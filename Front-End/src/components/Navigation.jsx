// Navigation.jsx (Modified to allow access to /home even when logged out)

import React, { useState, useEffect } from "react";
import { Link, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Home from "./Home"; // ★ Home component is now always potentially rendered
import Contact from "./Contact";
import About from "./About";
import SignUp from "./SignUp";
import Login from "./Login";
import Profile from "./Profile"; // Still needs protection
import BlogPage from "./BlogPage";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import "../assets/styles/Navigation.css";

// Receive props from App.jsx
function Navigation({ isLoggedIn: isLoggedInProp, setIsLoggedIn: setIsLoggedInProp }) {

  // Use the state/setter passed from App.jsx
  const isLoggedIn = isLoggedInProp;
  const setIsLoggedIn = setIsLoggedInProp;

  const [visible, setVisible] = useState(false);
  const navigate = useNavigate(); // Keep if used for other purposes

  // Effect for Navbar visibility (remains unchanged)
  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2000);
    const handleMouseMove = (event) => setVisible(event.clientY < 80);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <>
      {/* Navbar structure */}
      <nav className={`navbar ${visible ? "show" : ""}`}>
        <ul>
          {/* --- ★ CHANGE: Home link always shown --- */}
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/blog">Blog</Link></li>
          {isLoggedIn ? (
            <li><Link to="/profile">Profile</Link></li>
          ) : (
            <li><Link to="/login">Login/SignUp</Link></li>
          )}
        </ul>
      </nav>

      {/* --- Main Application Routes - Defined WITHIN Navigation --- */}
      <div className="main-content-area">
        <Routes>
            {/* --- Public Routes accessible ALWAYS --- */}
            {/* ★★★ HOME IS NOW HERE - ALWAYS ACCESSIBLE ★★★ */}
            <Route path="/home" element={<Home />} />
            {/* ★★★ -------------------------------- ★★★ */}

            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* --- Routes ONLY for Logged OUT Users --- */}
            {!isLoggedIn && (
               <>
                  <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
                  <Route path="/signup" element={<SignUp />} />
                  {/* Logged-out users trying profile get redirected to login */}
                  <Route path="/profile" element={<Navigate to="/login" replace />} />
                  {/* Add other redirects for logged-out users if necessary */}
               </>
            )}

            {/* --- Routes ONLY for Logged IN Users --- */}
             {isLoggedIn && (
               <>
                  {/* Profile is only accessible when logged in */}
                  <Route path="/profile" element={<Profile setIsLoggedIn={setIsLoggedIn} />} />
                  {/* Logged-in users trying login/signup get redirected to home */}
                  <Route path="/login" element={<Navigate to="/home" replace />} />
                  <Route path="/signup" element={<Navigate to="/home" replace />} />
                  {/* Add other protected routes */}
               </>
            )}

          {/* --- Fallback / Default Route --- */}
          {/* ★★★ CHANGE: Default redirect is now always /home ★★★ */}
          <Route path="*" element={<Navigate to="/home" replace />} />

        </Routes>
      </div>
    </>
  );
}

export default Navigation;