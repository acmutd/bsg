const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GithubStrategy = require('passport-github2').Strategy;
const { revokeGithubToken, createSubmissionRepo } = require('./github');
const { getStoredGithubToken, saveGithubToken } = require('./redis');


passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
})

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'https://api.binarysearchgang.com'}/auth/google/callback`,
    // bind the callback code to the session that started it (login CSRF)
    state: true
},
    (accessToken, refreshToken, profile, done) => {
        const user = {
            id: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            photo: profile.photos[0]?.value,
            accessToken: accessToken,
            provider: 'google'
        }

        // sync with central service
        // i have no idea if givenName or familyName is a thing but gemini added it 
        // and gemini is a google product so surely it is a thing but i haven't seen it in any logs
        const userData = {
            firstName: profile.name?.givenName || profile.displayName.split(' ')[0],
            lastName: profile.name?.familyName || profile.displayName.split(' ').slice(1).join(' '),
            handle: profile.displayName,
            email: user.email,
            photoURL: user.photo
        };

        const centralServiceUrl = process.env.CENTRAL_SERVICE_URL || 'http://central-service:5000';
        fetch(`${centralServiceUrl}/api/users/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Server-Secret': process.env.SERVER_SECRET,
                'X-User-Auth-ID': user.id
            },
            body: JSON.stringify(userData)
        }).then(res => {
            if (!res.ok) {
                // if post fails, try put to update
                return fetch(`${centralServiceUrl}/api/users/`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Server-Secret': process.env.SERVER_SECRET,
                        'X-User-Auth-ID': user.id
                    },
                    body: JSON.stringify(userData)
                });
            }
        }).catch(err => console.error("Failed to sync user to central-service:", err));

        return done(null, user);
    }));

// if we add github auth we gotta update this to do what the above does
passport.use(new GithubStrategy({
    clientID:process.env.GITHUB_CLIENT_ID,
    clientSecret:process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/auth/github/callback`,
    // bind the callback code to the session that started it (login CSRF)
    state: true
},
async (accessToken, refreshToken, profile, done) => {
    // any throw before done() would leave the login request hanging forever
    try {
        const user = {
            id: profile.id,
            name: profile.displayName || profile.username,
            email: profile.emails?.[0]?.value,
            photo: profile.photos?.[0]?.value,
            accessToken: accessToken, // Store access token for later revocation
            provider: 'github'
        }

        // displayName is null when the user never set a name on GitHub
        const displayName = user.name;
        const userData = {
            firstName: displayName.split(' ')[0],
            lastName: displayName.split(' ').slice(1).join(' '),
            handle: displayName,
            email: user.email,
            photoURL: user.photo
        };

        const centralServiceUrl = process.env.CENTRAL_SERVICE_URL || 'http://central-service:5000';
        //send the data to central service so it can be stored in the database
        fetch(`${centralServiceUrl}/api/users/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Server-Secret': process.env.SERVER_SECRET,
                'X-User-Auth-ID': user.id,
            },
            body: JSON.stringify(userData)
        }).then(res => {
            if (!res.ok) {
                // if post fails, try put to update
                return fetch(`${centralServiceUrl}/api/users/`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Server-Secret': process.env.SERVER_SECRET,
                        'X-User-Auth-ID': user.id
                    },
                    body: JSON.stringify(userData)
                });
            }
        }).catch(err => console.error("Failed to update central service: ", err))

        // revoke this user's previously stored token (if it differs from accessToken),
        // then save accessToken as the new stored token
        try {
            const previousGithubToken = await getStoredGithubToken(user.id)
            if(previousGithubToken && previousGithubToken !== accessToken) await revokeGithubToken(previousGithubToken)
            await saveGithubToken(user.id, accessToken)
        }
        catch(error){
            console.error('Failed to sync GitHub token in redis', error);
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
    }));

// used with passport.authorize from the footer button, so it links a repo to whoever is
// logged in (google or github) without replacing their session user
passport.use('github-connect', new GithubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    // must be under the registered callback URL, GitHub accepts sub-paths of it
    callbackURL: `${process.env.SERVER_URL}/auth/github/callback/connect`,
    // bind the callback code to the session that started it (connect CSRF:
    // otherwise an attacker's ?code= could link their repo to a victim's session).
    // sessionKey must differ from the login strategy: both default to
    // oauth2:github.com, which would let the two flows clobber each other's state.
    state: true,
    sessionKey: 'oauth2:github.com:connect'
},
async (accessToken, refreshToken, profile, done) => {
    try {
        await createSubmissionRepo(accessToken);
        return done(null, { token: accessToken, username: profile.username });
    } catch (error) {
        return done(error);
    }
}));



module.exports = passport;



