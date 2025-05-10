const express = require("express");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");

const router = express.Router();

// ✅ 회원가입 API
router.post("/signup", async (req, res) => {
  const { id, password } = req.body;

  try {
    console.log("📩 회원가입 요청 도착:", {
      id,
      password,
      /*
      profileImage: profileImage
        ? `base64 (${profileImage.length}자)`
        : "없음",
        */
    });

    const idRegex = /^[a-zA-Z0-9]{1,8}$/;
    if (!idRegex.test(id)) {
      return res.status(400).json({ message: "아이디는 영어와 숫자만 가능하며 8자 이하로 입력해주세요." });
    }

    const existingUser = await User.findOne({ id });
    if (existingUser) {
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const defaultProfilePath = path.join(__dirname, "../assets/profile.png");
    let profileImageBase64 = "";
    try {
      const imageBuffer = fs.readFileSync(defaultProfilePath);
      profileImageBase64 = `data:image/png;base64,${imageBuffer.toString("base64")}`;
    } catch (e) {
      console.warn("⚠️ 기본 프로필 이미지를 읽지 못했습니다.");
    }

    const newUser = new User({
      id,
      password: hashedPassword,
      profileImage: profileImageBase64,
      nickname: id,
      role: "user",
    });
    await newUser.save();

    req.session.user = {
      id: newUser.id,
      profileImage: newUser.profileImage,
      nickname: newUser.nickname,
    };

   // console.log("✅ 회원가입 성공:", newUser);
  
   console.log("✅ 회원가입 성공:", {
    id: newUser.id,
    nickname: newUser.nickname,
    profileImage: newUser.profileImage?.substring(0, 20) + "...(생략)",
  });

  res.status(200).json({ message: "회원가입 성공" });

  } catch (error) {
    console.error("❌ 회원가입 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }

});


//  로그인 API
router.post("/login", async (req, res) => {
  const { id, password } = req.body;

  try {
    console.log("🔑 로그인 요청:", id);
    console.log("🟡 로그인 요청 PW(입력값):", password);

    console.log("🔍 DB 조회 시작");
const user = await User.findOne({ id });
console.log("✅ DB 조회 완료");
    if (!user) {
      return res.status(400).json({ message: "아이디가 존재하지 않습니다." });
    }

    console.log("🔍 비밀번호 비교 시작");
const isMatch = await bcryptjs.compare(password, user.password);
console.log("✅ 비밀번호 비교 완료");
    if (!isMatch) {
      return res.status(400).json({ message: "비밀번호가 틀립니다." });
    }

    // ✅ 세션에 로그인 정보 저장 (한 번만 설정)
    req.session.user = {
      _id: user._id,
      id: user.id,
      profileImage: user.profileImage,
      nickname: user.nickname,
    };

   
    console.log("✅ 로그인 성공:", {
      id: user.id,
      nickname: user.nickname,
      profileImage: user.profileImage?.substring(0, 20) + "...(생략)",
      role: user.role,
    });

    // ✅ 응답도 한 번만
    res.status(200).json({ 
      message: "로그인 성공",
      role: user.role,
      user: req.session.user });

  } catch (error) {
    console.error("❌ 로그인 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});


// ✅ 로그인 상태 확인 API
router.get("/me", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const user = await User.findOne({ id: req.session.user.id });
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error("❌ 유저 정보 조회 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 닉네임 변경 API
router.patch("/nickname", async (req, res) => {
  const { nickname } = req.body;

  if (!req.session.user || !nickname) {
    return res.status(400).json({ message: "잘못된 요청입니다." });
  }

  const user = await User.findOne({ id: req.session.user.id });
  if (!user) {
    return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
  }

  user.nickname = nickname;
  await user.save();
  req.session.user.nickname = nickname;
  console.log("✅ 세션에 저장된 유저 정보:", {
    ...req.session.user,
    profileImage:
      req.session.user?.profileImage?.length > 20
        ? req.session.user.profileImage.substring(0, 20) + "...(생략)"
        : req.session.user?.profileImage,
  });
  
  res.status(200).json({ message: "닉네임 변경 완료", nickname });
});

// ✅ 닉네임 중복 확인 API
router.get("/check-nickname/:nickname", async (req, res) => {
  try {
    const { nickname } = req.params;

    const exists = await User.findOne({ nickname });
    res.status(200).json({ exists: !!exists });
  } catch (err) {
    console.error("❌ 닉네임 중복 확인 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});



// ✅ 프로필 이미지 업데이트 API
router.patch("/profile", async (req, res) => {
  try {
    const { profileImage } = req.body;

    if (!req.session.user || !profileImage) {
      return res.status(400).json({ message: "잘못된 요청입니다." });
    }

    const user = await User.findOne({ id: req.session.user.id });
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    user.profileImage = profileImage;
    await user.save();

    req.session.user.profileImage = profileImage;

    res.status(200).json({ message: "프로필 이미지가 업데이트되었습니다." });
  } catch (err) {
    console.error("❌ 프로필 이미지 업데이트 실패:", err);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

module.exports = router;
