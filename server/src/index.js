require('dotenv').config();


const express = require('express');
const session = require('express-session');
const app = express();
const passport = require('passport');
require('./config/passport');

const logger = require('./middleware/logger');
const corsMiddleware = require('./middleware/cors');
const port = 3000;



//Middleware
app.use(express.json());
app.use(corsMiddleware)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 3600000, // 1 hour
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax'
    },
}));

//Init Passport
app.use(passport.initialize());
app.use(passport.session());

// Logger middleware (must come AFTER session middleware)
app.use(logger);


const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    
});

