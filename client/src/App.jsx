import React from "react";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import { Routes, Route } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import InterviewPage from "./pages/InterviewPage";
import InterviewArena from "./pages/InterviewArena";
import InterviewHistory from "./pages/InterviewHistory";
import InterviewDetails from "./pages/InterviewDetails";

const App = () => {
  const { currentUser } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/auth"
        element={currentUser ? <Navigate to="/" /> : <Auth />}
      />
      <Route
        path="/interview"
        element={currentUser ? <InterviewPage /> : <Navigate to="/auth" />}
      />
      <Route
        path="interview/:id"
        element={currentUser ? <InterviewArena /> : <Navigate to="/auth" />}
      />
      <Route
        path="interview-history"
        element={currentUser ? <InterviewHistory /> : <Navigate to="/auth" />}
      />
      <Route
        path="/interview/details/:id"
        element={currentUser ? <InterviewDetails /> : <Navigate to="/auth" />}
      />
    </Routes>
  );
};

export default App;
