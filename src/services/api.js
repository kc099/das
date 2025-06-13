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
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token first
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && !error.config._retry) {
        try {
          error.config._retry = true;
          const refreshResponse = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
            refresh: refreshToken
          });
          
          if (refreshResponse.data.access) {
            localStorage.setItem('access_token', refreshResponse.data.access);
            // Retry the original request with new token
            error.config.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
            return api.request(error.config);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          // Only redirect if we're not already on login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } else {
        // No refresh token or refresh already failed, clear and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        // Only redirect if we're not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
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

// Flow API endpoints
export const flowAPI = {
  // Get all flows for the authenticated user
  getFlows: () => api.get('/api/flows/'),
  
  // Get a specific flow by ID
  getFlow: (id) => api.get(`/api/flows/${id}/`),
  
  // Create a new flow
  createFlow: (flowData) => api.post('/api/flows/', flowData),
  
  // Update an existing flow
  updateFlow: (id, flowData) => api.put(`/api/flows/${id}/`, flowData),
  
  // Delete a flow
  deleteFlow: (id) => api.delete(`/api/flows/${id}/`),
  
  // Execute a flow
  executeFlow: (id) => api.post(`/api/flows/${id}/execute/`),
  
  // Duplicate a flow
  duplicateFlow: (id) => api.post(`/api/flows/${id}/duplicate/`),
  
  // Get flow templates
  getTemplates: () => api.get('/api/flows/templates/'),
};

export default api;