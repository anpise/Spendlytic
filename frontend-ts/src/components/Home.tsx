import React from 'react';
import { Link } from 'react-router-dom';
import AuthModal from './AuthModal';

const Home: React.FC = () => {
  return (
    <AuthModal>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.4rem' }}>
        Welcome! How would you like to get started?
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        <Link to="/login" className="auth-button" style={{ width: '100%', textAlign: 'center', fontSize: '1.1rem' }}>
          Login
        </Link>
        <Link to="/register" className="auth-button" style={{ width: '100%', textAlign: 'center', fontSize: '1.1rem', background: '#a78bfa' }}>
          Sign Up
        </Link>
      </div>
      <p style={{ marginTop: '2rem', textAlign: 'center', color: '#f3e8ff', fontSize: '1rem', opacity: 0.85 }}>
        Track your expenses, analyze your spending, and take control of your finances with AI-powered insights.
      </p>
    </AuthModal>
  );
};

export default Home; 