import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectAPI, flowAPI, dashboardAPI, deviceAPI } from '../services/api';
import DashboardHeader from '../components/common/DashboardHeader';
import DashboardSidebar from '../components/common/DashboardSidebar';
// import FlowEditor from './FlowEditor';
// import DashboardCreator from './DashboardCreator';
import './ProjectDashboard.css';
import '../styles/BaseLayout.css';
import '../styles/ProjectDashboard.css';
import useDashboardStore from '../store/dashboardStore';
import { useStatActions } from '../hooks/useDashboardStats';

function ProjectDashboard() {
  const navigate = useNavigate();
  const { projectUuid } = useParams();
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [activeView] = useState('overview'); // 'overview', 'flow', 'dashboard'
  const [flows, setFlows] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [devices, setDevices] = useState([]);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAssignDeviceModal, setShowAssignDeviceModal] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useDashboardStore();
  const { decrementStat, refresh: refreshStats } = useStatActions();

  const loadProjectDevices = useCallback(async () => {
    try {
      const response = await deviceAPI.getDevicesByProject(projectUuid);
      if (response.data && Array.isArray(response.data)) {
        setDevices(response.data);
      }
    } catch (error) {
      console.error('Error loading project devices:', error);
    }
  }, [projectUuid]);

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
  }, [projectUuid, navigate, loadProjectDevices]);

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
        decrementStat('projects');
        refreshStats();
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="uniform-loading">
          <div className="uniform-loading-spinner"></div>
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="uniform-empty-state">
          <div className="uniform-empty-icon">⚠️</div>
          <h2 className="uniform-empty-title">Error</h2>
          <p className="uniform-empty-description">{error}</p>
          <button className="uniform-btn uniform-btn-primary" onClick={() => navigate('/dashboard')}>Back to Projects</button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-container">
        <div className="uniform-empty-state">
          <div className="uniform-empty-icon">💭</div>
          <h2 className="uniform-empty-title">Project Not Found</h2>
          <p className="uniform-empty-description">The project you're looking for doesn't exist or you don't have access to it.</p>
          <button className="uniform-btn uniform-btn-primary" onClick={() => navigate('/dashboard')}>Back to Projects</button>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div>
      {/* Compact Stats Bar */}
      <div style={{
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem', 
        padding: '1rem', 
        background: 'white', 
        borderRadius: '8px', 
        border: '1px solid #e5e7eb',
        alignItems: 'center'
      }}>
        <div style={{flex: 1}}>
          <h2 style={{margin: 0, fontSize: '1.25rem', fontWeight: '600'}}>{project.name}</h2>
          <p style={{margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)'}}>{project.description}</p>
        </div>
        <div style={{display: 'flex', gap: '1.5rem', alignItems: 'center'}}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '1.25rem', fontWeight: '600', color: 'var(--primary-color)'}}>{flows.length}</div>
            <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>Flows</div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '1.25rem', fontWeight: '600', color: 'var(--primary-color)'}}>{dashboards.length}</div>
            <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>Dashboards</div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '1.25rem', fontWeight: '600', color: 'var(--primary-color)'}}>{devices.length}</div>
            <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>Devices</div>
          </div>
          <span className="uniform-badge uniform-badge-success">{project.status}</span>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Flows Section */}
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">Flows</h3>
          </div>
          <div className="section-content">
            <p className="section-description">Design your data processing pipelines</p>
            <button className="btn btn-primary section-action" onClick={handleCreateFlow} style={{width: '100%', marginBottom: '1rem'}}>
              Create New Flow
            </button>
            <div className="items-container">
              {flows.map(flow => (
                <div key={flow.uuid} style={{
                  padding: '0.75rem', 
                  marginBottom: '0.5rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  background: '#f9fafb',
                  transition: 'all 0.2s ease'
                }} 
                onClick={() => navigate(`/project/${projectUuid}/flow/${flow.uuid}`)}
                onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.background = '#f9fafb'}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem'}}>
                    <h4>{flow.name}</h4>
                    <button 
                      className="action-btn danger"
                      onClick={(e) => handleDeleteFlow(e, flow.uuid)}
                      title="Delete Flow"
                      style={{fontSize: '0.8rem', padding: '2px'}}
                    >
                      🗑️
                    </button>
                  </div>
                  <p>{flow.description}</p>
                  <span>
                    Updated {new Date(flow.updated_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {flows.length === 0 && (
                <p style={{textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem'}}>No flows created yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Dashboards Section */}
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">Dashboards</h3>
          </div>
          <div className="section-content">
            <p className="section-description">Visualize your data and insights</p>
            <button className="btn btn-primary section-action" onClick={handleCreateDashboard} style={{width: '100%', marginBottom: '1rem'}}>
              Create New Dashboard
            </button>
            <div className="items-container">
              {dashboards.map(dashboard => (
                <div key={dashboard.uuid} style={{
                  padding: '1rem', 
                  marginBottom: '0.75rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  background: '#f9fafb',
                  transition: 'all 0.2s ease'
                }} 
                onClick={() => navigate(`/project/${projectUuid}/dashboard/${dashboard.uuid}`)}
                onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.background = '#f9fafb'}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem'}}>
                    <h4>{dashboard.name}</h4>
                    <button 
                      className="action-btn danger"
                      onClick={(e) => handleDeleteDashboard(e, dashboard.uuid)}
                      title="Delete Dashboard"
                      style={{fontSize: '0.8rem', padding: '2px'}}
                    >
                      🗑️
                    </button>
                  </div>
                  <p>{dashboard.description}</p>
                  <span>
                    Updated {new Date(dashboard.updated_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {dashboards.length === 0 && (
                <p style={{textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem'}}>No dashboards created yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Devices Section */}
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">Devices</h3>
          </div>
          <div className="section-content">
            <p className="section-description">Manage IoT devices for this project</p>
            <button 
              className="btn btn-primary section-action"
              style={{width: '100%', marginBottom: '1rem'}}
              onClick={() => {
                loadAvailableDevices();
                setShowAssignDeviceModal(true);
              }}
            >
              Assign Device
            </button>
            <div className="items-container">
              {devices.map(device => (
                <div key={device.uuid} style={{
                  padding: '1rem', 
                  marginBottom: '0.75rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  background: '#f9fafb',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem'}}>
                    <h4>{device.name}</h4>
                    <button 
                      className="action-btn danger"
                      onClick={() => handleUnassignDevice(device.uuid)}
                      title="Unassign Device"
                      style={{fontSize: '0.8rem', padding: '2px'}}
                    >
                      🗑️
                    </button>
                  </div>
                  <p>{device.description}</p>
                  <div style={{display: 'flex', gap: '0.25rem', marginBottom: '0.25rem'}}>
                    <span className={`uniform-badge ${device.status === 'active' ? 'uniform-badge-success' : 'uniform-badge-neutral'}`} style={{fontSize: '0.6rem', padding: '0.125rem 0.375rem'}}>
                      {device.status}
                    </span>
                    <span className={`uniform-badge ${device.is_active ? 'uniform-badge-success' : 'uniform-badge-neutral'}`} style={{fontSize: '0.6rem', padding: '0.125rem 0.375rem'}}>
                      {device.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <span>
                    Last seen: {device.last_seen ? new Date(device.last_seen).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              ))}
              {devices.length === 0 && (
                <p style={{textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem'}}>No devices assigned yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <DashboardHeader 
        user={user}
        subscriptionType="free"
        onLogout={() => {
          localStorage.clear();
          navigate('/login');
        }}
        onToggleSidebar={toggleSidebar}
      />
      
      <div className="layout">
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        <main className="main-content">
          <div className="content-wrapper">
            <div className="uniform-page-header">
              <div className="uniform-page-header-content">
                <h1 className="uniform-page-title">{project.name}</h1>
                <p className="uniform-page-subtitle">Organization: {project.organization.name}</p>
              </div>
              <div className="uniform-page-actions">
                <button 
                  className="delete-project-button"
                  onClick={handleDeleteProject}
                  title="Delete Project"
                >
                  🗑️ Delete Project
                </button>
              </div>
            </div>
            {activeView === 'overview' && renderOverview()}
          </div>
        </main>
      </div>

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