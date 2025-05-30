import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadReceipt } from '../services/api';

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      await uploadReceipt(file);
      navigate('/dashboard');
    } catch (err) {
      setError('Upload failed');
    }
  };

  return (
    <div className="container">
      <h2>Upload Receipt</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={e => setFile(e.target.files?.[0] || null)}
          required
        />
        <button type="submit">Upload</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export default Upload; 