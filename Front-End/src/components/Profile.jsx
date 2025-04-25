// src/components/Profile.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/Profile.css'; // Import standard CSS
import defaultUserIcon from "../assets/images/user-icon.png";

// ★ Import Confirmation Dialog
import ConfirmationDialog from './ConfirmationDialog';

const Profile = ({ setIsLoggedIn }) => {
  // --- State for Displayed Data ---
  const [userData, setUserData] = useState({
    name: '', email: '', photo: defaultUserIcon,
    address: '', phone: '', dateOfBirth: '',
  });

  // --- State for Edit Popup ---
  const [editData, setEditData] = useState({ /* Initialized in useEffect */ });
  const [editMode, setEditMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); // New file object
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // URL for preview img tag
  const [isPhotoMarkedForRemoval, setIsPhotoMarkedForRemoval] = useState(false); // Flag for removal intent

  // --- Component State ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(''); // General fetch/load error
  const [updateMessage, setUpdateMessage] = useState(''); // Edit success/error message
  const [isUploading, setIsUploading] = useState(false); // Upload loading state

  // --- Confirmation Dialog State ---
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    message: '',
    actionType: null, // e.g., 'removePhoto'
  });

  const navigate = useNavigate();
  const fileInputRef = useRef(null); // Ref for the file input

  // --- Fetch Profile Data ---
  useEffect(() => {
    const fetchProfile = async () => {
      // ... (Keep existing fetchProfile logic exactly as you provided) ...
      // Ensure it initializes both `userData` and `editData`
       setError('');
      setIsLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error("No token found, redirecting to login.");
        setError('Authentication required. Please log in.');
        if (setIsLoggedIn) setIsLoggedIn(false); // Check if function exists
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:3000/api/user', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const fetchedData = response.data;
        console.log("Profile data fetched:", fetchedData);

        const dobFormatted = fetchedData.dateOfBirth
                             ? new Date(fetchedData.dateOfBirth).toISOString().split('T')[0]
                             : '';

        const profileData = {
            name: fetchedData.name || '',
            email: fetchedData.email || '',
            photo: fetchedData.photo || defaultUserIcon,
            address: fetchedData.address || '',
            phone: fetchedData.phone || '',
            dateOfBirth: dobFormatted,
        };
        setUserData(profileData);
        setEditData(profileData); // Initialize edit form
        setImagePreviewUrl(profileData.photo); // Initialize preview

      } catch (err) {
        console.error("Profile fetch error:", err);
        let errorMessage = 'Failed to fetch profile data.';
        if (err.response) {
             if (err.response.status === 401 || err.response.status === 403) {
                 errorMessage = 'Session expired. Please log in again.';
                 localStorage.removeItem('token');
                  if (setIsLoggedIn) setIsLoggedIn(false);
                 navigate('/login');
             } else {
                 errorMessage = err.response.data?.error || err.response.data?.message || errorMessage;
             }
        } else if (err.request) {
            errorMessage = 'Network error. Could not connect to server.';
        } else {
            errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, setIsLoggedIn]);

  // --- Cleanup Object URL ---
  useEffect(() => {
      // Revoke the object URL if it exists and starts with 'blob:' when the component unmounts
      // or when the selectedFile changes (meaning a new preview URL might be generated)
       let currentPreview = imagePreviewUrl;
      return () => {
          if (currentPreview && typeof currentPreview === 'string' && currentPreview.startsWith('blob:')) {
              // console.log("Revoking blob URL:", currentPreview);
              URL.revokeObjectURL(currentPreview);
          }
      };
  }, [imagePreviewUrl]); // Re-run when imagePreviewUrl changes

  // --- Edit Popup Handlers ---
  const handleEditOpen = () => {
    setEditData({ ...userData });
    setImagePreviewUrl(userData.photo || defaultUserIcon); // Reset preview to current photo
    setSelectedFile(null);
    setIsPhotoMarkedForRemoval(false); // Reset removal flag
    setUpdateMessage('');
    setError('');
    setEditMode(true);
  };

  const handleEditClose = () => {
    setEditMode(false);
    // No need to revoke here, useEffect cleanup handles it
  };

  // --- Form Input Handlers ---
  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (file.size > 5 * 1024 * 1024) { // 5MB limit
              setUpdateMessage("❌ File is too large (Max 5MB).");
              setSelectedFile(null);
              // Don't reset preview here, keep the old one
              if (fileInputRef.current) fileInputRef.current.value = null; // Reset file input
              return;
          }
          setSelectedFile(file);
          // ★ Create and set preview URL
          const previewUrl = URL.createObjectURL(file);
          // Revoke previous blob URL if it exists before setting the new one
           if (imagePreviewUrl && typeof imagePreviewUrl === 'string' && imagePreviewUrl.startsWith('blob:')) {
               URL.revokeObjectURL(imagePreviewUrl);
           }
          setImagePreviewUrl(previewUrl);
          setIsPhotoMarkedForRemoval(false); // Selecting a file cancels removal intent
          setUpdateMessage('');
      } else {
          setSelectedFile(null);
          // Optionally revert preview if file selection is cancelled?
          // setImagePreviewUrl(userData.photo || defaultUserIcon);
      }
  };

  // --- Photo Removal Logic ---

  // ★ Step 1: User clicks "Remove Photo" button -> Show Confirmation Dialog
  const handleRequestRemovePhoto = useCallback(() => {
    // Don't show if already default or dialog is open
    if (isPhotoMarkedForRemoval || imagePreviewUrl === defaultUserIcon || confirmationState.isOpen) return;

    setConfirmationState({
        isOpen: true,
        message: "Are you sure you want to remove your profile photo?",
        actionType: 'removePhoto', // Identify the action
    });
  }, [isPhotoMarkedForRemoval, imagePreviewUrl, confirmationState.isOpen]);

  // ★ Step 2: User confirms in the dialog -> Update state for removal intent
  const confirmPhotoRemoval = useCallback(() => {
    console.log("User confirmed photo removal.");
    setImagePreviewUrl(defaultUserIcon); // Show default in preview
    setSelectedFile(null); // Clear any selected file
    setIsPhotoMarkedForRemoval(true); // Set flag for handleSaveProfile
    setConfirmationState({ isOpen: false, message: '', actionType: null }); // Close dialog
     if (fileInputRef.current) fileInputRef.current.value = null; // Reset file input visually
  }, []);

  // ★ Step 3: User cancels dialog
  const cancelConfirmation = useCallback(() => {
    console.log("User cancelled action.");
    setConfirmationState({ isOpen: false, message: '', actionType: null });
  }, []);


  // --- Save Profile Logic (Handles Upload, Removal, Details Update) ---
  const handleSaveProfile = async (e) => {
      e.preventDefault();
      setUpdateMessage('⏳ Saving...'); // Initial saving message
      setIsUploading(false); // Reset upload state

      const token = localStorage.getItem('token');
      if (!token) { /* ... handle auth error ... */ return; }

      let finalPhotoValue = userData.photo; // Start with current photo

      // --- Determine final photo value based on user actions ---
      if (isPhotoMarkedForRemoval) {
          console.log("Photo marked for removal.");
          finalPhotoValue = null; // ★ Signal backend to remove photo (adjust if backend needs empty string etc.)
      } else if (selectedFile) {
          // --- Upload new image ---
          setIsUploading(true);
          setUpdateMessage('⏳ Uploading image...');
          const formData = new FormData();
          formData.append('profileImage', selectedFile);

          try {
              console.log("Uploading image...");
              const uploadResponse = await axios.post('http://localhost:3000/api/auth/upload', formData, {
                  headers: {
                      'Content-Type': 'multipart/form-data',
                      'Authorization': `Bearer ${token}`
                  }
              });
              finalPhotoValue = uploadResponse.data.photo; // Use the URL from backend response
              console.log("Image upload successful:", finalPhotoValue);
              setSelectedFile(null); // Clear file state
              if (fileInputRef.current) fileInputRef.current.value = null; // Reset input visually
          } catch (uploadError) {
              console.error("Image upload failed:", uploadError);
              setUpdateMessage(`❌ Image upload failed: ${uploadError.response?.data?.message || uploadError.message}`);
              setIsUploading(false);
              return; // Stop save process if upload fails
          } finally {
              setIsUploading(false); // Ensure upload state is reset
          }
      }
      // Else (no new file, not marked for removal): finalPhotoValue remains userData.photo

      // --- Update User Details ---
      setUpdateMessage('⏳ Updating details...');
      try {
          const updatePayload = {
              name: editData.name,
              email: editData.email,
              photo: finalPhotoValue, // Use the determined photo value (URL, null, or existing)
              address: editData.address,
              phone: editData.phone,
              dateOfBirth: editData.dateOfBirth || null,
          };
          console.log("Updating profile data with payload:", updatePayload);

          const response = await axios.put('http://localhost:3000/api/auth/user', updatePayload, {
              headers: { Authorization: `Bearer ${token}` }
          });

          // --- Success ---
          const updatedUserDataFromServer = response.data.user;
          // Re-format date for display consistency
          updatedUserDataFromServer.dateOfBirth = updatedUserDataFromServer.dateOfBirth
                                                  ? new Date(updatedUserDataFromServer.dateOfBirth).toISOString().split('T')[0]
                                                  : '';
          updatedUserDataFromServer.photo = updatedUserDataFromServer.photo || defaultUserIcon; // Ensure photo has a fallback

          setUserData(updatedUserDataFromServer); // Update main display state
          setIsPhotoMarkedForRemoval(false); // Reset removal flag after successful save
          setUpdateMessage('✅ Profile updated successfully!');
          setTimeout(() => {
              setUpdateMessage('');
              handleEditClose(); // Close popup
          }, 2000);

      } catch (updateError) {
          console.error("Profile update failed:", updateError);
          // Handle potential case where photo upload succeeded but details update failed
          const errorMsg = `❌ Profile update failed: ${updateError.response?.data?.error || updateError.response?.data?.message || updateError.message}`;
          setUpdateMessage(errorMsg);
          // Should we revert the photo state if only details failed? Complex, maybe just show error.
      }
  };


  // --- Logout Logic ---
  const handleLogout = () => { /* ... Keep existing logout logic ... */
    localStorage.removeItem('token');
    if (setIsLoggedIn) setIsLoggedIn(false);
    navigate('/login');
   };

  // --- Render Logic ---
  if (isLoading) { /* ... loading ... */ }
  if (error && !editMode) { /* ... error ... */ }

  const isDefaultPhoto = userData.photo === defaultUserIcon || !userData.photo;

  return (
    <div className="profile-container">
      {/* Main Profile Display Card */}
      <div className="profile-card view-mode">
        <div className="image-container">
          <img
            src={userData.photo || defaultUserIcon}
            alt={`${userData.name}'s profile`}
            className="profile-image" // Style this class in Profile.css for size
            onError={(e) => { e.target.onerror = null; e.target.src=defaultUserIcon }}
          />
          <button onClick={handleEditOpen} className="update-btn edit-trigger-btn">
             Edit Profile
          </button>
        </div>
        <div className="user-info">
           {/* ... user info paragraphs ... */}
            <h2>{userData.name || 'N/A'}</h2>
            <p><strong>Email:</strong> {userData.email || 'N/A'}</p>
            <p><strong>Phone:</strong> {userData.phone || 'Not Set'}</p>
            <p><strong>Address:</strong> {userData.address || 'Not Set'}</p>
            <p><strong>Birthday:</strong> {userData.dateOfBirth || 'Not Set'}</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {/* Edit Profile Popup/Modal */}
      {editMode && (
        <div className="edit-popup">
          <div className="edit-card">
             <button onClick={handleEditClose} className="popup-close-btn" title="Close">×</button>
            <h3>Edit Your Profile</h3>

            {updateMessage && (
                 <div className={`message-card ${updateMessage.includes('❌') || updateMessage.includes('failed') ? 'error' : (updateMessage.includes('✅') ? 'success' : 'info')}`}>
                     {isUploading ? '⏳ Uploading image...' : updateMessage}
                 </div>
            )}

            <form onSubmit={handleSaveProfile} className="profile-edit-form">

              {/* --- Image Preview and Actions --- */}
              <div className="form-group image-preview-section">
                 <label>Profile Photo:</label>
                 <div className="image-controls">
                     <img
                         src={imagePreviewUrl || defaultUserIcon}
                         alt="Profile preview"
                         className="profile-image-preview" // Add style for this preview
                         onError={(e) => { e.target.onerror = null; e.target.src=defaultUserIcon }}
                     />
                     <div className="image-buttons">
                         <label htmlFor="profileImageUpload" className="upload-label button-like">
                             <span>{selectedFile ? 'Change' : 'Upload'}</span>
                         </label>
                         <input
                             ref={fileInputRef} // Use ref
                             type="file"
                             id="profileImageUpload"
                             style={{ display: 'none' }}
                             onChange={handleFileChange}
                             accept="image/png, image/jpeg, image/gif, image/webp"
                         />
                         {/* Show Remove button only if current/preview photo is NOT the default */}
                         {imagePreviewUrl && imagePreviewUrl !== defaultUserIcon && (
                            <button
                                type="button"
                                className="remove-photo-btn button-like danger"
                                onClick={handleRequestRemovePhoto} // Trigger confirmation
                                disabled={isPhotoMarkedForRemoval} // Disable if already marked
                             >
                                 Remove
                             </button>
                         )}
                     </div>
                 </div>
                   {selectedFile && !isPhotoMarkedForRemoval && <span className="file-name-display">{selectedFile.name}</span>}
                   {isPhotoMarkedForRemoval && <span className="file-name-display info">Photo will be removed on save.</span>}
              </div>


               {/* --- Text Fields with Labels --- */}
              <div className="form-group">
                 <label htmlFor="edit-name">Name:</label>
                 <input id="edit-name" type="text" name="name" value={editData.name || ''} onChange={handleEditChange} required />
              </div>
              {/* Email might not be editable - keep commented if needed */}
              {/* <div className="form-group"> ... email input ... </div> */}
              <div className="form-group">
                   <label htmlFor="edit-phone">Phone:</label>
                   <input id="edit-phone" type="tel" name="phone" placeholder="Optional" value={editData.phone || ''} onChange={handleEditChange} />
               </div>
               <div className="form-group">
                   <label htmlFor="edit-address">Address:</label>
                   <textarea id="edit-address" name="address" placeholder="Optional" value={editData.address || ''} onChange={handleEditChange} rows="3"></textarea>
               </div>
               <div className="form-group">
                   <label htmlFor="edit-dob">Date of Birth:</label>
                   <input id="edit-dob" type="date" name="dateOfBirth" value={editData.dateOfBirth || ''} onChange={handleEditChange} max={new Date().toISOString().split("T")[0]} /> {/* Prevent future dates */}
               </div>

              {/* --- Action Buttons --- */}
              <div className="form-actions">
                  <button type="submit" className="save-btn" disabled={isUploading}>
                     {isUploading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleEditClose} disabled={isUploading}>
                     Cancel
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* ★★★ Render Confirmation Dialog ★★★ */}
        <ConfirmationDialog
            isOpen={confirmationState.isOpen}
            message={confirmationState.message}
            onConfirm={confirmationState.actionType === 'removePhoto' ? confirmPhotoRemoval : () => {}} // Route to correct confirm action
            onCancel={cancelConfirmation}
            confirmText={confirmationState.actionType === 'removePhoto' ? "Remove" : "Confirm"} // Customize confirm text
            confirmButtonClass={confirmationState.actionType === 'removePhoto' ? 'danger' : ''} // Optional: Pass class for styling confirm button
        />

    </div> // End profile-container
  );
};

export default Profile;