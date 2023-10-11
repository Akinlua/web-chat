const express = require('express')
const router = express.Router();
const {getMainPage, getOneChat} = require("../controller/apis.js")
const {authMiddleware} = require('../middleware/authentication.js')

// router.get('/mainChat', authMiddleware, getMainPage)
router.get('/chat/user/:id', authMiddleware, getOneChat)


module.exports = router