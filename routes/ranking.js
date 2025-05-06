const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ✅ 랭킹 계산 함수 (공통)
function calculateRanking(countryMap) {
  const result = {};

  for (const [country, userMap] of Object.entries(countryMap)) {
    const userArray = Object.values(userMap).sort((a, b) => b.count - a.count);
    result[country] = [];

    let currentRank = 1;
    let prevCount = null;
    let skip = 0;

    for (let i = 0; i < userArray.length && result[country].length < 5; i++) {
      const user = userArray[i];

      if (user.count !== prevCount) {
        currentRank += skip;
        skip = 1;
      } else {
        skip++;
      }

      result[country].push({
        id: user.id,
        nickname: user.nickname,
        profileImage: user.profileImage,
        count: user.count,
        rank: currentRank,
      });

      prevCount = user.count;
    }
  }

  return result;
}

// ✅ 주간 랭킹
router.get("/weekly", async (req, res) => {
  try {
    const users = await User.find().populate("responses.surveyId");
    const countryMap = {};

    for (const user of users) {
      for (const response of user.responses) {
        const survey = response.surveyId;
        if (!survey || !survey.country) {
          //console.log("⚠️ 주간: 유효하지 않은 설문:", survey);
          continue;
        }

        const country = survey.country;

        if (!countryMap[country]) countryMap[country] = {};

        if (!countryMap[country][user.id]) {
          countryMap[country][user.id] = {
            id: user.id,
            nickname: user.nickname,
            profileImage: user.profileImage,
            count: 0,
          };
        }

        countryMap[country][user.id].count += 1;
      }
    }

    const result = calculateRanking(countryMap);
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ 주간 랭킹 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 월간 랭킹
router.get("/monthly", async (req, res) => {
  try {
    const users = await User.find().populate("responses.surveyId");
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const countryMap = {};

    for (const user of users) {
      //console.log("✅ 유저 ID:", user.id);
      for (const response of user.responses) {
        if (!response.respondedAt) {
          //console.log("⚠️ 응답에 respondedAt 없음:", response);
          continue;
        }

        const date = new Date(response.respondedAt);
        if (isNaN(date.getTime())) {
          //console.log("❌ Invalid Date:", response.respondedAt);
          continue;
        }

        if (date < startOfMonth || date > endOfMonth) continue;

        const survey = response.surveyId;
        if (!survey || !survey.country) {
          //console.log("⚠️ 월간: 유효하지 않은 설문:", survey);
          continue;
        }

        const country = survey.country;

        if (!countryMap[country]) countryMap[country] = {};

        if (!countryMap[country][user.id]) {
          countryMap[country][user.id] = {
            id: user.id,
            nickname: user.nickname,
            profileImage: user.profileImage,
            count: 0,
          };
        }

        countryMap[country][user.id].count += 1;
      }
    }

    const result = calculateRanking(countryMap);
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ 월간 랭킹 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
