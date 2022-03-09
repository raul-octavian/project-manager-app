const { array } = require("joi");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate")

const Schema = mongoose.Schema;


let ProjectSchema = new Schema({


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

  stages: {
    type: [String],
    'default': ["backlog", "To-do", "Doing", "Test", "Complete"]
  },

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
    used_Hours: {
      type: Number,
      default: 0,
      min: 0,
    }
  },
  members: [
    { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true }
  ],
  cards: [
    { type: Schema.Types.ObjectId, ref: 'Card', autopopulate: true }
  ],
},
  {
    timestamps: true
  });

ProjectSchema.plugin(autopopulate);

module.exports = mongoose.model('Project', ProjectSchema);