// server.js 또는 index.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); // ✅ 빠졌으면 반드시 추가
const app = express();
const port = process.env.PORT || 4000;

// ✅ 미들웨어는 라우터보다 먼저 선언해야 함
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 라우터 등록
const surveyRoutes = require("./routes/survey");
app.use("/survey", surveyRoutes); // 예: POST /survey

// ✅ DB 연결
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch((err) => console.error("❌ MongoDB 연결 실패", err));

// ✅ 서버 실행
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});

// ✅ 테스트용 기본 라우터
app.get("/", (req, res) => {
  res.send("✅ 서버가 잘 작동 중입니다.");
});

