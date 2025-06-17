import React from 'react';

const DashboardHeader = ({ user, subscriptionType, onLogout }) => (
  <header className="dashboard-header">
    <div className="header-content">
      <div className="logo-section">
        <h1>EdgeSync Dashboard</h1>
        <span className="subscription-badge">{subscriptionType}</span>
      </div>
      <div className="user-section">
        <div className="user-info">
          <span className="welcome">Welcome back,</span>
          <span className="username">{user.username}</span>
          <span className="email">{user.email}</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  </header>
);

export default DashboardHeader;