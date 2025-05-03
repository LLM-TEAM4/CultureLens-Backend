const mongoose = require("mongoose");

const SurveySchema = new mongoose.Schema({
  admin: {
    type: String,
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
    required: true,
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
    default: false, // 관리자 승인 전까지는 false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Survey", SurveySchema);
