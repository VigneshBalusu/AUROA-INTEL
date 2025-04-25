// src/components/ResetPassword.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/AuthForms.css'; // Ensure this shared CSS file is imported

// API Base URL (Defined Directly - Consistent)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"; // Replace if needed

const ResetPassword = () => {
  const { token } = useParams(); // Get token from URL parameter
  const navigate = useNavigate();

  // --- State ---
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '', show: false, timerId: null });
  const [isTokenInvalid, setIsTokenInvalid] = useState(false); // Track if token is known to be bad

  // --- Feedback Helper ---
  const showTemporaryFeedback = useCallback((type, message, duration = 4000) => {
      if (feedback.timerId) clearTimeout(feedback.timerId);
      const newTimerId = setTimeout(() => setFeedback(prev => (prev.message === message ? { type: '', message: '', show: false, timerId: null } : prev)), duration);
      setFeedback({ type, message, show: true, timerId: newTimerId });
  }, [feedback.timerId]);

  // --- Effect to check token presence on mount ---
  useEffect(() => {
      if (!token) {
           console.error("ResetPassword: No token found in URL parameter.");
           setIsTokenInvalid(true);
           showTemporaryFeedback('failure', 'Invalid password reset link: No token provided.', 10000);
      }
  }, [token, showTemporaryFeedback]); // Dependencies


  // --- Form Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '', show: false, timerId: null }); // Clear feedback

    if (!token) { showTemporaryFeedback('failure', 'Invalid or missing reset token.'); return; }
    if (!password || !confirmPassword) { showTemporaryFeedback('failure', 'Please enter and confirm your new password.'); return; }
    if (password.length < 6) { showTemporaryFeedback('failure', 'Password must be at least 6 characters long.'); return; }
    if (password !== confirmPassword) { showTemporaryFeedback('failure', 'Passwords do not match.'); return; }

    setIsLoading(true);
    try {
      console.log(`Attempting password reset with token prefix: ${token.substring(0, 8)}...`);
      const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password/${token}`, {
        password,
        confirmPassword,
      }, { timeout: 15000 });

      // --- Success ---
      console.log("Password reset successful:", response.data);
      showTemporaryFeedback('success', response.data.message || '✅ Password reset successfully!', 5000);
      setIsTokenInvalid(true); // Mark token as used/invalid after success
      setTimeout(() => navigate('/login'), 2500); // Redirect to login

    } catch (error) {
      console.error('Reset Password Error:', error);
      let errorMsg = 'Failed to reset password.';
      if (error.response) {
          console.error('Server Error:', { status: error.response.status, data: error.response.data });
          errorMsg = error.response.data?.error || `Error (${error.response.status})`;
          // Specifically check if backend indicates token invalid/expired
          if (error.response.status === 400 && (errorMsg.toLowerCase().includes('token') || errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('expired'))) {
                errorMsg = 'This reset link is invalid or has expired. Please request a new one.';
                setIsTokenInvalid(true); // Mark token as bad
          }
      } else if (error.request) { errorMsg = "Network Error: Could not reach server."; }
        else if (error.code === 'ECONNABORTED') { errorMsg = "Request timed out."; }
      showTemporaryFeedback('failure', errorMsg, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Logic ---
  return (
    <div className="auth-container">

      {/* Feedback Card */}
      <div className={`feedback-card ${feedback.type} ${feedback.show ? 'show' : ''}`}>
        {feedback.message}
      </div>

      <form className="auth-form reset-password-form" onSubmit={handleSubmit}>
        <h2 className='form-title'>Reset Password</h2>

        {/* Show error message if token is known to be invalid */}
        {isTokenInvalid && !feedback.show && (
            <p className="form-description error-text">
                This password reset link is invalid or has expired. Please request a new link.
            </p>
        )}

        {/* Render form only if token isn't known to be invalid */}
        {!isTokenInvalid && (
          <>
            <p className="form-description">Enter and confirm your new password below.</p>
            {/* New Password */}
            <div className="form-group">
                <label htmlFor="reset-password">New Password</label>
                <div className="password-container">
                    <input id="reset-password" type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" disabled={isLoading}/>
                    <button type="button" className="toggle-btn" onClick={() => setShowPassword(s => !s)} disabled={isLoading} title={showPassword ? 'Hide' : 'Show'}> {showPassword ? '👁️‍🗨️' : '👁️'} </button>
                </div>
            </div>
            {/* Confirm New Password */}
            <div className="form-group">
                <label htmlFor="reset-confirmPassword">Confirm New Password</label>
                <div className="password-container">
                    <input id="reset-confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" disabled={isLoading}/>
                    <button type="button" className="toggle-btn" onClick={() => setShowConfirmPassword(s => !s)} disabled={isLoading} title={showConfirmPassword ? 'Hide' : 'Show'}> {showConfirmPassword ? '👁️‍🗨️' : '👁️'} </button>
                </div>
            </div>
            {/* Submit Button */}
            <button type="submit" className="submit-btn" disabled={isLoading || !token}> {/* Disable if no token */}
                {isLoading ? 'Resetting...' : 'Set New Password'}
            </button>
          </>
        )}

        {/* Navigation Links */}
        <p className="redirect-text">
          {isTokenInvalid ? (
             <>Need help? <Link to="/forgot-password" className="link">Request New Reset Link</Link></>
          ) : (
             <>Remembered your password? <Link to="/login" className="link">Back to Login</Link></>
          )}
        </p>
      </form>
    </div>
  );
};

export default ResetPassword;