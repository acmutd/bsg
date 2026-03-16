const cors = require('cors')

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
const allowedOrigins = [...new Set([serverUrl, 'http://localhost:3000'])];

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
