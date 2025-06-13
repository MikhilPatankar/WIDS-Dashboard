
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
  children: JSX.Element;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { currentUser, isLoading } = useAuth(); // isLoading from AuthContext handles initial auth check
  const location = useLocation();

  if (isLoading) {
     return <div className="min-h-screen flex items-center justify-center bg-primary-dark text-text-primary text-xl">Verifying permissions...</div>;
  }

  // User must be logged in AND be an admin
  if (!currentUser || !currentUser.is_admin) {
    // If not admin (or not logged in), redirect to a general page (e.g., overview) or an access denied page.
    // Store the attempted location if you want to handle it post-login/permission grant.
    // For simplicity, redirecting to overview. A dedicated 'Access Denied' page would be better.
    alert("Access Denied: You do not have permission to view this page.");
    return <Navigate to="/overview" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminRoute;
