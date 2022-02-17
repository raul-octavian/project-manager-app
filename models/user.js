const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    require: true
  },
  username: {
    type: String,
  },
  created_at_date: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('user', userSchema);