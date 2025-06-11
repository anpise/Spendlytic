import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isTokenExpired } from '../services/tokenManager';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // If no token, redirect to home
        if (!token) {
          setIsValid(false);
          setIsLoading(false);
          return;
        }

        // If token is expired, remove it and redirect to home
        if (isTokenExpired(token)) {
          localStorage.removeItem('token');
          setIsValid(false);
          setIsLoading(false);
          return;
        }

        setIsValid(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Token validation error:', error);
        setIsValid(false);
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  if (isLoading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return isValid ? <>{children}</> : <Navigate to="/login" replace />;
};

export default PrivateRoute; 