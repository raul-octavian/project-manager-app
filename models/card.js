const { array } = require("joi");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate")


const Schema = mongoose.Schema;

let CardSchema = new Schema({


  cardName: {
    type: String,
    required: true,
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
    { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true }
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
}, {
  timestamps: true
})
CardSchema.plugin(autopopulate);

module.exports = mongoose.model('Card', CardSchema);