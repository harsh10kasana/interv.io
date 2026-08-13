import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { BsMic, BsRobot, BsPlayFill, BsInfoCircle, BsCheckCircle, BsLightningCharge } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";
import axios from "axios";

const MAX_QUESTIONS = 5; 

const PREFERRED_VOICE_NAMES = [
  "Google US English",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Microsoft Guy Online (Natural) - English (United States)",
  "Samantha",
  "Alex",
];

const pickNaturalVoice = (voices) => {
  if (!voices || voices.length === 0) return null;

  for (const name of PREFERRED_VOICE_NAMES) {
    const match = voices.find((v) => v.name === name);
    if (match) return match;
  }

  const usVoice = voices.find((v) => v.lang === "en-US" && !/uk|british/i.test(v.name));
  if (usVoice) return usVoice;

  const enVoice = voices.find((v) => v.lang && v.lang.startsWith("en"));
  return enVoice || voices[0];
};

const InterviewArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const [interview, setInterview] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  
  // Autonomous Voice State
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  // Refs
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef(""); 
  const startTimeRef = useRef(null); 
  const preferredVoiceRef = useRef(null);
  
  // 🚨 FIX: This ref prevents the stale closure bug so the app knows EXACTLY how many questions have passed
  const conversationRef = useRef([]);
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // =======================================================================
  // 0. LOAD A MORE NATURAL-SOUNDING VOICE
  // =======================================================================
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        preferredVoiceRef.current = pickNaturalVoice(voices);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // =======================================================================
  // 1. BOOT UP WEBCAM 
  // =======================================================================
  useEffect(() => {
    if (!interview || !hasStarted || interviewComplete) return; 

    let activeStream;
    const startCamera = async () => {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    };
    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [interview, hasStarted, interviewComplete]);

  // =======================================================================
  // 2. FETCH INITIAL INTERVIEW DATA 
  // =======================================================================
  useEffect(() => {
    const fetchArenaData = async () => {
      if (!currentUser) return;
      try {
        const token = await currentUser.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        const { data } = await axios.get(`http://localhost:5001/api/interview/${id}`, { headers });
        setInterview(data.interview);
        setConversation(data.interview.conversation);
      } catch (error) {
        console.error("Error loading arena:", error);
        navigate("/interview");
      }
    };

    fetchArenaData();
  }, [id, currentUser, navigate]);

  // =======================================================================
  // 3. TEXT TO SPEECH (AI VOICE) & AUTO-MIC TRIGGER
  // =======================================================================
  const speakText = (text) => {
    setIsAiSpeaking(true);
    window.speechSynthesis.cancel(); 
    
    const utterance = new SpeechSynthesisUtterance(text);

    if (preferredVoiceRef.current) {
      utterance.voice = preferredVoiceRef.current;
    }
    utterance.lang = "en-US";
    utterance.rate = 1.02;
    utterance.pitch = 1;
    
    utterance.onend = () => {
      setIsAiSpeaking(false);
      startListening(); 
    };

    window.speechSynthesis.speak(utterance);
  };

  // =======================================================================
  // 4. AUTONOMOUS MICROPHONE LOGIC
  // =======================================================================
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    setTranscript("");
    transcriptRef.current = "";
    setIsListening(true);

    recognition.onresult = (event) => {
      let currentText = "";
      for (let i = 0; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }
      
      setTranscript(currentText);
      transcriptRef.current = currentText;

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop();
        setIsListening(false);
        submitAnswer(transcriptRef.current);
      }, 5000); 
    };

    recognition.start();

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      recognition.stop();
      setIsListening(false);
      submitAnswer(transcriptRef.current);
    }, 7000);
  };

  // =======================================================================
  // 5. START / RESUME INTERVIEW ACTION
  // =======================================================================
  const handleBeginInterview = async () => {
    setHasStarted(true);
    if (!startTimeRef.current) startTimeRef.current = Date.now();

    if (conversation.length === 0) {
      setIsProcessing(true);
      try {
        const token = await currentUser.getIdToken();
        const startRes = await axios.post(`http://localhost:5001/api/interview/${id}/start`, {}, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        const firstQuestion = startRes.data.question;
        setConversation([{ speaker: "ai", content: firstQuestion, instantFeedback: null }]);
        
        speakText(firstQuestion);

      } catch (error) {
        console.error("Failed to start interview:", error);
      } finally {
        setIsProcessing(false);
      }
    } else {
      const lastAiMsg = conversation.slice().reverse().find(msg => msg.speaker === "ai");
      if (lastAiMsg) {
        speakText(lastAiMsg.content);
      } else {
        startListening();
      }
    }
  };

  // =======================================================================
  // 6. SUBMIT ANSWER LOGIC
  // =======================================================================
  const submitAnswer = async (finalTranscript) => {
    const isSilent = !finalTranscript.trim();
    const answerToSend = isSilent ? "[No answer provided by the candidate]" : finalTranscript;
    const displayAnswer = isSilent ? "*No response detected*" : finalTranscript;

    setIsProcessing(true);
    setTranscript("");
    transcriptRef.current = "";
    
    setConversation(prev => [...prev, { speaker: "user", content: displayAnswer, instantFeedback: null }]);

    try {
      const token = await currentUser.getIdToken();
      
      // 🚨 FIX: We now use the ref to count AI questions accurately, bypassing the stale closure bug
      const aiQuestionCount = conversationRef.current.filter(msg => msg.speaker === "ai").length;

      const { data } = await axios.post(`http://localhost:5001/api/interview/${id}/answer`, 
        { userAnswer: answerToSend, timeTakenSeconds: 0 },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      const instantFeedback = data.feedback; // Updated to match your backend property name

      if (aiQuestionCount >= MAX_QUESTIONS) {
        setConversation(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], instantFeedback };
          return updated;
        });
        setTotalTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        setInterviewComplete(true);
        window.speechSynthesis.cancel();
      } else {
        const nextAiQuestion = data.nextQuestion;
        setConversation(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], instantFeedback };
          updated.push({ speaker: "ai", content: nextAiQuestion, instantFeedback: null });
          return updated;
        });

        const scriptToSpeak = `${instantFeedback} Next question. ${nextAiQuestion}`;
        speakText(scriptToSpeak);
      }

    } catch (error) {
      console.error("Failed to submit answer:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // =======================================================================
  // RENDER: LOADING STATE
  // =======================================================================
  if (!interview) return <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center font-semibold text-lg text-gray-500">Loading Arena...</div>;

  const latestAiMessage = conversation.slice().reverse().find(msg => msg.speaker === "ai");
  const lastEntry = conversation[conversation.length - 1];
  const showAnswerArea = isListening || isProcessing || !!transcript || lastEntry?.speaker === "user";

  // =======================================================================
  // RENDER: INSTRUCTIONS SCREEN
  // =======================================================================
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] p-4 md:p-8 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-white p-10 rounded-3xl shadow-xl text-center border border-gray-100"
        >
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <BsRobot size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to your Arena</h1>
          <p className="text-gray-500 text-lg mb-8">Target Role: <span className="font-semibold text-black">{interview.role}</span> ({interview.experience})</p>
          
          <div className="bg-gray-50 p-6 rounded-2xl text-left space-y-4 mb-10 border border-gray-100">
            <h3 className="font-semibold flex items-center gap-2 text-gray-700">
              <BsInfoCircle className="text-blue-500"/> Hands-Free Mode Active
            </h3>
            <ul className="text-gray-600 space-y-2 text-sm md:text-base list-disc list-inside">
              <li>Ensure your volume is up. The AI will speak the questions out loud.</li>
              <li>Your microphone will <b>open automatically</b> after the AI finishes speaking.</li>
              <li>You have 7 seconds to start answering, or the AI will move on.</li>
              <li>The interview will conclude after {MAX_QUESTIONS} questions.</li>
            </ul>
          </div>

          <motion.button
            onClick={handleBeginInterview}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto px-12 py-4 bg-black text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <BsPlayFill size={24} />
            {conversation.length > 0 ? "Resume Interview" : "Begin Interview"}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // =======================================================================
  // RENDER: INTERVIEW COMPLETE SCREEN
  // =======================================================================
  if (interviewComplete) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] p-4 md:p-8 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-white p-12 rounded-3xl shadow-xl text-center border border-gray-100"
        >
          <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <BsCheckCircle size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Interview Complete!</h1>
          <p className="text-gray-500 text-lg mb-8">
            You successfully answered {MAX_QUESTIONS} questions.<br/>
            Total duration: <span className="font-semibold text-black">{Math.floor(totalTime / 60)}m {totalTime % 60}s</span>
          </p>
          
          {/* 🚨 FIX: Redirects straight to the Details Analytics Dashboard! */}
          <button
            onClick={() => navigate(`/interview/details/${id}`)}
            className="px-10 py-3 bg-black text-white rounded-full font-bold shadow-md hover:bg-gray-800 transition-all"
          >
            View Performance Analytics
          </button>
        </motion.div>
      </div>
    );
  }

  // =======================================================================
  // RENDER: ACTIVE INTERVIEW ARENA
  // =======================================================================
  return (
    <div className="min-h-screen bg-[#f3f3f3] p-4 md:p-8 flex justify-center">
      <style>{`
        @keyframes waveRing {
          0% { transform: scale(1); opacity: 0.55; }
          100% { transform: scale(2); opacity: 0; }
        }
        .wave-ring {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border: 2px solid currentColor;
          animation: waveRing 1.8s ease-out infinite;
          pointer-events: none;
        }
      `}</style>

      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN: Camera & Auto-Status */}
        <div className="w-full lg:w-5/12 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <HiSparkles className="text-green-500" size={24} />
              <h2 className="text-2xl font-semibold text-gray-800">{interview.role}</h2>
            </div>
            
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-inner mb-8">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform scale-x-[-1]" 
              />
              {isListening && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-pulse flex items-center gap-2 font-medium">
                  <div className="w-2 h-2 bg-white rounded-full"></div> REC
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-24 h-24 flex items-center justify-center">
                {(isAiSpeaking || isListening) && (
                  <>
                    <span className="wave-ring" style={{ animationDelay: "0s", color: isAiSpeaking ? "#3B82F6" : "#EF4444" }} />
                    <span className="wave-ring" style={{ animationDelay: "0.5s", color: isAiSpeaking ? "#3B82F6" : "#EF4444" }} />
                    <span className="wave-ring" style={{ animationDelay: "1s", color: isAiSpeaking ? "#3B82F6" : "#EF4444" }} />
                  </>
                )}
                <div
                  className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
                    isProcessing 
                      ? "bg-gray-100 text-gray-400" 
                      : isAiSpeaking 
                        ? "bg-blue-50 text-blue-500 border-4 border-blue-200" 
                        : isListening
                          ? "bg-red-50 text-red-500 border-4 border-red-200"
                          : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isAiSpeaking ? <BsRobot size={40} /> : <BsMic size={40} />}
                </div>
              </div>
              
              <p className="mt-6 text-sm font-bold tracking-widest uppercase"
                 style={{ color: isProcessing ? "#9CA3AF" : isAiSpeaking ? "#3B82F6" : isListening ? "#EF4444" : "#9CA3AF" }}>
                {isProcessing 
                  ? "Evaluating..." 
                  : isAiSpeaking 
                    ? "AI is Speaking..." 
                    : isListening 
                      ? "Listening " 
                      : "Getting Ready..."}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Question & Answer panel */}
        <div className="w-full lg:w-7/12 flex flex-col">
          <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-8 h-[80vh] overflow-y-auto flex flex-col gap-6">

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                  <BsRobot size={16} />
                </div>
                <h3 className="text-sm font-bold text-green-600 tracking-wider uppercase">Question</h3>
              </div>
              <p className="text-xl md:text-2xl font-medium text-gray-800 leading-relaxed min-h-[40px]">
                {isProcessing && conversation.length === 0 
                  ? "Generating your first question..." 
                  : latestAiMessage?.content}
              </p>
            </div>

            {showAnswerArea && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-3 text-gray-500 italic">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin"></div>
                    Evaluating your response...
                  </div>
                ) : transcript ? (
                  <p className="text-lg text-gray-700 leading-relaxed">{transcript}</p>
                ) : lastEntry?.speaker === "user" ? (
                  <p className="text-lg text-gray-700 leading-relaxed">{lastEntry.content}</p>
                ) : (
                  <p className="text-lg text-gray-400 italic">
                    {isAiSpeaking 
                      ? "Wait for the AI to finish speaking..." 
                      : "Speak now. Your words will appear here."}
                  </p>
                )}

                {!isProcessing && !transcript && lastEntry?.speaker === "user" && lastEntry?.instantFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-5 p-5 bg-blue-50 border border-blue-100 rounded-2xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BsLightningCharge className="text-blue-500" size={16} />
                      <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Feedback</h4>
                    </div>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      {lastEntry.instantFeedback}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default InterviewArena;