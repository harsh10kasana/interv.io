import React, { useState } from "react";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { BsRobot } from "react-icons/bs";
import { FaUser } from "react-icons/fa";
import { HiOutlineLogout } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { currentUser, logout, loading } = useContext(AuthContext);

  const [showUserPopup, setShowUserPopup] = useState(false);

  const navigate = useNavigate();

  return (
    <div className="bg-[#f3f3f3] flex justify-center px-4 pt-6">
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-6xl bg-white rounded-[24px] shadow-sm border border-gray-200 px-8 py-4 flex justify-between items-center relative"
      >
        <div onClick={()=>{navigate('/')}} className="flex items-center gap-3 cursor-pointer">
          <div className="bg-black text-white p-2 rounded-lg">
            <BsRobot size={18} />
          </div>
          <h1 className="font-semibold hidden md:block text-lg">interv.io</h1>
        </div>
        <div className="flex items-center relative">
          <div className="relative">
            <button
              onClick={() => {
                if (loading) return;
                if (currentUser) {
                  setShowUserPopup(!showUserPopup);
                } else {
                  setShowUserPopup(false);
                  navigate("/auth");
                }
              }}
              className={`bg-black text-white flex items-center justify-center font-semibold transition-all ${
                currentUser
                  ? "w-9 h-9 rounded-full text-lg"
                  : "px-5 py-2 rounded-full text-sm hover:bg-gray-800"
              } ${loading ? "cursor-not-allowed opacity-90" : ""}`}
            >
              {currentUser ? (
                currentUser.displayName.slice(0, 1).toUpperCase()
              ) : loading ? (
                <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Get Started"
              )}
            </button>
            {showUserPopup && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-0 mt-3 w-48 bg-white shadow-xl border border-gray-200 rounded-xl p-4 z-50"
              >
                <p className="text-md text-blue-500 font-medium mb-1">
                  {currentUser.displayName}
                </p>
                <button
                  onClick={() => {
                    navigate("/interview-history");
                    setShowUserPopup(false);
                  }}
                  className="cursor-pointer w-full text-left text-sm py-2 hover:text-black text-gray-600"
                >
                  Interview History
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowUserPopup(false);
                    }}
                  className="cursor-pointer w-full text-left text-sm py-2 flex items-center gap-2 text-red-500"
                >
                  <HiOutlineLogout size={16} />
                  Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Navbar;
