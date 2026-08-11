const express = require("express");
const { googleAuth } = require("../controllers/auth.controller");

const authRouter = express.Router();

authRouter.post("/google", googleAuth);

module.exports = authRouter;