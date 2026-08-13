import React from "react";
import Navbar from "../components/Navbar";
import { HiSparkles } from "react-icons/hi2";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { BsClock } from "react-icons/bs";
import { BsRobot } from "react-icons/bs";
import { BsMic } from "react-icons/bs";
import Footer from "../components/Footer";

const Home = () => {

  const navigate = useNavigate();

  const { currentUser } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-[#f3f3f3] flex flex-col">
      <Navbar />
      <div className="flex-1 px-6 py-20 ">
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full flex items-center gap-2">
            <HiSparkles size={16} className="bg-green-50 text-green-600" />
            AI Powered Interview Platform
          </div>
        </div>
        <div className="text-center mb-28">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-semibold leading-tight max-w-4xl mx-auto"
          >
            Practice Interviews with
            <span className="relative inline-block">
              <span className="bg-green-100 text-green-600 px-5 py-1 rounded-full">
                AI Intelligence
              </span>
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-gray-500 mt-6 max-w-2xl mx-auto text-lg"
          >
            Role-based mock interviews with smart follow-ups, adaptive
            difficulty and real-time performance evaluation.
          </motion.p>

          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <motion.button
              onClick={() => {
                if (currentUser) {
                  navigate("/interview");
                } else {
                  navigate("/auth");
                }
              }}
              whileHover={{ opacity: 0.9, scale: 1.03 }}
              whileTap={{ opacity: 1, scale: 0.98 }}
              className="bg-black text-white px-10 py-3 rounded-full hover:opacity-90 transition shadow-md"
            >
              Start Interview
            </motion.button>
            <motion.button
              onClick={() => {
                if (currentUser) {
                  navigate("/interview-history");
                } else {
                  navigate("/auth");
                }
              }}
              whileHover={{ opacity: 0.9, scale: 1.03 }}
              whileTap={{ opacity: 1, scale: 0.98 }}
              className="border border-gray-300 px-10 py-3 rounded-full hover:bg-gray-100 transition"
            >
              View History
            </motion.button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center gap-10 mb-28">
          {[
            {
              icon: <BsRobot size={24} />,
              step: "STEP 1",
              title: "Role & Experience Selection",
              desc: "AI adjusts difficulty based on selected job role.",
            },
            {
              icon: <BsMic size={24} />,
              step: "STEP 2",
              title: "Smart Voice Interview",
              desc: "Dynamic follow-up questions based on your answers.",
            },
            {
              icon: <BsClock size={24} />,
              step: "STEP 3",
              title: "Timer Based Simulation",
              desc: "Real interview pressure with time tracking.",
            },
          ].map((item, index) => {
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 + index * 0.2 }}
                className={`
        relative bg-white rounded-3xl border-2 border-green-100
        hover:border-green-500 p-10 w-80 max-w-[90%] shadow-md
        hover:shadow-2xl transition-all duration-300
        ${index === 0 ? "rotate-[-4deg]" : ""}
        ${index === 1 ? "rotate-[3deg] md:-mt-6 shadow-xl" : ""}
        ${index === 2 ? "rotate-[-3deg]" : ""}
    `} >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white border-2 border-green-500 text-green-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg">
                  {item.icon}
                </div>

                <div className="pt-10 text-center">
                  <div className="text-xs text-green-600 font-semibold mb-2 tracking-wider">
                    {item.step}
                  </div>

                  <h3 className="font-semibold mb-3 text-lg">{item.title}</h3>

                  <p className="text-sm text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
