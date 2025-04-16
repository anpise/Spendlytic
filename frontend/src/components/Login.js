import { useState } from 'react';
import { login } from '../services/api';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await login(form);
      localStorage.setItem('token', res.data.token);
      alert('Login successful!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input name="username" onChange={handleChange} placeholder="Username" required />
      <input name="password" onChange={handleChange} type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  );
}
