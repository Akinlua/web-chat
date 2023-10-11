// Connect to the Socket.IO server
const socket = io('http://127.0.0.1:3000/')

socket.on('connect', () => {

})

window.onload = function () {
  const unread_tag = document.getElementById("unread-tag")
  const chat_wrapper = document.getElementById("chat-wrapper")
  if(!unread_tag)  chat_wrapper.scrollTop = chat_wrapper.scrollHeight
  else unread_tag.scrollIntoView();
  const message_box = document.getElementById("message")
  message_box.focus()
}

//send message to the server
function sendMessage(event) {

    if(event.keyCode === 13){
      // send a message to the server
      const receiverId = document.getElementById("receiverId").value
      const senderId = document.getElementById("senderId").value
      const message = document.getElementById("message").value
      const room = receiverId + senderId
      // remove the value after getting the value
      const message_ = document.getElementById("message");
      message_.value = '';
      //dont append to page until a connection is made that is sent to the user
      if(message != '')  socket.emit('message', {message: message, senderID: senderId, receiverID: receiverId, room: room})
    }
    
}

socket.on('message', (data) => {

  const senderId = document.getElementById("senderId").value
  const receiverId = document.getElementById("receiverId").value
  
  // append for sender
  if(senderId == data.senderId){

      if(data.senderId != data.receiverId) {
        //append the receipient box up
        const chatBox_wrapper = document.getElementById('chatBox-Wrapper')
        const receiverBox = document.getElementById(`unreadWrap${data.receiverId}`)

        chatBox_wrapper.removeChild(receiverBox)
        chatBox_wrapper.insertBefore(receiverBox, chatBox_wrapper.children[1])
      }
      //also make sure that it sent to the receipient
      if(receiverId == data.receiverId){
        const htmlString = `
        <li class="clearfix">
          <div class="message-data text-right">
              <span class="message-data-time">${data.date}</span>
              <img src="https://bootdey.com/img/Content/avatar/avatar7.png" alt="avatar">
          </div>
          <div class="message other-message float-right">${data.message}</div>
        </li>
      `
      const ul = document.getElementById("chats");
      ul.insertAdjacentHTML('beforeend', htmlString)
      const chat_wrapper = document.getElementById("chat-wrapper")
      chat_wrapper.scrollTop = chat_wrapper.scrollHeight

      }
  } else {
       //append for receiver
      if(senderId == data.receiverId){

        if(data.senderId != data.receiverId) {
          //append the receipient box up
          const chatBox_wrapper = document.getElementById('chatBox-Wrapper')
          const receiverBox = document.getElementById(`unreadWrap${data.senderId}`)
  
          chatBox_wrapper.removeChild(receiverBox)
          chatBox_wrapper.insertBefore(receiverBox, chatBox_wrapper.children[1])
        }
        
        //check if page is opened
        if(receiverId == data.senderId) {
            const htmlString = `
            <li class="clearfix">
              <div class="message-data text-left">
                  <span class="message-data-time">${data.date}</span>
                  <img src="https://bootdey.com/img/Content/avatar/avatar7.png" alt="avatar">
              </div>
              <div class="message my-message">${data.message}</div>
            </li>
          `
          const ul = document.getElementById("chats");
          ul.insertAdjacentHTML('beforeend', htmlString)
          const unread_tag = document.getElementById("unread-tag")
          const chat_wrapper = document.getElementById("chat-wrapper")
          if(!unread_tag)  chat_wrapper.scrollTop = chat_wrapper.scrollHeight
          //then mark as seen
          socket.emit("seen", (data._id))
        } else {
          const unreadHMTLcontent = `<p  id="unread${data.senderId}" style=" display: none; background-color: green; width: 20px; height: 20px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white;">1</p>`
          const newElement = document.createRange().createContextualFragment(unreadHMTLcontent)
          const unreadWrapper = document.getElementById(`unreadWrap${data.senderId}`)

          const checkUnreadContent = document.getElementById(`unread${data.senderId}`)
          if(checkUnreadContent){
              //get the text content to manipulate
              const value = checkUnreadContent.textContent
              const newValue = String(parseInt(value) + 1)
              const new_unreadHMTLcontent = `<p  id="unread${data.senderId}" style=" display: none; background-color: green; width: 20px; height: 20px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white;">${newValue}</p>`
              const new_newElement = document.createRange().createContextualFragment(new_unreadHMTLcontent)
              unreadWrapper.replaceChild(new_newElement, checkUnreadContent)
          } else {
            unreadWrapper.appendChild(newElement)
          }
        }
      }
  }

 
  

  
})
socket.on('activity', (activity) => {
  const oldElement = document.getElementById(`status${activity.userId}`)
  const parent = document.getElementById(`status-wrap${activity.userId}`)
  let newElementHTML
  if(activity.status== "Online") newElementHTML= `<div class="status" id="status${activity.userId}"> <i class="fa fa-circle online"></i> ${activity.status} </div>`
  else newElementHTML= `<div class="status" id="status${activity.userId}"> <i class="fa fa-circle offline"></i> ${activity.status} </div>`
  const newElement = document.createRange().createContextualFragment(newElementHTML) 

  parent.replaceChild(newElement, oldElement)

  //only if chat is opened
  const receipientID = document.getElementById("receipientID").value
  if(activity.userId == receipientID){
    const oldElement = document.getElementById("chat-status")
    const parent = document.getElementById("parent-chat-status")
    let newElementHTML
    if(activity.status== "Online") newElementHTML= `<small id="chat-status"> ${activity.status}</small>`
    else newElementHTML= `<small id="chat-status"> Last seen ${activity.lastActive}</small>`
    const newElement = document.createRange().createContextualFragment(newElementHTML)
    parent.replaceChild(newElement, oldElement)
  }

})

socket.on("authFailed", () => {
  //redirect to login
  window.location.href = '/login'
  console.log("Auth Failed")
})

socket.on('reconnect', (attemptNumber) => {
  console.log(`Reconnected- ${attemptNumber}`)

  // reload page for update
  const receipientID = document.getElementById("receipientID").value
  render(receipientID,'')

})


// // Handle disconnection event
socket.on('disconnect', () => {
  // Update the Socket.IO connection status
  console.log("DISCONNECTED")
  
});

