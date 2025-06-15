import React from 'react';
import TimeSeriesWidget from './TimeSeriesWidget';
import BarChartWidget from './BarChartWidget';
import GaugeWidget from './GaugeWidget';
import StatPanelWidget from './StatPanelWidget';
import PieChartWidget from './PieChartWidget';

// Simple implementations for remaining widget types
const TableWidget = ({ widget, data = [] }) => {
  const sampleData = [
    { device: 'ESP32-001', status: 'Online', lastSeen: '2 min ago', sensors: 5 },
    { device: 'ESP32-002', status: 'Offline', lastSeen: '1 hour ago', sensors: 3 },
    { device: 'ESP32-003', status: 'Online', lastSeen: '30 sec ago', sensors: 7 },
  ];
  
  const tableData = data.length > 0 ? data : sampleData;
  const columns = Object.keys(tableData[0] || {});

  return (
    <div className="widget-container">
      <div className="widget-header">
        <h3 className="widget-title">{widget.title || 'Data Table'}</h3>
        <div className="widget-controls">
          <span className="widget-type-badge">📋 Table</span>
        </div>
      </div>
      <div className="widget-content">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col}>{col.charAt(0).toUpperCase() + col.slice(1)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index}>
                  {columns.map(col => (
                    <td key={col}>{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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

const HistogramWidget = ({ widget, data = [] }) => {
  return (
    <div className="widget-container">
      <div className="widget-header">
        <h3 className="widget-title">{widget.title || 'Histogram'}</h3>
        <div className="widget-controls">
          <span className="widget-type-badge">📊 Histogram</span>
        </div>
      </div>
      <div className="widget-content">
        <div className="histogram-placeholder">
          <p>Histogram visualization will be implemented with real data</p>
        </div>
      </div>
    </div>
  );
};

const XYChartWidget = ({ widget, data = [] }) => {
  return (
    <div className="widget-container">
      <div className="widget-header">
        <h3 className="widget-title">{widget.title || 'XY Chart'}</h3>
        <div className="widget-controls">
          <span className="widget-type-badge">📈 XY Chart</span>
        </div>
      </div>
      <div className="widget-content">
        <div className="xy-chart-placeholder">
          <p>XY Chart visualization will be implemented with real data</p>
        </div>
      </div>
    </div>
  );
};

const TrendChartWidget = ({ widget, data = [] }) => {
  return (
    <div className="widget-container">
      <div className="widget-header">
        <h3 className="widget-title">{widget.title || 'Trend Chart'}</h3>
        <div className="widget-controls">
          <span className="widget-type-badge">📉 Trend Chart</span>
        </div>
      </div>
      <div className="widget-content">
        <div className="trend-chart-placeholder">
          <p>Trend Chart visualization will be implemented with real data</p>
        </div>
      </div>
    </div>
  );
};

const WidgetFactory = ({ widget, data }) => {
  const renderWidget = () => {
    switch (widget.type) {
      case 'time_series':
        return <TimeSeriesWidget widget={widget} data={data} />;
      case 'bar_chart':
        return <BarChartWidget widget={widget} data={data} />;
      case 'gauge':
        return <GaugeWidget widget={widget} data={data} />;
      case 'stat_panel':
        return <StatPanelWidget widget={widget} data={data} />;
      case 'pie_chart':
        return <PieChartWidget widget={widget} data={data} />;
      case 'table':
        return <TableWidget widget={widget} data={data} />;
      case 'histogram':
        return <HistogramWidget widget={widget} data={data} />;
      case 'xy_chart':
        return <XYChartWidget widget={widget} data={data} />;
      case 'trend_chart':
        return <TrendChartWidget widget={widget} data={data} />;
      default:
        return (
          <div className="widget-container">
            <div className="widget-header">
              <h3 className="widget-title">Unknown Widget</h3>
            </div>
            <div className="widget-content">
              <p>Widget type "{widget.type}" not supported</p>
            </div>
          </div>
        );
    }
  };

  return renderWidget();
};

export default WidgetFactory; 