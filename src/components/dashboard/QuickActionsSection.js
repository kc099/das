import React from 'react';
import DashboardCard from '../common/DashboardCard';

const QuickActionsSection = ({ navigate }) => (
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
);

export default QuickActionsSection;