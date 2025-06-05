import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import { uploadReceipt } from '../services/api';

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
    try {
      const res = await uploadReceipt(fileInput.current.files[0]);
      setStatus('Upload successful!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err: any) {
      let msg = 'Upload failed. Please try again.';
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setStatus(msg);
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
      color: '#bfdbfe',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: "'Inter', 'Montserrat', Arial, sans-serif"
    }}>
      <h2 style={{ 
        color: '#bfdbfe', 
        fontWeight: 700, 
        fontSize: '2rem', 
        marginBottom: '2.2rem',
        textAlign: 'center',
        letterSpacing: '0.01em',
      }}>
        Upload a Bill or Receipt
      </h2>
      <label htmlFor="file-upload" style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        background: 'rgba(59,130,246,0.10)',
        border: '2px solid #60a5fa',
        borderRadius: 10,
        padding: '0.7rem 1rem',
        marginBottom: '1.5rem',
        cursor: 'pointer',
        transition: 'border 0.2s',
        boxShadow: '0 2px 8px rgba(59,130,246,0.08)'
      }}>
        <span style={{
          background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
          color: '#fff',
          fontWeight: 700,
          borderRadius: 6,
          padding: '0.5rem 1.2rem',
          fontSize: '1rem',
          marginRight: '1rem',
          boxShadow: '0 1px 4px rgba(59,130,246,0.10)'
        }}>Choose File</span>
        <input
          id="file-upload"
          type="file"
          ref={fileInput}
          onChange={handleFileChange}
          className="upload-file-input"
          style={{ display: 'none' }}
        />
        <span style={{ color: '#bfdbfe', fontSize: '1.08rem', fontWeight: 500, wordBreak: 'break-all' }}>{fileName || 'No file selected'}</span>
      </label>
      {fileName && (
        <div className="upload-file-name" style={{ color: '#bfdbfe', fontWeight: 600, fontSize: '1.08rem', marginBottom: '1.2rem', letterSpacing: '0.01em', textAlign: 'left', width: '100%' }}>
          Selected file: <span style={{ color: '#bfdbfe', fontWeight: 700 }}>{fileName}</span>
        </div>
      )}
      <button
        className="auth-button"
        onClick={handleUpload}
        style={{
          width: '100%',
          marginBottom: '1.2rem',
          color: '#fff',
          background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
          fontWeight: 700,
          fontSize: '1.13rem',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(59,130,246,0.10)',
          padding: '0.9rem 0',
          letterSpacing: '0.01em',
          transition: 'background 0.2s, color 0.2s',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          opacity: isUploading ? 0.7 : 1
        }}
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
        <div className={`upload-status${isSuccess ? ' success' : ''}${isError ? ' error' : ''}`} style={{ color: '#bfdbfe', fontWeight: 600, fontSize: '1.08rem', marginTop: '0.7rem' }}>{status}</div>
      )}
    </div>
  );
};

export default Upload; 