const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRouter = require("./routes/auth.route");
const interviewRouter = require("./routes/interview.route");
require("dotenv").config();


const app = express();

app.use(cors({
  origin: "http://localhost:5173/",
  credentials: true
}));

app.use(express.json());

connectDB();


app.use("/api/auth", authRouter);
app.use("/api/interview",interviewRouter);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});