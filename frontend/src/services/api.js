import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5050/api',
});

API.interceptors.request.use(req => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const register = (data) => API.post('/register', data);
export const login = (data) => API.post('/login', data);
export const getProtected = () => API.get('/protected');
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/upload', formData);
};