
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../model/User')
const jwtSecret = process.env.JWT_SECRET
const mongoose = require('mongoose')

const {authMiddleware} = require('../middleware/authentication.js')

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

        res.json({message: error})
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