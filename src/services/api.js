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
  
  // Organization endpoints
  get: (endpoint) => api.get(`/api${endpoint}`),
  post: (endpoint, data) => api.post(`/api${endpoint}`, data),
  put: (endpoint, data) => api.put(`/api${endpoint}`, data),
  delete: (endpoint) => api.delete(`/api${endpoint}`),
};

// Organization API endpoints
export const organizationAPI = {
  // Get all organizations for the authenticated user
  getOrganizations: () => api.get('/api/organizations/'),
  
  // Get a specific organization by ID
  getOrganization: (id) => api.get(`/api/organizations/${id}/`),
  
  // Create a new organization
  createOrganization: (orgData) => api.post('/api/organizations/', orgData),
  
  // Update an existing organization
  updateOrganization: (id, orgData) => api.put(`/api/organizations/${id}/`, orgData),
  
  // Delete an organization
  deleteOrganization: (id) => api.delete(`/api/organizations/${id}/`),
};

// Dashboard Template API endpoints
export const dashboardAPI = {
  // Get all dashboard templates for the authenticated user
  getTemplates: () => api.get('/api/dashboard-templates/'),
  
  // Get a specific template by UUID
  getTemplate: (uuid) => api.get(`/api/dashboard-templates/${uuid}/`),
  
  // Create a new dashboard template
  createTemplate: (templateData) => api.post('/api/dashboard-templates/', templateData),
  
  // Update an existing template
  updateTemplate: (uuid, templateData) => api.put(`/api/dashboard-templates/${uuid}/`, templateData),
  
  // Delete a template
  deleteTemplate: (uuid) => api.delete(`/api/dashboard-templates/${uuid}/`),
};

// Flow API endpoints
export const flowAPI = {
  // Get all flows for the authenticated user
  getFlows: () => api.get('/api/flows/'),
  
  // Get a specific flow by UUID
  getFlow: (uuid) => api.get(`/api/flows/${uuid}/`),
  
  // Create a new flow
  createFlow: (flowData) => api.post('/api/flows/', flowData),
  
  // Update an existing flow
  updateFlow: (uuid, flowData) => api.put(`/api/flows/${uuid}/`, flowData),
  
  // Delete a flow
  deleteFlow: (uuid) => api.delete(`/api/flows/${uuid}/`),
  
  // Execute a flow
  executeFlow: (uuid) => api.post(`/api/flows/${uuid}/execute/`),
  
  // Duplicate a flow
  duplicateFlow: (uuid) => api.post(`/api/flows/${uuid}/duplicate/`),
  
  // Get flow templates
  getTemplates: () => api.get('/api/flows/templates/'),
};

export default api;