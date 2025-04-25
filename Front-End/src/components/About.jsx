import React, { useState, useEffect } from "react";
import "../assets/styles/About.css";
import chatbotImage1 from "../assets/images/chatbot1.png";
import chatbotImage2 from "../assets/images/chatbot2.png";
import chatbotVideo from "../assets/Videos/chatbot-demo.mp4";
import chatbotImage3 from "../assets/images/chatbot3.png";
import chatbotImage4 from "../assets/images/chatbot4.png";

const About = () => {
  const [activeCard, setActiveCard] = useState(0);

  // Card Data: Image or Video with Text
  const cards = [
    {
      id: 1,
      type: "image",
      content: chatbotImage1,
      title: "Seamless Conversations",
      description: "Experience fast and intelligent chatbot interactions.",
    },
    {
      id: 2,
      type: "image",
      content: chatbotImage2,
      title: "User-Friendly Interface",
      description: "A smooth and easy-to-use chatbot interface for all users.",
    },
    {
      id: 3,
      type: "video",
      content: chatbotVideo,
      title: "Live Demo",
      description: "Watch the chatbot in action – responsive and efficient.",
    },
    {
      id: 4,
      type: "image",
      content: chatbotImage3,
      title: "Personalized Responses",
      description: "Get personalized and accurate responses instantly.",
    },
    {
      id: 5,
      type: "image",
      content: chatbotImage4,
      title: "Multilingual Support",
      description: "Interact with the chatbot in multiple languages seamlessly.",
    },
  ];

  // Smooth Scroll Animation
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const cardHeight = window.innerHeight;

      // Calculate the active card index based on scroll position
      const newActiveCard = Math.min(Math.round(scrollPosition / cardHeight), cards.length - 1);
      setActiveCard(newActiveCard);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [cards.length]);

  return (
    <>
      <h1 className="about-title">About Us</h1>
      <div className="about-page">
        <div className="cards-container">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={`about-card ${index === activeCard ? "active" : ""}`}
            >
              {/* Media (Image/Video) */}
              {card.type === "image" ? (
                <img src={card.content} alt={card.title} className="card-media" />
              ) : (
                <video autoPlay loop muted className="card-media">
                  <source src={card.content} type="video/mp4" />
                </video>
              )}

              {/* Card Content */}
              <div className="card-content">
                <h2>{card.title}</h2>
                <p>{card.description}</p>
                <div className="icons">❤️ 👍 🔗</div>
              </div>

              {/* Rope Effect */}
              <div className="rope" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default About;
