import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from './services/api';
import cacheService from './services/cache';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    organizations: 0,
    devices: 0,
    templates: 0,
    clusters: 0,
    messages: 0,
    subscriptionType: 'freemium'
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);

        // Use cache service to get all dashboard data efficiently
        const data = await cacheService.getDashboardData();
        
        // Update user profile
        if (data.profile) {
          setUser(data.profile);
          localStorage.setItem('user', JSON.stringify(data.profile));
        }

        // Update dashboard data - all from database
        setDashboardData({
          organizations: data.organizations.count || 0,
          devices: data.devices.count || 0,
          templates: data.templates.count || 0,
          clusters: data.clusters.count || 0,
          messages: data.mqttStats.messages || 0,
          subscriptionType: data.profile?.subscription_type || 'freemium'
        });

        // Preload cache in background for next time
        cacheService.preloadCache();

      } catch (error) {
        console.error('Dashboard initialization error:', error);
        if (error.response?.status === 401) {
          localStorage.clear();
          cacheService.clearAll();
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
      cacheService.clearAll();
      navigate('/');
    }
  };

  // Unified Card Component
  const DashboardCard = ({ icon, title, subtitle, onClick, type = "stat" }) => (
    <div className="dashboard-card" onClick={onClick}>
      <div className="dashboard-card-icon">
        {icon}
      </div>
      <div className="dashboard-card-content">
        <div className="dashboard-card-title">{title}</div>
        <div className="dashboard-card-subtitle">{subtitle}</div>
      </div>
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
            <span className="subscription-badge">{dashboardData.subscriptionType}</span>
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

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Overview Section */}
          <section className="dashboard-section">
            <h2>Overview</h2>
            <div className="dashboard-grid">
              <DashboardCard
                icon="🏢"
                title={dashboardData.organizations.toString()}
                subtitle="Organizations"
              />
              <DashboardCard
                icon="🏠"
                title={dashboardData.devices.toString()}
                subtitle="Connected Devices"
              />
              <DashboardCard
                icon="📊"
                title={dashboardData.templates.toString()}
                subtitle="Dashboard Templates"
              />
              <DashboardCard
                icon="🔒"
                title={dashboardData.clusters.toString()}
                subtitle="MQTT Clusters"
              />
              <DashboardCard
                icon="📈"
                title={dashboardData.messages.toLocaleString()}
                subtitle="MQTT Messages"
              />
            </div>
          </section>

          {/* Quick Actions Section */}
          <section className="dashboard-section">
            <h2>Quick Actions</h2>
            <div className="dashboard-grid">
              <DashboardCard
                icon="📊"
                title="Dashboard Creator"
                subtitle="Create templates"
                onClick={() => navigate('/dashboard-creator')}
                type="action"
              />
              <DashboardCard
                icon="🔗"
                title="Flow Editor"
                subtitle="Create visual flows"
                onClick={() => navigate('/flow-editor')}
                type="action"
              />
              <DashboardCard
                icon="🏢"
                title="Organizations"
                subtitle="View and manage"
                onClick={() => window.alert('Organizations management - Coming soon!')}
                type="action"
              />
              <DashboardCard
                icon="📱"
                title="Manage Devices"
                subtitle="Configure IoT devices"
                onClick={() => window.alert('Device management - Coming soon!')}
                type="action"
              />
              <DashboardCard
                icon="🔒"
                title="MQTT Clusters"
                subtitle="Manage brokers"
                onClick={() => navigate('/mqtt-clusters')}
                type="action"
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard; 