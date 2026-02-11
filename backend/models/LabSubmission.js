const mongoose = require('mongoose');

const LabSubmissionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  labId: { type: String, required: true },
  score: { type: Number, required: true }, // 0-100
  feedback: {
    strengths: [{ type: String }],
    improvements: [{ type: String }]
  },
  youtubeResults: [{
    videoId: String,
    title: String,
    thumbnail: String,
    channelTitle: String,
    url: String
  }],
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LabSubmission', LabSubmissionSchema);
