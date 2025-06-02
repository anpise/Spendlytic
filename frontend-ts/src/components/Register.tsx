import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthModal from './AuthModal';
import './Auth.css';
import { registerUser } from '../services/api';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerUser(form);
      alert('Registered successfully!');
      navigate('/login');
    } catch (err) {
      setError('Registration failed');
    }
  };

  return (
    <AuthModal>
      <h2 className="auth-title">Create Account</h2>
      <form className="auth-form" onSubmit={handleSubmit} style={{ width: '100%' }}>
        <input
          className="auth-input"
          name="username"
          onChange={e => setForm({ ...form, username: e.target.value })}
          placeholder="Username"
          required
        />
        <input
          className="auth-input"
          name="email"
          type="email"
          onChange={e => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          required
        />
        <input
          className="auth-input"
          name="password"
          type="password"
          onChange={e => setForm({ ...form, password: e.target.value })}
          placeholder="Password"
          required
        />
        <button className="auth-button" type="submit">Sign Up</button>
        {error && <p className="auth-error">{error}</p>}
      </form>
      <div className="auth-link">
        Already have an account? <Link to="/login">Sign in</Link>
      </div>
    </AuthModal>
  );
};

export default Register; 