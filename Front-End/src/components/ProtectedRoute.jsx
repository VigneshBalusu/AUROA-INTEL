// Create a new file: src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ isLoggedIn, children }) => {
  const location = useLocation();

  if (!isLoggedIn) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to in case you want to redirect them back after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children; // If logged in, render the child component (e.g., Home, Profile)
};

export default ProtectedRoute;