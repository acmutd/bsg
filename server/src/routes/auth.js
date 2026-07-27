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
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authenticated - BSG</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            color: #e2e2e2;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }
        .orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.05;
            pointer-events: none;
        }
        .orb-1 { top: -20%; left: -20%; width: 60%; height: 60%; background: #62AF2E; }
        .orb-2 { bottom: -20%; right: -20%; width: 50%; height: 50%; background: #62AF2E; }
        .card {
            position: relative;
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 1rem;
            padding: 2.5rem;
            max-width: 320px;
            width: 100%;
            text-align: center;
            box-shadow: inset 0 6px 12px rgba(255,255,255,0.06), inset 0 -6px 12px rgba(0,0,0,0.15);
        }
        .logo { margin-bottom: 1.25rem; }
        .logo svg { width: 48px; height: 48px; }
        h1 { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.5rem; }
        p { font-size: 0.85rem; color: rgba(226,226,226,0.5); line-height: 1.5; }
        .checkmark {
            width: 48px; height: 48px;
            border-radius: 50%;
            background: rgba(98,175,46,0.15);
            border: 2px solid #62AF2E;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 1rem;
        }
        .checkmark svg { width: 24px; height: 24px; stroke: #62AF2E; }
    </style>
</head>
<body>
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="card">
        <div class="logo">
            <svg viewBox="0 0 81 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M29.5 13.5L36.8326 20.5015L29.5 27.5M39.7661 27.5H51.5M41 47V61.5M26 61.5H56M65 13H77.5C77.3785 30.2972 72.1025 34.6283 57.5 37M15.5 13H3C3.12147 30.2972 8.3975 34.6283 23 37M15 3H65.5C65.5 3 65.1434 46.6785 40.5 46.5C15.9364 46.3221 15 3 15 3Z" stroke="#62AF2E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
        <div class="checkmark">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        </div>
        <h1>You're all set!</h1>
        <p>You can close this tab and head back to LeetCode to start solving.</p>
    </div>
    <script>setTimeout(function(){ window.close(); }, 3000);</script>
</body>
</html>`);
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


