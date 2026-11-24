import axios from 'axios';

// Ready for Node.js + Express backend integration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('lifora_token') ||
      localStorage.getItem('lifora_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token =
        localStorage.getItem('lifora_token') ||
        localStorage.getItem('lifora_auth_token');
      if (token && !token.startsWith('jwt_demo_') && !token.startsWith('jwt_mock_')) {
        localStorage.removeItem('lifora_token');
        localStorage.removeItem('lifora_auth_token');
        localStorage.removeItem('lifora_current_user');
      }
    }
    return Promise.reject(error);
  }
);

// Simulated delay helper for realistic UX in mock mode
export const simulatedDelay = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export default api;
