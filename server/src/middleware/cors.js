const cors = require('cors')

<<<<<<< HEAD
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
=======
const corsOption = {
    origin: `chrome-extension://${process.env.EXTENSION_ID || 'deadeahbgooeggmhfdleelgiaecafhkn' }`,
>>>>>>> 9a4b8d79d0be8772aaed0bc4e96a44f5af22620f
    credentials: true
}
const corsMiddleware = cors(corsOption);

module.exports = corsMiddleware;
