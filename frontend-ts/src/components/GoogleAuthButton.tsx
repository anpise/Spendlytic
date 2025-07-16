import React from 'react';
import Google3DIcon from './Google3DIcon';
import { getGoogleLoginUrl } from '../services/api';

interface GoogleAuthButtonProps {
  label: string;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ label }) => (
  <button
    type="button"
    className="auth-button google-login"
    style={{
      background: '#4285F4',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    onClick={() => window.location.href = getGoogleLoginUrl()}
  >
    <Google3DIcon /> {label}
  </button>
);

export default GoogleAuthButton; 