import React from 'react';
import BaseWidget from './BaseWidget';
import './Widgets.css';

const StatPanelContent = ({ data, showLoadingState, dataSource }) => {
  const sampleData = { 
    value: 1247, 
    unit: 'devices', 
    trend: '+12%',
    trendDirection: 'up'
  };
  
  if (showLoadingState) {
    return (
      <div className="widget-loading-state" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#9ca3af',
        textAlign: 'center',
        fontSize: '0.9rem'
      }}>
        <p style={{ margin: 0, fontStyle: 'italic' }}>
          Connecting to {dataSource?.nodeName || 'flow node'}...
        </p>
      </div>
    );
  }
  
  const statData = Object.keys(data).length > 0 ? data : sampleData;
  const { value, unit, trend, trendDirection } = statData;
  
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
    <div className="stat-panel-container">
      <div className="stat-main-value">
        <span className="stat-number">{value?.toLocaleString()}</span>
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      

      
      {trend && (
        <div className="stat-trend" style={{ color: getTrendColor(trendDirection) }}>
          <span className="trend-icon">{getTrendIcon(trendDirection)}</span>
          <span className="trend-value">{trend}</span>
          <span className="trend-period">vs last period</span>
        </div>
      )}
      
      <div className="stat-sparkline">
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
  );
};

const StatPanelWidget = ({ widget, data = {} }) => {
  // Check if this widget has a dataSource configured (from flow editor)
  const hasDataSource = widget.dataSource && widget.dataSource.type;
  
  // Determine what data to show
  let showLoadingState = false;
  
  if (hasDataSource && Object.keys(data).length === 0) {
    showLoadingState = true;
  }
  
  const footer = widget.query ? (
    <small className="widget-query">Query: {widget.query}</small>
  ) : null;

  return (
    <BaseWidget
      title={widget.title || 'Stat Panel'}
      footer={footer}
      className="widget-container"
      data-widget-type={widget.type}
    >
      <StatPanelContent 
        data={data} 
        showLoadingState={showLoadingState}
        dataSource={widget.dataSource}
      />
    </BaseWidget>
  );
};

export default StatPanelWidget; 