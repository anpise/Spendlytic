import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthModal from './AuthModal';
import './Auth.css';
import { loginUser } from '../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await loginUser(form);
      localStorage.setItem('token', res.data.token);
      navigate('/upload');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <AuthModal>
      <h2 className="auth-title">Sign In</h2>
      <form className="auth-form" onSubmit={handleSubmit} style={{ width: '100%' }}>
        <input
          className="auth-input"
          name="username"
          onChange={e => setForm({ ...form, username: e.target.value })}
          placeholder="Username or Email"
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
        <button className="auth-button" type="submit">Sign In</button>
        {error && <p className="auth-error">{error}</p>}
      </form>
      <div className="auth-link">
        Don't have an account? <Link to="/register">Sign up</Link>
      </div>
    </AuthModal>
  );
};

export default Login; 