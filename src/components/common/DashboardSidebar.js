import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useOverviewStats } from '../../hooks/useOverviewStats';

const DashboardSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { data: overviewStats, isLoading: loading } = useOverviewStats();

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
                  {loading ? '...' : overviewStats?.organizations ?? 0}
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
                  {loading ? '...' : overviewStats?.projects ?? 0}
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
                  {loading ? '...' : overviewStats?.mqttClusters ?? 0}
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
                  {loading ? '...' : overviewStats?.connectedDevices ?? 0}
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