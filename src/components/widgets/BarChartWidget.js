import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Widgets.css';

const BarChartWidget = ({ widget, data = [] }) => {
  // Sample data if no real data provided
  const sampleData = [
    { name: 'Device 1', sensors: 12, alerts: 3 },
    { name: 'Device 2', sensors: 8, alerts: 1 },
    { name: 'Device 3', sensors: 15, alerts: 5 },
    { name: 'Device 4', sensors: 10, alerts: 2 },
    { name: 'Device 5', sensors: 6, alerts: 0 },
  ];

  const chartData = data.length > 0 ? data : sampleData;

  return (
    <div className="widget-container">
      <div className="widget-header">
        <h3 className="widget-title">{widget.title || 'Bar Chart'}</h3>
        <div className="widget-controls">
          <span className="widget-type-badge">📊 Bar Chart</span>
        </div>
      </div>
      <div className="widget-content">
        <ResponsiveContainer width="100%" height={300}>
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