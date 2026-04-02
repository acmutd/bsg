const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const loggingModule = require('../middleware/logging');

const logger = new loggingModule.StructuredLogger('rooms-server');
const centralServiceUrl = process.env.CENTRAL_SERVICE_URL || 'http://central-service:5000';
const serverSecret = process.env.SERVER_SECRET;

// Middleware to ensure authentication
const ensureAuth = (req, res, next) => {
    if (!req.isAuthenticated() || !req.user) {
        logger.warn('Unauthenticated access attempt', {
            path: req.path,
            method: req.method,
        });
        return res.status(401).json({ error: 'Not authenticated' });
    }
    logger.debug('User authenticated', {
        user_id: req.user.id,
        path: req.path,
    });
    next();
};

// Create Room
router.post('/', ensureAuth, async (req, res) => {
    const authID = req.user.id;
    try {
        const response = await fetch(`${centralServiceUrl}/api/rooms/`, {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: {
                'Content-Type': 'application/json',
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authID
            }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        logger.error('Error creating room', error, {
            user_id: authID,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create Round
router.post('/:id/rounds/create', ensureAuth, async (req, res) => {
    const authID = req.user.id;
    const { id } = req.params;
    try {
        const response = await fetch(`${centralServiceUrl}/api/rooms/${id}/rounds/create`, {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: {
                'Content-Type': 'application/json',
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authID
            }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        logger.error('Error creating round', error, {
            user_id: authID,
            room_id: id,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start Round
router.post('/:id/start', ensureAuth, async (req, res) => {
    const authID = req.user.id;
    const { id } = req.params;
    try {
        const response = await fetch(`${centralServiceUrl}/api/rooms/${id}/start`, {
            method: 'POST',
            headers: {
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authID
            }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        logger.error('Error starting round', error, {
            user_id: authID,
            room_id: id,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Join Room
router.post('/:id/join', ensureAuth, async (req, res) => {
    const authID = req.user.id;
    const { id } = req.params;
    try {
        const response = await fetch(`${centralServiceUrl}/api/rooms/${id}/join`, {
            method: 'POST',
            headers: {
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authID
            }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        logger.error('Error joining room', error, {
            user_id: authID,
            room_id: id,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Active Room for User
router.get('/active', ensureAuth, async (req, res) => {
    const authID = req.user.id;
    try {
        const response = await fetch(`${centralServiceUrl}/api/rooms/active`, {
            method: 'GET',
            headers: {
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authID
            }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        logger.error('Error getting active room', error, {
            user_id: authID,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Room by ID
router.get('/:id', ensureAuth, async (req, res) => {
    const authID = req.user.id;
    const { id } = req.params;
    try {
        const response = await fetch(`${centralServiceUrl}/api/rooms/${id}`, {
            method: 'GET',
            headers: {
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authID
            }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        logger.error('Error getting room', error, {
            user_id: authID,
            room_id: id,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Leave Room
router.post('/:id/leave', ensureAuth, async (req, res) => {
    const authID = req.user.id;
    const { id } = req.params;
    try {
        const response = await fetch(`${centralServiceUrl}/api/rooms/${id}/leave`, {
            method: 'POST',
            headers: {
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authID
            }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Error leaving room:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// End Round
router.post('/:id/end', ensureAuth, async (req, res) => {
    const authID = req.user.id;
    const { id } = req.params;
    try {
        const response = await fetch(`${centralServiceUrl}/api/rooms/${id}/end`, {
            method: 'POST',
            headers: {
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authID
            }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        logger.error('Error ending round', error, {
            user_id: authID,
            room_id: id,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/leave', ensureAuth, async (req, res) => {
    const authId = req.user.id;
    const { id } = req.params;
    
    try {
        const response = await fetch(`${centralServiceUrl}/api/rooms/${id}/leave`, {
            method: 'POST',
            headers: {
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authId,
            }
        });

        const data = await response.json()
        res.status(response.status).json(data)

    }catch(error){
        console.log('Unable to find room to leave')
        res.status(500).json({error: 'Internal Server Error'})

    }
})

module.exports = router;
