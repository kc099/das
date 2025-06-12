import axios from 'axios';

// Configure base URL for Django backend
const API_BASE_URL = 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  // Get RSA public key for encryption
  getPublicKey: () => api.get('/api/public-key/'),
  
  // Login with email and password
  login: (credentials) => api.post('/api/login/', credentials),
  
  // Register new user
  signup: (userData) => api.post('/api/signup/', userData),
  
  // Logout user
  logout: (refreshToken) => api.post('/api/logout/', { refresh: refreshToken }),
  
  // Get user profile
  getProfile: () => api.get('/api/profile/'),
};

export default api;