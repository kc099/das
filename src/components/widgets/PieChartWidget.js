import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './Widgets.css';

const PieChartWidget = ({ widget, data = [] }) => {
  // Check if this widget has a dataSource configured (from flow editor)
  const hasDataSource = widget.dataSource && widget.dataSource.type;
  
  // Sample data if no real data provided AND no dataSource configured
  const sampleData = [
    { name: 'Temperature', value: 35, color: '#22c55e' },
    { name: 'Humidity', value: 25, color: '#059669' },
    { name: 'Pressure', value: 20, color: '#10b981' },
    { name: 'Motion', value: 15, color: '#047857' },
    { name: 'Light', value: 5, color: '#065f46' },
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
  
  // Generate colors if not provided
  const colors = ['#22c55e', '#059669', '#10b981', '#047857', '#065f46', '#064e3b'];
  const dataWithColors = chartData.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length]
  }));

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="widget-container" data-widget-type={widget.type}>
      <div className="widget-header">
        <div className="widget-header-content">
          <div className="widget-title-section">
            <h3 className="widget-title">{widget.title || 'Pie Chart'}</h3>
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
            <PieChart>
            <Pie
              data={dataWithColors}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {dataWithColors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
            />
          </PieChart>
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

export default PieChartWidget; 