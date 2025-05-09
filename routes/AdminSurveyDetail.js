const express = require("express");
const router = express.Router();
const Survey = require("../models/Survey");

// ✅ 설문 승인 처리
router.post("/surveys/:id/approve", async (req, res) => {
  try {
    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      {
        approved: true,
        status: "approved"  // 상태도 업데이트
      },
      { new: true }
    );

    if (!survey) {
      return res.status(404).json({ message: "설문을 찾을 수 없습니다." });
    }

    res.status(200).json({ message: "승인 완료", survey });
  } catch (error) {
    console.error("[승인 오류]", error);
    res.status(500).json({ message: "설문 승인 중 오류 발생", error });
  }
});

// ✅ 설문 거절 처리
router.post("/surveys/:id/reject", async (req, res) => {
  try {
    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      {
        approved: false,
        status: "rejected"  // 상태도 업데이트
      },
      { new: true }
    );

    if (!survey) {
      return res.status(404).json({ message: "설문을 찾을 수 없습니다." });
    }

    res.status(200).json({ message: "거절 완료", survey });
  } catch (error) {
    console.error("[거절 오류]", error);
    res.status(500).json({ message: "설문 거절 중 오류 발생", error });
  }
});

module.exports = router;
