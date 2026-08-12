const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      default: "",
    },
    techStack: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true },
);

const Interview = mongoose.model("Interview", interviewSchema);

module.exports = Interview;