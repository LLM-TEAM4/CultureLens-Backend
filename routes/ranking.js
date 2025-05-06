const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.get("/weekly", async (req, res) => {
  try {
    // 응답에 포함된 surveyId까지 한 번에 가져옴
    const users = await User.find().populate("responses.surveyId");

    const countryMap = {};

    for (const user of users) {
      for (const response of user.responses) {
        const survey = response.surveyId;

        if (!survey || !survey.country) continue; // 데이터 무결성 체크

        const country = survey.country;

        if (!countryMap[country]) {
          countryMap[country] = {};
        }

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

    res.status(200).json(result);
  } catch (err) {
    console.error("❌ 랭킹 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
