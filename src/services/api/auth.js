import { apiClient } from './client';

export const authAPI = {
  getPublicKey: () => apiClient.get('/api/public-key/'),
  login: (credentials) => apiClient.post('/api/login/', credentials),
  signup: (userData) => apiClient.post('/api/signup/', userData),
  logout: (refreshToken) => apiClient.post('/api/logout/', { refresh_token: refreshToken }),
  getProfile: () => apiClient.get('/api/profile/'),
  googleOAuth: (credential) => apiClient.post('/api/google-oauth/', { credential }),

  // Password reset endpoints
  forgotPassword: (email) => apiClient.post('/api/forgot-password/', { email }),
  verifyOTP: (email, otp) => apiClient.post('/api/verify-otp/', { email, otp }),
  resetPassword: (email, otp, newPassword, confirmPassword) =>
    apiClient.post('/api/reset-password/', {
      email,
      otp,
      new_password: newPassword,
      confirm_password: confirmPassword
    }),

  get: (endpoint) => apiClient.get(`/api${endpoint}`),
  post: (endpoint, data) => apiClient.post(`/api${endpoint}`, data),
  put: (endpoint, data) => apiClient.put(`/api${endpoint}`, data),
  delete: (endpoint) => apiClient.delete(`/api${endpoint}`),
};