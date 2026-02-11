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
const port = 3000;



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
    app.use(express.json());
    app.use(corsMiddleware)
    app.use(session({
        store: storeObj,
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 3600000, // 1 hour
            httpOnly: true,
            secure: true, // Setting it true now for deployement
            sameSite: 'none'
        },
    }));

    //Init Passport
    app.use(passport.initialize());
    app.use(passport.session());


    const authRoutes = require('./routes/auth');
    app.use('/auth', authRoutes);


    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);

    });

}

startServer();
