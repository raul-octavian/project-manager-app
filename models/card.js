const { array } = require("joi");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");


const Schema = mongoose.Schema;

let cardSchema = new Schema({


  card_stage: {
    type: String
  },
  card_name: {
    type: String,
  },
  card_description: {
    type: String,
  },
  status: {
    type: Boolean,
    default: false,
  },
  card_start_Date: {
    type: Date
  },
  card_due_Date: {
    type: Date
  },
  card_allocated_Hours: {
    type: Number
  },
  card_usedHours: {
    type: Number,
    default: 0,
    min: 0,
  },

  card_members: [
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

  tasks: [
    { type: Schema.Types.ObjectId, ref: 'task' }
  ]
});

module.exports = mongoose.model('card', cardSchema);