import axios from 'axios';

const API_BASE_URL = 'http://10.0.3.193:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Plantation Request API
export const plantationAPI = {
  uploadRequest: (formData) => api.post('/upload-request', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
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
