import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthModal from './AuthModal';
import './Auth.css';
import { registerUser } from '../services/api';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await registerUser(form);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setShowLoader(true);
        setTimeout(() => {
          setShowLoader(false);
          navigate('/login');
        }, 1200);
      }, 1800);
    } catch (err: any) {
      let msg = 'Registration failed';
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    }
  };

  return (
    <AuthModal>
      {showToast && <div className="toast">Registered successfully!</div>}
      {showLoader && (
        <div className="loader">
          <div className="loader-spinner"></div>
        </div>
      )}
      {!showLoader && <>
        <h2 className="auth-title">Create Account</h2>
        <form className="auth-form" onSubmit={handleSubmit} style={{ width: '100%' }} autoComplete="off">
          <input
            className="auth-input"
            name="username"
            onChange={e => setForm({ ...form, username: e.target.value })}
            placeholder="Username"
            required
            autoComplete="off"
          />
          <input
            className="auth-input"
            name="email"
            type="email"
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            required
            autoComplete="off"
          />
          <input
            className="auth-input"
            name="password"
            type="password"
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="Password"
            required
            autoComplete="new-password"
            inputMode="text"
          />
          <button className="auth-button" type="submit">Sign Up</button>
          {error && <p className="auth-error">{error}</p>}
        </form>
        <div className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </>}
    </AuthModal>
  );
};

export default Register; 