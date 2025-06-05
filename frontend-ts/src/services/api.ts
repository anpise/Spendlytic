import axios from 'axios';

const API = axios.create({ baseURL: `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api` });

// Request interceptor
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Handle token expiration
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface Bill {
  id: string;
  merchant_name: string;
  date: string;
  total_amount: number;
}

interface BillItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export const loginUser = (data: LoginData) => API.post('/login', data);
export const registerUser = (data: RegisterData) => API.post('/register', data);
export const uploadReceipt = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/upload', formData);
};
export const fetchBills = () => API.get<{ bills: Bill[] }>('/bills');
export const fetchBillItems = (billId: string) => API.get<{ items: BillItem[] }>(`/bills/${billId}/items`);

export default API; 