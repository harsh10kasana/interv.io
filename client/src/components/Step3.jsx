import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BsCameraVideo,
  BsMic,
  BsCheckCircle,
  BsExclamationTriangle,
} from "react-icons/bs";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";


const Step3 = ({ interviewData, prevStep }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const { currentUser } = useContext(AuthContext);


  const [stream, setStream] = useState(null);
  const [hardwareStatus, setHardwareStatus] = useState("checking");

  useEffect(() => {
    let activeStream = null;

    const startHardwareCheck = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setHardwareStatus("success");
      } catch (error) {
        console.error("Hardware access denied or unavailable:", error);
        setHardwareStatus("error");
      }
    };

    startHardwareCheck();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);


    const handleStartInterview = async () => {
    try {

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }


      const token = await currentUser.getIdToken();


      const response = await axios.post(
        "http://localhost:5001/api/interview/create", 
        interviewData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const interviewId = response.data.interviewId;

      if (!interviewId) {
        return;
      }

      navigate(`/interview/${interviewId}`);

    } catch (error) {

      console.error(error.response?.data || error.message);
    }
  };


  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full"
      >
        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-semibold mb-2">System Check</h2>
          <p className="text-gray-500 mb-8">
            Let's make sure your camera and microphone are working perfectly
            before you meet the AI.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8">
          <div className="w-full aspect-video bg-gray-900 rounded-3xl overflow-hidden relative flex items-center justify-center border-4 border-gray-100 shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                hardwareStatus === "success" ? "opacity-100" : "opacity-0"
              }`}
            />

            {hardwareStatus === "checking" && (
              <div className="absolute text-white flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-gray-600 border-t-green-500 rounded-full animate-spin" />
                <p className="text-sm font-medium">
                  Requesting camera access...
                </p>
              </div>
            )}

            {hardwareStatus === "error" && (
              <div className="absolute text-white flex flex-col items-center gap-3 text-center px-6">
                <BsExclamationTriangle size={40} className="text-red-500" />
                <p className="font-semibold">Hardware Access Denied</p>
                <p className="text-sm text-gray-400">
                  Please allow camera and microphone permissions in your browser
                  settings to continue.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex gap-4 mb-10">
          <div
            className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border ${
              hardwareStatus === "success"
                ? "border-green-200 bg-green-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <BsCameraVideo
              className={
                hardwareStatus === "success"
                  ? "text-green-600"
                  : "text-gray-400"
              }
              size={20}
            />
            <span
              className={`font-semibold text-sm ${hardwareStatus === "success" ? "text-green-700" : "text-gray-500"}`}
            >
              Camera {hardwareStatus === "success" ? "Ready" : "Not Found"}
            </span>
          </div>

          <div
            className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border ${
              hardwareStatus === "success"
                ? "border-green-200 bg-green-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <BsMic
              className={
                hardwareStatus === "success"
                  ? "text-green-600"
                  : "text-gray-400"
              }
              size={20}
            />
            <span
              className={`font-semibold text-sm ${hardwareStatus === "success" ? "text-green-700" : "text-gray-500"}`}
            >
              Microphone {hardwareStatus === "success" ? "Ready" : "Not Found"}
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex justify-between items-center pt-4 border-t border-gray-100"
        >
          <motion.button
            onClick={prevStep}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3 rounded-full font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
          >
            Back
          </motion.button>

          <motion.button
            onClick={handleStartInterview}
            disabled={hardwareStatus !== "success"}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-10 py-3 rounded-full font-semibold transition-all shadow-md flex items-center gap-2 ${
              hardwareStatus === "success"
                ? "bg-black text-white hover:opacity-90"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Start Interview
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Step3;
