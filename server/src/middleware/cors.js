const cors = require('cors')


const corsMiddleware = cors({
    origin: function(origin, callback){
        if(!origin || origin.startsWith('chrome-extension://')){
            callback(null, true);
        } else {
            callback(null, false);
        }

    },
    credentials: true
    
}
);

module.exports = corsMiddleware;
