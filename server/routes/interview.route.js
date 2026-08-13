const express=require('express');
const  requireAuth  = require('../middlewares/authMiddleware');
const { createInterview,startInterview,submitAnswer,getInterview,getAllInterviews } = require('../controllers/interview.controller');

const interviewRouter = express.Router();
interviewRouter.get("/",requireAuth, getAllInterviews); 
interviewRouter.post("/create",requireAuth,createInterview);
interviewRouter.get("/:id",requireAuth, getInterview);
interviewRouter.get("/details/:id",requireAuth, getInterview);
interviewRouter.post("/:id/start", requireAuth, startInterview);
interviewRouter.post("/:id/answer", requireAuth, submitAnswer);


module.exports=interviewRouter;