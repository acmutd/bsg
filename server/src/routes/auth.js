const express = require('express');
const passport = require('passport');
const router = express.Router();


router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account'
    })
);

router.get('/google/callback',
    passport.authenticate('google', {failureRedirect: '/'}),
    (req, res) => {
        res.redirect('/auth/done');
    }

);


router.get('/done', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authentication Complete</title>
        </head>
        <body>
            <div class="container">
                <h1>✓ Authentication Successful!</h1>
                <p>You can now go back to the LeetCode page.</p>
                <script>
                    setTimeout(() => {
                        window.close();
                    }, 10000);
                </script>
            </div>
        </body>
        </html>
    `);
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
                    console.log("GitHub token revoked successfully");
                } else {
                    console.error("Failed to revoke GitHub token:", response.status);
                }
            } else if (provider === 'google') {
                const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
                    method: 'POST'
                });

                if (response.ok) {
                    console.log("Google token revoked successfully");
                } else {
                    console.error("Failed to revoke Google token:", response.status);
                }
            }
        } catch (error) {
            console.error("Error revoking OAuth token:", error);
        }
    }

    // Destroy session completely
    req.logout((err) => {
        if (err) {
            console.error("Error during logout:", err);
            return res.status(500).json({ success: false, message: 'Error logging out' });
        }

        // Destroy the session entirely
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
                return res.status(500).json({ success: false, message: 'Error destroying session' });
            }

            // Clear the session cookie
            res.clearCookie('connect.sid', { path: '/' });

            res.json({ success: true, message: 'Logged out successfully' });
        });
    });
});

router.get('/user', (req, res) => {
    if(req.isAuthenticated()) {
        // Only send safe user data to frontend - NEVER send accessToken
        const { accessToken, ...safeUserData } = req.user;
        res.json(safeUserData);
    }else {
        res.status(401).json({message: 'Not authenticated'});
    }
});



router.get('/github',
    passport.authenticate('github', {
        scope: ['user:email']
    })
);

router.get('/github/callback', 
    passport.authenticate('github', {failureRedirect: '/'}),
    (req, res) => {
        res.redirect('/auth/done');
        console.log(req.user);
    }

);



module.exports = router;


