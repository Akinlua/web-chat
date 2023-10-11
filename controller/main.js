
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../model/User')
const jwtSecret = process.env.JWT_SECRET
const mongoose = require('mongoose')
const axios = require("axios")
const checkDate = require('../middleware/date')

const mainPage = async (req, res) => {
    //set user to online
    const user = await User.findOne({_id: req.user})
    user.activity = "Online"
    user.lastTimeActive = "Online"
    await user.save()

    let id
    if(req.query.id) id = req.query.id
    else id = req.user

    let search = ""
    if(req.query.search) search = req.query.search
    
    const cookieHeader = `token=${req.cookies.token}`
    const config = {
        method: 'get',
        url: `http://127.0.0.1:3000/api/chat/user/${id}?search=${search}`,
        headers: {
            'Cookie': cookieHeader,
        },
    }
    let data = {}
    try{
        const response = await axios(config)
        data = response.data
    } catch(error) {
        console.log(error.response.data)
        return res.status(error.response.data.statusCode).json({error: error.response.data.message})
    }
    
    if(!data){
        return res.status(500).json({error: "Error Ocurred"})
    }

    const lastTimeActive = checkDate(data.receipient.lastTimeActive)
    let add = {}
    add.lastTimeActive = lastTimeActive
    Object.assign(data,add)

    // console.log(data)
    res.render('index', data)
}

const search = async (req, res) => {

    const {search, id} = req.body
    res.redirect(`/?search=${search}&id=${id}`)
}

const registerPage = async (req, res) => {

    res.render('register')

}

const postRegister = async (req,res) => {

    try {

        const {username, password} = req.body
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({username, password: hashedPassword})
        const token =  await jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_LIFETIME})
        res.cookie('token', token, {httpOnly: true})

        res.redirect('/')
    }  catch (error) {
        console.log(error)
        res.json({error: error})
    }    
}

const loginPage = async (req, res) => {

    res.render('login')
}
const postLogin = async (req, res) => {
    

    // const {username, password} = req.body
    const username = req.body.username
    const password = req.body.password

    const user = await User.findOne({username})
    if(!user) {
        error = "Invalid credentials"
        return res.json(error)
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if(!isPasswordValid) {
        error = "Invalid credentials"
        return res.json(error)
    }

    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_LIFETIME})
    res.cookie('token', token, {httpOnly: true})

    res.redirect('/')
}

const logout = async (req, res) => {
    res.clearCookie('token');
    //res.json({ message: 'Logout successful.'});
    res.redirect('/login');
}

module.exports = {
    mainPage,
    loginPage,
    registerPage,
    postLogin,
    postRegister,
    logout,
    search
}
