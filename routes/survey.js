const express = require("express");
const router = express.Router();

const multer = require("multer");
const { uploadToNcpS3 } = require("../utils/s3");

const Survey = require("../models/Survey");
const User = require("../models/User");
const Response = require("../models/Response");

const mongoose = require("mongoose");
const upload = multer({ storage: multer.memoryStorage() });

/*User.responses는 기존 응답 삭제 후 다시 추가됨 → 1회 응답 유지
Survey.responses는 중복 저장 가능 → 누적 이력 저장
answers는 [1, 3, 4, ...] 형태의 점수 배열
respondedAt은 시간 기록용 필드*/

// ✅ 설문 등록
router.post("/", upload.single("image"), async (req, res) => {
  if (!req.session.user) {
    return res.status(400).json({ message: "잘못된 요청입니다." });
  }

  const user = await User.findOne({ id: req.session.user.id });
  if (!user) {
    return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
  }

  try {
    const { admin, country, category, entityName } = req.body;
    const captions = JSON.parse(req.body.captions);
    const file = req.file;

    let imageUrl = "";
    if (file) {
      const s3Result = await uploadToNcpS3(file); // 네이버 클라우드 S3 업로드
      imageUrl = s3Result;
    } else {
      console.log("파일 없음");
    }

    const newSurvey = new Survey({
      user,
      country,
      category,
      entityName,
      captions,
      imageUrl,
      approved: false,
    });

    await newSurvey.save();
    res.status(201).json({ message: "등록 성공", survey: newSurvey });
  } catch (err) {
    console.error("❌ 설문 등록 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 설문 전체 목록 가져오기 + 진행도 포함
router.get("/", async (req, res) => {
  const user = req.session.user;

  if (user) {
    console.log("📥 설문 요청 - 유저:", {
      id: user.id,
      nickname: user.nickname,
    });
  } else {
    console.log("📥 설문 요청 - 비로그인 사용자");
  }

  try {
    const surveys = await Survey.find(); // 모든 설문
    let userResponses = [];
    if (user?._id) {
      userResponses = await Response.find({ userId: user._id });
    }

    const surveysWithProgress = surveys.map((survey) => {
      const matched = userResponses.find(
        (r) => r.surveyId.toString() === survey._id.toString()
      );

      return {
        _id: survey._id,
        imageUrl: survey.imageUrl,
        country: survey.country,
        category: survey.category,
        entityName: survey.entityName,
        title: `${survey.country} > ${survey.category} > ${survey.entityName}`,
        captions: survey.captions,
        progress: matched ? matched.answers.length : 0,
        total: 20,
      };
    });

    res.json(surveysWithProgress);
  } catch (error) {
    console.error("❌ 설문 목록 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 설문 세부 정보 가져오기
router.get("/:id", async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: "존재하지 않는 설문입니다" });

    const progress = survey.responses?.length || 0;
    const goal = 20;
    const progressPercentage = (progress / goal) * 100;

    res.json({
      survey,
      progress: {
        current: progress,
        total: goal,
        percentage: progressPercentage.toFixed(2),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 설문 응답 저장
router.post("/:surveyId/answer", async (req, res) => {
  const { surveyId } = req.params;
  const { answers } = req.body;
  const userId = req.session.user?._id;

  if (!userId) return res.status(401).json({ message: "로그인이 필요합니다." });

  const existing = await Response.findOne({ userId, surveyId });

  if (existing) {
    existing.answers = answers;
    existing.respondedAt = new Date();
    await existing.save();
  } else {
    await Response.create({ userId, surveyId, answers });
  }

  res.json({ message: "응답 저장 완료" });
});

// ✅ 로그인한 유저의 모든 응답 조회
router.get("/my", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const responses = await Response.find({ userId: req.session.user._id }).populate("surveyId");
    res.json(responses);
  } catch (err) {
    console.error("❌ 응답 조회 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 유저의 해당 설문 응답 개수 조회
router.get("/:surveyId/progress", async (req, res) => {
  const { surveyId } = req.params;
  const userId = req.session.user?._id;

  if (!userId) return res.status(401).json({ message: "로그인이 필요합니다." });

  const response = await Response.findOne({ userId, surveyId });
  const progress = response?.answers.length || 0;

  res.json({ progress });
});

module.exports = router;
