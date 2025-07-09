import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Widgets.css';

const BarChartWidget = ({ widget, data = [] }) => {
  // Check if this widget has a dataSource configured (from flow editor)
  const hasDataSource = widget.dataSource && widget.dataSource.type;
  
  // Sample data if no real data provided AND no dataSource configured
  const sampleData = [
    { name: 'Device 1', sensors: 12, alerts: 3 },
    { name: 'Device 2', sensors: 8, alerts: 1 },
    { name: 'Device 3', sensors: 15, alerts: 5 },
    { name: 'Device 4', sensors: 10, alerts: 2 },
    { name: 'Device 5', sensors: 6, alerts: 0 },
  ];

  // Determine what data to show
  let chartData;
  let showLoadingState = false;
  
  if (hasDataSource) {
    // Widget has a dataSource - either show real data or loading state
    if (data.length > 0) {
      chartData = data;
    } else {
      showLoadingState = true;
      chartData = []; // No sample data for dataSource widgets
    }
  } else {
    // Widget has no dataSource - show real data or sample data
    chartData = data.length > 0 ? data : sampleData;
  }

  return (
    <div className="widget-container" data-widget-type={widget.type}>
      <div className="widget-header">
        <div className="widget-header-content">
          <div className="widget-title-section">
            <h3 className="widget-title">{widget.title || 'Bar Chart'}</h3>
          </div>
        </div>
      </div>
      <div className="widget-content">
        {showLoadingState ? (
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
              Connecting to {widget.dataSource?.nodeName || 'flow node'}...
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="name" 
              stroke="#666"
              fontSize={12}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="sensors" 
              fill="var(--primary-color)" 
              radius={[2, 2, 0, 0]}
            />
            {chartData[0]?.alerts !== undefined && (
              <Bar 
                dataKey="alerts" 
                fill="var(--secondary-color)" 
                radius={[2, 2, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
      {widget.query && (
        <div className="widget-footer">
          <small className="widget-query">Query: {widget.query}</small>
        </div>
      )}
    </div>
  );
};

export default BarChartWidget; 