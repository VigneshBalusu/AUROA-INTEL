import React, { useState } from 'react';
import '../assets/styles/Contact.css';
import VigneshImage from '../assets/images/image.png';
import ManojImage from '../assets/images/Manu.jpg';
import DeviImage from '../assets/images/Devi.png';
import JhanaviImage from '../assets/images/Jhanavi.jpeg';
import ManasaImage from '../assets/images/manasa.jpeg';

const Contact = () => {
  // State for form and card flip
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [flippedCard, setFlippedCard] = useState(null);

  // Team Data
  const teamMembers = [
    { name: 'Vignesh', role: 'Lead Developer', image: VigneshImage },
    { name: 'Manoj Kumar', role: 'Front Developer', image: ManojImage },
    { name: 'Devi Sri', role: 'UI/UX Designer', image: DeviImage },
    { name: 'Jahnavi', role: 'Logo Designer', image: JhanaviImage },
    { name: 'Sweeti Manasa', role: 'BackEnd Developer', image: ManasaImage },
  ];



 

  // Toggle card flip
  const toggleFlip = (index) => {
    setFlippedCard(flippedCard === index ? null : index);
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="hero">
        <h1>Get in Touch</h1>
        <p>We’d love to hear from you. Reach out to us anytime!</p>
      </section>

    

      {/* Contact Info */}
      <section className="contact-info">
        <h2>Our Info</h2>
        <p>
          Email: <a href="mailto:contact@auroraintel.com">contact@auroraintel.com</a>
        </p>
        <p>
          Phone: <a href="tel:+1234567890">+1 234 567 890</a>
        </p>
        <p>
          <a href="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.8354345091843!2d144.9537363153165!3d-37.81627974202109!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad65d5df1f9b1fd%3A0x5045675218ce720!2sMelbourne%20VIC!5e0!3m2!1sen!2sau!4v1611787251466!5m2!1sen!2sau">
            Location
          </a>
        </p>

        {/* Google Map */}
        <div className="map-container">
          <iframe
            title="location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.8354345091843!2d144.9537363153165!3d-37.81627974202109!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad65d5df1f9b1fd%3A0x5045675218ce720!2sMelbourne%20VIC!5e0!3m2!1sen!2sau!4v1611787251466!5m2!1sen!2sau"
            frameBorder="0"
            width="100%"
            height="300"
            allowFullScreen
            loading="lazy"
          ></iframe>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <h2>Meet the Team</h2>
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div
              key={member.name}
              className={`team-card ${flippedCard === index ? 'flipped' : ''}`}
              onClick={() => toggleFlip(index)}
            >
              <div className="card-inner">
                <div className="card-front">
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </div>
                <div className="card-back">
                  <img src={member.image} alt={member.name} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Contact;
