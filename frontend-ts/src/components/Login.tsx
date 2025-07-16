import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthModal from './AuthModal';
import './Auth.css';
import { loginUser, fetchBills, getGoogleLoginUrl } from '../services/api';
import Google3DIcon from './Google3DIcon';
import GoogleAuthButton from './GoogleAuthButton';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  // Capture token from URL and store in localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await loginUser(form);
      localStorage.setItem('token', res.data.token);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setShowLoader(true);
        setTimeout(() => {
          setShowLoader(false);
          navigate('/dashboard');
        }, 1200);
      }, 1800);
    } catch (err: any) {
      let msg = 'Invalid credentials';
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    }
  };

  return (
    <AuthModal>
      {showToast && <div className="toast">Login successful!</div>}
      {showLoader && (
        <div className="loader">
          <div className="loader-spinner"></div>
        </div>
      )}
      {!showLoader && <>
        <h2 className="auth-title">Sign In</h2>
        <form className="auth-form" onSubmit={handleSubmit} style={{ width: '100%' }}>
          <input
            className={`auth-input${error ? ' error' : ''}`}
            name="username"
            onChange={e => setForm({ ...form, username: e.target.value })}
            placeholder="Username or Email"
            required
          />
          <input
            className={`auth-input${error ? ' error' : ''}`}
            name="password"
            type="password"
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="Password"
            required
          />
          <button className="auth-button" type="submit">Sign In</button>
          <div style={{ marginTop: '0.2rem' }}>
            <GoogleAuthButton label="Sign in with Google" />
          </div>
          {error && <div className="auth-error">{error}</div>}
        </form>
        <div className="auth-link">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </>}
    </AuthModal>
  );
};

export default Login; 