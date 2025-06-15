import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from './services/api';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [organizations, setOrganizations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({
    devices: 0,
    sensors: 0,
    dataPoints: 0,
    subscriptionType: 'free'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Check if user is logged in
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Get user from localStorage first
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Fetch fresh user profile
        const response = await authAPI.getProfile();
        if (response.data.status === 'success') {
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        // Fetch organizations
        const orgResponse = await authAPI.get('/organizations/');
        if (orgResponse.data.status === 'success') {
          setOrganizations(orgResponse.data.organizations);
        }

        // Fetch dashboard templates
        const templatesResponse = await authAPI.get('/dashboard-templates/');
        if (templatesResponse.data.status === 'success') {
          setTemplates(templatesResponse.data.templates);
        }

        // TODO: Fetch devices from sensors API
        // For now, using mock data
        setDevices([
          { id: 1, name: 'ESP32-001', status: 'online', sensors: 5, lastSeen: '2 min ago' },
          { id: 2, name: 'ESP32-002', status: 'offline', sensors: 3, lastSeen: '1 hour ago' },
          { id: 3, name: 'ESP32-003', status: 'online', sensors: 7, lastSeen: '30 sec ago' },
        ]);

        setStats({
          devices: 3,
          sensors: 15,
          dataPoints: 1247,
          subscriptionType: 'freemium'
        });

      } catch (error) {
        console.error('Dashboard initialization error:', error);
        if (error.response?.status === 401) {
          localStorage.clear();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [navigate]);

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
      navigate('/');
    }
  };

  const renderOverview = () => (
    <div className="tab-content">
      {/* Stats Overview */}
      <section className="stats-section">
        <h2>Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🏢</div>
            <div className="stat-content">
              <h3>{organizations.length}</h3>
              <p>Organizations</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏠</div>
            <div className="stat-content">
              <h3>{stats.devices}</h3>
              <p>Connected Devices</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{templates.length}</h3>
              <p>Dashboard Templates</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>{stats.dataPoints.toLocaleString()}</h3>
              <p>Data Points</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-card" onClick={() => navigate('/dashboard-creator')}>
            <div className="action-icon">📊</div>
            <div className="action-content">
              <h3>Dashboard Creator</h3>
              <p>Create dashboard templates</p>
            </div>
          </button>
          <button className="action-card" onClick={() => navigate('/flow-editor')}>
            <div className="action-icon">🔗</div>
            <div className="action-content">
              <h3>Flow Editor</h3>
              <p>Create visual flows</p>
            </div>
          </button>
          <button className="action-card" onClick={() => setActiveTab('organizations')}>
            <div className="action-icon">🏢</div>
            <div className="action-content">
              <h3>Manage Organizations</h3>
              <p>View and manage organizations</p>
            </div>
          </button>
          <button className="action-card" onClick={() => setActiveTab('devices')}>
            <div className="action-icon">📱</div>
            <div className="action-content">
              <h3>Manage Devices</h3>
              <p>Configure IoT devices</p>
            </div>
          </button>
        </div>
      </section>
    </div>
  );

  const renderOrganizations = () => (
    <div className="tab-content">
      <div className="section-header">
        <h2>Organizations</h2>
        <button className="create-btn" onClick={() => navigate('/dashboard-creator')}>
          + Create Organization
        </button>
      </div>
      
      {organizations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <h3>No organizations yet</h3>
          <p>Create your first organization to get started</p>
          <button className="create-btn" onClick={() => navigate('/dashboard-creator')}>
            Create Organization
          </button>
        </div>
      ) : (
        <div className="items-grid">
          {organizations.map(org => (
            <div key={org.id} className="item-card">
              <div className="item-header">
                <h3>{org.name}</h3>
                <span className="item-badge">{org.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <p className="item-description">{org.description}</p>
              <div className="item-meta">
                <span>Owner: {org.owner.username}</span>
                <span>Created: {new Date(org.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTemplates = () => (
    <div className="tab-content">
      <div className="section-header">
        <h2>Dashboard Templates</h2>
        <button className="create-btn" onClick={() => navigate('/dashboard-creator')}>
          + Create Template
        </button>
      </div>
      
      {templates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No templates yet</h3>
          <p>Create your first dashboard template</p>
          <button className="create-btn" onClick={() => navigate('/dashboard-creator')}>
            Create Template
          </button>
        </div>
      ) : (
        <div className="items-grid">
          {templates.map(template => (
            <div key={template.id} className="item-card">
              <div className="item-header">
                <h3>{template.name}</h3>
                <span className="item-badge">{template.widgets.length} widgets</span>
              </div>
              <p className="item-description">{template.description}</p>
              <div className="item-meta">
                <span>Organization: {template.organization.name}</span>
                <span>Updated: {new Date(template.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="item-actions">
                <button 
                  className="edit-btn"
                  onClick={() => navigate('/dashboard-creator')}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDevices = () => (
    <div className="tab-content">
      <div className="section-header">
        <h2>IoT Devices</h2>
        <button className="create-btn">
          + Add Device
        </button>
      </div>
      
      {devices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📱</div>
          <h3>No devices connected</h3>
          <p>Connect your first IoT device to start collecting data</p>
          <button className="create-btn">
            Add Device
          </button>
        </div>
      ) : (
        <div className="items-grid">
          {devices.map(device => (
            <div key={device.id} className="item-card">
              <div className="item-header">
                <h3>{device.name}</h3>
                <span className={`item-badge ${device.status}`}>
                  {device.status === 'online' ? '🟢' : '🔴'} {device.status}
                </span>
              </div>
              <div className="item-meta">
                <span>Sensors: {device.sensors}</span>
                <span>Last seen: {device.lastSeen}</span>
              </div>
              <div className="item-actions">
                <button className="edit-btn">Configure</button>
                <button className="view-btn">View Data</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <h2>Access Denied</h2>
          <p>Please log in to access your dashboard.</p>
          <button onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>EdgeSync Dashboard</h1>
            <span className="subscription-badge">{stats.subscriptionType}</span>
          </div>
          <div className="user-section">
            <div className="user-info">
              <span className="welcome">Welcome back,</span>
              <span className="username">{user.username}</span>
              <span className="email">{user.email}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <div className="nav-content">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`nav-tab ${activeTab === 'organizations' ? 'active' : ''}`}
            onClick={() => setActiveTab('organizations')}
          >
            🏢 Organizations
          </button>
          <button 
            className={`nav-tab ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            📋 Templates
          </button>
          <button 
            className={`nav-tab ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => setActiveTab('devices')}
          >
            📱 Devices
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'organizations' && renderOrganizations()}
        {activeTab === 'templates' && renderTemplates()}
        {activeTab === 'devices' && renderDevices()}
      </main>
    </div>
  );
}

export default Dashboard; 