import React, { useState, useEffect, useCallback } from 'react';
import { flowAPI } from '../../services/api/flow';
import './WidgetPropertiesPanel.css';

const WidgetPropertiesPanel = ({ widget, onClose, onUpdate, projectUuid }) => {
  const [formData, setFormData] = useState({
    title: widget.title || '',
    type: widget.type || '',
    config: widget.config || {},
    dataSource: widget.dataSource || {}
  });
  const [dataSourceStatus, setDataSourceStatus] = useState('checking');
  const [nodeOutputData, setNodeOutputData] = useState(null);

  const checkDataSourceStatus = useCallback(async () => {
    if (!widget.dataSource || widget.dataSource.type !== 'flow_node') {
      setDataSourceStatus('no_source');
      return;
    }

    try {
      setDataSourceStatus('checking');
      
      // Try to get current node output to verify data source is active
      // For device nodes, include sensor type if available
      const params = {};
      if (widget.config && widget.config.sensorVariable) {
        params.sensor_type = widget.config.sensorVariable;
      }
      
      const response = await flowAPI.getNodeOutput(
        widget.dataSource.flowUuid, 
        widget.dataSource.nodeId,
        params
      );
      
      if (response.data && response.data.output) {
        setDataSourceStatus('active');
        setNodeOutputData(response.data.output);
      } else {
        setDataSourceStatus('inactive');
      }
    } catch (error) {
      console.error('Error checking data source status:', error);
      setDataSourceStatus('error');
    }
  }, [widget.dataSource, widget.config]);

  useEffect(() => {
    // Check data source status when panel opens
    checkDataSourceStatus();
  }, [checkDataSourceStatus]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfigChange = (configKey, value) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [configKey]: value
      }
    }));
  };

  const handleSave = () => {
    onUpdate(formData);
    onClose();
  };

  const getDataSourceStatusIcon = () => {
    switch (dataSourceStatus) {
      case 'active': return '🟢';
      case 'inactive': return '🟡';
      case 'error': return '🔴';
      case 'checking': return '🔄';
      case 'no_source': return '⚫';
      default: return '❓';
    }
  };

  const getDataSourceStatusText = () => {
    switch (dataSourceStatus) {
      case 'active': return 'Data source is active and providing data';
      case 'inactive': return 'Data source exists but no recent data';
      case 'error': return 'Error connecting to data source';
      case 'checking': return 'Checking data source status...';
      case 'no_source': return 'No data source configured';
      default: return 'Unknown status';
    }
  };

  return (
    <div className="widget-properties-overlay" onClick={onClose}>
      <div className="widget-properties-panel" onClick={e => e.stopPropagation()}>
        <div className="properties-header">
          <h3>Widget Properties</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="properties-content">
          {/* Basic Properties */}
          <div className="property-section">
            <h4>Basic Settings</h4>
            
            <div className="form-field">
              <label>Widget Title:</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter widget title"
              />
            </div>

            <div className="form-field">
              <label>Widget Type:</label>
              <span className="readonly-field">{formData.type}</span>
            </div>
          </div>

          {/* Data Source Information */}
          <div className="property-section">
            <h4>Data Source</h4>
            
            <div className="data-source-status">
              <div className="status-indicator">
                <span className="status-icon">{getDataSourceStatusIcon()}</span>
                <span className="status-text">{getDataSourceStatusText()}</span>
              </div>
              <button 
                className="refresh-status-btn"
                onClick={checkDataSourceStatus}
                disabled={dataSourceStatus === 'checking'}
              >
                🔄 Refresh
              </button>
            </div>

            {formData.dataSource && formData.dataSource.type === 'flow_node' && (
              <div className="data-source-details">
                <div className="form-field">
                  <label>Flow UUID:</label>
                  <span className="readonly-field">{formData.dataSource.flowUuid}</span>
                </div>
                
                <div className="form-field">
                  <label>Node ID:</label>
                  <span className="readonly-field">{formData.dataSource.nodeId}</span>
                </div>

                <div className="form-field">
                  <label>Node Name:</label>
                  <span className="readonly-field">{formData.dataSource.nodeName || 'Flow Node'}</span>
                </div>

                <div className="form-field">
                  <label>Auto Refresh:</label>
                  <span className="readonly-field">
                    {formData.dataSource.autoRefresh ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="form-field">
                  <label>Refresh Interval:</label>
                  <span className="readonly-field">
                    {formData.dataSource.refreshInterval / 1000}s
                  </span>
                </div>
              </div>
            )}

            {nodeOutputData && (
              <div className="current-data-preview">
                <h5>Current Data Preview:</h5>
                <pre className="data-preview">
                  {JSON.stringify(nodeOutputData, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Widget Configuration */}
          <div className="property-section">
            <h4>Widget Configuration</h4>
            
            {formData.type === 'time_series' && (
              <>
                <div className="form-field">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.config.showLegend || false}
                      onChange={(e) => handleConfigChange('showLegend', e.target.checked)}
                    />
                    Show Legend
                  </label>
                </div>
                
                <div className="form-field">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.config.animation !== false}
                      onChange={(e) => handleConfigChange('animation', e.target.checked)}
                    />
                    Enable Animation
                  </label>
                </div>
              </>
            )}

            {formData.type === 'gauge' && (
              <>
                <div className="form-field">
                  <label>Min Value:</label>
                  <input
                    type="number"
                    value={formData.config.min || 0}
                    onChange={(e) => handleConfigChange('min', Number(e.target.value))}
                  />
                </div>
                
                <div className="form-field">
                  <label>Max Value:</label>
                  <input
                    type="number"
                    value={formData.config.max || 100}
                    onChange={(e) => handleConfigChange('max', Number(e.target.value))}
                  />
                </div>
              </>
            )}

            <div className="form-field">
              <label>Auto Refresh:</label>
              <select
                value={formData.config.autoRefresh ? 'enabled' : 'disabled'}
                onChange={(e) => handleConfigChange('autoRefresh', e.target.value === 'enabled')}
              >
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            <div className="form-field">
              <label>Refresh Interval (seconds):</label>
              <input
                type="number"
                min="5"
                max="300"
                value={(formData.config.refreshInterval || 30000) / 1000}
                onChange={(e) => handleConfigChange('refreshInterval', Number(e.target.value) * 1000)}
              />
            </div>
          </div>
        </div>

        <div className="properties-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetPropertiesPanel;