import React, { useEffect } from "react";
import "../assets/styles/Animation.css";
import logo from "../assets/images/logo.jpeg"; // Ensure the correct path

const Animation = ({ onAnimationEnd }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationEnd && onAnimationEnd(); // Hide animation after 3s
    }, 3000);
    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  return (
    <div className="logo-animation">
      <div className="logo-box">
        <img src={logo} alt="Aurora Intel Logo" className="logo" />
      </div>
    </div>
  );
};

export default Animation;
