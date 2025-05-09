// scripts/createAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function createAdmin() {
    require("dotenv").config();
    await mongoose.connect(process.env.MONGO_URI);
  
  const existing = await User.findOne({ id: "admin@admin.com" });
  if (existing) {
    console.log("⚠️ 이미 관리자 계정이 존재합니다.");
    return mongoose.disconnect();
  }

  const hashed = await bcrypt.hash("1234", 10);

  await User.create({
    id: "admin@admin.com",
    password: hashed,
    nickname: "관리자",
    profileImage: "",
    role: "admin",
    responses: [],
  });

  console.log("✅ 관리자 계정 생성 완료!");
  mongoose.disconnect();
}

createAdmin().catch(err => {
  console.error("❌ 관리자 계정 생성 실패:", err);
  mongoose.disconnect();
});
