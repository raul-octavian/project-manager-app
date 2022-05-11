const { array, date, bool } = require("joi");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate")


const Schema = mongoose.Schema;

let CardSchema = new Schema({


  cardName: {
    type: String,
    required: true,
  },
  index: {
    type: Number
  },

  stage: {
    type: String,
    default: "backlog"
  },
  cardDescription: {
    type: String,
  },
  status: {
    type: Boolean,
    default: false,
  },
  tasks: [
    { type: Schema.Types.ObjectId, ref: 'Task', autopopulate: true }
  ],
  cardMembers: [
    {
      type: Schema.Types.ObjectId, ref: 'User',
      autopopulate: { select: ['name', 'email', 'username'] }
    }
  ],
  cardStartDate: {
    type: Date
  },
  cardDueDate: {
    type: Date
  },
  cardAllocatedHours: {
    type: Number
  },
  cardUsedHours: {
    type: Number,
    default: 0,
    min: 0,
  },
  isComplete: {
    type: Boolean,
    default: false
  },
  allowsManualHoursInput: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})
CardSchema.plugin(autopopulate);

CardSchema.pre('findOneAndUpdate', function () {
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

CardSchema.pre('updateOne', function () {
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

module.exports = mongoose.model('Card', CardSchema);