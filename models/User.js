const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: {
    type: String,
    default: "", // 프로필 이미지(base64) 저장용
  },
  responses: [
    {
      surveyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Survey", // 연관된 설문 참조
      },
      answers: {
        type: [Number], // 각 문항에 대한 응답 점수
        required: true,
      },
      respondedAt: {
        type: Date,
        default: Date.now, // 응답 시간 기록
      },
    },
  ],
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
