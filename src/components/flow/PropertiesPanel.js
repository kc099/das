import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../../styles/PropertiesPanel.css';
import { flowAPI } from '../../services/api/flow';
import { dashboardAPI } from '../../services/api/dashboard';

function PropertiesPanel({ selectedNode, onUpdateNode, onClose, projectId, flowId }) {
  const [showVisualizeModal, setShowVisualizeModal] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState('');
  const [selectedDashboard, setSelectedDashboard] = useState('');
  const [dashboards, setDashboards] = useState([]);
  const [isCreatingWidget, setIsCreatingWidget] = useState(false);
  const [isLoadingDashboards, setIsLoadingDashboards] = useState(false);

  // State to hold available variables for device nodes
  const [deviceVariables, setDeviceVariables] = useState([]);
  const wsRef = useRef(null);

  const widgetTypes = [
    { value: 'time_series', label: 'Time Series', description: 'Display data over time with line charts' },
    { value: 'bar_chart', label: 'Bar Chart', description: 'Compare values with vertical bars' },
    { value: 'gauge', label: 'Gauge', description: 'Show single values with circular gauge' },
    { value: 'stat_panel', label: 'Stat Panel', description: 'Display key metrics and statistics' },
    { value: 'pie_chart', label: 'Pie Chart', description: 'Show proportions with circular chart' },
    { value: 'table', label: 'Table', description: 'Display data in tabular format' },
  ];

  // When a device node is selected, open a websocket to gather variable names (sensor_type)
  useEffect(() => {
    // Clean up any existing socket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (!selectedNode || selectedNode.data.category !== 'device') {
      setDeviceVariables([]);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const accessToken = localStorage.getItem('access_token');

    const envBase = process.env.REACT_APP_WS_BASE_URL;
    let base;
    if (envBase) {
      base = envBase.replace(/\/$/, '');
    } else if (window.location.port === '3000') {
      base = `${protocol}://${window.location.hostname}:8000`;
    } else {
      base = `${protocol}://${window.location.host}`;
    }

    const wsUrl = `${base}/ws/sensors/${accessToken ? `?token=${encodeURIComponent(accessToken)}` : ''}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (
            data.device_id === selectedNode.data.config.deviceUuid ||
            data.device_id === selectedNode.data.config.device_id
          ) {
            const variable = data.sensor_type;
            if (variable) {
              setDeviceVariables((prev) => {
                if (prev.includes(variable)) return prev;
                return [...prev, variable];
              });
            }
          }
        } catch (e) {
          // ignore malformed data
        }
      };
    } catch (err) {
      console.error('Failed to open WebSocket for device variables', err);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [selectedNode]);

  const loadDashboards = useCallback(async () => {
    try {
      setIsLoadingDashboards(true);
      const response = await dashboardAPI.getTemplates({ project: projectId });
      
      const dashboards = response.data.results || response.data.templates || [];
      setDashboards(dashboards);
      
      // Auto-select first dashboard if available
      if (dashboards.length > 0) {
        setSelectedDashboard(dashboards[0].uuid);
      }
    } catch (error) {
      console.error('Error loading dashboards:', error);
      setDashboards([]);
    } finally {
      setIsLoadingDashboards(false);
    }
  }, [projectId]);

  // Load available dashboards when modal opens
  useEffect(() => {
    if (showVisualizeModal && projectId) {
      loadDashboards();
    }
  }, [showVisualizeModal, projectId, loadDashboards]);

  // After hooks – safely bail out on no selection
  if (!selectedNode) {
    return null;
  }

  const handleVisualizeOutput = async () => {
    if (!selectedWidgetType || !flowId || !selectedDashboard) return;

    try {
      setIsCreatingWidget(true);
      
      // Create widget configuration
      const widgetConfig = {
        widget_type: selectedWidgetType,
        dashboard_uuid: selectedDashboard,
        widget_title: `${selectedNode.data.label || selectedNode.data.nodeType} - ${widgetTypes.find(w => w.value === selectedWidgetType)?.label}`,
        node_name: selectedNode.data.label || selectedNode.data.nodeType,
        // Include selected variable for device nodes
        ...(selectedNode.data.category === 'device' && selectedNode.data.config?.variable && {
          output_field: selectedNode.data.config.variable,
          sensor_variable: selectedNode.data.config.variable
        }),
        widget_config: {
          autoRefresh: true,
          refreshInterval: 30000, // 30 seconds in milliseconds
          showLegend: selectedWidgetType === 'time_series',
          animation: selectedWidgetType !== 'table',
          // Include variable info in config for device nodes
          ...(selectedNode.data.category === 'device' && selectedNode.data.config?.variable && {
            sensorVariable: selectedNode.data.config.variable
          })
        }
      };

      // Call the backend API to create widget from node
      const response = await flowAPI.createWidgetFromNode(flowId, selectedNode.id, widgetConfig);

      // Show success message with dashboard name
      const dashboard = dashboards.find(d => d.uuid === selectedDashboard);
      alert(`Widget created successfully! A ${widgetTypes.find(w => w.value === selectedWidgetType)?.label} widget has been added to "${dashboard?.name || 'Selected Dashboard'}" to visualize the output of ${selectedNode.data.label || selectedNode.data.nodeType}.`);
      
      setShowVisualizeModal(false);
      setSelectedWidgetType('');
      setSelectedDashboard('');
    } catch (error) {
      console.error('Error creating widget:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || 'Failed to create widget. Please try again.';
      alert(errorMessage);
    } finally {
      setIsCreatingWidget(false);
    }
  };

  const updateNodeConfig = (key, value) => {
    const updatedNode = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        config: {
          ...selectedNode.data.config,
          [key]: value
        }
      }
    };
    onUpdateNode(updatedNode);
  };

  const updateNodeData = (key, value) => {
    const updatedNode = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        [key]: value
      }
    };
    onUpdateNode(updatedNode);
  };

  const renderConfigField = (key, value) => {
    const type = typeof value;
    
    if (type === 'boolean') {
      return (
        <div className="config-field" key={key}>
          <label>{key}:</label>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => updateNodeConfig(key, e.target.checked)}
          />
        </div>
      );
    }
    
    if (type === 'number') {
      return (
        <div className="config-field" key={key}>
          <label>{key}:</label>
          <input
            type="number"
            value={value}
            onChange={(e) => updateNodeConfig(key, Number(e.target.value))}
          />
        </div>
      );
    }
    
    if (type === 'string') {
      // For longer text fields, use textarea
      if (key === 'text' || key === 'code' || key === 'query' || value.length > 50) {
        return (
          <div className="config-field" key={key}>
            <label>{key}:</label>
            <textarea
              value={value}
              onChange={(e) => updateNodeConfig(key, e.target.value)}
              rows={key === 'code' ? 8 : 3}
            />
          </div>
        );
      }
      
      return (
        <div className="config-field" key={key}>
          <label>{key}:</label>
          <input
            type="text"
            value={value}
            onChange={(e) => updateNodeConfig(key, e.target.value)}
          />
        </div>
      );
    }
    
    if (Array.isArray(value)) {
      return (
        <div className="config-field" key={key}>
          <label>{key}:</label>
          <input
            type="text"
            value={value.join(', ')}
            onChange={(e) => updateNodeConfig(key, e.target.value.split(', ').filter(v => v.trim()))}
            placeholder="Comma-separated values"
          />
        </div>
      );
    }
    
    // For objects, show as JSON editor
    return (
      <div className="config-field" key={key}>
        <label>{key}:</label>
        <textarea
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              updateNodeConfig(key, parsed);
            } catch (err) {
              // Invalid JSON, don't update
            }
          }}
          rows={4}
        />
      </div>
    );
  };

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <h3>Properties</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="properties-content">
        {/* Basic node properties */}
        <div className="property-section">
          <h4>Basic Properties</h4>
          
          <div className="config-field">
            <label>Label:</label>
            <input
              type="text"
              value={selectedNode.data.label || ''}
              onChange={(e) => updateNodeData('label', e.target.value)}
            />
          </div>
          
          <div className="config-field">
            <label>Type:</label>
            <span className="readonly-field">{selectedNode.data.nodeType}</span>
          </div>
          
          <div className="config-field">
            <label>Category:</label>
            <span className="readonly-field">{selectedNode.data.category}</span>
          </div>

          {selectedNode.data.subtype && (
            <div className="config-field">
              <label>Subtype:</label>
              <span className="readonly-field">{selectedNode.data.subtype}</span>
            </div>
          )}
        </div>

        {/* Device specific section */}
        {selectedNode.data.category === 'device' && (
          <div className="property-section">
            <h4>Device Settings</h4>

            <div className="config-field">
              <label>Device:</label>
              <span className="readonly-field">{selectedNode.data.label}</span>
            </div>

            <div className="config-field">
              <label>Variable:</label>
              {deviceVariables.length > 0 ? (
                <select
                  value={selectedNode.data.config?.variable || ''}
                  onChange={(e) => updateNodeConfig('variable', e.target.value)}
                >
                  <option value="">Select variable</option>
                  {deviceVariables.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Variable name"
                  value={selectedNode.data.config?.variable || ''}
                  onChange={(e) => updateNodeConfig('variable', e.target.value)}
                />
              )}
            </div>
          </div>
        )}

        {/* Configuration properties */}
        {selectedNode.data.config && Object.keys(selectedNode.data.config).length > 0 && (
          <div className="property-section">
            <h4>Configuration</h4>
            {Object.entries(selectedNode.data.config).map(([key, value]) =>
              (key === 'variable' || key === 'deviceUuid') ? null : renderConfigField(key, value)
            )}
          </div>
        )}

        {/* Position properties */}
        <div className="property-section">
          <h4>Position</h4>
          <div className="config-field">
            <label>X:</label>
            <input
              type="number"
              value={Math.round(selectedNode.position.x)}
              onChange={(e) => {
                const updatedNode = {
                  ...selectedNode,
                  position: { ...selectedNode.position, x: Number(e.target.value) }
                };
                onUpdateNode(updatedNode);
              }}
            />
          </div>
          <div className="config-field">
            <label>Y:</label>
            <input
              type="number"
              value={Math.round(selectedNode.position.y)}
              onChange={(e) => {
                const updatedNode = {
                  ...selectedNode,
                  position: { ...selectedNode.position, y: Number(e.target.value) }
                };
                onUpdateNode(updatedNode);
              }}
            />
          </div>
        </div>

        {/* Visualize Output Section - Only for output and device nodes */}
        {projectId && (selectedNode.data.category === 'output' || selectedNode.data.category === 'device') && (
          <div className="property-section">
            <h4>Visualization</h4>
            <p className="section-description">
              Create a widget to visualize this node's output data
            </p>
            {selectedNode.data.category === 'device' && !selectedNode.data.config?.variable && (
              <div className="validation-warning">
                ⚠️ Please select a variable first before creating visualization
              </div>
            )}
            <button 
              className="visualize-button"
              onClick={() => setShowVisualizeModal(true)}
              disabled={selectedNode.data.category === 'device' && !selectedNode.data.config?.variable}
            >
              📊 Visualize Output
            </button>
          </div>
        )}
      </div>

      {/* Visualize Modal */}
      {showVisualizeModal && (
        <div className="modal-overlay" onClick={() => setShowVisualizeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Visualization</h3>
              <button 
                className="close-button"
                onClick={() => setShowVisualizeModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                Create a widget to visualize the output from <strong>{selectedNode.data.label || selectedNode.data.nodeType}</strong>
              </p>
              
              {/* Dashboard Selection */}
              <div className="form-section">
                <label htmlFor="dashboard-select">Select Dashboard:</label>
                {isLoadingDashboards ? (
                  <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>Loading dashboards...</p>
                ) : dashboards.length > 0 ? (
                  <select 
                    id="dashboard-select"
                    value={selectedDashboard} 
                    onChange={(e) => setSelectedDashboard(e.target.value)}
                    className="dashboard-select"
                  >
                    <option value="">Select a dashboard</option>
                    {dashboards.map(dashboard => (
                      <option key={dashboard.uuid} value={dashboard.uuid}>
                        {dashboard.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="no-dashboards">
                    <p>No dashboards found for this project.</p>
                    <p className="text-small">Create a dashboard first to add widgets.</p>
                  </div>
                )}
              </div>

              {/* Widget Type Selection */}
              <div className="form-section">
                <label>Widget Type:</label>
                <div className="widget-types">
                {widgetTypes.map(widget => (
                  <div 
                    key={widget.value}
                    className={`widget-type-card ${selectedWidgetType === widget.value ? 'selected' : ''}`}
                    onClick={() => setSelectedWidgetType(widget.value)}
                  >
                    <h4>{widget.label}</h4>
                    <p>{widget.description}</p>
                  </div>
                ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="secondary-button"
                onClick={() => setShowVisualizeModal(false)}
                disabled={isCreatingWidget}
              >
                Cancel
              </button>
              <button 
                className="primary-button"
                onClick={handleVisualizeOutput}
                disabled={!selectedWidgetType || !selectedDashboard || isCreatingWidget || dashboards.length === 0}
              >
                {isCreatingWidget ? 'Creating...' : 'Create Widget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertiesPanel;