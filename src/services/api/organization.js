import { apiClient } from './client';

export const organizationAPI = {
  getOrganizations: () => apiClient.get('/api/organizations/'),
  getOrganization: (id) => apiClient.get(`/api/organizations/${id}/`),
  createOrganization: (orgData) => apiClient.post('/api/organizations/', orgData),
  updateOrganization: (id, orgData) => apiClient.put(`/api/organizations/${id}/`, orgData),
  deleteOrganization: (id) => apiClient.delete(`/api/organizations/${id}/`),
};