import { useState } from 'react';
import { uploadFile, getProtected } from '../services/api';

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [protectedMsg, setProtectedMsg] = useState('');

  const handleUpload = async () => {
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
      setProtectedMsg(res.data.message + ' (User: ' + res.data.user.username + ')');
    } catch (err) {
      alert(err.response?.data?.message || 'Protected route error');
    }
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
      <button onClick={checkProtected}>Check Protected</button>
      <p>{protectedMsg}</p>
    </div>
  );
}
