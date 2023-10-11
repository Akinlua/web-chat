const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../model/User')
const Message = require('../model/Message')

const jwtSecret = process.env.JWT_SECRET
const mongoose = require('mongoose')

//get all chats associated with the user, plus the users chat
const getMainPage = async (req, res) => {

    //get all chats
    let users = await User.find({}).select({password: 0})

    //get the one chat user info
    const user = await User.findById(id).select({password: 0})

    //SEARCH
    //change users if there is a search query
    let search = ""
    if (req.query.search){
        search = req.query.search
        users =  await User.find({username: {$regex: search, $options: 'i'}}).select({password: 0})
    }

    //get all message associated with the owner
    const ids = [req.user]//store the ids associated with chats, usually 2
    //get messages for only the owner
    const messages = await Message.find({ $and: [{senderId: {$in: ids}}, {receiverId: {$in: ids}}] })

    const response = {
        message: "Main Page Info, the data contains all the users info and the owner(logged in user) chats info",
        users: users,
        receipient: user,
        chat: messages 
    }
    res.status(200).json(response)
}


const getUpdatedUsers = async (users, req, id)=>{
        //set unread to user dict
        const newUsers = []
        for (const user of users) {
            //check for status
            if(user.socketId.length == 0) {
                user.activity = "Offline"
                await user.save()
            }
            let user__ = {}
            const ids = [req.user, user._id]
            const message = await Message.find({ $and: [{senderId: {$in: ids}}, {receiverId: {$in: ids}}, {receiverId: req.user}, {read: false}] })//the receiver must be the user, no need to show unread for a message u sent
            const messages = await message.filter(doc => doc.sender !== doc.receiver)
            const messages_count = messages.length
            //get the last message time
            const message__ = await Message.find({ $and: [{senderId: {$in: ids}}, {receiverId: {$in: ids}}] }).sort("-createdAt")
            const messages_ = await message__.filter(doc => doc.sender !== doc.receiver)
            const time_last_message = messages_[0]
            user__.unread = await messages_count
            if(user._id == id){
                user__.unread = 0
            }
            
            if(time_last_message) {
                const lastTimeObject = time_last_message.createdAt
                user__.lastMessageTime = await lastTimeObject.toISOString()
            } else {
                user__.lastMessageTime = "2022-10-11T12:15:38.722Z"//set to past
            }

            if(user._id == req.user) user__.lastMessageTime = new Date().toISOString()
            const check = await Object.assign(user._doc,user__)
            newUsers.push(check)
        }
        return newUsers
}

const sortUsers = async (users) => {
    
    // console.log(users)
    let currentTime = new Date()
    const newUsers = await users.sort((a,b) => {
        let timeA = new Date(a.lastMessageTime);
        let timeB = new Date(b.lastMessageTime)
        let differenceA = Math.abs(timeA - currentTime)
        let differenceB = Math.abs(timeB - currentTime)
        return differenceA - differenceB
    })
    return newUsers
}

// get each chat 
const getOneChat = async (req, res) => {
    const {id} = req.params

     //get all chats
    let users = await User.find({}).select({password: 0})

    //SEARCH
    //change users if there is a search query
    let search = ""
    if (req.query.search){
        search = req.query.search
        users =  await User.find({username: {$regex: search, $options: 'i'}}).select({password: 0})
    }

    const updatedusers = await getUpdatedUsers(users, req, id)
    const updated_users = await sortUsers(updatedusers)

    //get all message associated with the owner
    const ids = [req.user, id]//store the ids associated with chats, usually 2
    //get messages for only the owner
    let messages_read
    let messages_unread
    if(id == req.user){
        //allow for sender to be receiver ID
        messages_read = await Message.find({ $and: [{senderId: {$in: ids}}, {receiverId: {$in: ids}}, {read: true}] }).sort("createdAt")
        messages_unread = await Message.find({ $and: [{senderId: {$in: ids}}, {receiverId: {$in: ids}}, {read: false}] }).sort("createdAt")
    } else {
        messages_read = await Message.find({ $and: [{senderId: {$in: ids}}, {receiverId: {$in: ids}}, {read: true}] }).sort("createdAt")
        messages_read = messages_read.filter(doc => doc.sender !== doc.receiver)
        messages_unread = await Message.find({ $and: [{senderId: {$in: ids}}, {receiverId: {$in: ids}}, {read: false}] }).sort("createdAt")
        messages_unread = await messages_unread.filter(doc => doc.sender !== doc.receiver)
    }

    //set unread messages to read
    const set_unread_read = await Message.updateMany({ $and: [{senderId: {$in: ids}}, {receiverId: {$in: ids}}, {read: false}, {receiverId: req.user}] }, {read: true}, {new: true, runValidators:true})

    //get the owner details
    const chat_user = await User.findById(req.user).select({password: 0})

    //?get the one chat user info
    const receipient = await User.findById(id).select({password: 0})
    if(!receipient) {
        return res.status(404).json({
            message: "User not found with the id"
        })
    }
    
    const response = {
        message: "Main Page Info, the data contains all the users info and the owner(logged in user) chats info",
        users: updated_users,
        sender: chat_user,
        receipient: receipient,
        chat_read: messages_read,
        chat_unread: messages_unread,
        unread_count: messages_unread.length,
        search:  search,
    }
    // console.log(users)

    res.status(200).json(response)
}
module.exports = {
    getMainPage,
    getOneChat,
}