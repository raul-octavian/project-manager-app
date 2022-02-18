const { array } = require("joi");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let projectSchema = new Schema({


  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  owner: {
    type: String,
  },
  stages: [
    {
      name: String,
    }
  ],

  timeSchedule: {
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
    }
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
  cards: [
    { type: Schema.Types.ObjectId, ref: 'card' }
  ],
});

module.exports = mongoose.model('project', projectSchema);