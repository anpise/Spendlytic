import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthModal from './AuthModal';
import './Auth.css';
import { loginUser } from '../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

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
          navigate('/upload');
        }, 1200);
      }, 1800);
    } catch (err) {
      setError('Invalid credentials');
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