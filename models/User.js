const mongoose = require("mongoose");

const ResponseSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Survey"
  },
  answers: {
    type: [Number],
    required: true
  },
  respondedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false }); // 개별 _id 생성 방지 (선택)

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: "" },
  nickname: { type: String, default: "" },
  responses: [ResponseSchema]
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
