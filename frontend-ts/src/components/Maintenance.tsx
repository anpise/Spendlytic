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
        Please try again in a few minutes. We're working to get everything back up and running.
      </p>
    </div>
  );
};

export default Maintenance; 