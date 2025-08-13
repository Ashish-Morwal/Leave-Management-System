import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const PrivateRoute = ({ children, requiredRole = null }) => {
  const { state } = useAppContext();
  const location = useLocation();

  // Check if user is authenticated
  if (!state.token) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if role is required and user has it
  if (requiredRole && state.role !== requiredRole) {
    // Redirect to unauthorized page or dashboard
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and has required role (if any)
  return children;
};

export default PrivateRoute;


