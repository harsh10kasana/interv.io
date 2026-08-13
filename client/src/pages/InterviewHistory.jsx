import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { 
  BsClockHistory, 
  BsArrowRight, 
  BsBriefcase, 
  BsCheckCircle, 
  BsPlayFill 
} from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";
import Navbar from "../components/Navbar"; 

const InterviewHistory = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [interviews, setInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser) return;
      
      try {
        const token = await currentUser.getIdToken();
        const { data } = await axios.get("http://localhost:5001/api/interview", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const sortedData = data.interviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setInterviews(sortedData);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-[#f3f3f3] flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-12 md:py-20">
        
        <div className="mb-12 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm font-semibold text-gray-600 shadow-sm mb-4 border border-gray-100">
            <BsClockHistory className="text-blue-500" />
            Your Activity
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Interview History
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl">
            Review your past performances, read AI feedback, and track your progress over time.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Loading your records...</p>
          </div>
        ) : interviews.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-3xl shadow-md border border-gray-100 text-center max-w-2xl mx-auto mt-10"
          >
            <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <BsBriefcase size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Interviews Yet</h3>
            <p className="text-gray-500 mb-8">You haven't started any mock interviews. Ready to test your skills?</p>
            <button 
              onClick={() => navigate("/interview")}
              className="px-8 py-3 bg-black text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <HiSparkles />
              Start New Interview
            </button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {interviews.map((session) => {
              const questionsAsked = session.conversation.filter(msg => msg.speaker === "ai").length;
              const isCompleted = questionsAsked >= 5; 
              const date = new Date(session.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

              return (
                <motion.div 
                  key={session._id} 
                  variants={itemVariants}
                  whileHover={{ y: -5, shadow: "0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 flex flex-col transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate(`/interview/details/${session._id}`)}
                >

                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                      isCompleted ? "bg-green-50 text-green-600" : "bg-blue-50 text-red-600"
                    }`}>
                      {isCompleted ? <BsCheckCircle /> : <BsPlayFill size={16} />}
                      {isCompleted ? "Completed" : "Not Completed"}
                    </div>
                    <span className="text-sm font-medium text-gray-400">{date}</span>
                  </div>


                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-black line-clamp-1">
                    {session.role}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6 font-medium">
                    {session.experience} Experience
                  </p>


                  <div className="mt-auto pt-6 border-t border-gray-100 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Tech Stack</p>
                      <div className="flex gap-2 flex-wrap">
                        {session.techStack.slice(0, 2).map((tech, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium">
                            {tech}
                          </span>
                        ))}
                        {session.techStack.length > 2 && (
                          <span className="text-xs bg-gray-50 text-gray-400 px-2 py-1 rounded-md font-medium">
                            +{session.techStack.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-colors duration-300">
                      <BsArrowRight size={20} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InterviewHistory;