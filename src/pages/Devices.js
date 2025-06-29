import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, deviceAPI, organizationAPI } from '../services/api';
import cacheService from '../services/cache';
import DashboardHeader from '../components/common/DashboardHeader';
import DashboardSidebar from '../components/common/DashboardSidebar';
import LoadingLayout from '../components/common/LoadingLayout';

import '../styles/DevicesPage.css';
import '../styles/BaseLayout.css';
import '../styles/DevicesPage.css';
import useDashboardStore from '../store/dashboardStore';
import { useStatActions } from '../hooks/useDashboardStats';

function Devices() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useDashboardStore();
  const [newDevice, setNewDevice] = useState({
    name: '',
    description: '',
    organization: '',
    status: 'active'
  });
  const [createdDevice, setCreatedDevice] = useState(null);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const { incrementStat, decrementStat, refresh: refreshStats } = useStatActions();

  useEffect(() => {
    const initializeDevices = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch user profile
        const userResponse = await authAPI.get('/profile/');
        if (userResponse.data.status === 'success') {
          setUser(userResponse.data.user);
        }

        // Fetch user's organizations
        const orgResponse = await organizationAPI.getOrganizations();
        if (orgResponse.data.status === 'success') {
          setOrganizations(orgResponse.data.organizations);
          if (orgResponse.data.organizations.length > 0) {
            setNewDevice(prev => ({ ...prev, organization: orgResponse.data.organizations[0].id }));
          }
        }

        // Fetch devices
        await loadDevices();

      } catch (error) {
        console.error('Devices initialization error:', error);
        if (error.response?.status === 401) {
          localStorage.clear();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeDevices();
  }, [navigate]);

  const loadDevices = async () => {
    try {
      const response = await deviceAPI.getDevices();
      if (response.data && Array.isArray(response.data)) {
        setDevices(response.data);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const loadProjectsForOrganization = async (orgId) => {
    try {
      const response = await organizationAPI.getOrganizationProjects(orgId);
      if (response.data.status === 'success') {
        setAvailableProjects(response.data.projects || []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setAvailableProjects([]);
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      cacheService.clearAll();
      navigate('/');
    }
  };

  const handleCreateDevice = async () => {
    try {
      const deviceData = {
        ...newDevice,
        project_uuids: selectedProjects
      };

      const response = await deviceAPI.createDevice(deviceData);
      if (response.data) {
        setCreatedDevice(response.data);
        setShowCreateModal(false);
        setShowTokenModal(true);
        setNewDevice({
          name: '',
          description: '',
          organization: organizations[0]?.id || '',
          status: 'active'
        });
        setSelectedProjects([]);
        await loadDevices();
        cacheService.invalidate('devices');
        incrementStat('connectedDevices');
        refreshStats();
      }
    } catch (error) {
      console.error('Error creating device:', error);
      alert('Failed to create device. Please try again.');
    }
  };

  const handleDeleteDevice = async (deviceUuid) => {
    if (!window.confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      return;
    }

    try {
      await deviceAPI.deleteDevice(deviceUuid);
      await loadDevices();
      cacheService.invalidate('devices');
      decrementStat('connectedDevices');
      refreshStats();
    } catch (error) {
      console.error('Error deleting device:', error);
      alert('Failed to delete device. Please try again.');
    }
  };

  const handleRegenerateToken = async (deviceUuid) => {
    try {
      const response = await deviceAPI.regenerateToken(deviceUuid);
      if (response.data) {
        setCreatedDevice(response.data);
        setShowTokenModal(true);
      }
    } catch (error) {
      console.error('Error regenerating token:', error);
      alert('Failed to regenerate token. Please try again.');
    }
  };

  const handleOrganizationChange = (orgId) => {
    setNewDevice(prev => ({ ...prev, organization: orgId }));
    setSelectedProjects([]);
    loadProjectsForOrganization(orgId);
  };

  if (loading) {
    return <LoadingLayout user={user} message="Loading your devices..." />;
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <h2 className="empty-title">Access Denied</h2>
          <p className="empty-description">Please log in to access your devices.</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <DashboardHeader 
        user={user} 
        subscriptionType="free"
        onLogout={handleLogout}
        onToggleSidebar={toggleSidebar}
      />
      
      <div className="layout">
        {/* Shared Sidebar Component */}
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />

        {/* Main Content */}
        <main className="main-content">
          <div className="page-header">
            <div className="page-header-content">
              <h1 className="page-title">Your Devices</h1>
              <p className="page-subtitle">Manage your IoT devices and their project assignments</p>
            </div>
            <div className="page-actions">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowCreateModal(true);
                  if (organizations.length > 0) {
                    loadProjectsForOrganization(organizations[0].id);
                  }
                }}
              >
                + New Device
              </button>
            </div>
          </div>

          {devices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📱</div>
              <h2 className="empty-title">No Devices Yet</h2>
              <p className="empty-description">Create your first IoT device to start collecting data and building applications</p>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowCreateModal(true);
                  if (organizations.length > 0) {
                    loadProjectsForOrganization(organizations[0].id);
                  }
                }}
              >
                Create Your First Device
              </button>
            </div>
          ) : (
            <div className="devices-grid">
              {devices.map(device => (
                <div key={device.uuid} className="device-card">
                  <div className="card-header">
                    <h3 className="card-title">{device.name}</h3>
                    <span className={`status-badge ${device.status === 'active' ? 'status-success' : device.status === 'offline' ? 'status-danger' : 'status-neutral'}`}>
                      {device.status}
                    </span>
                  </div>
                  <div className="card-content">
                    <p className="card-description">{device.description || 'No description provided'}</p>
                    <div className="card-stats">
                      <div className="stat">
                        <span className="stat-value">{device.projects?.length || 0}</span>
                        <span className="stat-label">Projects</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{device.token ? '••••' : 'None'}</span>
                        <span className="stat-label">Token</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <div style={{display: 'flex', gap: '0.5rem', flex: 1}}>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegenerateToken(device.uuid);
                        }}
                      >
                        Show Token
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDevice(device.uuid);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right'}}>
                      <div>{device.organization?.name}</div>
                      <div>Updated {new Date(device.updated_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create Device Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Device</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="device-name">Device Name *</label>
                <input
                  className="form-input"
                  id="device-name"
                  type="text"
                  value={newDevice.name}
                  onChange={e => setNewDevice({...newDevice, name: e.target.value})}
                  placeholder="e.g., Temperature Sensor 1, ESP32 Gateway"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="device-description">Description</label>
                <textarea
                  className="form-textarea"
                  id="device-description"
                  value={newDevice.description}
                  onChange={e => setNewDevice({...newDevice, description: e.target.value})}
                  placeholder="Describe what this device does..."
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="device-organization">Organization *</label>
                <select
                  className="form-select"
                  id="device-organization"
                  value={newDevice.organization}
                  onChange={e => handleOrganizationChange(parseInt(e.target.value))}
                >
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="device-status">Status</label>
                <select
                  className="form-select"
                  id="device-status"
                  value={newDevice.status}
                  onChange={e => setNewDevice({...newDevice, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              {availableProjects.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Assign to Projects (Optional)</label>
                  <div style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '1rem', background: 'var(--bg-tertiary)'}}>
                    {availableProjects.map(project => (
                      <label key={project.uuid} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.25rem 0'}}>
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(project.uuid)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedProjects([...selectedProjects, project.uuid]);
                            } else {
                              setSelectedProjects(selectedProjects.filter(p => p !== project.uuid));
                            }
                          }}
                        />
                        {project.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-primary"
                onClick={handleCreateDevice}
                disabled={!newDevice.name || !newDevice.organization}
              >
                Create Device
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token Display Modal */}
      {showTokenModal && createdDevice && (
        <div className="modal-overlay" onClick={() => setShowTokenModal(false)}>
          <div className="modal-content token-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Device Authentication Token</h2>
              <button 
                className="close-button"
                onClick={() => setShowTokenModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="token-warning">
                <p>⚠️ <strong>Important:</strong> Save this token securely. You won't be able to see it again!</p>
              </div>
              <div className="form-group">
                <label>Device Token</label>
                <div className="token-display">
                  <input
                    type="text"
                    value={createdDevice.token}
                    readOnly
                    className="token-input"
                  />
                  <button 
                    className="copy-button"
                    onClick={() => navigator.clipboard.writeText(createdDevice.token)}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
              <div className="token-instructions">
                <h4>How to use this token:</h4>
                <ul>
                  <li>Include it in your device's HTTP headers: <code>Authorization: Token {createdDevice.token}</code></li>
                  <li>Use it for device API authentication</li>
                  <li>Keep it secure - anyone with this token can access your device</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="primary-button"
                onClick={() => setShowTokenModal(false)}
              >
                I've Saved the Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Devices; 