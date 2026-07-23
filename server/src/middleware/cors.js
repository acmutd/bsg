const cors = require('cors')

// Origins allowed to call this API from a browser. FRONTEND_URL is a
// comma-separated list so previews/local dev can be added without a code change,
// e.g. FRONTEND_URL=https://binarysearchgang.com,https://bsg-kappa.vercel.app
const defaultOrigins = [
    'https://binarysearchgang.com',
    'https://www.binarysearchgang.com',
    'https://bsg-kappa.vercel.app',
    'http://localhost:3001',
];
const envOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(url => url.trim().replace(/\/$/, ''))
    .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

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
