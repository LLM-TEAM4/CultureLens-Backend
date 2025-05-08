// /routes/upload.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../utils/cloudinary");
const Survey = require("../models/Survey");

// Cloudinary 설정
/**const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "survey_images",
    allowed_formats: ["jpg", "png", "jpeg"],
  }
});

const storage = multer.memoryStorage();
const upload = multer({ storage }); //upload는 multer함수가 리턴한 미들웨어
**/

//응답 항목 유효성 검사
router.post("/", async (req, res) => {
  const { admin, country, category, entityName, imageUrl, captions, responses } = req.body;

  // 응답 항목이 비어 있지 않거나 빈 값이 아닌지 확인하는 유효성 검사
  const isComplete = responses.every(response => 
    response.answers &&  // 응답이 존재하는지 확인
    response.answers.length === captions.length && // 응답 항목 수가 캡션 수와 일치하는지 확인
    response.answers.every(answer => answer !== null && answer !== undefined && answer !== '') // 빈 값 (null, undefined, '')이 아닌지 확인
  );

  if (!isComplete) {
    return res.status(400).json({ message: "모든 항목에 응답해야 하며, 빈 값은 허용되지 않습니다." });
  }

  try {
    const survey = new Survey({
      admin,
      country,
      category,
      entityName,
      imageUrl,
      captions,
      responses, // 응답 데이터를 포함하여 저장
    });
    await survey.save();
    res.status(201).json({ message: "설문 등록 성공", survey });
  } catch (error) {
    console.error("서버 에러:", error);
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

// ✅ GET /survey - 전체 설문 목록 가져오기
router.get("/", async (req, res) => {
  try {
    console.log("📥 GET /survey 도착");
    const surveys = await Survey.find().sort({ createdAt: -1 }); // 최신순 정렬
    console.log("📦 DB에서 가져온 설문들:", surveys);
    res.json(surveys);
  } catch (error) {
    console.error("❌ 설문 가져오기 에러:", error);
    res.status(500).json({ message: "설문 목록을 불러오는 중 오류가 발생했습니다." });
  }
});

// 설문 세부 정보 가져오기 (진행 상황 포함)
router.get('/:id', async (req, res) => {
  const { id } = req.params; // URL에서 ID 받기

  try {
    const survey = await Survey.findById(id); // MongoDB에서 설문 찾기

    if (!survey) {
      return res.status(404).json({ message: "설문을 찾을 수 없습니다." });
    }

    // 설문 진행 상황 계산
    const progress = survey.responses.length;  // 응답자 수
    const goal = 20;  // 예시로 목표 응답자 수를 20명으로 설정

    const progressPercentage = (progress / goal) * 100;

    // 설문 정보와 진행 상황 반환
    res.json({
      survey,
      progress: {
        current: progress,
        total: goal,
        percentage: progressPercentage.toFixed(2),  // 진행 상태 퍼센트 계산
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});


module.exports = router;

