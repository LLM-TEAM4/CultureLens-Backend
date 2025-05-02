const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadToNcpS3 } = require("../utils/s3");
const Survey = require("../models/Survey");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    console.log("📥 PIST /survey 도착");
    const captions = JSON.parse(req.body.captions); //어떤 것들인지
    const { admin, country, category, entityName } = req.body;
    const file = req.file;
    

    if (!file) {
      console.log("❌ 이미지 없음");
      return res.status(400).json({ message: "이미지 파일이 첨부되지 않았습니다." });
    }

    console.log("📂 받은 파일:", file.originalname);

    const imageUrl = await uploadToNcpS3(file);
    console.log("✅ 업로드된 이미지 URL:", imageUrl);


    const survey = new Survey({
      admin,
      country,
      category,
      entityName,
      imageUrl,
      captions,
    });

    await survey.save();
    res.status(201).json({ message: "등록 완료", survey });
  } catch (err) {
    console.error("에러:", err);
    res.status(500).json({ message: "서버 에러" });
  }
});
router.post("/test", upload.single("image"), async (req, res) => {
  try {
    console.log("📥 POST /test 도착");

    const file = req.file;
    if (!file) {
      console.log("❌ 파일 없음");
      return res.status(400).json({ message: "이미지 파일이 첨부되지 않았습니다." });
    }

    console.log("📂 받은 파일:", file.originalname);

    // ✅ NCP Object Storage에 업로드
    const imageUrl = await uploadToNcpS3(file);
    console.log("✅ 업로드된 이미지 URL:", imageUrl);

    res.status(200).json({
      message: "이미지 업로드 성공",
      imageUrl,
    });
  } catch (error) {
    console.error("❌ 업로드 실패:", error);
    res.status(500).json({ message: "이미지 업로드 중 서버 오류가 발생했습니다." });
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

