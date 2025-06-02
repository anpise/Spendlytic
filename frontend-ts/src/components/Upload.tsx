import React, { useRef, useState } from 'react';

const Upload: React.FC = () => {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleUpload = () => {
    if (!fileInput.current?.files?.[0]) {
      setStatus('Please select a file to upload.');
      return;
    }
    // Simulate upload
    setStatus('Uploading...');
    setTimeout(() => {
      setStatus('Upload successful!');
    }, 1500);
  };

  return (
    <div style={{ padding: '2.5rem 1rem', maxWidth: 500, margin: '80px auto 0 auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(102, 126, 234, 0.08)' }}>
      <h1 style={{ color: '#764ba2', fontWeight: 700, fontSize: '2rem', marginBottom: '2rem' }}>
        Upload a Bill or Receipt
      </h1>
      <input
        type="file"
        ref={fileInput}
        onChange={handleFileChange}
        style={{ marginBottom: '1.2rem', fontSize: '1rem' }}
      />
      <div style={{ marginBottom: '1.2rem', color: '#764ba2', fontWeight: 500 }}>{fileName}</div>
      <button
        onClick={handleUpload}
        style={{ background: 'linear-gradient(90deg, #764ba2 0%, #667eea 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 2rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', marginBottom: '1.2rem' }}
      >
        Upload
      </button>
      <div style={{ color: status === 'Upload successful!' ? '#43e97b' : '#a78bfa', fontWeight: 500 }}>{status}</div>
    </div>
  );
};

export default Upload; 