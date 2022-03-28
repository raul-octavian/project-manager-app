const { array, date } = require("joi");
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
    'default': ["backlog", "todo", "active", "test", "complete"]
  },

  timeSchedule: {
    startDate: {
      type: Date,
      default: Date.now()
    },
    dueDate: {
      type: Date
    },
    allocatedHours: {
      type: Number,
      default: 0,
      min: 0
    },
    usedHours: {
      type: Number,
      default: 0,
      min: 0,
    }
  },
  members: [
    {
      type: Schema.Types.ObjectId, ref: 'User',
      autopopulate: { select: ['name', 'email', 'username'] }
      // autopopulate: { select: 'email' },
      // autopopulate: { select: 'username' },
      // autopopulate: { select: '_id' }
    }
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