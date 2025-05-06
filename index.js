require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 4000;

// ✅ 라우터 불러오기
const authRoutes = require("./routes/auth");
const surveyRoutes = require("./routes/survey");
const rankingRoutes = require("./routes/ranking");  // ⬅️ 요거 추가!

// ✅ 미들웨어
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 라우터 등록
app.use("/api/auth", authRoutes);
app.use("/survey", surveyRoutes);
app.use("/api/ranking", rankingRoutes); // ⬅️ 이거 추가해줘야 /api/ranking/* 경로가 작동함

// ✅ MongoDB 연결
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
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
