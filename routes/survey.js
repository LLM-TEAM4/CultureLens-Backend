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


module.exports = router;

