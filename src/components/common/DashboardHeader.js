import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizationAPI, projectAPI, mqttAPI } from '../../services/api';
import cacheService from '../../services/cache';

const DashboardHeader = ({ user, subscriptionType, onLogout, onToggleSidebar }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [overviewData, setOverviewData] = useState({
    organizations: 0,
    projects: 0,
    clusters: 0,
    devices: 0,
    loading: true
  });
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setOverviewData(prev => ({ ...prev, loading: true }));

        // Fetch organizations
        const orgResponse = await organizationAPI.getOrganizations();
        const organizationsCount = orgResponse.data.status === 'success' 
          ? orgResponse.data.organizations.length 
          : 0;

        // Fetch projects
        const projectResponse = await projectAPI.getProjects();
        const projectsCount = projectResponse.data.status === 'success' 
          ? projectResponse.data.projects.length 
          : 0;

        // Fetch MQTT clusters
        const clustersResponse = await mqttAPI.clusters.list();
        const clustersCount = clustersResponse.data && Array.isArray(clustersResponse.data) 
          ? clustersResponse.data.length 
          : 0;

        // Fetch devices using cache service
        const devicesData = await cacheService.getDevices();
        const devicesCount = devicesData.count || 0;

        setOverviewData({
          organizations: organizationsCount,
          projects: projectsCount,
          clusters: clustersCount,
          devices: devicesCount,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching overview data:', error);
        setOverviewData(prev => ({ ...prev, loading: false }));
      }
    };

    if (showDropdown) {
      fetchOverviewData();
    }
  }, [showDropdown]);

  const handleDropdownItemClick = (action) => {
    setShowDropdown(false);
    if (action) action();
  };

  const handleLogoutClick = () => {
    setShowDropdown(false);
    onLogout();
  };

  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="logo-section">
          {onToggleSidebar && (
            <button className="sidebar-toggle" onClick={onToggleSidebar}>
              ☰
            </button>
          )}
          <h1>EdgeSync Dashboard</h1>
          <span className="subscription-badge">{subscriptionType}</span>
        </div>
        
        <div className="profile-dropdown" ref={dropdownRef}>
          <button 
            className="profile-button"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span className="profile-text">
              Welcome back,<br />
              <strong>{user?.username || user?.email}</strong>
            </span>
            <div className="profile-avatar">
              {(user?.username || user?.email)?.charAt(0).toUpperCase()}
            </div>
            <span className="dropdown-arrow">▼</span>
          </button>

          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-section">
                <div className="dropdown-header">Overview</div>
                <div className="overview-stats">
                  <div className="stat-item">
                    <span className="stat-icon">🏢</span>
                    <span className="stat-label">Organizations</span>
                    <span className="stat-value">
                      {overviewData.loading ? '...' : overviewData.organizations}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">📋</span>
                    <span className="stat-label">Projects</span>
                    <span className="stat-value">
                      {overviewData.loading ? '...' : overviewData.projects}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">🔒</span>
                    <span className="stat-label">MQTT Clusters</span>
                    <span className="stat-value">
                      {overviewData.loading ? '...' : overviewData.clusters}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">🏠</span>
                    <span className="stat-label">Connected Devices</span>
                    <span className="stat-value">
                      {overviewData.loading ? '...' : overviewData.devices}
                    </span>
                  </div>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <div className="dropdown-section">
                <div className="dropdown-header">Quick Actions</div>
                <div className="quick-actions">
                  <button 
                    className="action-item"
                    onClick={() => handleDropdownItemClick(() => navigate('/organizations'))}
                  >
                    <span className="action-icon">🏢</span>
                    <div className="action-text">
                      <span className="action-title">Organizations</span>
                      <span className="action-subtitle">Manage organizations</span>
                    </div>
                  </button>
                  <button 
                    className="action-item"
                    onClick={() => handleDropdownItemClick(() => navigate('/devices'))}
                  >
                    <span className="action-icon">🏠</span>
                    <div className="action-text">
                      <span className="action-title">Devices</span>
                      <span className="action-subtitle">Manage IoT devices</span>
                    </div>
                  </button>
                  <button 
                    className="action-item"
                    onClick={() => handleDropdownItemClick(() => navigate('/mqtt-clusters'))}
                  >
                    <span className="action-icon">🔒</span>
                    <div className="action-text">
                      <span className="action-title">MQTT Clusters</span>
                      <span className="action-subtitle">Manage brokers</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <button className="logout-button" onClick={handleLogoutClick}>
                <span className="logout-icon">🚪</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;