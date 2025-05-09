const express = require("express");
const router = express.Router();
const Survey = require("../models/Survey");

console.log("✅ MaingPage.js 라우터 로드됨");

router.get("/home", async (req, res) => {
  console.log("📥 /api/home 요청 받음");

  try {
    const surveys = await Survey.find({ approved: true });
    console.log("✅ 승인된 설문 결과:", surveys);
    res.status(200).json(surveys);
  } catch (error) {
    console.error("🔥 서버 오류 발생:", error);
    res.status(500).json({
      message: "서버 오류 발생",
      error: error.message,
      stack: error.stack,
    });
  }
});

module.exports = router;
