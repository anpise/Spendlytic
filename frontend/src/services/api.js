import axios from 'axios';

const API = axios.create({ baseURL: `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api` });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const loginUser = (data) => API.post('/login', data);
export const registerUser = (data) => API.post('/register', data);
export const uploadReceipt = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/upload', formData);
};
export const fetchBills = () => API.get('/bills');
export const fetchBillItems = (billId) => API.get(`/bills/${billId}/items`);
