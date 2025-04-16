import { useEffect, useState } from 'react';
import { getProtected, uploadFile } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [protectedMsg, setProtectedMsg] = useState('');
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) return;
    try {
      const res = await uploadFile(file);
      alert('File uploaded: ' + res.data.filename);
    } catch (err) {
      alert(err.response?.data?.message || 'Upload error');
    }
  };

  const checkProtected = async () => {
    try {
      const res = await getProtected();
      setProtectedMsg('User: ' + res.data.user.username);
    } catch (err) {
      alert(err.response?.data?.message || 'Protected route error');
      navigate('/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <h2>Spendlytic Dashboard</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload Receipt</button>
      <button onClick={checkProtected}>Check Protected</button>
      <button onClick={handleLogout}>Logout</button>
      <p>{protectedMsg}</p>
    </div>
  );
}
