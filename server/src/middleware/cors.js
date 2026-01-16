const cors = require('cors')

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001'
];

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
