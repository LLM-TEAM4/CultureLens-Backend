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

router.post("/", async (req, res) => {
  console.log("📥 POST /survey 도착");
  console.log(req.body);
  try {
    const { admin, country, category, entityName, imageUrl, captions } = req.body;

    const survey = new Survey({
      admin,
      country,
      category,
      entityName,
      imageUrl,
      captions, // 이미 배열이면 JSON.parse 필요 없음
    });

    await survey.save();
    res.status(201).json({ message: "등록 성공", survey });
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

// 설문 세부 정보 가져오기
router.get('/:id', async (req, res) => {
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

module.exports = router;

