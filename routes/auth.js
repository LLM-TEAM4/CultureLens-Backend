

const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const router = express.Router();


// ✅ 회원가입 API
router.post("/signup", async (req, res) => {
  const { id, password } = req.body;

  try {
    console.log("📩 회원가입 요청 도착:", req.body);

    const idRegex = /^[a-zA-Z0-9]{1,8}$/;
    if (!idRegex.test(id)) {
      return res.status(400).json({ message: "아이디는 영어와 숫자만 가능하며 8자 이하로 입력해주세요." });
    }

    // 1. 아이디 중복 확인
    const existingUser = await User.findOne({ id });
    if (existingUser) {
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }

    // 2. 비밀번호 암호화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. 유저 저장
    const newUser = new User({ id, password: hashedPassword });
    await newUser.save();
    // 회원가입 성공 후 로그인 세션 설정
    req.session.user = {
      id: newUser.id,
    };

    console.log("✅ 회원가입 성공:", newUser);
    res.status(201).json({ message: "회원가입 성공" });

  } catch (error) {
    console.error("❌ 회원가입 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

// ✅ 로그인 API
router.post("/login", async (req, res) => {
  const { id, password } = req.body;

  try {
    console.log("🔑 로그인 요청:", req.body);

    // 1. 사용자 존재 확인
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(400).json({ message: "아이디가 존재하지 않습니다." });
    }

    // 2. 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "비밀번호가 틀립니다." });
    }

    //사용자 정보 반환ㅡ, 로그인 성공 한다면
    req.session.user = {
      id: user.id, // 또는 user._id
    };
    

    console.log("✅ 로그인 성공:", user.id);
    res.status(200).json({ message: "로그인 성공", user: { id: user.id } });

    console.log("✅ 세션 상태:", req.session);
  } catch (error) {
    console.error("❌ 로그인 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  res.status(200).json({ user: req.session.user });
});

module.exports = router;
