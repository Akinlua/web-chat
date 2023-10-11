const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const MessageSchema = new Schema({
  message: {
    type: String,
    required: true,
  },
  sender: {
    type: String,
  },
  receiver: {
    type: String,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date:{
    type: mongoose.Schema.Types.Mixed,
  },
  read:{
    type: Boolean,
    default: false,
  }


}, {timestamps: true});

module.exports = mongoose.model('Message', MessageSchema);