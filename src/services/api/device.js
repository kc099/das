import { apiClient } from './client';

export const deviceAPI = {
  // List devices with optional filters
  getDevices: (params = {}) => {
    return apiClient.get('/sensors/api/devices/', { params });
  },

  // Get a specific device by UUID
  getDevice: (uuid) => {
    return apiClient.get(`/sensors/api/devices/${uuid}/`);
  },

  // Create a new device
  createDevice: (deviceData) => {
    return apiClient.post('/sensors/api/devices/', deviceData);
  },

  // Update a device
  updateDevice: (uuid, deviceData) => {
    return apiClient.put(`/sensors/api/devices/${uuid}/`, deviceData);
  },

  // Partially update a device
  patchDevice: (uuid, deviceData) => {
    return apiClient.patch(`/sensors/api/devices/${uuid}/`, deviceData);
  },

  // Delete a device
  deleteDevice: (uuid) => {
    return apiClient.delete(`/sensors/api/devices/${uuid}/`);
  },

  // Assign device to a project
  assignToProject: (deviceUuid, projectUuid) => {
    return apiClient.post(`/sensors/api/devices/${deviceUuid}/assign_project/`, {
      project_uuid: projectUuid
    });
  },

  // Unassign device from a project
  unassignFromProject: (deviceUuid, projectUuid) => {
    return apiClient.delete(`/sensors/api/devices/${deviceUuid}/assign-project/${projectUuid}/`);
  },

  // Regenerate device authentication token
  regenerateToken: (deviceUuid) => {
    return apiClient.post(`/sensors/api/devices/${deviceUuid}/regenerate-token/`);
  },

  // Get devices by organization
  getDevicesByOrganization: (organizationId) => {
    return apiClient.get('/sensors/api/devices/', {
      params: { organization: organizationId }
    });
  },

  // Get devices by project
  getDevicesByProject: (projectUuid) => {
    return apiClient.get('/sensors/api/devices/', {
      params: { project_uuid: projectUuid }
    });
  }
}; 