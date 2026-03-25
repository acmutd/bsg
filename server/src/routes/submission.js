const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const loggingModule = require('../middleware/logging');

const logger = new loggingModule.StructuredLogger('submission-server');

router.post('/', async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { slug, status, code, language, runtime, memory } = req.body;

    // only process accepted submissions
    if (status !== 'Accepted') {
        return res.json({ message: 'Ignored non-accepted submission' });
    }

    const authID = req.user.id;
    const centralServiceUrl = process.env.CENTRAL_SERVICE_URL || 'http://central-service:5000';
    const serverSecret = process.env.SERVER_SECRET;

    try {
        const activeRoomRes = await fetch(`${centralServiceUrl}/api/rooms/active`, {
            headers: {
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authID
            }
        });

        if (!activeRoomRes.ok) {
            const errorText = await activeRoomRes.text();
            logger.error('Failed to get active room', new Error(errorText), {
                user_id: authID,
                status: activeRoomRes.status,
            });
            return res.status(500).json({ error: 'Failed to check active room' });
        }

        const activeRoomData = await activeRoomRes.json();
        const roomID = activeRoomData.roomID;

        if (!roomID) {
            return res.json({ message: 'No active room for user' });
        }

        const lookupRes = await fetch(`${centralServiceUrl}/api/problems/lookup?slug=${slug}`, {
            headers: {
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authID
            }
        });
        if (!lookupRes.ok) {
            const errorText = await lookupRes.text();
            logger.error('Failed to lookup problem', new Error(errorText), {
                user_id: authID,
                problem_slug: slug,
                status: lookupRes.status,
            });
            return res.status(500).json({ error: 'Problem lookup failed' });
        }

        const problemData = await lookupRes.json();
        const problemID = problemData.data?.id;

        if (!problemID) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        const submitRes = await fetch(`${centralServiceUrl}/api/rooms/${roomID}/${problemID}`, {
            method: 'POST',
            headers: {
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authID,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, language, runtime, memory, verdict: status })
        });

        if (!submitRes.ok) {
            const errorText = await submitRes.text();
            logger.error('Failed to submit score', new Error(errorText), {
                user_id: authID,
                room_id: roomID,
                problem_id: problemID,
                status: submitRes.status,
            });
            return res.status(500).json({ error: 'Failed to submit score' });
        }

        logger.info('Submission processed successfully', {
            user_id: authID,
            room_id: roomID,
            problem_slug: slug,
            verdict: status,
            runtime: runtime,
        });

        return res.json({ success: true, message: 'Score submitted' });

    } catch (error) {
        logger.error('Error in submission proxy', error, {
            user_id: authID,
        });
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
