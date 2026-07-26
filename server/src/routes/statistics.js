const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const loggingModule = require('../middleware/logging');

const logger = new loggingModule.StructuredLogger('rooms-statistics');
const centralServiceUrl = process.env.CENTRAL_SERVICE_URL || 'http://central-service:5000';
const serverSecret = process.env.SERVER_SECRET;

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

router.get('/:roomId', ensureAuth, async(req, res) => {
    const authID = req.user.id;
    const { roomId } = req.params;

    try{
        const response = await fetch(`${centralServiceUrl}/api/statistics/${roomId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authID,
            }
        });
        if(!response.ok){
            const errorData = await response.json()
            return res.status(response.status).json(errorData)
        }
        const data = await response.json();
        res.json(data)

    }catch(error){
        logger.error('Erorr making the call to get stats data', error, {
            user_id: authID,
            room_id: roomId,
        });
        res.status(500).json({error: 'Internal Server Error'});
    }
});

module.exports = router;


