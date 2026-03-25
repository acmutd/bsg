const express = require('express');
const passport = require('passport');
const router = express.Router();
const loggingModule = require('../middleware/logging');

const logger = new loggingModule.StructuredLogger('auth-server');


router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account'
    })
);

router.get('/google/callback',
    passport.authenticate('google', {failureRedirect: '/auth/google'}),
    (req, res) => {
        logger.info('User authenticated via Google', {
            user_id: req.user?.id,
        });
        res.redirect('/auth/done');
     }
);


router.get('/done',(req, res) => {
    res.send(`You are successfully authenticated please go back to the leetcode page`);
});


router.get('/user', (req, res) => {
    if(req.isAuthenticated() && req.user) {
        logger.info('User info retrieved', {
            user_id: req.user.id,
            provider: req.user.provider,
        });
        return res.json({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            photo: req.user.photo
        });
    }
    else {
        logger.warn('Unauthenticated user info request', {
            path: req.path,
        });
        res.status(401).json({ error: 'Not authenticated'});
    }
});

router.post('/logout', async (req, res) => {
    const accessToken = req.user?.accessToken;
    const provider = req.user?.provider;

    // Revoke OAuth token if user is logged in
    if (accessToken && provider) {
        try {
            if (provider === 'github') {
                const credentials = Buffer.from(`${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`).toString('base64');

                const response = await fetch(`https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/token`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        access_token: accessToken
                    })
                });

                if (response.ok) {
                    logger.info("GitHub token revoked", {
                        provider: 'github',
                        user_id: req.user?.id,
                    });
                } else {
                    logger.warn("Failed to revoke GitHub token", {
                        provider: 'github',
                        status: response.status,
                        user_id: req.user?.id,
                    });
                }
            } else if (provider === 'google') {
                const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
                    method: 'POST'
                });

                if (response.ok) {
                    logger.info("Google token revoked", {
                        provider: 'google',
                        user_id: req.user?.id,
                    });
                } else {
                    logger.warn("Failed to revoke Google token", {
                        provider: 'google',
                        status: response.status,
                        user_id: req.user?.id,
                    });
                }
            }
        } catch (error) {
            logger.error("Error revoking OAuth token", error, {
                provider: provider || 'unknown',
                user_id: req.user?.id,
            });
        }
    }

    // Destroy session completely
    req.logout((err) => {
        if (err) {
            logger.error("Error during logout", err, {
                user_id: req.user?.id,
            });
            return res.status(500).json({ success: false, message: 'Error logging out' });
        }

        // Destroy the session entirely
        req.session.destroy((err) => {
            if (err) {
                logger.error("Error destroying session", err, {
                    user_id: req.user?.id,
                });
                return res.status(500).json({ success: false, message: 'Error destroying session' });
            }

            logger.info("User logged out successfully", {
                user_id: req.user?.id,
            });

            // Clear the session cookie
            res.clearCookie('connect.sid', { path: '/' });

            res.json({ success: true, message: 'Logged out successfully' });
        });
    });
});

router.get('/github',
    passport.authenticate('github', {
        scope: ['user:email']
    })
);

router.get('/github/callback', 
    passport.authenticate('github', {failureRedirect: '/'}),
    (req, res) => {
        logger.info('User authenticated via GitHub', {
            user_id: req.user?.id,
        });
        res.redirect('/auth/done');
    }

);



module.exports = router;


