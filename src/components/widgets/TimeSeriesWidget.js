import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Widgets.css';

const TimeSeriesWidget = ({ widget, data = [] }) => {
  // Sample data if no real data provided
  const sampleData = [
    { timestamp: '00:00', value: 20, temperature: 22 },
    { timestamp: '04:00', value: 18, temperature: 19 },
    { timestamp: '08:00', value: 25, temperature: 26 },
    { timestamp: '12:00', value: 30, temperature: 32 },
    { timestamp: '16:00', value: 28, temperature: 29 },
    { timestamp: '20:00', value: 22, temperature: 24 },
  ];

  const chartData = data.length > 0 ? data : sampleData;

  return (
    <div className="widget-container" data-widget-type={widget.type}>
      <div className="widget-header">
        <div className="widget-header-content">
          <div className="widget-title-section">
            <h3 className="widget-title">{widget.title || 'Time Series Chart'}</h3>
          </div>
          <span className="widget-type-badge">📈 Time Series</span>
        </div>
      </div>
      <div className="widget-content">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="timestamp" 
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
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="var(--primary-color)" 
              strokeWidth={2}
              dot={{ fill: 'var(--primary-color)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'var(--primary-color)', strokeWidth: 2 }}
            />
            {chartData[0]?.temperature && (
              <Line 
                type="monotone" 
                dataKey="temperature" 
                stroke="var(--secondary-color)" 
                strokeWidth={2}
                dot={{ fill: 'var(--secondary-color)', strokeWidth: 2, r: 4 }}
              />
            )}
          </LineChart>
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

export default TimeSeriesWidget; 