const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

router.get('/google/callback',
    passport.authenticate('google', {failureRedirect: '/'}),
    (req, res) => {
        res.redirect('/auth/done');
        console.log(req.user)
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

router.get('/logout', (req, res) => {
    req.logout((err => {
        if(err) return res.status(500).send ('Error logging out');
        res.redirect('/');
    }));
});

router.get('/user', (req, res) => {
    if(req.isAuthenticated()) {
        res.json(req.user);
    }else {
        res.status(401).json({message: 'Not authenticated'});
    }
});


module.exports = router;


