import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { BsMic, BsRobot, BsPlayFill, BsInfoCircle, BsCheckCircle, BsLightningCharge } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";
import axios from "axios";

const API_URL = "http://localhost:5001/api/interview";
const MAX_QUESTIONS = 5;
const START_TIMEOUT = 7000; // 7 sec to start answering
const SILENCE_TIMEOUT = 5000; // 5 sec of silence = user finished answering

const InterviewArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  // states
  const [interview, setInterview] = useState(null); // interview data from backend
  const [conversation, setConversation] = useState([]); // all questions and answers
  const [hasStarted, setHasStarted] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // true while waiting for backend
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(""); // what the user is saying right now
  const [totalTime, setTotalTime] = useState(0);

  // refs (used because timers and speech callbacks need the latest value)
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef("");
  const startTimeRef = useRef(null);
  const submittedRef = useRef(false); // so the answer doesn't get submitted twice
  const utteranceRef = useRef(null);
  const conversationRef = useRef([]);

  // keep the ref updated with the latest conversation
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // gets the firebase token and makes the header for api calls
  const getHeaders = async () => {
    const token = await currentUser.getIdToken();
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // fetch the interview details when page opens
  useEffect(() => {
    const fetchInterview = async () => {
      if (!currentUser) return;
      try {
        const { data } = await axios.get(`${API_URL}/${id}`, await getHeaders());
        setInterview(data.interview);
        setConversation(data.interview.conversation);
      } catch (error) {
        console.error("Error loading interview:", error);
        navigate("/interview");
      }
    };
    fetchInterview();
  }, [id, currentUser, navigate]);

  // start the webcam once the interview starts
  useEffect(() => {
    if (!hasStarted || interviewComplete) return;

    let stream;
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch((err) => console.error("Camera access denied:", err));

    // turn off the camera when we leave
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [hasStarted, interviewComplete]);

  // stop mic, voice and timers when the user leaves the page
  useEffect(() => {
    return () => {
      clearTimeout(silenceTimerRef.current);
      recognitionRef.current?.abort();
      window.speechSynthesis.cancel();
    };
  }, []);

  // makes the AI speak the text, and opens the mic after it finishes
  const speakText = (text) => {
    window.speechSynthesis.cancel();
    setIsAiSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance; // chrome bug: voice stops in the middle without this
    utterance.lang = "en-US";
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((v) => v.name.includes("Google")) || voices.find((v) => v.lang === "en-US");
    utterance.pitch = 1; 
    utterance.rate = 1;  

    const onFinish = () => {
      setIsAiSpeaking(false);
      startListening();
    };
    utterance.onend = onFinish;
    utterance.onerror = onFinish;

    window.speechSynthesis.speak(utterance);
  };

  // converts the user's voice to text using the browser's speech recognition
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition isn't supported here. Please use Chrome or Edge.");
      return;
    }

    // clear the old session if there is any
    recognitionRef.current?.abort();
    clearTimeout(silenceTimerRef.current);
    submittedRef.current = false;
    transcriptRef.current = "";
    setTranscript("");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    // runs when the user stops speaking (or never started)
    const finishAnswer = () => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      clearTimeout(silenceTimerRef.current);
      recognition.stop();
      setIsListening(false);
      submitAnswer(transcriptRef.current);
    };

    recognition.onstart = () => setIsListening(true);

    // runs every time the user says something
    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");

      setTranscript(text);
      transcriptRef.current = text;

      // reset the silence timer because the user is still speaking
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(finishAnswer, SILENCE_TIMEOUT);
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      // mic is blocked or not available
      if (["not-allowed", "service-not-allowed", "audio-capture"].includes(e.error)) {
        submittedRef.current = true; // so it doesn't restart again
        clearTimeout(silenceTimerRef.current);
        setIsListening(false);
        alert("Microphone is blocked or unavailable. Allow mic access in the browser's site settings.");
      }
    };

    // chrome sometimes stops recognition by itself, so start it again
    recognition.onend = () => {
      if (!submittedRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.start();

    // if the user doesn't speak at all, submit empty answer after 7 sec
    silenceTimerRef.current = setTimeout(finishAnswer, START_TIMEOUT);
  };

  // runs when user clicks Begin / Resume button
  const handleBeginInterview = async () => {
    // ask for mic permission 
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream.getTracks().forEach((t) => t.stop());
    } catch {
      alert("Please allow microphone access to continue.");
      return;
    }

    setHasStarted(true);
    if (!startTimeRef.current) startTimeRef.current = Date.now();

    // resume case: speak the last question again
    if (conversation.length > 0) {
      const lastQuestion = conversation.filter((m) => m.speaker === "ai").pop();
      lastQuestion ? speakText(lastQuestion.content) : startListening();
      return;
    }

    // new interview: get the first question from backend
    setIsProcessing(true);
    try {
      const { data } = await axios.post(`${API_URL}/${id}/start`, {}, await getHeaders());
      setConversation([{ speaker: "ai", content: data.question, instantFeedback: null }]);
      speakText(data.question);
    } catch (error) {
      console.error("Failed to start interview:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // sends the answer to backend and gets feedback + next question
  const submitAnswer = async (answerText) => {
    const isSilent = !answerText.trim();
    const answerToSend = isSilent ? "[No answer provided by the candidate]" : answerText;
    const displayAnswer = isSilent ? "*No response detected*" : answerText;

    setIsProcessing(true);
    setTranscript("");
    transcriptRef.current = "";

    // count how many questions are asked till now (using ref so we get the latest value)
    const questionsAsked = conversationRef.current.filter((m) => m.speaker === "ai").length;

    // show the user's answer on screen
    setConversation((prev) => [...prev, { speaker: "user", content: displayAnswer, instantFeedback: null }]);

    try {
      const { data } = await axios.post(
        `${API_URL}/${id}/answer`,
        { userAnswer: answerToSend, timeTakenSeconds: 0 },
        await getHeaders()
      );
      const feedback = data.feedback;
      const isLastQuestion = questionsAsked >= MAX_QUESTIONS;

      // add feedback to the user's answer, and add next question if the interview is not over
      setConversation((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], instantFeedback: feedback };
        if (!isLastQuestion) {
          updated.push({ speaker: "ai", content: data.nextQuestion, instantFeedback: null });
        }
        return updated;
      });

      if (isLastQuestion) {
        setTotalTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        setInterviewComplete(true);
        window.speechSynthesis.cancel();
      } else {
        speakText(`${feedback} Next question. ${data.nextQuestion}`);
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ------------------- UI -------------------

  // loading screen
  if (!interview) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center font-semibold text-lg text-gray-500">
        Loading Arena...
      </div>
    );
  }

  // instructions screen (before starting)
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] p-4 md:p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-white p-10 rounded-3xl shadow-xl text-center border border-gray-100"
        >
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <BsRobot size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to your Arena</h1>
          <p className="text-gray-500 text-lg mb-8">
            Target Role: <span className="font-semibold text-black">{interview.role}</span> ({interview.experience})
          </p>

          <div className="bg-gray-50 p-6 rounded-2xl text-left space-y-4 mb-10 border border-gray-100">
            <h3 className="font-semibold flex items-center gap-2 text-gray-700">
              <BsInfoCircle className="text-blue-500" /> Hands-Free Mode Active
            </h3>
            <ul className="text-gray-600 space-y-2 text-sm md:text-base list-disc list-inside">
              <li>Ensure your volume is up. The AI will speak the questions out loud.</li>
              <li>Your microphone will <b>open automatically</b> after the AI finishes speaking.</li>
              <li>You have 7 seconds to start answering, or the AI will move on.</li>
              <li>The interview will conclude after {MAX_QUESTIONS} questions.</li>
              <li>Use Chrome or Edge and allow microphone access when asked.</li>
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

  // interview finished screen
  if (interviewComplete) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] p-4 md:p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-white p-12 rounded-3xl shadow-xl text-center border border-gray-100"
        >
          <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <BsCheckCircle size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Interview Complete!</h1>
          <p className="text-gray-500 text-lg mb-8">
            You successfully answered {MAX_QUESTIONS} questions.
            <br />
            Total duration:{" "}
            <span className="font-semibold text-black">
              {Math.floor(totalTime / 60)}m {totalTime % 60}s
            </span>
          </p>
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

  // main interview screen
  const latestQuestion = conversation.filter((m) => m.speaker === "ai").pop();
  const lastEntry = conversation[conversation.length - 1];
  const lastIsUser = lastEntry?.speaker === "user";
  const showAnswerArea = isListening || isProcessing || !!transcript || lastIsUser;

  // text and colors for the status shown under the mic icon
  let status = { text: "Getting Ready...", color: "#9CA3AF", circle: "bg-gray-100 text-gray-400" };
  if (isProcessing) {
    status = { text: "Evaluating...", color: "#9CA3AF", circle: "bg-gray-100 text-gray-400" };
  } else if (isAiSpeaking) {
    status = { text: "AI is Speaking...", color: "#3B82F6", circle: "bg-blue-50 text-blue-500 border-4 border-blue-200" };
  } else if (isListening) {
    status = { text: "Listening", color: "#EF4444", circle: "bg-red-50 text-red-500 border-4 border-red-200" };
  }

  return (
    <div className="min-h-screen bg-[#f3f3f3] p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8">
        {/* left side: camera and status */}
        <div className="w-full lg:w-5/12">
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
              {/* red REC badge while mic is on */}
              {isListening && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-pulse flex items-center gap-2 font-medium">
                  <div className="w-2 h-2 bg-white rounded-full"></div> REC
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* ripple circles when AI is speaking or mic is listening */}
                {(isAiSpeaking || isListening) && (
                  <>
                    <span className="absolute inset-0 rounded-full border-2 animate-ping" style={{ borderColor: status.color }} />
                    <span className="absolute inset-0 rounded-full border-2 animate-ping" style={{ borderColor: status.color, animationDelay: "0.5s" }} />
                  </>
                )}
                <div className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${status.circle}`}>
                  {isAiSpeaking ? <BsRobot size={40} /> : <BsMic size={40} />}
                </div>
              </div>

              <p className="mt-6 text-sm font-bold tracking-widest uppercase" style={{ color: status.color }}>
                {status.text}
              </p>
            </div>
          </div>
        </div>

        {/* right side: question, answer and feedback */}
        <div className="w-full lg:w-7/12">
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
                  : latestQuestion?.content}
              </p>
            </div>

            {/* answer box */}
            {showAnswerArea && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-3 text-gray-500 italic">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin"></div>
                    Evaluating your response...
                  </div>
                ) : transcript || lastIsUser ? (
                  <p className="text-lg text-gray-700 leading-relaxed">{transcript || lastEntry.content}</p>
                ) : (
                  <p className="text-lg text-gray-400 italic">
                    {isAiSpeaking ? "Wait for the AI to finish speaking..." : "Speak now. Your words will appear here."}
                  </p>
                )}

                {/* feedback box */}
                {!isProcessing && !transcript && lastIsUser && lastEntry.instantFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 p-5 bg-blue-50 border border-blue-100 rounded-2xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BsLightningCharge className="text-blue-500" size={16} />
                      <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Feedback</h4>
                    </div>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">{lastEntry.instantFeedback}</p>
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