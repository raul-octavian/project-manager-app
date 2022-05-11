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
  isComplete: {
    type: Boolean,
    default: false
  },
  allowsManualHoursInput: {
    type: Boolean,
    default: false
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
ProjectSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate();
  if (update.__v != null) {
    delete update.__v;
  }
  const keys = ['$set', '$setOnInsert'];
  for (const key of keys) {
    if (update[key] != null && update[key].__v != null) {
      delete update[key].__v;
      if (Object.keys(update[key]).length === 0) {
        delete update[key];
      }
    }
  }
  update.$inc = update.$inc || {};
  update.$inc.__v = 1;
});

ProjectSchema.pre('updateOne', function () {
  const update = this.getUpdate();
  if (update.__v != null) {
    delete update.__v;
  }
  const keys = ['$set', '$setOnInsert'];
  for (const key of keys) {
    if (update[key] != null && update[key].__v != null) {
      delete update[key].__v;
      if (Object.keys(update[key]).length === 0) {
        delete update[key];
      }
    }
  }
  update.$inc = update.$inc || {};
  update.$inc.__v = 1;
});

module.exports = mongoose.model('Project', ProjectSchema);