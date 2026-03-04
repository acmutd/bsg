const express = require('express')
const router = express.Router();

router.get('/submissions:id', (req, res) => {
    res.send("This is the submission Id")
})