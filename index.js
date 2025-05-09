// ✅ 1. 환경 설정
require("dotenv").config();

// ✅ 2. 모듈 불러오기
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
<<<<<<< HEAD
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth");
const surveyRoutes = require("./routes/survey");
const rankingRoutes = require("./routes/ranking");

const app = express();
const port = process.env.PORT || 4000;

// ✅ 세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 60 * 60 * 2,
    }),
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 2,
    },
  })
);

// ✅ CORS 설정
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// ✅ Body 파서
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// ✅ JSON 파싱 (body-parser와 중복이긴 하지만 실무에서 겸용되기도 함)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 라우터
app.use("/api/auth", authRoutes);
app.use("/survey", surveyRoutes);
app.use("/api/ranking", rankingRoutes);

// ✅ 루트 테스트
=======
const app = express();
const port = process.env.PORT || 4000;

// ✅ 3. 라우터 불러오기 (순서 주의)
const adminRouter = require("./routes/Administrator");              // 관리자 목록/탭 라우터
const adminSurveyDetailRouter = require("./routes/AdminSurveyDetail"); // 관리자 상세 승인/거절 라우터
const authRoutes = require("./routes/auth");                        // 사용자 인증
const surveyRoutes = require("./routes/survey");                    // 설문 API
const homeSurveyRoutes = require("./routes/MainPage");              // 홈 화면용 설문 조회

// ✅ 4. 미들웨어 등록
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true  // ← 이게 핵심!
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 5. 라우터 등록
app.use("/admin/surveys", adminRouter);          // GET /admin/surveys?status=...
app.use("/admin/detail", adminSurveyDetailRouter); // POST /admin/detail/:id/approve

app.use("/api/auth", authRoutes);                // 회원가입/로그인
app.use("/survey", surveyRoutes);                // 설문 등록 및 응답
app.use("/api", homeSurveyRoutes);               // 메인 페이지용 설문 목록 (GET /api/home 등)

// ✅ 6. 테스트용 기본 라우터
>>>>>>> origin/kyeongeun/feature-admin-approval
app.get("/", (req, res) => {
  res.send("✅ 서버가 잘 작동 중입니다.");
});

<<<<<<< HEAD
// ✅ 유저 세션 확인
app.get("/api/userinfo", (req, res) => {
  if (req.session && req.session.user) {
    res.json({ id: req.session.user.id });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// ✅ 로그아웃
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("로그아웃 실패");
    res.clearCookie("connect.sid");
    res.send("로그아웃 성공");
  });
});

// ✅ MongoDB 연결 및 서버 실행
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB 연결 성공");
    app.listen(port, () => {
      console.log(`🚀 서버 실행 중: http://localhost:${port}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB 연결 실패", err));
=======
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
>>>>>>> origin/kyeongeun/feature-admin-approval
