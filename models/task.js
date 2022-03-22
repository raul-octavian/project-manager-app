const { array } = require("joi");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate")



const Schema = mongoose.Schema;

let TaskSchema = new Schema({


  taskName: {
    type: String,
    required: true,
  },
  taskDescription: {
    type: String,
  },
  status: {
    type: Boolean,
    default: false,
  }
},
  {
    timestamps: true
  })
TaskSchema.plugin(autopopulate);

module.exports = mongoose.model('Task', TaskSchema);