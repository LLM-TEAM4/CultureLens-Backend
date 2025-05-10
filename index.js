require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth");
const surveyRoutes = require("./routes/survey");
const rankingRoutes = require("./routes/ranking");

const app = express();
const port = process.env.PORT || 4000;

app.use(session({
  secret: 'your-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true, // HTTPS 환경에서만
    sameSite: 'none' // 크로스 도메인 쿠키를 허용
  }
}));

app.use(cors({
  origin: 'https://culturelens-frontend.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ OPTIONS 요청에 대해 204 상태 코드 반환 (Express에서 처리)
app.options(/.*/, (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://culturelens-frontend.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204); // 204 응답으로 OPTIONS 요청 처리
});

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
app.get("/", (req, res) => {
  res.send("✅ 서버가 잘 작동 중입니다.");
});

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
