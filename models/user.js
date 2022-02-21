const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let UserSchema = new Schema({
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
  }
},
  {
    timestamps: true
  });

module.exports = mongoose.model('User', UserSchema);