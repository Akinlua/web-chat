const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const UserSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Please provide username'],
    unique: true
  },
  password: {
    type: String,
    required: true,
    required: [true, 'Please provide Password'],
  },
  activity:{
    type: String,
    enum: ['Online', 'Offline'],
    default: 'Online',
  },
  lastTimeActive:{
    type: mongoose.Schema.Types.Mixed,
  },
  socketId: [{type: String}]

});

module.exports = mongoose.model('User', UserSchema);