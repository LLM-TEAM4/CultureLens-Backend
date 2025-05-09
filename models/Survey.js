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

  //거절상태추가
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Survey", SurveySchema);
