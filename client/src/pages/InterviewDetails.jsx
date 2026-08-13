import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import axios from "axios";
import { BsArrowLeft, BsPlayFill, BsCheckCircle, BsLightningCharge, BsRobot, BsPerson, BsGraphUp } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const InterviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const [interview, setInterview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = await currentUser.getIdToken();
        const { data } = await axios.get(`http://localhost:5001/api/interview/details/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInterview(data.interview);
      } catch (error) {
        console.error("Failed to load details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser) fetchDetails();
  }, [id, currentUser]);

  if (isLoading || !interview) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Analyzing Performance Data...</p>
      </div>
    );
  }

  // --- DATA PROCESSING ---
  const aiQuestionsCount = interview.conversation.filter(m => m.speaker === "ai").length;
  const isCompleted = aiQuestionsCount >= 5; // Assuming 5 is MAX_QUESTIONS
  
  // Extract only the user answers that have metrics attached
  const userAnswers = interview.conversation.filter(m => m.speaker === "user" && m.metrics);

  // Calculate Overall Averages
  let avgCorrectness = 0, avgCommunication = 0, avgConfidence = 0;
  if (userAnswers.length > 0) {
    avgCorrectness = Math.round(userAnswers.reduce((acc, curr) => acc + curr.metrics.correctness, 0) / userAnswers.length);
    avgCommunication = Math.round(userAnswers.reduce((acc, curr) => acc + curr.metrics.communication, 0) / userAnswers.length);
    avgConfidence = Math.round(userAnswers.reduce((acc, curr) => acc + curr.metrics.confidence, 0) / userAnswers.length);
  }

  // Format Data for the Graph (Average score per question)
  const chartData = userAnswers.map((ans, idx) => ({
    name: `Q${idx + 1}`,
    score: Math.round((ans.metrics.correctness + ans.metrics.communication + ans.metrics.confidence) / 3)
  }));

  return (
    <div className="min-h-screen bg-[#f3f3f3] py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Top Navigation & Header */}
        <button 
          onClick={() => navigate("/interview-history")}
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-medium mb-8"
        >
          <BsArrowLeft /> Back to History
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <HiSparkles className="text-green-500" size={24} />
              <h1 className="text-3xl font-bold text-gray-900">{interview.role}</h1>
            </div>
            <p className="text-gray-500 font-medium">{interview.experience} • {new Date(interview.createdAt).toLocaleDateString()}</p>
          </div>

          {/* Conditional Resume Button */}
          {!isCompleted ? (
            <button 
              onClick={() => navigate(`/interview/${interview._id}`)}
              className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <BsPlayFill size={20} /> Resume Interview
            </button>
          ) : (
            <div className="px-6 py-2 bg-green-100 text-green-700 rounded-full font-bold flex items-center gap-2">
              <BsCheckCircle size={18} /> Interview Completed
            </div>
          )}
        </div>

        {userAnswers.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500 text-lg">No performance data available yet. Start the interview to generate analytics.</p>
          </div>
        ) : (
          <>
            {/* OVERALL METRICS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { label: "Correctness", value: avgCorrectness, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Communication", value: avgCommunication, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Confidence", value: avgConfidence, color: "text-orange-600", bg: "bg-orange-50" },
              ].map((metric, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} 
                  className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between"
                >
                  <span className="text-gray-500 font-semibold">{metric.label}</span>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${metric.bg} ${metric.color}`}>
                    {metric.value}/10
                  </div>
                </motion.div>
              ))}
            </div>

            {/* PERFORMANCE GRAPH */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} 
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-10"
            >
              <div className="flex items-center gap-2 mb-6">
                <BsGraphUp className="text-green-500" size={20} />
                <h2 className="text-xl font-bold text-gray-800">Performance Trend</h2>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`${value}/10`, 'Avg Score']}
                    />
                    <Line type="monotone" dataKey="score" stroke="#22C55E" strokeWidth={4} dot={{ r: 6, fill: '#22C55E', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* DETAILED Q&A BREAKDOWN */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Detailed Feedback</h2>
            <div className="space-y-6">
              {interview.conversation.map((msg, index) => {
                // Only render when we hit a User message (so we can grab the AI's preceding question)
                if (msg.speaker !== "user" || !msg.metrics) return null;
                const question = interview.conversation[index - 1]?.content;

                return (
                  <motion.div key={index} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100"
                  >
                    {/* Question Header */}
                    <div className="bg-gray-50 p-6 border-b border-gray-100 flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><BsRobot size={20} /></div>
                      <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Question {index / 2 + 0.5}</p>
                        <p className="text-lg font-medium text-gray-800">{question}</p>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* User Answer */}
                      <div className="flex gap-4 mb-6">
                        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shrink-0"><BsPerson size={20} /></div>
                        <div>
                          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Your Answer</p>
                          <p className="text-gray-700 leading-relaxed">{msg.content}</p>
                        </div>
                      </div>

                      {/* AI Feedback & Scores */}
                      <div className="ml-14 bg-blue-50 border border-blue-100 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <BsLightningCharge className="text-blue-500" size={18} />
                          <h4 className="font-bold text-blue-700">AI Feedback</h4>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">{msg.feedback}</p>
                        
                        {/* Mini Score Pills */}
                        <div className="flex flex-wrap gap-3">
                          <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold border border-blue-100 text-gray-600">
                            Correctness: <span className="text-blue-600">{msg.metrics.correctness}/10</span>
                          </span>
                          <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold border border-blue-100 text-gray-600">
                            Communication: <span className="text-purple-600">{msg.metrics.communication}/10</span>
                          </span>
                          <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold border border-blue-100 text-gray-600">
                            Confidence: <span className="text-orange-600">{msg.metrics.confidence}/10</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InterviewDetails;