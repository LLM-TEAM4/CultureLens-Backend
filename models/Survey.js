//설문조사 객체 스키마
const mongoose = require("mongoose");

const SurveySchema = new mongoose.Schema({
  admin: String,
  country: String,
  category: String,
  entityName: String,
  imageUrl: String,
  captions: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Survey", SurveySchema);
