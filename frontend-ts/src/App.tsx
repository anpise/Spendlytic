import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Upload from './components/Upload';
import PrivateRoute from './components/PrivateRoute';
import Home from './components/Home';
import Navbar from './components/Navbar';
import Maintenance from './components/Maintenance';
import { checkBackendHealth } from './services/healthCheck';
import './App.css';

const isLoggedIn = () => !!localStorage.getItem('token');

const App: React.FC = () => {
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      const isHealthy = await checkBackendHealth();
      setIsBackendHealthy(isHealthy);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 20000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (isBackendHealthy === null) {
    return <Maintenance />; // Show maintenance page while checking initial health
  }

  if (!isBackendHealthy) {
    return <Maintenance />; // Show maintenance page if backend is down
  }

  return (
    <div className="app-bg">
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={isLoggedIn() ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={isLoggedIn() ? <Navigate to="/dashboard" /> : <Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <PrivateRoute>
                <Upload />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App; 