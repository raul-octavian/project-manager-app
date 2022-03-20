const { array } = require("joi");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate")


const Schema = mongoose.Schema;

let CardSchema = new Schema({


  card_name: {
    type: String,
    required: true,
  },

  stage: {
    type: String,
    default: "backlog"
  },
  card_description: {
    type: String,
  },
  status: {
    type: Boolean,
    default: false,
  },
  tasks: [
    { type: Schema.Types.ObjectId, ref: 'Task', autopopulate: true }
  ],
  card_members: [
    { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true }
  ],
  card_start_Date: {
    type: Date
  },
  card_due_Date: {
    type: Date
  },
  card_allocated_Hours: {
    type: Number
  },
  card_used_Hours: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true
})
CardSchema.plugin(autopopulate);

module.exports = mongoose.model('Card', CardSchema);