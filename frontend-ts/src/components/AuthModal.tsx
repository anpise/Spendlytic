import React from 'react';
import './AuthModal.css';

interface AuthModalProps {
  children: React.ReactNode;
  onClose?: () => void;
  showClose?: boolean;
}

const AnalyticsIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="20" width="4" height="11" rx="2" fill="#60a5fa"/>
    <rect x="14" y="13" width="4" height="18" rx="2" fill="#3b82f6"/>
    <rect x="23" y="7" width="4" height="24" rx="2" fill="#2563eb"/>
    <rect x="32" y="2" width="4" height="29" rx="2" fill="#1e40af"/>
  </svg>
);

const AuthModal: React.FC<AuthModalProps> = ({ children, onClose, showClose = false }) => {
  return (
    <div className="auth-modal-bg">
      <div className="auth-modal-card" style={{ background: 'rgba(30,58,138,0.10)' }}>
        <div className="auth-modal-header">
          <span className="auth-modal-logo"><AnalyticsIcon /></span>
          <span className="auth-modal-title">Spendlytic</span>
          {showClose && (
            <button className="auth-modal-close" onClick={onClose} aria-label="Close">&times;</button>
          )}
        </div>
        <div className="auth-modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 