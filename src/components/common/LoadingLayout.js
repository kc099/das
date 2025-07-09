import React from 'react';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import useDashboardStore from '../../store/dashboardStore';

/**
 * LoadingLayout
 * --------------
 * Reusable layout that keeps the main dashboard chrome (header + sidebar)
 * visible while a page is fetching its initial data. This prevents the
 * sidebar from briefly disappearing between route changes, providing a much
 * smoother navigation experience.
 *
 * Props:
 * - user:          The currently authenticated user (can be null while loading)
 * - message:       Optional loading message to display under the spinner
 */
const LoadingLayout = ({ user = null, message = 'Loading...' }) => {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useDashboardStore();

  return (
    <div className="page-container">
      <DashboardHeader
        user={user}
        subscriptionType="free"
        onLogout={() => {}}
        onToggleSidebar={toggleSidebar}
      />

      <div className="layout">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="main-content">
          <div className="content-wrapper">
            <p style={{ 
              textAlign: 'center', 
              color: '#9ca3af', 
              fontStyle: 'italic',
              padding: '2rem'
            }}>
              {message}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoadingLayout; 