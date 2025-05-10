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


// 설문 등록 - 마이페이지 설문 등록 중 등록하기 버튼. 
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
      // 네이버 클라우드 S3 업로드 
      const s3Result = await uploadToNcpS3(file);
      imageUrl = s3Result;
    } else{
      console.log("파일없음");
    }

    const newSurvey = new Survey({
      user,
      country,
      category,
      entityName,
      captions,
      imageUrl,
      status: 'pending',  // 기본 상태는 '대기중'
    });

    await newSurvey.save();
    res.status(201).json({ message: "등록 성공", survey: newSurvey });
  } catch (err) {
    console.error("❌ 설문 등록 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


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
// 로그인한 사용자가 등록한 설문만 가져오기
router.get("/posted", async (req, res) => {
  if (!req.session?.user?._id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  try {
    const userId = req.session.user._id;
    console.log("📥 GET /survey/posted 도착 - userId:", userId);

    // 로그인한 사용자가 등록한 설문만 조회 (status 관계없이)
    const surveys = await Survey.find({ user: userId }).sort({ createdAt: -1 });
    console.log("📦 내가 등록한 설문들:", surveys);

    const surveysWithResponseCount = await Promise.all(
      surveys.map(async (survey) => {
        const responses = await Response.find({ surveyId: survey._id });
        const uniqueUserCount = new Set(responses.map(r => r.userId.toString())).size;

        return {
          ...survey.toObject(),
          responseUserCount: uniqueUserCount,  // ✅ 고유 응답자 수 포함
        };
      })
    );

    res.json(surveysWithResponseCount); 
  } catch (error) {
    console.error("❌ 내가 등록한 설문 가져오기 오류:", error);
    res.status(500).json({ message: "설문 목록을 불러오는 중 오류가 발생했습니다." });
  }
});

// 📁 routes/survey.js

router.get("/all/posted", async (req, res) => {
  if (!req.session?.user?._id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const user = await User.findById(req.session.user._id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "접근 권한이 없습니다." });
    }

    console.log("📥 관리자 설문 목록 요청");

    const surveys = await Survey.find()
      .sort({ createdAt: -1 })
      .populate("user", "id email"); // ✅ 유저 정보 포함

    res.json(surveys);
  } catch (error) {
    console.error("❌ 관리자 설문 목록 조회 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});



// 설문 세부 정보 가져오기
router.get('/detail/:id', async (req, res) => {
  const { id } = req.params; // URL에서 ID 받기

  try {
    const survey = await Survey.findById(id); // MongoDB에서 설문 찾기

    if (!survey) {
      return res.status(404).json({ message: "설문을 찾을 수 없습니다." });
    }

    // 설문 정보 반환
    res.json(survey);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});


router.get("/", async (req, res) => {
  const user = req.session.user;

  if (user) {
    console.log("📥 설문 요청[진행 중인 설문조사] - 유저:", {
      id: user.id,
      nickname: user.nickname,
    });
  } else {
    console.log("📥 설문 요청[진행 중인 설문조사] - 비로그인 사용자");
  }

  try {
    const surveys = await Survey.find({ status: "approved" }); // ✅ 승인된 설문만
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
        total: survey.captions.length,
      };
    });

    res.json(surveysWithProgress);
  } catch (error) {
    console.error("❌ 설문 목록 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});


// 설문 응답 저장 (기존 응답 누적 저장)
/*
처음 저장 ➡️ 새로 저장
이어서 저장 ➡️ 기존 끝에서 덧붙임
또 이어서 저장 ➡️ 계속 이어 붙임
*/

router.post("/:surveyId/answer", async (req, res) => {
  const { surveyId } = req.params;
  const { answers } = req.body;
  const userId = req.session.user?._id;
  console.log("✅ 저장 요청 받은 surveyId:", surveyId); 
  if (!userId) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  const existing = await Response.findOne({ userId, surveyId });

  if (existing) {
    // 기존 답변 길이 기준으로 업데이트
    const combinedAnswers = [...existing.answers];

    for (let i = 0; i < answers.length; i++) {
      const targetIndex = existing.answers.length + i;
      combinedAnswers[targetIndex] = answers[i];
    }

    existing.answers = combinedAnswers;
    existing.respondedAt = new Date();
    await existing.save();
  } else {
    // 처음 저장할 때는 그대로
    await Response.create({ userId, surveyId, answers });
  }

  res.json({ message: "응답 저장 완료" });
});



// 유저의 해당 설문 응답 개수 조회
router.get("/:surveyId/progress", async (req, res) => {
  const { surveyId } = req.params;
  const userId = req.session.user?._id;

  if (!userId) return res.status(401).json({ message: "로그인이 필요합니다." });

  const response = await Response.findOne({ userId, surveyId });
  const progress = response?.answers.length || 0;

  res.json({ progress });
});

// GET /survey/:id
router.get("/:id", async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ message: "존재하지 않는 설문입니다" });
    }

    const responses = await Response.find({ surveyId: survey._id });
    const uniqueUserCount = new Set(responses.map(r => r.userId.toString())).size;

    const votes = {};
    survey.captions.forEach((_, idx) => {
      votes[idx] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    });

    responses.forEach((r) => {
      r.answers.forEach((score, idx) => {
        if (votes[idx] && votes[idx][score] !== undefined) {
          votes[idx][score]++;
        }
      });
    });

    res.status(200).json({
      ...survey.toObject(),
      votes,
      participantCount: uniqueUserCount
    });
    console.log("응답 데이터", {
      ...survey.toObject(),
      votes,
      participantCount: uniqueUserCount
    });
  } catch (err) {
    console.error("❌ 설문 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// PATCH /survey/:id/status
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, rejectReason } = req.body;

  if (!req.session?.user?._id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const user = await User.findById(req.session.user._id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "접근 권한이 없습니다." });
    }

    const update = { status };
    if (status === "rejected") {
      update.rejectReason = rejectReason;
    } else {
      update.rejectReason = undefined;
    }

    const updatedSurvey = await Survey.findByIdAndUpdate(id, update, { new: true });
    if (!updatedSurvey) {
      return res.status(404).json({ message: "설문을 찾을 수 없습니다." });
    }

    res.json(updatedSurvey);
  } catch (error) {
    console.error("❌ 상태 변경 실패:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;