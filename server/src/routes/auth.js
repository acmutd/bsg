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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet"> <!-- same font as the web app (apps/web/app/layout.tsx) -->
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --primary: 114, 171, 28; /* --primary in ui-styles/global.css */
            --bg: #1a1a1a; /* --bsg-dark, grey underlay */
                        --glass: rgba(255, 255, 255, 0.1); /* --bsg-glass */
        }
        body {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }

        .glow { /* the blurred green light from long-background.png */
            position: absolute;
            border-radius: 50%;
            filter: blur(110px);
            pointer-events: none;
        }
        .glow-1 { top: -25%; left: -10%; width: 55vw; height: 55vw; background: rgba(var(--primary), 0.12); }
        .glow-2 { top: 20%; right: -20%; width: 45vw; height: 45vw; background: rgba(var(--primary), 0.09); }

        .grid { /* the faint square grid from long-background.png */
            position: absolute;
            inset: 0;
            background-image:
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 42px 42px;
            -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 100%); /* fades out toward the edges */
                    mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 100%);
            pointer-events: none;
        }

        .wave-bg {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        .wave { animation: wave-drift 18s linear infinite; } /* one period is 100 units, so the loop is seamless */
        @keyframes wave-drift {
            from { transform: translateX(0); }
            to   { transform: translateX(-100px); }
        }

        .card { /* glass container, built from the --bsg-glass tokens */
            position: relative;
            margin: 0 1rem;
            padding: 2.75rem 3rem;
            max-width: 34rem;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            border-radius: 1.25rem;
            background: rgba(255, 255, 255, 0.04); /* mostly see-through */
            border: 1px solid var(--glass);
            box-shadow: inset 0 6px 12px rgba(255, 255, 255, 0.06), inset 0 -6px 12px rgba(0, 0, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.35); /* --bsg-glass-shadow plus a soft drop shadow */
            backdrop-filter: blur(16px) saturate(140%);
            -webkit-backdrop-filter: blur(16px) saturate(140%);
            animation: rise 0.5s ease-out both;
        }
        @keyframes rise {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .brand svg { width: 70px; height: auto; }
        .brand-name {
            font-size: 3.75rem;
            font-weight: 700;
            line-height: 1;
            letter-spacing: 0.02em;
            color: #ffffff;
        }
        .checkmark { /* same badge as auth.html, sized up for this bigger card */
            width: 56px; height: 56px;
            margin-top: 1.75rem;
            border-radius: 50%;
            background: rgba(var(--primary), 0.15);
            border: 2px solid rgb(var(--primary));
            display: flex; align-items: center; justify-content: center;
        }
        .checkmark svg { width: 28px; height: 28px; stroke: rgb(var(--primary)); }
        .title {
            margin-top: 1rem; /* checkmark now carries the gap below the brand */
            font-size: 1.5rem;
            font-weight: 600;
        }
        .message {
            margin-top: 0.5rem;
            font-size: 1rem;
            font-weight: 300;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.7);
            text-wrap: balance;
        }
        @media (max-width: 600px) {
            .card { padding: 2rem 1.5rem; }
            .brand svg { width: 50px; }
            .brand-name { font-size: 2.75rem; }
            .title { font-size: 1.25rem; }
            .message { font-size: 0.9rem; }
        }
        @media (prefers-reduced-motion: reduce) {
            .wave, .card { animation: none; }
        }
    </style>
</head>
<body>
    <div class="glow glow-1"></div>
    <div class="glow glow-2"></div>
    <div class="grid"></div>

    <svg class="wave-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
            <linearGradient id="wave-fill" gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="100">
                <stop offset="0%"   stop-color="rgb(114,171,28)" stop-opacity="0.02"/>
                <stop offset="35%"  stop-color="rgb(114,171,28)" stop-opacity="0.05"/>
                <stop offset="70%"  stop-color="rgb(114,171,28)" stop-opacity="0.09"/>
                <stop offset="100%" stop-color="rgb(114,171,28)" stop-opacity="0.15"/>
            </linearGradient>
        </defs>
        <g class="wave">
            <path d="M-100,55 Q-75,19 -50,55 T0,55 T50,55 T100,55 T150,55 T200,55 L200,100 L-100,100 Z" fill="url(#wave-fill)"/> <!-- true sine, crest y=37, trough y=73 -->
        </g>
    </svg>

    <main class="card">
        <div class="brand">
            <svg viewBox="0 0 81 65" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M29.5 13.5L36.8326 20.5015L29.5 27.5M39.7661 27.5H51.5M41 47V61.5M26 61.5H56M65 13H77.5C77.3785 30.2972 72.1025 34.6283 57.5 37M15.5 13H3C3.12147 30.2972 8.3975 34.6283 23 37M15 3H65.5C65.5 3 65.1434 46.6785 40.5 46.5C15.9364 46.3221 15 3 15 3Z" stroke="rgb(114,171,28)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="brand-name">BSG</span>
        </div>
        <div class="checkmark">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        </div>
        <h1 class="title">You're all set!</h1>
        <p class="message">You have successfully logged in. You may close this tab or navigate back to LeetCode.</p>
    </main>

    <script>setTimeout(function(){ window.close(); }, 3000);</script>
</body>
</html>
`);
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


