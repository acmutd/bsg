const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GithubStrategy = require('passport-github2').Strategy;


passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
})

passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback'
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

    return done(null, user);
}));

passport.use(new GithubStrategy({
    clientID:process.env.GITHUB_CLIENT_ID,
    clientSecret:process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/github/callback'
},
(accessToken, refreshToken, profile, done) => {
    // Debug: Log what GitHub is actually returning
    console.log('GitHub Profile:', JSON.stringify(profile, null, 2));
    console.log('GitHub Emails:', profile.emails);

    const user = {
        id: profile.id,
        name: profile.displayName || profile.username,
        email: profile.emails?.[0]?.value || profile.email,
        photo: profile.photos?.[0]?.value,
        accessToken: accessToken, // Store access token for later revocation
        provider: 'github'
    }
    return done(null, user);

}));



module.exports = passport;



