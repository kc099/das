import React from 'react';

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

export default DashboardCard;