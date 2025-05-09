const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadToNcpS3 } = require("../utils/s3");
const Survey = require("../models/Survey");
const User = require("../models/User");
const mongoose = require("mongoose");
const upload = multer({ storage: multer.memoryStorage() });

/*User.responses는 기존 응답 삭제 후 다시 추가됨 → 1회 응답 유지
Survey.responses는 중복 저장 가능 → 누적 이력 저장
answers는 [1, 3, 4, ...] 형태의 점수 배열
respondedAt은 시간 기록용 필드*/


// 설문 등록
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
      approved: false,
    });

    await newSurvey.save();
    res.status(201).json({ message: "등록 성공", survey: newSurvey });
  } catch (err) {
    console.error("❌ 설문 등록 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});




// 설문 전체 목록 불러오기 (진행도 포함)
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
    const surveys = await Survey.find({ approved: true });//일반유저는 승인된설문만 볼 수 있도록록
    //console.log("✅ 승인된 설문 조회 결과:", surveys);
    let userResponses = [];
    if (user?._id) {
      const foundUser = await User.findById(user._id);
      userResponses = foundUser.responses || [];
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

// 설문 응답 저장 (기존 응답 누적 저장)
router.post("/:id/answer", async (req, res) => {
  const { answers } = req.body;
  const surveyId = req.params.id;

  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    const existingResponse = user.responses.find(
      (r) => r.surveyId.toString() === surveyId
    );

    let combinedAnswers = answers;

    if (existingResponse) {
      combinedAnswers = [...existingResponse.answers];

      for (let i = 0; i < answers.length; i++) {
        const targetIndex = existingResponse.answers.length + i;
        combinedAnswers[targetIndex] = answers[i];
      }

      await User.updateOne(
        { _id: userId },
        { $pull: { responses: { surveyId } } }
      );
    }

    await User.updateOne(
      { _id: userId },
      {
        $push: {
          responses: {
            surveyId,
            answers: combinedAnswers,
            respondedAt: new Date(),
          },
        },
      }
    );

    await Survey.updateOne(
      { _id: surveyId },
      {
        $push: {
          responses: {
            respondentId: userId,
            answers,
          },
        },
      }
    );

    res.status(200).json({ message: "응답 저장 완료" });
  } catch (err) {
    console.error("❌ 설문 응답 저장 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

//설문 승인 처리
router.post("/:id/approve", async (req, res) => {
  const surveyId = req.params.id;

  try {
    const updated = await Survey.findByIdAndUpdate(
      surveyId,
      { isApproved: true },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "설문 없음" });

    res.status(200).json({ message: "승인 완료", survey: updated });
  } catch (err) {
    console.error("설문 승인 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

//설문 거절
router.post("/:id/reject", async (req, res) => {
  const surveyId = req.params.id;

  try {
    const updated = await Survey.findByIdAndDelete(surveyId); // 또는 status: "rejected"로 처리
    if (!updated) return res.status(404).json({ message: "설문 없음" });

    res.status(200).json({ message: "거절 및 삭제 완료" });
  } catch (err) {
    console.error("설문 거절 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


// 유저의 해당 설문 응답 개수 조회
router.get("/:id/progress", async (req, res) => {
  if (!req.session?.user?._id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  const userId = req.session.user._id;
  const surveyId = req.params.id;

  try {
    const user = await User.findById(userId);
    const response = user.responses.find((r) => r.surveyId.toString() === surveyId);
    const progress = response ? response.answers.length : 0;

    res.status(200).json({ progress });
  } catch (err) {
    console.error("❌ 설문 진행도 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.get("/pending", async (req, res) => {
  try {
    const pendingSurveys = await Survey.find({ isApproved: false });
    res.status(200).json(pendingSurveys);
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});

// GET /survey/:id
router.get("/:id", async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: "존재하지 않는 설문입니다" });
    res.status(200).json(survey);
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
