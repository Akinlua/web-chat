const express = require('express')
const router = express.Router();
const {mainPage,loginPage,
    registerPage,
    postLogin,
    postRegister,
    logout, search} = require("../controller/main.js")
const {authMiddleware} = require('../middleware/authentication.js')

router.get('/', authMiddleware, mainPage)

router.get('/register', registerPage)
router.get('/login', loginPage)

router.post('/register', postRegister)
router.post('/login', postLogin)

router.get('/logout',authMiddleware, logout)

router.post('/search', authMiddleware, search )

module.exports = router