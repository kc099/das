import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectAPI, flowAPI, dashboardAPI, deviceAPI } from '../services/api';
import DashboardHeader from '../components/common/DashboardHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
// import FlowEditor from './FlowEditor';
// import DashboardCreator from './DashboardCreator';
import './ProjectDashboard.css';

function ProjectDashboard() {
  const navigate = useNavigate();
  const { projectUuid } = useParams();
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('overview'); // 'overview', 'flow', 'dashboard'
  const [flows, setFlows] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [devices, setDevices] = useState([]);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAssignDeviceModal, setShowAssignDeviceModal] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState([]);

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true);
        
        // Get user data from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
        
        // Load project details
        const projectResponse = await projectAPI.getProject(projectUuid);
        if (projectResponse.data.status === 'success') {
          setProject(projectResponse.data.project);
        }

        // Load project flows
        const flowsResponse = await flowAPI.getFlows();
        if (flowsResponse.data) {
          const projectFlows = flowsResponse.data.filter(
            flow => flow.project_uuid === projectUuid
          );
          setFlows(projectFlows);
        }

        // Load project dashboard templates
        const dashboardsResponse = await dashboardAPI.getTemplates();
        if (dashboardsResponse.data.status === 'success') {
          const projectDashboards = dashboardsResponse.data.templates.filter(
            template => template.project && template.project.uuid === projectUuid
          );
          setDashboards(projectDashboards);
        }

        // Load project devices
        await loadProjectDevices();

      } catch (error) {
        console.error('Error loading project data:', error);
        setError('Failed to load project data');
        if (error.response?.status === 401) {
          navigate('/login');
        } else if (error.response?.status === 404) {
          setError('Project not found');
        }
      } finally {
        setLoading(false);
      }
    };

    if (projectUuid) {
      loadProjectData();
    }
  }, [projectUuid, navigate]);

  const loadProjectDevices = async () => {
    try {
      const response = await deviceAPI.getDevicesByProject(projectUuid);
      if (response.data && Array.isArray(response.data)) {
        setDevices(response.data);
      }
    } catch (error) {
      console.error('Error loading project devices:', error);
    }
  };

  const loadAvailableDevices = async () => {
    try {
      if (!project) return;
      
      const response = await deviceAPI.getDevicesByOrganization(project.organization.id);
      if (response.data && Array.isArray(response.data)) {
        // Filter out devices already assigned to this project
        const assignedDeviceUuids = devices.map(d => d.uuid);
        const available = response.data.filter(d => !assignedDeviceUuids.includes(d.uuid));
        setAvailableDevices(available);
      }
    } catch (error) {
      console.error('Error loading available devices:', error);
    }
  };

  const handleAssignDevices = async () => {
    try {
      // Assign each selected device to the project
      for (const deviceUuid of selectedDevices) {
        await deviceAPI.assignToProject(deviceUuid, projectUuid);
      }
      
      setShowAssignDeviceModal(false);
      setSelectedDevices([]);
      await loadProjectDevices();
    } catch (error) {
      console.error('Error assigning devices:', error);
      alert('Failed to assign devices. Please try again.');
    }
  };

  const handleUnassignDevice = async (deviceUuid) => {
    if (!window.confirm('Are you sure you want to unassign this device from the project?')) {
      return;
    }

    try {
      await deviceAPI.unassignFromProject(deviceUuid, projectUuid);
      await loadProjectDevices();
    } catch (error) {
      console.error('Error unassigning device:', error);
      alert('Failed to unassign device. Please try again.');
    }
  };

  const handleCreateFlow = async () => {
    try {
      const newFlowData = {
        name: 'New Flow',
        description: 'A new flow diagram',
        project_uuid: projectUuid,
        nodes: [],
        edges: [],
        metadata: {},
        tags: []
      };
      
      const response = await flowAPI.createFlow(newFlowData);
      if (response.data) {
        // Navigate to flow editor with the new flow
        navigate(`/project/${projectUuid}/flow/${response.data.uuid}`);
      }
    } catch (error) {
      console.error('Error creating flow:', error);
    }
  };

  const handleCreateDashboard = async () => {
    try {
      const newDashboardData = {
        name: 'New Dashboard',
        description: 'A new dashboard template',
        organization_id: project.organization.id,
        project_id: project.id,
        layout: {},
        widgets: [],
        datasources: []
      };
      
      const response = await dashboardAPI.createTemplate(newDashboardData);
      if (response.data.status === 'success') {
        // Navigate to dashboard creator with the new template
        navigate(`/project/${projectUuid}/dashboard/${response.data.template.uuid}`);
      }
    } catch (error) {
      console.error('Error creating dashboard:', error);
    }
  };

  const handleDeleteFlow = async (event, flowUuid) => {
    event.stopPropagation(); // Prevent card click
    if (window.confirm('Are you sure you want to delete this flow?')) {
      try {
        await flowAPI.deleteFlow(flowUuid);
        // Refresh flows list
        setFlows(flows.filter(f => f.uuid !== flowUuid));
      } catch (error) {
        console.error('Error deleting flow:', error);
        alert('Failed to delete flow');
      }
    }
  };

  const handleDeleteDashboard = async (event, dashboardUuid) => {
    event.stopPropagation(); // Prevent card click
    if (window.confirm('Are you sure you want to delete this dashboard?')) {
      try {
        await dashboardAPI.deleteTemplate(dashboardUuid);
        // Refresh dashboards list
        setDashboards(dashboards.filter(d => d.uuid !== dashboardUuid));
      } catch (error) {
        console.error('Error deleting dashboard:', error);
        alert('Failed to delete dashboard');
      }
    }
  };

  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this entire project? This action cannot be undone.')) {
      try {
        await projectAPI.deleteProject(projectUuid);
        alert('Project deleted successfully');
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
      }
    }
  };

  if (loading) {
    return (
      <div className="project-dashboard-container">
        <LoadingSpinner message="Loading project..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-dashboard-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')}>Back to Projects</button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-dashboard-container">
        <div className="error-state">
          <h2>Project Not Found</h2>
          <button onClick={() => navigate('/dashboard')}>Back to Projects</button>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="project-overview">
      <div className="project-info">
        <h2>{project.name}</h2>
        <p>{project.description}</p>
        <div className="project-stats">
          <div className="stat-card">
            <h3>{flows.length}</h3>
            <p>Flow{flows.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="stat-card">
            <h3>{dashboards.length}</h3>
            <p>Dashboard{dashboards.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="stat-card">
            <h3>{devices.length}</h3>
            <p>Device{devices.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="stat-card">
            <h3>{project.status}</h3>
            <p>Status</p>
          </div>
        </div>
      </div>

      <div className="project-actions">
        <div className="action-section">
          <h3>Flows</h3>
          <p>Design your data processing pipelines</p>
          <button className="primary-button" onClick={handleCreateFlow}>
            Create New Flow
          </button>
          <div className="items-list">
            {flows.map(flow => (
              <div key={flow.uuid} className="item-card" 
                   onClick={() => navigate(`/project/${projectUuid}/flow/${flow.uuid}`)}>
                <div className="item-content">
                  <h4>{flow.name}</h4>
                  <p>{flow.description}</p>
                  <span className="item-meta">
                    Updated {new Date(flow.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <button 
                  className="delete-button"
                  onClick={(e) => handleDeleteFlow(e, flow.uuid)}
                  title="Delete Flow"
                >
                  🗑️
                </button>
              </div>
            ))}
            {flows.length === 0 && (
              <p className="empty-state">No flows created yet. Start by creating your first flow!</p>
            )}
          </div>
        </div>

        <div className="action-section">
          <h3>Dashboards</h3>
          <p>Visualize your data and insights</p>
          <button className="primary-button" onClick={handleCreateDashboard}>
            Create New Dashboard
          </button>
          <div className="items-list">
            {dashboards.map(dashboard => (
              <div key={dashboard.uuid} className="item-card"
                   onClick={() => navigate(`/project/${projectUuid}/dashboard/${dashboard.uuid}`)}>
                <div className="item-content">
                  <h4>{dashboard.name}</h4>
                  <p>{dashboard.description}</p>
                  <span className="item-meta">
                    Updated {new Date(dashboard.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <button 
                  className="delete-button"
                  onClick={(e) => handleDeleteDashboard(e, dashboard.uuid)}
                  title="Delete Dashboard"
                >
                  🗑️
                </button>
              </div>
            ))}
            {dashboards.length === 0 && (
              <p className="empty-state">No dashboards created yet. Create widgets from your flow outputs!</p>
            )}
          </div>
        </div>

        <div className="action-section">
          <h3>Devices</h3>
          <p>Manage IoT devices for this project</p>
          <button 
            className="primary-button" 
            onClick={() => {
              loadAvailableDevices();
              setShowAssignDeviceModal(true);
            }}
          >
            Assign Device
          </button>
          <div className="items-list">
            {devices.map(device => (
              <div key={device.uuid} className="item-card device-item">
                <div className="item-content">
                  <h4>{device.name}</h4>
                  <p>{device.description}</p>
                  <div className="device-status">
                    <span className={`status-badge ${device.status}`}>
                      {device.status}
                    </span>
                    <span className={`active-badge ${device.is_active ? 'active' : 'inactive'}`}>
                      {device.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <span className="item-meta">
                    Last seen: {device.last_seen ? new Date(device.last_seen).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <button 
                  className="delete-button"
                  onClick={() => handleUnassignDevice(device.uuid)}
                  title="Unassign Device"
                >
                  🚫
                </button>
              </div>
            ))}
            {devices.length === 0 && (
              <p className="empty-state">No devices assigned yet. Assign devices to start collecting data!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="project-dashboard-container">
      <DashboardHeader 
        user={user}
        subscriptionType="free"
        onLogout={() => {
          localStorage.clear();
          navigate('/login');
        }}
      />
      
      <div className="project-navigation">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back to Projects
        </button>
        <div className="project-title">
          <h1>{project.name}</h1>
          <span className="project-org">{project.organization.name}</span>
        </div>
        <div className="project-actions-nav">
          <button 
            className="delete-project-button"
            onClick={handleDeleteProject}
            title="Delete Project"
          >
            🗑️ Delete Project
          </button>
        </div>
      </div>

      <main className="project-main">
        {activeView === 'overview' && renderOverview()}
      </main>

      {/* Assign Device Modal */}
      {showAssignDeviceModal && (
        <div className="modal-overlay" onClick={() => setShowAssignDeviceModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Devices to Project</h2>
              <button 
                className="close-button"
                onClick={() => setShowAssignDeviceModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {availableDevices.length === 0 ? (
                <p>No available devices found. Create devices first in the Devices page.</p>
              ) : (
                <div className="device-selection">
                  <p>Select devices to assign to this project:</p>
                  <div className="device-checkboxes">
                    {availableDevices.map(device => (
                      <label key={device.uuid} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedDevices.includes(device.uuid)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedDevices([...selectedDevices, device.uuid]);
                            } else {
                              setSelectedDevices(selectedDevices.filter(d => d !== device.uuid));
                            }
                          }}
                        />
                        <div className="device-info">
                          <span className="device-name">{device.name}</span>
                          <span className="device-description">{device.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="primary-button"
                onClick={handleAssignDevices}
                disabled={selectedDevices.length === 0 || availableDevices.length === 0}
              >
                Assign Selected Devices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDashboard; 