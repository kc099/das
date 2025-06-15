import React from 'react';
import './Widgets.css';

const StatPanelWidget = ({ widget, data = {} }) => {
  // Sample data if no real data provided
  const sampleData = { 
    value: 1247, 
    unit: 'devices', 
    label: 'Connected Devices',
    trend: '+12%',
    trendDirection: 'up'
  };
  
  const statData = Object.keys(data).length > 0 ? data : sampleData;
  const { value, unit, label, trend, trendDirection } = statData;
  
  const getTrendColor = (direction) => {
    switch (direction) {
      case 'up': return '#22c55e';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '➡️';
    }
  };

  return (
    <div className="widget-container">
      <div className="widget-header">
        <h3 className="widget-title">{widget.title || 'Stat Panel'}</h3>
        <div className="widget-controls">
          <span className="widget-type-badge">🔢 Stat Panel</span>
        </div>
      </div>
      <div className="widget-content">
        <div className="stat-panel-container">
          <div className="stat-main-value">
            <span className="stat-number">{value?.toLocaleString()}</span>
            {unit && <span className="stat-unit">{unit}</span>}
          </div>
          
          {label && (
            <div className="stat-label">{label}</div>
          )}
          
          {trend && (
            <div className="stat-trend" style={{ color: getTrendColor(trendDirection) }}>
              <span className="trend-icon">{getTrendIcon(trendDirection)}</span>
              <span className="trend-value">{trend}</span>
              <span className="trend-period">vs last period</span>
            </div>
          )}
          
          <div className="stat-sparkline">
            {/* Simple sparkline visualization */}
            <svg width="100%" height="30" viewBox="0 0 100 30">
              <polyline
                points="0,20 20,15 40,10 60,18 80,8 100,12"
                fill="none"
                stroke="var(--primary-color)"
                strokeWidth="2"
                opacity="0.6"
              />
              <circle cx="100" cy="12" r="2" fill="var(--primary-color)" />
            </svg>
          </div>
        </div>
      </div>
      {widget.query && (
        <div className="widget-footer">
          <small className="widget-query">Query: {widget.query}</small>
        </div>
      )}
    </div>
  );
};

export default StatPanelWidget; 