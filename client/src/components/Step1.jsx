import React from "react";
import { motion } from "framer-motion";
import { HiSparkles } from "react-icons/hi2";

const Step1 = ({ interviewData, updateData, nextStep }) => {
  const experiences = ["Fresher / Intern", "1-3 Years", "3-5 Years", "Senior (5+ Years)"];

  const handleNext = () => {
    if (interviewData.role && interviewData.experience) {
      nextStep();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, 
      },
    },
  };
213
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (

    <div className="w-full max-w-2xl mx-auto bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 ">
      

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full"
      >
    
        


        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-semibold mb-2">Tell us about the role</h2>
          <p className="text-gray-500 mb-8">
            We will tailor the AI's questions based on the job you are targeting.
          </p>
        </motion.div>


        <motion.div variants={itemVariants} className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Target Job Role
          </label>
          <input
            type="text"
            placeholder="e.g., Frontend Developer"
            value={interviewData.role}
            onChange={(e) => updateData("role", e.target.value)}
            className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-lg"
          />
        </motion.div>


        <motion.div variants={itemVariants} className="mb-10">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Your Experience Level
          </label>
          <div className="grid grid-cols-2 gap-4">
            {experiences.map((exp) => (
              <div
                key={exp}
                onClick={() => updateData("experience", exp)}
                className={`cursor-pointer border-2 rounded-2xl py-4 px-5 text-center transition-all duration-300 ${
                  interviewData.experience === exp
                    ? "border-green-500 bg-green-50 text-green-700 font-semibold shadow-sm"
                    : "border-gray-200 text-gray-600 hover:border-green-600 "
                }`}
              >
                {exp}
              </div>
            ))}
          </div>
        </motion.div>


        <motion.div variants={itemVariants} className="flex justify-end pt-4 border-t border-gray-100">
          <motion.button
            onClick={handleNext}
            disabled={!interviewData.role || !interviewData.experience}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-10 py-3 rounded-full font-semibold transition-all shadow-md ${
              interviewData.role && interviewData.experience
                ? "bg-black text-white hover:opacity-90"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Next Step
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Step1;