const bodyParser = require("body-parser");


const cors = require("cors");


const MongoStore = require("connect-mongo");
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const userRoutes = require("./routes/auth");
const app = express();
const port = process.env.PORT || 4000;

const session = require('express-session');

// ✅ 미들웨어 (라우터보다 먼저 선언해야 함!)
app.use(cors({
  origin: 'http://localhost:3000', // React 개발 서버의 주소
  credentials: true, // 쿠키와 같은 인증 정보 포함
}));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",  // 세션 데이터 저장할 컬렉션
    }),
    cookie: {
      httpOnly: true,
      secure: false, // HTTPS 아니면 false
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 1, // 1시간// 쿠키 유효 시간 (예: 1시간)
    },
  })
);





app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ✅ 라우터 등록 (중복 제거 및 순서 수정)

const surveyRoutes = require("./routes/survey");

app.use("/api/auth", require("./routes/auth")); 
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

app.get("/api/userinfo", (req, res) => {
  if (req.session && req.session.user) {
    res.json({ id: req.session.user.id }); // 또는 username 등
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});



app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("로그아웃 실패");
    res.clearCookie("connect.sid");
    res.send("로그아웃 성공");
  });
});
