import axios from 'axios';

// Use Vite dev proxy in development. Backend is proxied at '/api'.
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/register', userData),
  login: (credentials) => api.post('/login', credentials),
};

// Plantation Request API
export const plantationAPI = {
  uploadRequest: (formData) => api.post('/upload-request', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

// Marketplace API
export const marketplaceAPI = {
  getCredits: () => api.get('/marketplace'),
  buyCredits: (data) => api.post('/buy-credits', data),
};

// Explorer API
export const explorerAPI = {
  getTransactions: () => api.get('/explorer'),
};

// CO2 Decline Profile API
export const co2API = {
  getDeclineProfile: () => api.get('/co2-decline-profile'),
};

// User API
export const userAPI = {
  getUserCredits: (userId) => api.get(`/user/${userId}/credits`),
};

// Invoice API
export const invoiceAPI = {
  getInvoice: (requestId) => api.get(`/invoice/${requestId}`, {
    responseType: 'blob',
  }),
};

export default api;




