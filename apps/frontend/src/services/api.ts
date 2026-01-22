import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
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
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    // Handle specific HTTP errors
    switch (error.response.status) {
      case 401:
        // Handle unauthorized - only redirect if not already on login
        if (window.location.pathname !== '/login') {
          localStorage.removeItem('token');
          // Don't redirect if we don't have auth set up yet
          // window.location.href = '/login';
        }
        break;
      case 404:
        console.error('Resource not found:', error.config?.url);
        break;
      case 429:
        console.error('Rate limited. Please slow down.');
        break;
      case 500:
        console.error('Server error:', error.message);
        break;
    }

    return Promise.reject(error);
  }
);

export default api;
