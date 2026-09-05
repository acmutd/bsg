const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const loggingModule = require('../middleware/logging');

const logger = new loggingModule.StructuredLogger('problems-server');
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
    next();
};

router.get('/tags', ensureAuth, async (req, res) => {
    const authID = req.user.id;
    try {
        const response = await fetch(`${centralServiceUrl}/api/problems/tags`, {
            method: 'GET',
            headers: {
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authID,
            }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        logger.error('Error fetching problem tags', error, {
            user_id: authID,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/companies', ensureAuth, async (req, res) => {
    const authID = req.user.id;
    try {
        const response = await fetch(`${centralServiceUrl}/api/problems/companies`, {
            method: 'GET',
            headers: {
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authID,
            }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        logger.error('Error fetching problem companies', error, {
            user_id: authID,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/count', ensureAuth, async (req, res) => {
    const authID = req.user.id;
    try {
        const params = new URLSearchParams();
        if (req.query.tags) params.set('tags', req.query.tags);
        if (req.query.companies) params.set('companies', req.query.companies);
        if (req.query.blind75) params.set('blind75', req.query.blind75);
        if (req.query.neetcode150) params.set('neetcode150', req.query.neetcode150);
        if (req.query.recentlyAsked) params.set('recentlyAsked', req.query.recentlyAsked);
        if (req.query.difficulties) params.set('difficulties', req.query.difficulties);

        const response = await fetch(`${centralServiceUrl}/api/problems/count?${params.toString()}`, {
            method: 'GET',
            headers: {
                'X-Server-Secret': serverSecret,
                'X-User-Auth-ID': authID,
            }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        logger.error('Error counting available problems', error, {
            user_id: authID,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
