const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const router = express.Router();

// 회원가입 API (암호화 제외)
router.post("/signup", async (req, res) => {

    const { id, password } = req.body;
    
    try {

        console.log("회원가입 요청 도착");

        const salt = await bcrypt.genSalt(10); // salt 생성
        const hashedPassword = await bcrypt.hash(password, salt);

        

        const newUser = new User({ id, password:hashedPassword }); // 비밀번호 암호화 없이 저장

        await newUser.save();

        
        res.status(201).json({ message: "회원가입 성공" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류 발생" });
    }
});


router.post("/login", async (req, res) => {
    const { id, password } = req.body;
  
    try {
      // 이메일로 사용자 찾기
      const user = await User.findOne({ id });
  
      if (!user) {
        return res.status(400).json({ message: "아이디가 존재하지 않습니다." });
      }
  
      // 비밀번호 비교 (암호화된 비밀번호와 비교)
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "비밀번호가 틀립니다." });
      }
  
      // 로그인 성공
      res.status(200).json({ message: "로그인 성공", user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "서버 오류" });
    }
  });

module.exports = router;
