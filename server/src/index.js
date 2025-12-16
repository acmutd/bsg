require('dotenv').config();


const express = require('express');
const session = require('express-session');
const app = express();
const passport = require('passport');
const logger = require('./middleware/logger');
const port = 3000;
require('./config/passport');
const cors = require('cors');




//Middleware
app.use(express.json());

app.use(cors({
    origin: function(origin, callback){
        if(!origin || origin.startsWith('chrome-extension://')){
            callback(null, true);
        } else if (origin === 'http://localhost:3000'){
            callback(null, true);
        } else {
            callback(null, false);
        }
    },

    credentials: true

}));


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
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

