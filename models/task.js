const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let taskSchema = new Schema({
  cardID: ObjectId,
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  status: Number,
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

  // start_Date: {
  //   type: Date
  // },
  // due_Date: {
  //   type: Date
  // },
  // allocated_Hours: {
  //   type: Number
  // },
  // usedHours: {
  //   type: Number,
  //   default: 0,
  //   min: 0,
  // },
  members: [
    {
      userID: {
        type: ObjectId

      },
    }

  ],

  created_at_date: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('task', taskSchema);