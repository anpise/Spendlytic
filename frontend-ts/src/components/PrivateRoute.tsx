import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isTokenExpired } from '../services/tokenManager';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // If no token, redirect to home
    if (!token) {
      setIsValid(false);
      return;
    }

    // If token is expired, remove it and redirect to home
    if (isTokenExpired(token)) {
      localStorage.removeItem('token');
      setIsValid(false);
      return;
    }

    setIsValid(true);
  }, []);

  if (isValid === null) {
    return null; // Still checking token validity
  }

  return isValid ? <>{children}</> : <Navigate to="/login" replace />;
};

export default PrivateRoute; 