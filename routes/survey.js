const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadToNcpS3 } = require("../utils/s3");
const Survey = require("../models/Survey");
const User = require("../models/User");

const upload = multer({ storage: multer.memoryStorage() });

/*User.responses는 기존 응답 삭제 후 다시 추가됨 → 1회 응답 유지

Survey.responses는 중복 저장 가능 → 누적 이력 저장

answers는 [1, 3, 4, ...] 형태의 점수 배열

respondedAt은 시간 기록용 필드
*/

// 설문 응답 저장 (중복 응답 제거 후 새로 저장)
router.post("/:id/answer", async (req, res) => {
  const { answers } = req.body;
  const surveyId = req.params.id;

  // 세션 확인
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const userId = req.session.user._id;

    // 설문 존재 확인
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ message: "설문을 찾을 수 없습니다." });
    }

    // ✅ 1. 사용자 응답 중복 제거
    await User.updateOne(
      { _id: userId },
      { $pull: { responses: { surveyId } } }
    );

    // ✅ 2. 사용자 응답 새로 저장
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          responses: {
            surveyId,
            answers,
            respondedAt: new Date(),
          },
        },
      }
    );

    // ✅ 3. 설문 응답 저장 (이력으로 누적됨)
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

module.exports = router;
