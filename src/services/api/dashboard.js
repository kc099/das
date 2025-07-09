import { apiClient } from './client';

export const dashboardAPI = {
  getTemplates: (params = {}) => apiClient.get('/api/dashboard-templates/', { params }),
  getTemplate: (uuid) => apiClient.get(`/api/dashboard-templates/${uuid}/`),
  createTemplate: (templateData) => apiClient.post('/api/dashboard-templates/', templateData),
  updateTemplate: (uuid, templateData) => apiClient.put(`/api/dashboard-templates/${uuid}/`, templateData),
  deleteTemplate: (uuid) => apiClient.delete(`/api/dashboard-templates/${uuid}/`),
  
  // Widget data endpoints
  getWidgetData: (dashboardUuid, widgetId) => apiClient.get(`/api/dashboard-templates/${dashboardUuid}/widgets/${widgetId}/data/`),
  getWidgetSamples: (dashboardUuid, widgetId) => apiClient.get(`/api/dashboard-templates/${dashboardUuid}/widgets/${widgetId}/samples/`),
};