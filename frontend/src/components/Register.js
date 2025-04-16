import { useState } from 'react';
import { register } from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await register(form);
      localStorage.setItem('token', res.data.token);
      alert('Registered successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <input name="username" onChange={handleChange} placeholder="Username" required />
      <input name="email" onChange={handleChange} placeholder="Email" required />
      <input name="password" onChange={handleChange} type="password" placeholder="Password" required />
      <button type="submit">Register</button>
    </form>
  );
}
