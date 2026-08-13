import React, { useState } from 'react';
import Step1 from '../components/Step1';
import Step2 from '../components/Step2';
import Step3 from '../components/Step3';
import { BsCheck } from "react-icons/bs";
import { motion } from "framer-motion";

const InterviewPage = () => {
  const [step, setStep] = useState(1);
  const [interviewData, setInterviewData] = useState({
    role: "",
    experience: "",
    techStack: [],
    jobDescription: ""
  });

  const updateData = (field, value) => {
    setInterviewData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    setStep((prev) => prev + 1);
  };
  
  const prevStep = () => {
    setStep((prev) => prev - 1);
  };


  const stepsList = [
    { num: 1, title: "Role & Experience", desc: "Select your target job" },
    { num: 2, title: "Tech Stack", desc: "Provide technical context" },
    { num: 3, title: "System Check", desc: "Camera & Mic setup" }
  ];

  return (
    <div className="min-h-screen bg-[#f3f3f3] py-12 px-4 md:px-8 flex justify-center">
      

      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8 items-start mt-10">
        

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-3xl p-8 shadow-md border border-gray-100 "
        >
          <h3 className="text-lg font-semibold mb-8 text-gray-800">Setup Progress</h3>
          
          <div className="flex flex-col gap-6 relative">
            {stepsList.map((s, index) => {
              const isCompleted = step > s.num;
              const isActive = step === s.num;
              
              return (
                <div key={s.num} className="flex gap-4 relative z-10">
                  

                  {index !== stepsList.length - 1 && (
                    <div 
                      className={`absolute left-5 top-10 w-0.5 h-12 -z-10 transition-colors duration-300 ${
                        isCompleted ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}


                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 ${
                    isCompleted 
                      ? "bg-green-500 border-green-500 text-white" 
                      : isActive
                        ? "bg-green-50 border-green-500 text-green-600 shadow-[0_0_0_4px_rgba(34,197,94,0.1)]"
                        : "bg-white border-gray-200 text-gray-400"
                  }`}>
                    {isCompleted ? <BsCheck size={20} className="font-bold" /> : <span className="font-semibold text-sm">{s.num}</span>}
                  </div>


                  <div className="pt-2">
                    <p className={`font-semibold text-sm transition-colors duration-300 ${
                      isActive || isCompleted ? "text-gray-900" : "text-gray-400"
                    }`}>
                      {s.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                  </div>
                  
                </div>
              );
            })}
          </div>
        </motion.div>


        <div className="flex-1 w-full max-w-3xl">

          {step === 1 && <Step1 interviewData={interviewData} updateData={updateData} nextStep={nextStep} />}  
          {step === 2 && <Step2 interviewData={interviewData} updateData={updateData} prevStep={prevStep} nextStep={nextStep} />}
          {step === 3 && <Step3 interviewData={interviewData} prevStep={prevStep} />}
        </div>

      </div>
    </div>
  );
};

export default InterviewPage;