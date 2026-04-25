import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ROLE_HOME: Record<string, string> = {
  patient: '/dashboard',
  doctor: '/doctor/dashboard',
  admin: '/admin/dashboard',
};

const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Spinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
