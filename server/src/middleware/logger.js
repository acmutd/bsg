// Middleware to log session ID for every request
const logger = (req, res, next) => {
    if (req.sessionID) {
        console.log('Session ID:', req.sessionID);
    }
    next();
};

module.exports = logger;

