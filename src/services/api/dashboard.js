import { apiClient } from './client';

export const dashboardAPI = {
  getTemplates: () => apiClient.get('/api/dashboard-templates/'),
  getTemplate: (uuid) => apiClient.get(`/api/dashboard-templates/${uuid}/`),
  createTemplate: (templateData) => apiClient.post('/api/dashboard-templates/', templateData),
  updateTemplate: (uuid, templateData) => apiClient.put(`/api/dashboard-templates/${uuid}/`, templateData),
  deleteTemplate: (uuid) => apiClient.delete(`/api/dashboard-templates/${uuid}/`),
};