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
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], // 가능한 값 설정
    default: 'pending', // 기본값을 '대기중'으로 설정
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Survey", SurveySchema);
