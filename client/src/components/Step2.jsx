import React from "react";
import { motion } from "framer-motion";

const Step2 = ({ interviewData, updateData, prevStep, nextStep }) => {
  const handleNext = () => {
    if (interviewData.techStack.length > 0) {
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
          <h2 className="text-3xl font-semibold mb-2">Technical Context</h2>
          <p className="text-gray-500 mb-8">
            Give the AI the specific technologies and job description to hyper-personalize the interview.
          </p>
        </motion.div>


        <motion.div variants={itemVariants} className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Core Tech Stack & Skills
          </label>
          <input
            type="text"
            placeholder="React, Tailwind, Node.js, System Design..."
            value={interviewData.techStack}
            onChange={(e) => updateData("techStack", e.target.value)}
            className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-base"
          />
          <p className="text-xs text-gray-400 mt-2 ml-1">Separate skills with commas.</p>
        </motion.div>


        <motion.div variants={itemVariants} className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Job Description (Optional)
          </label>
          <textarea
            rows={5}
            placeholder="Paste the job description here so the AI can simulate the exact company requirements..."
            value={interviewData.jobDescription}
            onChange={(e) => updateData("jobDescription", e.target.value)}
            className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-base resize-none"
          />
        </motion.div>

        
      <motion.div variants={itemVariants} className="flex justify-between items-center pt-4 border-t border-gray-100">
        <motion.button
          onClick={prevStep}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-8 py-3 rounded-full font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
        >
          Back
        </motion.button>

        <motion.button
          onClick={handleNext}

          disabled={interviewData.techStack.length === 0} 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-10 py-3 rounded-full font-semibold transition-all shadow-md ${

            interviewData.techStack.length > 0 
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

export default Step2;