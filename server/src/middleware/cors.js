const cors = require('cors')

const serverUrl = process.env.SERVER_URL;
const allowedOrigins = [...new Set([serverUrl])];

const corsMiddleware = cors({
    origin: function(origin, callback){
        if(!origin || origin.startsWith('chrome-extension://') || allowedOrigins.includes(origin)){
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true
});

module.exports = corsMiddleware;
