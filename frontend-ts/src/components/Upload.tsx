import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Upload: React.FC = () => {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleUpload = async () => {
    if (!fileInput.current?.files?.[0]) {
      setStatus('Please select a file to upload.');
      return;
    }
    setIsUploading(true);
    setStatus('Uploading...');
    const formData = new FormData();
    formData.append('file', fileInput.current.files[0]);
    try {
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData,
      });
      if (res.ok) {
        setStatus('Upload successful!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      } else {
        const data = await res.json();
        setStatus(data.message || 'Upload failed');
      }
    } catch (err) {
      setStatus('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const isSuccess = status === 'Upload successful!';
  const isError = status && !isSuccess && status !== 'Uploading...';

  return (
    <div style={{
      padding: '2.5rem 1rem',
      maxWidth: 420,
      margin: '100px auto 0 auto',
      background: 'rgba(30,58,138,0.10)',
      borderRadius: 20,
      boxShadow: '0 8px 32px rgba(30, 58, 138, 0.18)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <h2 className="auth-title" style={{ color: '#e0e7ef', marginBottom: '2rem' }}>
        Upload a Bill or Receipt
      </h2>
      <label htmlFor="file-upload" className="upload-file-label">
        <input
          id="file-upload"
          type="file"
          ref={fileInput}
          onChange={handleFileChange}
          className="upload-file-input"
        />
      </label>
      {fileName && <div className="upload-file-name">{fileName}</div>}
      <button
        className="auth-button"
        onClick={handleUpload}
        style={{ width: '100%', marginBottom: '1.2rem' }}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
      {isUploading && (
        <div className="loader">
          <div className="loader-spinner"></div>
        </div>
      )}
      {status && !isUploading && (
        <div className={`upload-status${isSuccess ? ' success' : ''}${isError ? ' error' : ''}`}>{status}</div>
      )}
    </div>
  );
};

export default Upload; 