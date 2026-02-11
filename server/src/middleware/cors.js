const cors = require('cors')

const allowedOrigins = [
    'https://bsg-kappa.vercel.app'
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
