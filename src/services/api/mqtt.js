import { apiClient } from './client';

export const mqttAPI = {
  setPassword: (credentials) => apiClient.post('/api/mqtt/set-password/', credentials),
  deleteHostedCluster: () => apiClient.delete('/api/mqtt/delete-hosted/'),
  
  getInfo: async () => {
    try {
      const response = await apiClient.get('/api/mqtt/user-info/');
      return response;
    } catch (error) {
      console.error('MQTT info error:', error); // Changed to console.error for better logging
      // The backend should ideally handle this, but as a fallback:
      return {
        data: {
          username: null,
          hasPassword: false, // Explicitly set hasPassword to false on error
          password: null, // Ensure password is null on error
          connected: false,
          broker: {
            host: '13.203.165.247',
            port: 1883,
            websocketPort: 1884
          }
        }
      };
    }
  },

  listAcls: () => apiClient.get('/api/acls/'),
  addAcl: (data) => apiClient.post('/api/acls/', data),
  deleteAcl: (id) => apiClient.delete(`/api/acls/${id}/`),

  clusters: {
    list: () => apiClient.get('/api/mqtt-clusters/'),
    get: (uuid) => apiClient.get(`/api/mqtt-clusters/${uuid}/`),
    create: (clusterData) => apiClient.post('/api/mqtt-clusters/', clusterData),
    update: (uuid, clusterData) => apiClient.put(`/api/mqtt-clusters/${uuid}/`, clusterData),
    delete: (uuid) => apiClient.delete(`/api/mqtt-clusters/${uuid}/`),
    getStats: (uuid) => apiClient.get(`/api/mqtt-clusters/${uuid}/stats/`),
    testConnection: (uuid, credentials) => apiClient.post(`/api/mqtt-clusters/${uuid}/test/`, credentials),
  }
};