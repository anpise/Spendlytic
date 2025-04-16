import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await login(form);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard'); // ✅ redirect on success
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
<div className="flex justify-center">
  <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-4">
    <h2 className="text-2xl font-semibold text-indigo-600 text-center">Login to Spendlytic</h2>

    <input
      type="text"
      name="username"
      placeholder="Username"
      value={form.username}
      onChange={handleChange}
      className="w-full px-4 py-2 border rounded-md"
      required
    />

    <input
      type="password"
      name="password"
      placeholder="Password"
      value={form.password}
      onChange={handleChange}
      className="w-full px-4 py-2 border rounded-md"
      required
    />

    <button type="submit" className="bg-indigo-600 text-white w-full py-2 rounded-md hover:bg-indigo-700">
      Login
    </button>

    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
  </form>
</div>

  );
}
