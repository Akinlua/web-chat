require('dotenv').config()
require('express-async-errors');
const cors = require("cors")
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cookieParser = require("cookie-parser")

const connectDB = require("./db/connect")
const mainRouter= require('./routes/main')
const apiRouter= require('./routes/apis')


const User = require('./model/User')
const Message = require('./model/Message')
const {authMiddleware} = require("./middleware/authentication")
const errorHandlerMiddleware = require("./middleware/errror-handler")
const notFoundMiddleware = require("./middleware/not-found");
const { error } = require('console');


app.set('view engine', 'ejs')
app.use(cors())
app.use(bodyParser.json())

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use(express.static('public'))

app.use(cookieParser())

//socket io codes

let server = require('http').createServer(app)
let io = require('socket.io')(server)


app.use('', mainRouter) 
app.use('/api', apiRouter)


// Store client connections
const clientSockets = {};
//clear the sockets id on server reboot
User.updateMany({}, {$set: {socketId: []}})
  .then((result) => {
    console.log("Reset Sockets Id for all users")
  })
  .catch((error) => {
    console.log(error)
  })

// Sending data to a specific client
function sendDataToClient(clientIdentifier, message) {
  const clientSocket = clientSockets[clientIdentifier];
  if (clientSocket) {
    clientSocket.emit('message', message);
  }
}

function getCookie(cookie, cookiename) {
  const cookies = cookie.split(';')

  for(let i=0; i<cookies.length; i++){
      const cookie = cookies[i].trim();
      if(cookie.startsWith(cookiename + '=')){
          return cookie.substring(cookiename.length + 1)
      }
  }
}

function setDate() {
    const currentdate = new Date()
    const dateFormatOptions = {year: 'numeric', month: 'short', day: 'numeric'}
    const formatDate = currentdate.toLocaleDateString(undefined, dateFormatOptions)

    const timeformatOptions = {hour: '2-digit', minute: '2-digit'}
    const formattedtime = currentdate.toLocaleTimeString(undefined, timeformatOptions)

    const date = formatDate + " | " + formattedtime
    return date
}

const getUserId = async (socket ) => {
    //get userid
    const cookie = socket.handshake.headers.cookie
    const userId = getCookie(cookie, 'userID')
    //validate the userid
    let user//get user in this field
    try{
      const user_  = await User.findById(userId)
      user = user_
      if(!user){
          socket.emit("authFailed")
          socket.disconnect(true)
          return
      }
    } catch {
      socket.emit("authFailed")
      socket.disconnect(true)
      return
    }
    return {userId, user}
}

io.on('connection', async (socket) => {

  //get userid
  const {userId, user} = await getUserId(socket)//like authenticating
  if(!userId){
    return
  }
  io.emit('activity', {status: "Online", userId: userId})
  console.log("Connected ", userId)
  // console.log(user)


  // Store the client connection
  const clientIdentifier = socket.id;
  clientSockets[clientIdentifier] = socket;
  // console.log(clientSockets)

  //store the socket id to the database
  const user_socket = await User.findOne({_id: userId})
  user_socket.socketId.push(clientIdentifier)
  user_socket.activity = "Online"
  user_socket.lastTimeActive = "Online"
  await user_socket.save()

  //MESSAGE
  socket.on('message', async (data) => {
    //join the sender to a room
    socket.join(data.room)
    const user_sockets1 = await User.findById(data.senderID)
    const socketsID1 = user_sockets1.socketId
    socketsID1.forEach(socketId => {
      const clientSocket = clientSockets[socketId];
      if (clientSocket) {
        clientSocket.join(data.room);
      }
    });
    //join the recepeint to the same room
    const user_sockets2 = await User.findById(data.receiverID)
    const socketsID2 = user_sockets2.socketId
    socketsID2.forEach(socketId => {
      const clientSocket = clientSockets[socketId];
      if (clientSocket) {
        clientSocket.join(data.room);
      }
    });
    //save the message first
    const date = setDate()
    const message_model = await Message.create({
      message: data.message,
      sender: user_sockets1.username,
      receiver: user_sockets2.username,
      senderId: data.senderID,
      receiverId: data.receiverID,
      date: date
    })
    
    //emit message to the room
    io.to(data.room).emit('message', message_model)
  }) 

  socket.on("seen", async (messageId) => {
      const set_read = await Message.findOneAndUpdate({_id: messageId}, {read: true}, {new: true, runValidators:true})
      
  })

  // DISCONNECTION
  socket.on('disconnect', async () => {
    const {userId, user} = await getUserId(socket)//like authenticating
    if(!userId){
      return
    }
    delete clientSockets[clientIdentifier];
    //delete the socket id from database
    try {
      const user_socket = await User.findOne({_id: userId})
      user_socket.socketId.pop(clientIdentifier)
      await user_socket.save()
    } catch (error){
      console.log("error: ", error)
    }

    const date = setDate()
    const user_socket = await User.findOne({_id: userId})
    if(user_socket.socketId.length == 0) {
      user_socket.activity = "Offline"
      user_socket.lastTimeActive= date
      await user_socket.save()

      io.emit('activity', {status: "Offline", lastActive: date, userId: userId})
    }
    console.log("A User disconnected")
    
    
  });

  
});

//end codes


// //error handler
app.use(errorHandlerMiddleware);
app.use(notFoundMiddleware);

function check() {
    let list =[
        {id: "233", check: true, lastMessageTime: '2023-10-07T17:52:44.999Z'},
        {id: "we3e", check: false, lastMessageTime: '2023-10-11T12:15:38.722Z'},
        {id: "223433", check: true,lastMessageTime: '2023-10-11T12:53:26.046Z'}
    ]
    console.log(list)
    // users.sort((a,b) => new Date(b.lastMessageTime)  - new Date(a.lastMessageTime));
    let currentTime = new Date()
    list.sort((a,b) => {
        let timeA = new Date(a.lastMessageTime);
        let timeB = new Date(b.lastMessageTime)
        let differenceA = Math.abs(timeA - currentTime)
        let differenceB = Math.abs(timeB - currentTime)
        return differenceA - differenceB
    })
    console.log(list)
}



const port = process.env.PORT || 3000


const start = async () => {
    try{
        //connect DB
        await connectDB()
        server.listen(port), console.log(`Server is listening to port ${port}`)
        // app.listen(port, "0.0.0.0", console.log(`Server is listening to port ${port}`))
    } catch (error) {
        console.log(error)
    }
}

start();
// check();