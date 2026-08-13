const Interview = require("../models/interview.model");
const askAI = require("../services/openRouter.services");

const getAllInterviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const interviews = await Interview.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, interviews });
  } catch (error) {
    console.error("Error fetching interviews:", error);
    res.status(500).json({ success: false, error: "Server error fetching interviews" });
  }
};

const createInterview = async (req, res) => {
  try {
    const { role, experience, techStack, jobDescription } = req.body;
    const userId = req.user.id;

    const newInterview = new Interview({
      userId,
      role,
      experience,
      techStack,
      jobDescription,
      status: "in-progress",
      conversation: [],
    });

    await newInterview.save();

    res.status(201).json({
      success: true,
      interviewId: newInterview._id,
      message: "Arena created successfully!",
    });

  } catch (error) {
    console.error("Error creating interview:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error creating interview" });
  }
};

const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ success: false, error: "Interview not found" });
    }

    if (interview.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: "Unauthorized access to this interview" });
    }

    res.status(200).json({ success: true, interview });
  } catch (error) {
    console.error("Error fetching interview:", error);
    res.status(500).json({ success: false, error: "Failed to load arena data" });
  }
};

const startInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ error: "Interview not found" });

    if (interview.conversation.length > 0) {
      return res.status(400).json({ error: "Interview has already started" });
    }

    const prompt = `
    The candidate is applying for a ${interview.role} role with ${interview.experience} of experience. 
    Their tech stack is: ${interview.techStack.join(", ")}. 
    Generate the FIRST interview question to assess their foundational knowledge.
    Respond ONLY with a valid JSON object in this exact format: { "question": "your question here" }`;


    const messages = [
      { role: "system", content: "You are an expert technical interviewer. You must respond ONLY with a valid JSON object." },
      { role: "user", content: prompt }
    ];

    const rawResponse = await askAI({ messages });


    const cleanText = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const aiResponse = JSON.parse(cleanText);

    interview.conversation.push({
      speaker: "ai",
      content: aiResponse.question,
    });
    
    await interview.save();

    res.status(200).json({ success: true, question: aiResponse.question });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to start interview" });
  }
};

const submitAnswer = async (req, res) => {
  try {
    const { userAnswer, timeTakenSeconds } = req.body; 
    const interview = await Interview.findById(req.params.id);

    if (!interview) return res.status(404).json({ error: "Interview not found" });

    const lastMessage = interview.conversation[interview.conversation.length - 1];
    if (!lastMessage || lastMessage.speaker !== "ai") {
       return res.status(400).json({ error: "Waiting for AI to ask a question." });
    }

    const lastQuestion = lastMessage.content;

    const prompt = `
    You asked them: "${lastQuestion}"
    Their answer was: "${userAnswer}"

    Evaluate their answer strictly. Then, generate the NEXT technical question to ask them.
    If they answered well, make the next question harder. If they struggled, ask a fundamental concept.
    
    Respond ONLY with a valid JSON object matching this exact structure:
    {
      "metrics": {
        "correctness": <number 1-10>,
        "communication": <number 1-10>,
        "confidence": <number 1-10>
      },
      "instantFeedback": "<brief instant feedback on their answer>",
      "feedback": "<brief private feedback on what they did well/poorly>",
      "nextQuestion": "<the next technical question to ask>"
    }`;


    const messages = [
      { role: "system", content: `You are a strict technical recruiter interviewing a ${interview.role} (${interview.experience}). You must respond ONLY with a valid JSON object.` },
      { role: "user", content: prompt }
    ];

    const rawResponse = await askAI({ messages });


    const cleanText = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const aiResponse = JSON.parse(cleanText);

    interview.conversation.push({
      speaker: "user",
      content: userAnswer,
      metrics: aiResponse.metrics,
      instantFeedback: aiResponse.instantFeedback,
      feedback: aiResponse.feedback,
      timeTakenSeconds: timeTakenSeconds || 0
    });

    interview.conversation.push({
      speaker: "ai",
      content: aiResponse.nextQuestion
    });

    await interview.save();

    res.status(200).json({ 
      success: true,
      nextQuestion: aiResponse.nextQuestion,
      instantFeedback: aiResponse.instantFeedback,
      metrics: aiResponse.metrics
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process answer" });
  }
};

module.exports={
    createInterview,
    getInterview,
    submitAnswer,
    startInterview,
    getAllInterviews
}