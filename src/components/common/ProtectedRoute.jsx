import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="w-10 h-10 border-4 border-[#C1123F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Strict role check: user must match allowedRoles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's authorized role dashboard
    if (user.role === 'donor') return <Navigate to="/donor/dashboard" replace />;
    if (user.role === 'recipient') return <Navigate to="/recipient/dashboard" replace />;
    if (user.role === 'hospital') return <Navigate to="/hospital/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
