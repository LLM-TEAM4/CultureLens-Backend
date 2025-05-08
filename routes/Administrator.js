const express = require("express");
const router = express.Router();
const Survey = require("../models/Survey");

// ✅ 1. 승인 상태별 설문 목록 가져오기
// GET /admin/surveys?status=pending|approved|rejected
router.get("/", async (req, res) => {
  const { status } = req.query;

  let filter = {};
  if (status === "approved") filter.approved = true;
  else if (status === "rejected") filter.approved = false;
  else if (status === "pending") filter.approved = null;

  try {
    const surveys = await Survey.find(filter).sort({ createdAt: -1 });
    res.status(200).json(surveys);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "설문 조회 실패", error: err });
  }
});

// ✅ 2. 설문 승인
// POST /admin/surveys/:id/approve
router.post("/:id/approve", async (req, res) => {
  try {
    const updated = await Survey.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );
    res.status(200).json({ message: "승인 완료", survey: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "승인 처리 실패", error: err });
  }
});

// ✅ 3. 설문 거절
// POST /admin/surveys/:id/reject
router.post("/:id/reject", async (req, res) => {
  try {
    const updated = await Survey.findByIdAndUpdate(
      req.params.id,
      { approved: false },
      { new: true }
    );
    res.status(200).json({ message: "거절 완료", survey: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "거절 처리 실패", error: err });
  }
});

module.exports = router;
