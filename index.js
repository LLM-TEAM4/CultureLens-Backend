// ✅ 1. 환경 설정
require("dotenv").config();

// ✅ 2. 모듈 불러오기
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 4000;

// ✅ 3. 라우터 불러오기 (순서 주의)
const adminRouter = require("./routes/Administrator");              // 관리자 목록/탭 라우터
const adminSurveyDetailRouter = require("./routes/AdminSurveyDetail"); // 관리자 상세 승인/거절 라우터
const authRoutes = require("./routes/auth");                        // 사용자 인증
const surveyRoutes = require("./routes/survey");                    // 설문 API
const homeSurveyRoutes = require("./routes/MainPage");              // 홈 화면용 설문 조회

// ✅ 4. 미들웨어 등록
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 5. 라우터 등록
app.use("/admin/surveys", adminRouter);          // GET /admin/surveys?status=...
app.use("/admin/detail", adminSurveyDetailRouter); // POST /admin/detail/:id/approve

app.use("/api/auth", authRoutes);                // 회원가입/로그인
app.use("/survey", surveyRoutes);                // 설문 등록 및 응답
app.use("/api", homeSurveyRoutes);               // 메인 페이지용 설문 목록 (GET /api/home 등)

// ✅ 6. 테스트용 기본 라우터
app.get("/", (req, res) => {
  res.send("✅ 서버가 잘 작동 중입니다.");
});

// ✅ 7. MongoDB 연결
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch((err) => console.error("❌ MongoDB 연결 실패", err));

// ✅ 8. 서버 실행
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
  console.log("✅ 현재 연결 중인 DB URI:", process.env.MONGO_URI);
});