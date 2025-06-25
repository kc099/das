import { apiClient } from './client';

export const deviceAPI = {
  // List devices with optional filters
  getDevices: (params = {}) => {
    return apiClient.get('/api/devices/', { params });
  },

  // Get a specific device by UUID
  getDevice: (uuid) => {
    return apiClient.get(`/api/devices/${uuid}/`);
  },

  // Create a new device
  createDevice: (deviceData) => {
    return apiClient.post('/api/devices/', deviceData);
  },

  // Update a device
  updateDevice: (uuid, deviceData) => {
    return apiClient.put(`/api/devices/${uuid}/`, deviceData);
  },

  // Partially update a device
  patchDevice: (uuid, deviceData) => {
    return apiClient.patch(`/api/devices/${uuid}/`, deviceData);
  },

  // Delete a device
  deleteDevice: (uuid) => {
    return apiClient.delete(`/api/devices/${uuid}/`);
  },

  // Assign device to a project
  assignToProject: (deviceUuid, projectUuid) => {
    return apiClient.post(`/api/devices/${deviceUuid}/assign_project/`, {
      project_uuid: projectUuid
    });
  },

  // Unassign device from a project
  unassignFromProject: (deviceUuid, projectUuid) => {
    return apiClient.delete(`/api/devices/${deviceUuid}/assign-project/${projectUuid}/`);
  },

  // Regenerate device authentication token
  regenerateToken: (deviceUuid) => {
    return apiClient.post(`/api/devices/${deviceUuid}/regenerate-token/`);
  },

  // Get devices by organization
  getDevicesByOrganization: (organizationId) => {
    return apiClient.get('/api/devices/', {
      params: { organization: organizationId }
    });
  },

  // Get devices by project
  getDevicesByProject: (projectUuid) => {
    return apiClient.get('/api/devices/', {
      params: { project_uuid: projectUuid }
    });
  }
}; 