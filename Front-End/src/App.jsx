// App.jsx (Full Code - Delegating Routing to Navigation)
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom"; // useNavigate not needed here
import Entry from "./components/Entry";
import Navigation from "./components/Navigation"; // Navigation contains the main app routes
import Animation from "./components/Animation";

// No need to import specific page components here (Login, Home, etc.)
// as Navigation is responsible for rendering them based on the path.

function App() {
  // State for the entry animation
  const [showAnimation, setShowAnimation] = useState(false);

  // ★ Centralized Login State ★
  // Initialize state from localStorage to persist login status across refreshes
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("token"));

  // Effect to sync login state across tabs/windows via localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      console.log("App.jsx: Storage event detected, updating login state.");
      // Update state based on the current presence of the token
      setIsLoggedIn(!!localStorage.getItem("token"));
    };

    // Listen for storage changes in other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Optional: Initial check in case the token changed before this component mounted
    // handleStorageChange(); // Can sometimes cause double-renders, useState initializer is often sufficient

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array ensures this runs only once on mount/unmount


  return (
    <BrowserRouter>
      {/* Conditionally render the entry animation */}
      {showAnimation && (
        <Animation onAnimationEnd={() => setShowAnimation(false)} />
      )}

      {/* Main Router Setup */}
      <Routes>
        {/* Route 1: The Entry/Landing Page */}
        {/* Displayed only at the root path "/" */}
        <Route
          path="/"
          element={<Entry onNavigate={() => setShowAnimation(true)} />} // Trigger animation on navigation away from Entry
        />

        {/* Route 2: All Other Application Paths */}
        {/* The "/*" path catches every route EXCEPT the exact root "/" */}
        {/* It renders the Navigation component, which contains its own <Routes> */}
        {/* to handle nested paths like /home, /login, /profile, /forgot-password etc. */}
        <Route
          path="/*" // Matches any path that isn't just "/"
          element={
            // Pass the central login state and the function to update it down to Navigation
            <Navigation
              isLoggedIn={isLoggedIn}
              setIsLoggedIn={setIsLoggedIn} // Pass the setter function
            />
           }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;