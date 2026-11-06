const cors = require('cors')

const allowedOrigins = [
    `chrome-extension://${process.env.EXTENSION_ID || 'mnllpknljobnjmbaognpclblmpfcllmc' }`,
    'https://leetcode.com'
]
const corsOption = {
    origin: allowedOrigins,
    credentials: true
}
const corsMiddleware = cors(corsOption);

module.exports = corsMiddleware;
