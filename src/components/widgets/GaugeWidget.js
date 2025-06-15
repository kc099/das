import React from 'react';
import './Widgets.css';

const GaugeWidget = ({ widget, data = {} }) => {
  // Sample data if no real data provided
  const sampleData = { value: 75, max: 100, unit: '%', label: 'CPU Usage' };
  const gaugeData = Object.keys(data).length > 0 ? data : sampleData;
  
  const { value = 0, max = 100, unit = '', label = 'Value' } = gaugeData;
  const percentage = Math.min((value / max) * 100, 100);
  const angle = (percentage / 100) * 180; // Half circle gauge
  
  // Calculate color based on percentage
  const getGaugeColor = (percent) => {
    if (percent < 30) return '#22c55e'; // Green
    if (percent < 70) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };
  
  const gaugeColor = getGaugeColor(percentage);
  
  return (
    <div className="widget-container">
      <div className="widget-header">
        <h3 className="widget-title">{widget.title || 'Gauge Chart'}</h3>
        <div className="widget-controls">
          <span className="widget-type-badge">⏲️ Gauge</span>
        </div>
      </div>
      <div className="widget-content">
        <div className="gauge-container">
          <svg width="200" height="120" viewBox="0 0 200 120" className="gauge-svg">
            {/* Background arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Value arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={gaugeColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(angle / 180) * 251.3} 251.3`}
              style={{
                transition: 'stroke-dasharray 0.5s ease-in-out'
              }}
            />
            {/* Center dot */}
            <circle cx="100" cy="100" r="4" fill="#374151" />
            {/* Needle */}
            <line
              x1="100"
              y1="100"
              x2={100 + 60 * Math.cos((angle - 90) * Math.PI / 180)}
              y2={100 + 60 * Math.sin((angle - 90) * Math.PI / 180)}
              stroke="#374151"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                transition: 'all 0.5s ease-in-out'
              }}
            />
          </svg>
          <div className="gauge-value">
            <span className="gauge-number">{value}</span>
            <span className="gauge-unit">{unit}</span>
          </div>
          <div className="gauge-label">{label}</div>
          <div className="gauge-range">
            <span>0</span>
            <span>{max}</span>
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

export default GaugeWidget; 