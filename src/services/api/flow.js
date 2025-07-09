import { apiClient } from './client';

export const flowAPI = {
  getFlows: () => apiClient.get('/api/flows/'),
  getFlow: (uuid) => apiClient.get(`/api/flows/${uuid}/`),
  createFlow: (flowData) => apiClient.post('/api/flows/', flowData),
  updateFlow: (uuid, flowData) => apiClient.put(`/api/flows/${uuid}/`, flowData),
  deleteFlow: (uuid) => apiClient.delete(`/api/flows/${uuid}/`),
  executeFlow: (uuid) => apiClient.post(`/api/flows/${uuid}/execute/`),
  duplicateFlow: (uuid) => apiClient.post(`/api/flows/${uuid}/duplicate/`),
  getTemplates: () => apiClient.get('/api/flows/templates/'),
  
  // Flow node output endpoints
  getNodeOutput: (flowUuid, nodeId, params = {}) => apiClient.get(`/api/flows/${flowUuid}/nodes/${nodeId}/output/`, { params }),
  getNodeOutputHistory: (flowUuid, nodeId, params = {}) => apiClient.get(`/api/flows/${flowUuid}/nodes/${nodeId}/output/history/`, { params }),
  createWidgetFromNode: (flowUuid, nodeId, widgetConfig) => apiClient.post(`/api/flows/${flowUuid}/nodes/${nodeId}/create-widget/`, widgetConfig),
};