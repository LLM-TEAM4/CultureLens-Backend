const mongoose = require("mongoose");

const SurveySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  entityName: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    default: "",
  },
  captions: {
    type: [String],
    required: true,
  },
  responses: [
    {
      respondentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      answers: {
        type: [Number],
        required: true,
      },
    },
  ],
  approved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Survey", SurveySchema);
