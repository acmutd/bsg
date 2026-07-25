const cors = require('cors')

const corsOption = {
    origin: `chrome-extension://${process.env.EXTENSION_ID || 'deadeahbgooeggmhfdleelgiaecafhkn' }`,
    credentials: true
}
const corsMiddleware = cors(corsOption);

module.exports = corsMiddleware;
