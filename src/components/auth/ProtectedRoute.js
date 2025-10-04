import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render protected content
  return children;
};

// Higher-order component for admin-only routes
export const AdminRoute = ({ children }) => {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      {children}
    </ProtectedRoute>
  );
};

// Higher-order component for employee routes (ADMIN or EMPLOYEE)
export const EmployeeRoute = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <ProtectedRoute>
      {(user?.role === 'ADMIN' || user?.role === 'EMPLOYEE') ? (
        children
      ) : (
        <Navigate to="/unauthorized" replace />
      )}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;