import React from 'react';
import DashboardCard from '../common/DashboardCard';

const OverviewSection = ({ dashboardData }) => (
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
);

export default OverviewSection;