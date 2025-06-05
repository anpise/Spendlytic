import React from 'react';

const AnalyticsIcon = () => (
  <svg width="48" height="48" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="20" width="4" height="11" rx="2" fill="#60a5fa"/>
    <rect x="14" y="13" width="4" height="18" rx="2" fill="#3b82f6"/>
    <rect x="23" y="7" width="4" height="24" rx="2" fill="#2563eb"/>
    <rect x="32" y="2" width="4" height="29" rx="2" fill="#1e40af"/>
  </svg>
);

const Logo: React.FC = () => {
  return (
    <div className="logo-container">
      <AnalyticsIcon />
      <span className="logo-text">Spendlytic</span>
    </div>
  );
};

export default Logo; 