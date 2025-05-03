require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/auth");
const app = express();
const port = process.env.PORT || 4000;

// ✅ 미들웨어 (라우터보다 먼저 선언해야 함!)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", userRoutes);

// ✅ 라우터 등록 (중복 제거 및 순서 수정)
const authRoutes = require("./routes/auth"); 
const surveyRoutes = require("./routes/survey");

app.use("/api/auth", authRoutes);  
app.use("/survey", surveyRoutes);

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

// GitHub Actions가 배포했다면 PM2 로그에 찍힘
console.log("✅ 자동 배포 테스트 로그"); 

