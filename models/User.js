const mongoose = require("mongoose");



const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: {
    type: String,
    default: "", // 프로필 이미지(base64) 저장용
  },
  nickname: { type: String, default: "" },   
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user"
  },
  credit : {type:Number, default:0}
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
