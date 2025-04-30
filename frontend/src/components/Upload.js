import { useState } from 'react';
import { uploadReceipt } from '../services/api';

export default function Upload() {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) return alert('No file selected');
    try {
      const res = await uploadReceipt(file);
      alert('Uploaded and parsed receipt');
    } catch {
      alert('Upload failed');
    }
  };

  return (
    <div className="container">
      <h2>Upload Receipt</h2>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}