const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let teamSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  members: [
    {
      userID: {
        type: ObjectId
      },
      userRole: {
        type: String
      },
    }
  ]
});

module.exports = mongoose.model('Team', TeamSchema);