import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import cacheService from '../services/cache';
import { useDashboardData } from '../hooks/useDashboard';
import DashboardHeader from '../components/common/DashboardHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import OverviewSection from '../components/dashboard/OverviewSection';
import QuickActionsSection from '../components/dashboard/QuickActionsSection';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, dashboardData } = useDashboardData();

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

  if (loading) {
    return (
      <div className="dashboard-container">
        <LoadingSpinner message="Loading your dashboard..." />
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
      <DashboardHeader 
        user={user} 
        subscriptionType={dashboardData.subscriptionType}
        onLogout={handleLogout} 
      />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <OverviewSection dashboardData={dashboardData} />
          <QuickActionsSection navigate={navigate} />
        </div>
      </main>
    </div>
  );
}

export default Dashboard; 