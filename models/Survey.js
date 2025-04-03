const mongoose = require("mongoose");

const SurveySchema = new mongoose.Schema({
  admin: {
    type: String,
    required: true, // 관리자의 ID 또는 이름
  },
  country: {
    type: String,
    required: true, // 설문이 속한 국가
  },
  category: {
    type: String,
    required: true, // 설문 카테고리 (예: Architecture, Cuisine 등)
  },
  entityName: {
    type: String,
    required: true, // 설문을 평가하는 대상의 이름 (예: 한옥, 음식 등)
  },
  imageUrl: {
    type: String,
    required: true, // 설문에 포함될 이미지 URL
  },
  captions: {
    type: [String], // 설문에 포함된 캡션들 (예: "경치", "디자인", "실용성")
    required: true,
  },
  responses: [
    {
      respondentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 응답자 정보 (사용자 ID로 식별)
      answers: {
        type: [Number], // 각 캡션에 대한 점수 배열 (1~5 점수)
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now, // 설문 생성 시 자동으로 저장되는 시간
  },
});

// 설문 모델 생성
module.exports = mongoose.model("Survey", SurveySchema);
