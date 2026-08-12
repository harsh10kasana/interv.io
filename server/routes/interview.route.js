const express=require('express');
const  requireAuth  = require('../middlewares/authMiddleware');
const { createInterview,startInterview,submitAnswer,getInterview } = require('../controllers/interview.controller');

const interviewRouter = express.Router();

interviewRouter.post("/create",requireAuth,createInterview);
interviewRouter.get("/:id",requireAuth, getInterview);
interviewRouter.post("/:id/start", requireAuth, startInterview);
interviewRouter.post("/:id/answer", requireAuth, submitAnswer);


module.exports=interviewRouter;