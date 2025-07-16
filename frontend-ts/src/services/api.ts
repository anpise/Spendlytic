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
      // Only redirect if token exists (user is logged in)
      if (error.response.status === 401 && localStorage.getItem('token')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
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

interface BillItem {
  id: number;
  description: string;
  price: string;
  quantity: number;
  category?: string;
}

interface Bill {
  id: number;
  merchant_name: string;
  total_amount: string;
  date: string;
  created_at: string;
  items: BillItem[];
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
export const getGoogleLoginUrl = () => `${API.defaults.baseURL}/auth/google/login`;

export default API; 