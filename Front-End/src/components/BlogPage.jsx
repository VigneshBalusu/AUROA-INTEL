// src/components/BlogPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import "../assets/styles/BlogPage.css"; // Ensure CSS path is correct
import defaultUserIcon from "../assets/images/user-icon.png"; // Ensure path is correct
// import { useNavigate } from 'react-router-dom'; // Uncomment if navigation is needed

const API_BASE_URL = "http://localhost:3000"; // Define your API base URL

const BlogPage = () => {
  // --- State Variables ---
  const [experiences, setExperiences] = useState([]); // Stores the list of experiences
  const [isLoading, setIsLoading] = useState(true);    // Loading state for fetching experiences
  const [fetchError, setFetchError] = useState(null); // Error message if fetching fails
  const [showFormPopup, setShowFormPopup] = useState(false); // Visibility of the add experience form
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // Visibility of the success flash message
  const [isTagging, setIsTagging] = useState(false); // Controls the tagging UI within the form
  const [newEntryId, setNewEntryId] = useState(null); // Tracks the ID of a newly added entry for animation
  const [formError, setFormError] = useState("");    // Error message specific to the submission form
  const [newExperienceData, setNewExperienceData] = useState({ // Data for the new experience being added
    experience: "",
    taggedEmail: "",
    messageToRecipient: ""
  });

  // const navigate = useNavigate(); // Initialize if navigation is needed

  // --- Fetch Experiences Function ---
  const fetchExperiences = useCallback(async () => {
    console.log("[BlogPage] Attempting to fetch experiences...");
    setIsLoading(true);
    setFetchError(null);
    try {
      // Use the correct backend endpoint to get all experiences
      const response = await axios.get(`${API_BASE_URL}/api/experiences`);

      if (response.data && Array.isArray(response.data)) {
         // Sort experiences by creation date, newest first
         const sortedExperiences = response.data.sort((a, b) =>
             new Date(b.createdAt) - new Date(a.createdAt)
         );
         setExperiences(sortedExperiences);
         console.log(`[BlogPage] Successfully fetched and sorted ${sortedExperiences.length} experiences.`);
      } else {
         console.error("[BlogPage] Invalid data format received from API:", response.data);
         setFetchError("Received invalid data format from the server.");
      }
    } catch (error) {
      console.error("[BlogPage] FAILED to fetch experiences:", error);
      if (error.response) {
        // Server responded with an error status (4xx, 5xx)
        setFetchError(`Failed to load experiences. Server responded with status ${error.response.status} (${error.response.data?.error || 'Server Error'}).`);
      } else if (error.request) {
        // No response received from server
        setFetchError("Network Error: Could not connect to the server. Please check if it's running.");
      } else {
        // Other errors (e.g., setting up the request)
        setFetchError(`An unexpected error occurred: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      console.log("[BlogPage] Fetch attempt finished.");
    }
  }, []); // Empty dependency array: fetch only on mount effectively

  // --- Effect to Fetch Data on Mount ---
  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]); // Run the fetch function when the component mounts

  // --- Event Handlers ---

  // Open the 'Add Experience' form popup
  const openForm = useCallback(() => {
      const token = localStorage.getItem('token');
      if (!token) {
          alert("Please log in to share your experience.");
          // Optionally redirect: navigate('/login');
          return;
      }
      // Reset form state before opening
      setFormError("");
      setIsTagging(false);
      setNewExperienceData({ experience: "", taggedEmail: "", messageToRecipient: "" });
      setShowFormPopup(true);
  }, []); // Dependencies array might include navigate if used

  // Close the 'Add Experience' form popup
  const closeForm = useCallback(() => {
      setShowFormPopup(false);
      // Optionally reset form state more thoroughly on close if needed
      // setFormError("");
      // setIsTagging(false);
      // setNewExperienceData({ experience: "", taggedEmail: "", messageToRecipient: "" });
  }, []);

  // Handle changes in form input fields
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewExperienceData(prev => ({ ...prev, [name]: value }));
  }, []);

  // --- Form Submission Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setFormError("");   // Clear previous form errors
    const token = localStorage.getItem('token');

    // --- Client-side Validations ---
    if (!token) {
        setFormError("Authentication error. Please log in again.");
        // Optionally redirect: navigate('/login');
        return;
    }
    if (!newExperienceData.experience?.trim()) {
        setFormError("Experience text cannot be empty.");
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (isTagging && newExperienceData.taggedEmail && !emailRegex.test(newExperienceData.taggedEmail.trim())) {
        setFormError("Please enter a valid email address for the tagged recipient.");
        return;
    }
    // --- End Validations ---

    try {
      // Prepare the data payload for the backend
      const payload = {
          experience: newExperienceData.experience.trim(),
          // Only include tagging info if tagging is active and email is provided
          taggedEmail: isTagging && newExperienceData.taggedEmail?.trim() ? newExperienceData.taggedEmail.trim().toLowerCase() : null,
          messageToRecipient: isTagging && newExperienceData.taggedEmail?.trim() && newExperienceData.messageToRecipient?.trim() ? newExperienceData.messageToRecipient.trim() : null
      };

      console.log("[BlogPage] Submitting Experience Payload:", payload);

      // --- ★★★ IMPORTANT BACKEND NOTE ★★★ ---
      // The backend endpoint 'POST /api/experiences' MUST fetch the *latest*
      // user details (name, email, photo) associated with the provided 'token'
      // and save *those* details into the new Experience document being created.
      // The frontend only sends the experience text and tagging info.
      // --- ★★★ END BACKEND NOTE ★★★ ---

      const response = await axios.post(
        `${API_BASE_URL}/api/experiences`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // --- Handle Success ---
      // Assume the backend response includes the fully created experience object
      // which contains the correctly saved (latest) user details.
      const addedExperience = response.data.experience;
      console.log("[BlogPage] Experience submitted successfully:", addedExperience);

      // Prepend the new experience to the existing list for immediate display
      setExperiences((prev) => [addedExperience, ...prev]);
      setNewEntryId(addedExperience._id); // Set ID to trigger 'new' animation class
      closeForm(); // Close the popup form
      showSuccessPopupMessage(); // Show temporary success message

    } catch (error) {
      // --- Handle Errors ---
      console.error("[BlogPage] Failed to submit experience:", error);
       if (error.response) {
           // Handle specific server errors
           if (error.response.status === 401 || error.response.status === 403) {
               localStorage.removeItem('token'); // Remove invalid token
               setFormError("Your session has expired. Please log in again to submit.");
               // Optionally update global state or redirect: navigate('/login');
           } else {
               // Use error message from backend response if available
               setFormError(error.response.data?.error || `Submission failed (Server Status: ${error.response.status})`);
           }
       } else if (error.request) {
            // Network error
           setFormError("Network Error: Could not reach the server. Please try again later.");
       } else {
           // Other unexpected errors
           setFormError("An unexpected error occurred during submission.");
       }
    }
  };

  // Show success popup message temporarily
  const showSuccessPopupMessage = () => {
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000); // Hide after 3 seconds
  };

  // --- Render Logic ---
  return (
    <div className="blog-page"> {/* Main container */}

      {/* Header Section */}
      <div className="header-container">
        <h1>Chatbot Experiences</h1>
        {/* Button to open the submission form */}
        <button className="add-experience-btn" onClick={openForm}>
          Add Your Experience
        </button>
      </div>

      {/* Form Popup/Modal */}
      {showFormPopup && (
        <div className={`popup-overlay ${showFormPopup ? 'visible' : ''}`}>
          <div className="popup-container">
            {/* Close button */}
            <button onClick={closeForm} className="popup-close-btn" title="Close">×</button>
            <h2>Share Your Experience</h2>
            {/* Display form errors */}
            {formError && <p className="form-error-text error-box">{formError}</p>}

            {/* Add Experience Form */}
            <form onSubmit={handleSubmit} className="experience-form">

              {/* Experience Textarea */}
              <div className="form-group">
                <label htmlFor="exp-text">Your Experience:*</label> {/* Indicate required */}
                <textarea
                  id="exp-text" name="experience"
                  placeholder="Share your thoughts, feedback, or interesting interactions with the chatbot..."
                  value={newExperienceData.experience} onChange={handleChange}
                  required rows="5"
                />
              </div>

              {/* Tagging Section */}
              <div className="form-group tagging-section">
                 {/* Show "Tag Someone" button if tagging UI is hidden */}
                 {!isTagging && (
                    <button type="button" className="tag-btn" onClick={() => setIsTagging(true)}>
                       Tag Someone (Optional)
                   </button>
                 )}
                 {/* Show tagging fields if UI is active */}
                 {isTagging && (
                   <div className="tagging-fields"> {/* Wrapper for styling */}
                     <div className="form-group">
                        {/* Required attribute added via JSX for clarity */}
                        <label htmlFor="exp-taggedEmail">Recipient's Email:*</label>
                        <input
                           id="exp-taggedEmail" type="email" name="taggedEmail"
                           placeholder="Email address to notify"
                           value={newExperienceData.taggedEmail} onChange={handleChange}
                           required // HTML5 required when visible
                        />
                     </div>
                     <div className="form-group">
                         <label htmlFor="exp-messageToRecipient">Message to Recipient (Optional):</label>
                         <textarea
                            id="exp-messageToRecipient" name="messageToRecipient"
                            placeholder="Add a short message for the tagged person..."
                            value={newExperienceData.messageToRecipient} onChange={handleChange}
                            rows="3"
                        />
                     </div>
                     {/* Button to hide tagging fields */}
                     <button type="button" onClick={() => { setIsTagging(false); setNewExperienceData(prev => ({...prev, taggedEmail: '', messageToRecipient: ''})); }} className="cancel-tag-btn">
                         Cancel Tag
                     </button>
                   </div>
                 )}
              </div>

              {/* Submit Button */}
              <button type="submit" className="submit-experience-btn">Post Experience</button>
            </form>
          </div>
        </div>
      )}

      {/* Success Message Flash Popup */}
      {showSuccessMessage && (
        <div className="popup-message success-box">✅ Experience added successfully!</div>
      )}

      {/* Display Area for Experiences */}
      <div className="content-area"> {/* Wrapper for loading/error/grid */}
          {/* Loading State */}
          {isLoading && <p className="status-text loading-text">Loading experiences...</p>}

          {/* Error State */}
          {fetchError && <p className="fetch-error-text error-box">{fetchError}</p>}

          {/* Experiences Grid (or Empty Message) */}
          {!isLoading && !fetchError && (
            <> {/* Use Fragment to group grid and empty message */}
              {experiences.length > 0 ? (
                <div className="experience-grid">
                  {/* Map over fetched experiences */}
                  {experiences.map((item) => (
                    <div
                      key={item._id} // Use unique MongoDB ID
                      // Apply animation class if it's the newly added entry
                      className={`experience-card ${item._id === newEntryId ? "new" : ""} ${item.taggedEmail ? "tagged" : ""}`}
                      onAnimationEnd={() => { if (item._id === newEntryId) setNewEntryId(null); }}
                      title={item.taggedEmail ? `Tagged: ${item.taggedEmail}` : ''}
                    >
                      {/* User Info Section - Displays data SAVED WITH this experience */}
                      <div className="user-info-header">
                          <div className="img-wrapper">
                            <img
                                src={item.userPhoto || defaultUserIcon} // Use photo from experience record
                                alt={`${item.userName || 'User'}'s profile`}
                                // Fallback if the stored URL is broken or missing
                                onError={(e) => { e.target.onerror = null; e.target.src = defaultUserIcon; }}
                            />
                          </div>
                          <div className="user-details">
                              <h3>{item.userName || 'Anonymous'}</h3> {/* Use name from experience record */}
                              {/* Optional: Display user email if needed */}
                              {/* <span className="email-text">{item.userEmail || ''}</span> */}
                          </div>
                           <span className="timestamp-text"> {/* Moved timestamp here */}
                            {new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                           </span>
                      </div>

                      {/* Experience Text Content */}
                      <div className="text-content">
                        <p className="experience-text">{item.experience}</p>
                        {/* Optional: Display tagged info more prominently */}
                        {item.taggedEmail && (
                          <p className="tagged-info">
                              <span className="tag-icon">@</span> {/* Example icon */}
                              Tagged: {item.taggedEmail}
                              {item.messageToRecipient && <span className="tag-message">"{item.messageToRecipient}"</span>}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Message if no experiences are found
                <p className="status-text empty-text">No experiences shared yet. Be the first!</p>
              )}
            </>
          )}
       </div> {/* End content-area */}

    </div> // End blog-page
  );
};

export default BlogPage;