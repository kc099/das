import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../../styles/Widgets.css';

const TimeSeriesWidget = ({ widget, data = [] }) => {
  // Check if this widget has a dataSource configured (from flow editor)
  const hasDataSource = widget.dataSource && widget.dataSource.type;

  // Sample data if no real data provided AND no dataSource configured
  const sampleData = [
    { timestamp: '00:00', value: 20, temperature: 22 },
    { timestamp: '04:00', value: 18, temperature: 19 },
    { timestamp: '08:00', value: 25, temperature: 26 },
    { timestamp: '12:00', value: 30, temperature: 32 },
    { timestamp: '16:00', value: 28, temperature: 29 },
    { timestamp: '20:00', value: 22, temperature: 24 },
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
    <div className="widget-container" data-widget-type={widget.type} style={{ 
      width: '100%', 
      height: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="widget-header">
        <div className="widget-header-content">
          <div className="widget-title-section">
            <h3 className="widget-title">{widget.title || 'Time Series Chart'}</h3>
          </div>
        </div>
      </div>
      <div className="widget-content" style={{ 
        flex: 1,
        width: '100%', 
        maxWidth: '100%',
        overflow: 'hidden',
        padding: '1rem',
        minHeight: '200px'
      }}>
        {showLoadingState ? (
          <div className="widget-loading-state" style={{
            display: 'flex',
            flexDirection: 'column',
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
            <LineChart data={chartData} onError={(error) => console.error('📈 LineChart Error:', error)}>
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
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
            />
            {chartData[0]?.temperature && (
              <Line 
                type="monotone" 
                dataKey="temperature" 
                stroke="#059669"
                strokeWidth={2}
                dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
              />
            )}
          </LineChart>
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

export default TimeSeriesWidget; 