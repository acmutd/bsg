const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const loggingModule = require('../middleware/logging');
const { commitSolution } = require('../config/github');
const { getGithubRepoLink } = require('../config/redis');

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

        // push the solution to the user's BSG-Submissions repo; not awaited so GitHub can't block scoring
        pushToGithub(authID, slug, language, code)
            .catch(err => logger.error('Failed to push solution to GitHub', err, {
                user_id: authID,
                problem_slug: slug,
            }));

        const difficulty = problemData.data?.difficulty;
        const statsRes = await fetch(`${centralServiceUrl}/api/statistics/${roomID}/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authID,
            },
            body: JSON.stringify({ runtime, difficulty })
        });

        if (!statsRes.ok) {
            logger.error('Failed to update statistics', new Error(await statsRes.text()), {
                user_id: authID,
                room_id: roomID,
            });
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

const map = {"python3": ".py",
             "cpp" : ".cpp",
             "python": ".py",
             "java": ".java",
             "c": ".c",
             "csharp": ".cs",
             "javascript": ".js",
             "typescript": ".ts",
             "php": ".php",
             "swift": ".swift",
             "kotlin": ".kt",
             "dart": ".dart",
             "golang": ".go",
             "ruby": ".rb",
             "scala": ".scala",
             "rust": ".rs",
             "racket": ".rkt",
             "erlang": ".erl",
             "elixir": ".ex",
             "mysql": ".sql",
             "mssql": ".sql",
             "oraclesql": ".sql",
             "postgresql": ".sql",
             "pythondata": ".py",
             "bash": ".sh"}
// language is LeetCode's lang value, e.g. "python3", "cpp", "java", "golang"
function solutionPath(slug, language) {

    const lang = map[language] || '.txt'
    const path = `submission/${slug}/solution${lang}`
    
    return path
}

async function pushToGithub(authID, slug, language, code) {
    // only users who connected a repo from the footer button have a link
    const link = await getGithubRepoLink(authID);
    if (!link) return;

    await commitSolution(link.token, link.username, solutionPath(slug, language), code, `Solved ${slug}`);
}

module.exports = router;
