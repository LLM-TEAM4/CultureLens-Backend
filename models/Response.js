const mongoose = require("mongoose");

const ResponseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // 누가 했는지
    required: true,
  },
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Survey", // 어떤 설문인지
    required: true,
  },
  answers: {
    type: [Number],
    required: true,
  },
  respondedAt: {
    type: Date,
    default: Date.now,
  },
});

const Response = mongoose.model("Response", ResponseSchema);
module.exports = Response;
