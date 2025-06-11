import React from 'react';
import Logo from './Logo';
import './Maintenance.css';

const Maintenance: React.FC = () => {
  return (
    <div className="maintenance-container">
      <Logo />
      <h1 className="maintenance-title">We're Currently Down</h1>
      <h2 className="maintenance-subtitle">Our servers are temporarily unavailable</h2>
      <div className="maintenance-spinner">
        <div className="spinner"></div>
      </div>
      <p className="maintenance-message">
        The service may take up to 30 seconds to start if it hasn't been used in a while. Thank you for your patience!
      </p>
    </div>
  );
};

export default Maintenance; 