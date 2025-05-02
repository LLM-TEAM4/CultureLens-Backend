const express = require("express");
const router = express.Router();
const Survey = require("../models/Survey");
const User = require("../models/User");

// ✅ POST /survey - 설문 등록
router.post("/", async (req, res) => {
  console.log("📥 POST /survey 도착");
  try {
    const { admin, country, category, entityName, imageUrl, captions } = req.body;

    const survey = new Survey({
      admin,
      country,
      category,
      entityName,
      imageUrl,
      captions,
    });

    await survey.save();
    res.status(201).json({ message: "등록 성공", survey });
  } catch (error) {
    console.error("서버 에러:", error);
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

// ✅ GET /survey - 설문 전체 조회
router.get("/", async (req, res) => {
  try {
    const surveys = await Survey.find().sort({ createdAt: -1 });
    res.json(surveys);
  } catch (error) {
    console.error("설문 가져오기 에러:", error);
    res.status(500).json({ message: "설문 목록 불러오기 실패" });
  }
});

// ✅ GET /survey/:id - 설문 상세 조회
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const survey = await Survey.findById(id);
    if (!survey) {
      return res.status(404).json({ message: "설문을 찾을 수 없습니다." });
    }
    res.json(survey);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

// ✅ POST /survey/:id/answer - 설문 응답 저장
router.post("/:id/answer", async (req, res) => {
  const { answers } = req.body;
  const surveyId = req.params.id;

  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const user = await User.findOne({ id: req.session.user.id });
    const survey = await Survey.findById(surveyId);

    if (!survey) {
      return res.status(404).json({ message: "설문이 존재하지 않습니다." });
    }

    // 1. 설문 DB에 응답 추가
    survey.responses.push({
      respondentId: user._id,
      answers,
    });
    await survey.save();

    // 2. 사용자 DB에도 응답 내역 추가
    user.responses = user.responses || [];
    user.responses.push({
      surveyId,
      answers,
    });
    await user.save();

    res.status(200).json({ message: "응답 저장 완료" });
  } catch (error) {
    console.error("❌ 응답 저장 실패:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
