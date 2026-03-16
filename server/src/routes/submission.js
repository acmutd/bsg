const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

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
            console.error('Failed to get active room:', activeRoomRes.status, await activeRoomRes.text());
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
            console.error('Failed to lookup problem:', lookupRes.status, await lookupRes.text());
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
            console.error('Failed to submit score:', submitRes.status, await submitRes.text());
            return res.status(500).json({ error: 'Failed to submit score' });
        }

        return res.json({ success: true, message: 'Score submitted' });

    } catch (error) {
        console.error('Error in submission proxy:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
