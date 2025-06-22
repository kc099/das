import { apiClient } from './client';

export const organizationAPI = {
  getOrganizations: () => apiClient.get('/api/organizations/'),
  getOrganization: (id) => apiClient.get(`/api/organizations/${id}/`),
  createOrganization: (orgData) => apiClient.post('/api/organizations/', orgData),
  updateOrganization: (id, orgData) => apiClient.put(`/api/organizations/${id}/`, orgData),
  deleteOrganization: (id) => apiClient.delete(`/api/organizations/${id}/`),
  
  // Member management
  getOrganizationMembers: (orgId) => apiClient.get(`/api/organizations/${orgId}/members/`),
  addOrganizationMember: (orgId, memberData) => apiClient.post(`/api/organizations/${orgId}/members/`, memberData),
  removeOrganizationMember: (orgId, memberId) => apiClient.delete(`/api/organizations/${orgId}/members/${memberId}/`),
};