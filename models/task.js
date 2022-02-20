const { array } = require("joi");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate")



const Schema = mongoose.Schema;

let TaskSchema = new Schema({


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
    { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true }
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
TaskSchema.plugin(autopopulate);

module.exports = mongoose.model('Task', TaskSchema);