import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5050/api', // adjust if needed
});

// Attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const register = (data) => API.post('/register', data);
export const login = (data) => API.post('/login', data);
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/upload', formData);
};
export const getProtected = () => API.get('/protected');
