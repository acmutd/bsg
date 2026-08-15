require('dotenv').config();

//express session imports
const express = require('express');
const session = require('express-session');
const app = express();

//passport imports
const passport = require('passport');
require('./config/passport');

//other middleware imports
const corsMiddleware = require('./middleware/cors');
const loggingModule = require('./middleware/logging');

const port = 3000;

// Initialize logger
const logger = new loggingModule.StructuredLogger('auth-server');



//redis imports
const Redis = require('redis'); 

//RedisStore is a class constructor that helps us to connect
//express and redis server together
const { RedisStore } = require('connect-redis')
                                                        
                
//connect to the server
const Redisclient = Redis.createClient({
    url: `redis://:${process.env.REDIS_PASSWORD}@redis-cache:6379`
});


async function connectToRedis () {

    try{
        //connect to the server
        await Redisclient.connect();

        if(Redisclient.isReady){

            //redis objects to store express-session data 
            const store = new RedisStore({ client: Redisclient })
        

            return store
        } else {
            console.error("Redis client connected but is not ready. Failing startup.");
            throw new Error("Redis client is not ready after connect");
        }
        
    }catch(error){

    //callback error message if not connected
    console.warn("Redis Client Connection Failed")
    throw error

    }

}

//create a wrapper async function to deal with the connectRedis() function
//since connectToRedis is async we need to wait until its done then initialize
//the express session

async function startServer() {

    //the app waits for this to run and only then it works with the middleware
    const storeObj = await connectToRedis();

    //Implement later in memory storage on the express.js server or dynamo DB if the redis server
    //might crash or break


    //Important Middleware
    // TLS terminates at Caddy/Cloudflare in front of us; trust the proxy's
    // X-Forwarded-Proto so secure cookies work in production
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
        app.set('trust proxy', 1);
    }
    app.use(express.json());
    app.use(loggingModule.createValidationMiddleware(logger));
    // Rate limiting. The auth limiter is stricter because the panel polls
    // /auth/user while the login page is open; the global limiter is generous
    // so room/participants/leaderboard refreshes and retries aren't blocked.
    const authRateLimit = loggingModule.createRateLimitMiddleware(logger, {
        requestsPerMinute: 120,
        timeWindow: 60000
    });
    const globalRateLimit = loggingModule.createRateLimitMiddleware(logger, {
        requestsPerMinute: 600,
        timeWindow: 60000
    });
    app.use(loggingModule.createStructuredLoggingMiddleware(logger));
    app.use(corsMiddleware)
    app.use(session({
        store: storeObj,
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 3600000, // 1 hour
            httpOnly: true,
            secure: isProduction, // HTTPS-only in production (behind Caddy/Cloudflare)
            sameSite: 'lax'
        },
    }));

    //Init Passport
    app.use(passport.initialize());
    app.use(passport.session());


    const authRoutes = require('./routes/auth');
    app.use('/auth', authRateLimit);
    app.use('/auth', authRoutes);

    // Global limiter applies to everything not already handled above.
    app.use(globalRateLimit);

    const roomsRoutes = require('./routes/rooms');
    app.use('/rooms', roomsRoutes);

    const problemsRoutes = require('./routes/problems');
    app.use('/problems', problemsRoutes);

    const submissionRoutes = require('./routes/submission');
    app.use('/submission', submissionRoutes);

    const statisticsRoutes = require('./routes/statistics');
    app.use('/statistics', statisticsRoutes)

    // Healthcheck endpoint
    app.get('/health', async (req, res) => {
        try {
            // check Redis status
            const redisStatus = Redisclient.isReady ? 'ok' : 'not ready';

            res.status(200).json({
                status: 'ok',
                redis: redisStatus,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            res.status(500).json({
                status: 'error',
                error: err.message
            });
        }
    });


    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);

    });

}

startServer();
