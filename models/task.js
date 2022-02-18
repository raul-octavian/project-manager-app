const { array } = require("joi");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");


const Schema = mongoose.Schema;

let taskSchema = new Schema({


  task_name: {
    type: String,
    required: true,
  },
  task_description: {
    type: String,
  },
  status: {
    type: Boolean
  },
  start_Date: {
    type: Date
  },
  due_Date: {
    type: Date
  },
  allocated_Hours: {
    type: Number
  },
  usedHours: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  members: [
    {
      userID: {
        type: String

      },
    }

  ],

  created_at_date: {
    type: Date,
    immutable: true, 
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('task', taskSchema);