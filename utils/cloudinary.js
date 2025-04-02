// /utils/cloudinary.js
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dw35se4ky",
  api_key: "842435677666832",
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = { cloudinary };
