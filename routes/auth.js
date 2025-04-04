const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const router = express.Router();

// ✅ 회원가입 API
router.post("/signup", async (req, res) => {
  const { id, password } = req.body;

  try {
    console.log("📩 회원가입 요청 도착:", req.body);

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

    console.log("✅ 회원가입 성공:", newUser);
    res.status(201).json({ message: "회원가입 성공" });

  } catch (error) {
    console.error("❌ 회원가입 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});


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

    console.log("✅ 로그인 성공:", user.id);
    res.status(200).json({ message: "로그인 성공", user: { id: user.id } });

  } catch (error) {
    console.error("❌ 로그인 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
