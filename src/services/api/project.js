import { apiClient } from './client';

export const projectAPI = {
  getProjects: () => apiClient.get('/api/projects/'),
  getProject: (uuid) => apiClient.get(`/api/projects/${uuid}/`),
  createProject: (projectData) => apiClient.post('/api/projects/', projectData),
  updateProject: (uuid, projectData) => apiClient.put(`/api/projects/${uuid}/`, projectData),
  deleteProject: (uuid) => apiClient.delete(`/api/projects/${uuid}/`),
}; 