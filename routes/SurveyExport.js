const express = require("express");
const router = express.Router();
const SurveyModel = require("../models/Survey");
const ResponseModel = require("../models/Response");

// n/m/p 판단 함수
function calculateNMP(votes) {
  const total = [1, 2, 3, 4, 5].reduce((sum, score) => sum + (votes[score] || 0), 0);
  const weightedSum = [1, 2, 3, 4, 5].reduce((sum, score) => sum + score * (votes[score] || 0), 0);
  const avg = total > 0 ? weightedSum / total : 0;

  if (avg <= 2) return "n";
  if (avg <= 3) return "m";
  return "p";
}

// ✅ 집계 함수
async function aggregateResponses(surveyId, captionsLength) {
  const responses = await ResponseModel.find({ surveyId });
  const stats = Array.from({ length: captionsLength }, () => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }));

  responses.forEach(response => {
    response.answers.forEach((score, idx) => {
      if (stats[idx] && [1, 2, 3, 4, 5].includes(score)) {
        stats[idx][score] += 1;
      }
    });
  });

  return stats;
}

// ✅ CSV Export
router.get("/:id/export/csv", async (req, res) => {
  try {
    const survey = await SurveyModel.findById(req.params.id);
    if (!survey) return res.status(404).send("Survey not found");

    const stats = await aggregateResponses(survey._id, survey.captions.length);

    let csv = "캡션,1점,2점,3점,4점,5점,총응답,n/m/p\n";
    survey.captions.forEach((caption, i) => {
      const votes = stats[i];
      const total = [1, 2, 3, 4, 5].reduce((sum, score) => sum + votes[score], 0);
      const nmp = calculateNMP(votes);
      csv += `${caption},${votes[1]},${votes[2]},${votes[3]},${votes[4]},${votes[5]},${total},${nmp}\n`;
    });



    const BOM = '\uFEFF';
    const buffer = Buffer.from(BOM + csv, 'utf8');

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="survey_${req.params.id}.csv"`);
    res.send(buffer);


  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// ✅ JSON Export
router.get("/:id/export/json", async (req, res) => {
  try {
    const survey = await SurveyModel.findById(req.params.id);
    if (!survey) return res.status(404).send("Survey not found");

    const stats = await aggregateResponses(survey._id, survey.captions.length);

    const exportData = survey.captions.map((caption, i) => {
      const votes = stats[i];
      const total = [1, 2, 3, 4, 5].reduce((sum, score) => sum + votes[score], 0);
      const nmp = calculateNMP(votes);
      return { caption, votes, total, nmp };
    });

    res.json({ surveyId: survey._id, results: exportData });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
