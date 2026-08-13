const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: { type: String, required: true },
    experience: { type: String, required: true },
    techStack: { type: [String], required: true },
    jobDescription: { type: String, default: "" },

    status: {
      type: String,
      enum: [ "in-progress", "completed"],
      default: "in-progress",
    },

    conversation: [
      {
        speaker: { type: String, enum: ["ai", "user"], required: true },
        content: { type: String, required: true },

        metrics: {
          correctness: { type: Number, min: 1, max: 10 },
          communication: { type: Number, min: 1, max: 10 },
          confidence: { type: Number, min: 1, max: 10 },
        },
        instantFeedback: { type: String },
        feedback: { type: String },
        timeTakenSeconds: { type: Number },

        timestamp: { type: Date, default: Date.now },
      },
    ],

    finalSummary: {
      overallScore: { type: Number, min: 1, max: 100 },
      strengths: { type: [String] },
      areasOfImprovement: { type: [String] },
      recommendation: { type: String },
      feedbackSummary: { type: String },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Interview", interviewSchema);
