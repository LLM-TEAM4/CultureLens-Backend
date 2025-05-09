// ✅ 1. 환경 설정
require("dotenv").config();

// ✅ 2. 모듈 불러오기
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 4000;

// ✅ 3. 라우터 불러오기
const authRoutes = require("./routes/auth");
const surveyRoutes = require("./routes/survey");
const rankingRoutes = require("./routes/ranking");
const adminRouter = require("./routes/Administrator");
const adminSurveyDetailRouter = require("./routes/AdminSurveyDetail");
const homeSurveyRoutes = require("./routes/MainPage");

// ✅ 4. 세션 설정
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

// ✅ 5. 미들웨어
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 6. 라우터 등록
app.use("/api/auth", authRoutes);
app.use("/survey", surveyRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/admin/surveys", adminRouter);
app.use("/admin/detail", adminSurveyDetailRouter);
app.use("/api", homeSurveyRoutes);

// ✅ 7. 기본 라우터
app.get("/", (req, res) => {
  res.send("✅ 서버가 잘 작동 중입니다.");
});

// ✅ 8. 유저 세션 확인
app.get("/api/userinfo", (req, res) => {
  if (req.session && req.session.user) {
    res.json({ id: req.session.user.id });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// ✅ 9. 로그아웃
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("로그아웃 실패");
    res.clearCookie("connect.sid");
    res.send("로그아웃 성공");
  });
});

// ✅ 10. MongoDB 연결 및 서버 실행
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ MongoDB 연결 성공");
    app.listen(port, () => {
      console.log(`🚀 서버 실행 중: http://localhost:${port}`);
      console.log("✅ 현재 연결 중인 DB URI:", process.env.MONGO_URI);
    });
  })
  .catch((err) => console.error("❌ MongoDB 연결 실패", err));
