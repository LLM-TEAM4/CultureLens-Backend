const express = require("express");
const router = express.Router();
const Response = require("../models/Response");
const User = require("../models/User");
const Survey = require("../models/Survey");

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

// ✅ 공통 함수로 사용 (주간/월간 랭킹)
async function generateCountryRanking(filter = {}) {
  const responses = await Response.find(filter)
    .populate("surveyId")
    .populate("userId");

  const countryMap = {};

  for (const res of responses) {
    const survey = res.surveyId;
    const user = res.userId;
    if (!survey || !user || !survey.country) continue;

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

  return calculateRanking(countryMap);
}

// ✅ 주간 랭킹 (기간 제한 없이 전체 응답 기준)
router.get("/weekly", async (req, res) => {
  try {
    const cumulativeRanking = await Response.aggregate([
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" } },
      { $unwind: "$userInfo" },
      { $project: { id: "$userInfo.id", nickname: "$userInfo.nickname", count: 1 } }
    ]);
    const ranked = cumulativeRanking.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
    res.status(200).json(cumulativeRanking);
  } catch (error) {
    console.error("❌ 주간 누적 랭킹 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});


// ✅ 월간 랭킹 (이달의 응답만)
router.get("/monthly", async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const cumulativeMonthlyRanking = await Response.aggregate([
      { $match: { respondedAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" } },
      { $unwind: "$userInfo" },
      { $project: { id: "$userInfo.id", nickname: "$userInfo.nickname", count: 1 } }
    ]);
    const ranked = cumulativeRanking.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
    res.status(200).json(cumulativeMonthlyRanking);
  } catch (error) {
    console.error("❌ 월간 누적 랭킹 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 국가별 랭킹 조회 라우터 추가
router.get("/country/:country", async (req, res) => {
  const { country } = req.params;
  const { period } = req.query;

  let dateFilter = {};
  if (period === "monthly") {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
    dateFilter = { respondedAt: { $gte: startOfMonth, $lte: endOfMonth } };
  }

  const responses = await Response.find(dateFilter)
    .populate("surveyId")
    .populate("userId");

  const userCounts = {};

  for (const res of responses) {
    if (res.surveyId?.country !== country) continue;
    const userId = res.userId?._id?.toString();
    if (!userId) continue;
    userCounts[userId] = (userCounts[userId] || 0) + 1;
  }

  const users = await User.find({ _id: { $in: Object.keys(userCounts) } });

  const ranking = users
  .map(u => ({
    id: u.id,
    nickname: u.nickname,
    profileImage: u.profileImage,
    count: userCounts[u._id.toString()],
  }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 5)
  .map((user, index) => ({
    ...user,
    rank: index + 1  
  }));

  res.json(ranking);
});


module.exports = router;
