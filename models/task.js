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
    type: Boolean,
    default: false,
  },
  task_members: [
    { type: Schema.Types.ObjectId, ref: 'user' }
  ],
  task_start_Date: {
    type: Date
  },
  task_due_Date: {
    type: Date
  },
  task_allocated_Hours: {
    type: Number
  },
  task_used_Hours: {
    type: Number,
    default: 0,
    min: 0,
  },

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