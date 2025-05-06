const bodyParser = require("body-parser");
const rankingRoutes = require("./routes/ranking");



const cors = require("cors");


const MongoStore = require("connect-mongo");
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const session = require("express-session");

const MongoStore = require("connect-mongo");

const app = express();
const port = process.env.PORT || 4000;

// ✅ 세션 미들웨어
app.use(session({
  secret: process.env.SESSION_SECRET || "your_secret_key",  // .env에 저장 권장
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // 이 부분이 핵심!
    ttl: 60 * 60 * 2, // 세션 수명 2시간
  }),
  cookie: {
    httpOnly: true,
    secure: false, // https 적용 시 true
    maxAge: 1000 * 60 * 60 * 2, // 2시간
  },
}));

// ✅ CORS
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// ✅ JSON 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 라우터
const authRoutes = require("./routes/auth");

const userRoutes = require("./routes/auth");
const app = express();
const port = process.env.PORT || 4000;

const session = require('express-session');

// ✅ 미들웨어 (라우터보다 먼저 선언해야 함!)
app.use(cors({
  origin: 'http://localhost:3000', // React 개발 서버의 주소
  credentials: true, // 쿠키와 같은 인증 정보 포함
}));
app.use("/api/ranking", rankingRoutes);  // 정확히 이걸로
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
const rankingRoutes = require("./routes/ranking");

app.use("/api/auth", authRoutes);
app.use("/survey", surveyRoutes);
app.use("/api/ranking", rankingRoutes);

// ✅ MongoDB 연결
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB 연결 성공");

    app.listen(port, () => {
      console.log(`🚀 서버 실행 중: http://localhost:${port}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB 연결 실패", err));

// ✅ 테스트 라우터
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
