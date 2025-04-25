import React from "react";
import { useNavigate } from "react-router-dom";
import "../assets/styles/Entry.css";

const Entry = ({ onNavigate }) => {
  const navigate = useNavigate();

  const handleNavigation = () => {
    onNavigate(); // Trigger the animation
    setTimeout(() => navigate("/home"), 1500); // Navigate to home after animation ends
  };

  return (
    <div className="entry-container">
      <video autoPlay muted loop>
        <source src="./canvas.mp4" type="video/mp4" />
      </video>

      {/* Centered Button */}
      <div className="content">
        <button onClick={handleNavigation}>Get Started</button>
      </div>
    </div>
  );
};

export default Entry;
