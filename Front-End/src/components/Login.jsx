// src/components/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link for navigation
import "../assets/styles/Login.css"; // Import scoped CSS for Login page

// --- ★ API URL Defined Directly In File ★ ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"; // Replace if needed

// Component receives setIsLoggedIn function from parent (e.g., App.js)
const Login = ({ setIsLoggedIn }) => {
  // --- State ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '', show: false }); // Unified feedback

  const navigate = useNavigate();

  // --- Helper Functions ---
  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (feedback.show && feedback.type === 'failure') {
      setFeedback({ type: '', message: '', show: false });
    }
  };

  // Shows temporary feedback card
  const showTemporaryFeedback = (type, message, duration = 3000) => {
     if (feedback.timerId) clearTimeout(feedback.timerId);
     const newTimerId = setTimeout(() => setFeedback(prev => (prev.message === message ? { type: '', message: '', show: false, timerId: null } : prev)), duration);
     setFeedback({ type, message, show: true, timerId: newTimerId });
  };

  // --- Form Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showTemporaryFeedback('failure', "Please enter both email and password."); return;
    }
    setIsLoading(true);
    setFeedback({ type: '', message: '', show: false });

    try {
      const loginUrl = `${API_BASE_URL}/api/auth/login`;
      console.log('Attempting login to:', loginUrl);
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textResponse = await response.text();
        console.warn("Received non-JSON response:", { status: response.status, text: textResponse });
        data = { error: `Server Error (${response.status}). Please try again.` }; // Create basic error data
      }

      if (!response.ok) {
          let errorMessage = data?.error || `Login failed (Status: ${response.status})`;
          if (response.status === 401) errorMessage = data?.error || "Invalid email or password.";
          showTemporaryFeedback('failure', errorMessage);
          return;
      }

      if (!data?.token) {
        showTemporaryFeedback('failure', "Login failed: Authentication data missing."); return;
      }

      console.log("✅ Login successful, received token.");
      localStorage.setItem("token", data.token);
      if (data.user) {
        localStorage.setItem("userInfo", JSON.stringify({ name: data.user.name, email: data.user.email, photo: data.user.photo }));
      }
      setIsLoggedIn(true);
      showTemporaryFeedback('success', "Login Successful! Redirecting...");
      setTimeout(() => { navigate("/home"); }, 1500);

    } catch (error) {
      console.error('Login handleSubmit Error:', error);
      let errorMessage = "❌ An unexpected error occurred.";
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = "❌ Network error: Could not connect.";
      }
      showTemporaryFeedback('failure', errorMessage, 4000);
    } finally {
      setIsLoading(false);
    }
  }; // End handleSubmit

  // --- JSX Return ---
  return (
    <div className="login-container">

      {/* Unified Feedback Card */}
      <div className={`feedback-card ${feedback.type} ${feedback.show ? 'show' : ''}`}>
        {feedback.message}
        {feedback.type === 'failure' && feedback.message?.toLowerCase().includes("user not found") && (
          <> Please check email or <span className="link" onClick={() => !isLoading && navigate("/signup")}>Sign Up</span>.</>
        )}
      </div>

      {/* Login Form Card */}
      <div className="login-card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={handleInputChange(setEmail)} required autoComplete="email" disabled={isLoading}/>
            </div>

            {/* Password Input & Forgot Password Link */}
            <div className="form-group">
                <div className="label-row"> {/* ★ Flex container for label and link */}
                    <label htmlFor="login-password">Password</label>
                    {/* ★ ADDED: Forgot Password Link */}
                    <Link to="/forgot-password" className="link forgot-password-link" tabIndex={isLoading ? -1 : 0}>
                       Forgot Password?
                    </Link>
                </div>
                <div className="password-container">
                    <input id="login-password" type={showPassword ? "text" : "password"} placeholder="Enter password" value={password} onChange={handleInputChange(setPassword)} required autoComplete="current-password" disabled={isLoading}/>
                    <button type="button" className="toggle-btn" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} disabled={isLoading} title={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? '👁️‍🗨️' : '👁️'}
                    </button>
                </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btns" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
            </button>

            {/* Signup Link */}
            <p className="redirect-text">
                Don't have an account?{" "}
                <span className="link" onClick={() => !isLoading && navigate("/signup")} role="link" tabIndex={isLoading ? -1 : 0} onKeyDown={(e) => !isLoading && e.key === 'Enter' && navigate('/signup')}>
                    Sign Up Here
                </span>
            </p>
        </form>
      </div>
    </div>
  );
};

export default Login;