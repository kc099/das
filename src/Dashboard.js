import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from './services/api';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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

        // TODO: Fetch user statistics from sensors API
        // For now, using mock data
        setStats({
          devices: 3,
          sensors: 12,
          dataPoints: 1247,
          subscriptionType: 'freemium'
        });

      } catch (error) {
        console.error('Dashboard initialization error:', error);
        if (error.response?.status === 401) {
          // Token expired or invalid
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
      // Clear local storage and redirect
      localStorage.clear();
      navigate('/');
    }
  };

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

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Stats Overview */}
        <section className="stats-section">
          <h2>Overview</h2>
          <div className="stats-grid">
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
                <h3>{stats.sensors}</h3>
                <p>Active Sensors</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3>{stats.dataPoints.toLocaleString()}</h3>
                <p>Data Points</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔐</div>
              <div className="stat-content">
                <h3>Encrypted</h3>
                <p>Secure Connection</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-card">
              <div className="action-icon">➕</div>
              <div className="action-content">
                <h3>Add Device</h3>
                <p>Connect a new IoT device</p>
              </div>
            </button>
            <button className="action-card">
              <div className="action-icon">📱</div>
              <div className="action-content">
                <h3>Manage Sensors</h3>
                <p>Configure sensor settings</p>
              </div>
            </button>
            <button className="action-card">
              <div className="action-icon">📊</div>
              <div className="action-content">
                <h3>View Analytics</h3>
                <p>Analyze sensor data</p>
              </div>
            </button>
            <button className="action-card">
              <div className="action-icon">⚙️</div>
              <div className="action-content">
                <h3>Settings</h3>
                <p>Account and preferences</p>
              </div>
            </button>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="activity-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">🔌</div>
              <div className="activity-content">
                <h4>Device Connected</h4>
                <p>ESP32 Temperature Sensor #3 came online</p>
                <span className="activity-time">2 minutes ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📊</div>
              <div className="activity-content">
                <h4>Data Received</h4>
                <p>Humidity sensor reported 65% humidity</p>
                <span className="activity-time">5 minutes ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">⚠️</div>
              <div className="activity-content">
                <h4>Alert Triggered</h4>
                <p>Temperature exceeded threshold (25°C)</p>
                <span className="activity-time">1 hour ago</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard; 