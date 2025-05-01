require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/auth");
const app = express();
const port = process.env.PORT || 4000;

const session = require('express-session');

app.use(
  session({
    secret: 'your-secret-key', // 🔐 세션 암호화 키 (원하는 문자열로 설정)
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,      // JavaScript에서 쿠키 접근 불가
      maxAge: 1000 * 60 * 60 * 1, // 쿠키 유효 시간 (예: 1시간)
    },
  })
);



// ✅ 미들웨어 (라우터보다 먼저 선언해야 함!)
app.use(cors({
  origin: 'http://localhost:3000', // React 개발 서버의 주소
  credentials: true, // 쿠키와 같은 인증 정보 포함
}));
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

app.get("/api/userinfo", (req, res) => {
  if (req.session && req.session.user) {
    res.json({ id: req.session.user.id }); // 또는 username 등
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// 회원가입 라우트 추가
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;

  // 비밀번호 해싱
  const hashedPassword = bcrypt.hashSync(password, 10);

  // 새로운 사용자 생성
  const newUser = new User({
    username,
    password: hashedPassword
  });

  newUser.save((err, user) => {
    if (err) {
      return res.status(500).json({ error: '회원가입 실패' });
    }

    // 회원가입 후 로그인 처리 (세션에 정보 저장)
    req.session.user = { id: user._id, username: user.username };
    res.status(201).json({ message: '회원가입 성공 및 자동 로그인 완료' });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // 여기서 실제 사용자 인증 로직을 구현
  User.findOne({ username }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (bcrypt.compareSync(password, user.password)) {
      req.session.user = { id: user._id, username: user.username };
      return res.json({ message: "Login successful" });
    } else {
      return res.status(401).json({ error: "Invalid credentials" });
    }
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("로그아웃 실패");
    res.clearCookie("connect.sid");
    res.send("로그아웃 성공");
  });
});
