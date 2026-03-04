const express = require('express')
const router = express.Router();

router.get('/room:id', (req, res) => {
    res.send("This is the room")
})