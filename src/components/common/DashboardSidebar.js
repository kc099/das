import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { organizationAPI, projectAPI, mqttAPI, deviceAPI } from '../../services/api';
import cacheService from '../../services/cache';

const DashboardSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [overviewStats, setOverviewStats] = useState({
    organizations: 0,
    projects: 0,
    mqttClusters: 0,
    connectedDevices: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        
        // Initialize stats object
        const stats = {
          organizations: 0,
          projects: 0,
          mqttClusters: 0,
          connectedDevices: 0
        };

        // Fetch organizations
        try {
          const orgResponse = await organizationAPI.getOrganizations();
          if (orgResponse.data.status === 'success' && Array.isArray(orgResponse.data.organizations)) {
            stats.organizations = orgResponse.data.organizations.length;
          }
        } catch (error) {
          console.error('Error fetching organizations:', error);
        }

        // Fetch projects
        try {
          const projectResponse = await projectAPI.getProjects();
          if (projectResponse.data.status === 'success' && Array.isArray(projectResponse.data.projects)) {
            stats.projects = projectResponse.data.projects.length;
          }
        } catch (error) {
          console.error('Error fetching projects:', error);
        }

        // Fetch MQTT clusters
        try {
          const clustersResponse = await mqttAPI.clusters.list();
          if (clustersResponse.data && Array.isArray(clustersResponse.data)) {
            stats.mqttClusters = clustersResponse.data.length;
          }
        } catch (error) {
          console.error('Error fetching MQTT clusters:', error);
        }

        // Fetch devices
        try {
          const devicesResponse = await deviceAPI.getDevices();
          if (devicesResponse.data && Array.isArray(devicesResponse.data)) {
            stats.connectedDevices = devicesResponse.data.length;
            // Update cache
            cacheService.setOverviewStats({
              connectedDevices: devicesResponse.data.length,
              mqttClusters: stats.mqttClusters
            });
          }
        } catch (error) {
          console.error('Error fetching devices:', error);
          // Try to get from cache if API fails
          try {
            const cachedStats = await cacheService.getOverviewStats();
            stats.connectedDevices = cachedStats.connectedDevices || 0;
          } catch (cacheError) {
            console.error('Error getting cached stats:', cacheError);
          }
        }
        
        setOverviewStats(stats);
      } catch (error) {
        console.error('Error loading sidebar stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const isCurrentPage = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-section">
          <h3>Overview</h3>
          <div className="sidebar-overview-stats">
            <Link 
              to="/organizations" 
              className={`sidebar-stat-item ${isCurrentPage('/organizations') ? 'active' : ''}`}
              onClick={onClose}
            >
              <div className="sidebar-stat-icon organizations">🏢</div>
              <div className="sidebar-stat-content">
                <div className="sidebar-stat-label">Organizations</div>
                <div className="sidebar-stat-value">
                  {loading ? '...' : overviewStats.organizations}
                </div>
              </div>
            </Link>
            
            <Link 
              to="/dashboard" 
              className={`sidebar-stat-item ${isCurrentPage('/dashboard') ? 'active' : ''}`}
              onClick={onClose}
            >
              <div className="sidebar-stat-icon projects">📁</div>
              <div className="sidebar-stat-content">
                <div className="sidebar-stat-label">Projects</div>
                <div className="sidebar-stat-value">
                  {loading ? '...' : overviewStats.projects}
                </div>
              </div>
            </Link>
            
            <Link 
              to="/mqtt-clusters" 
              className={`sidebar-stat-item ${isCurrentPage('/mqtt-clusters') ? 'active' : ''}`}
              onClick={onClose}
            >
              <div className="sidebar-stat-icon mqtt">🔗</div>
              <div className="sidebar-stat-content">
                <div className="sidebar-stat-label">MQTT Clusters</div>
                <div className="sidebar-stat-value">
                  {loading ? '...' : overviewStats.mqttClusters}
                </div>
              </div>
            </Link>
            
            <Link 
              to="/devices" 
              className={`sidebar-stat-item ${isCurrentPage('/devices') ? 'active' : ''}`}
              onClick={onClose}
            >
              <div className="sidebar-stat-icon devices">📱</div>
              <div className="sidebar-stat-content">
                <div className="sidebar-stat-label">Connected Devices</div>
                <div className="sidebar-stat-value">
                  {loading ? '...' : overviewStats.connectedDevices}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar; 