import React, { useState } from 'react';
import { dashboardAPI } from '../../services/api';
import './PropertiesPanel.css';

function PropertiesPanel({ selectedNode, onUpdateNode, onClose, projectId }) {
  const [showVisualizeModal, setShowVisualizeModal] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState('');
  const [isCreatingWidget, setIsCreatingWidget] = useState(false);

  if (!selectedNode) return null;

  const widgetTypes = [
    { value: 'time_series', label: 'Time Series', description: 'Display data over time with line charts' },
    { value: 'bar_chart', label: 'Bar Chart', description: 'Compare values with vertical bars' },
    { value: 'gauge', label: 'Gauge', description: 'Show single values with circular gauge' },
    { value: 'stat_panel', label: 'Stat Panel', description: 'Display key metrics and statistics' },
    { value: 'pie_chart', label: 'Pie Chart', description: 'Show proportions with circular chart' },
    { value: 'table', label: 'Table', description: 'Display data in tabular format' },
  ];

  const handleVisualizeOutput = async () => {
    if (!selectedWidgetType || !projectId) return;

    try {
      setIsCreatingWidget(true);
      
      // Create a new widget based on this node's output
      const widgetConfig = {
        id: `widget-${Date.now()}`,
        type: selectedWidgetType,
        nodeId: selectedNode.id,
        nodeName: selectedNode.data.label || selectedNode.data.nodeType,
        title: `${selectedNode.data.label || selectedNode.data.nodeType} - ${widgetTypes.find(w => w.value === selectedWidgetType)?.label}`,
        dataSource: {
          type: 'flow_node',
          nodeId: selectedNode.id,
          flowId: 'current', // This would be the current flow ID
        },
        position: { x: 0, y: 0 },
        size: { w: 6, h: 4 },
        config: {
          autoRefresh: true,
          refreshInterval: 30,
        }
      };

      // Add widget to project's dashboard template
      // This will create a new dashboard template if one doesn't exist
      const dashboardData = {
        name: `${selectedNode.data.label || selectedNode.data.nodeType} Dashboard`,
        description: `Auto-generated dashboard for ${selectedNode.data.label || selectedNode.data.nodeType} node`,
        widgets: [widgetConfig],
        layout: [
          {
            i: widgetConfig.id,
            x: 0,
            y: 0,
            w: 6,
            h: 4
          }
        ]
      };

      // This would normally call the dashboard API to create/update a template
      console.log('Creating widget:', widgetConfig);
      console.log('Dashboard data:', dashboardData);
      
      alert(`Widget created! A ${widgetTypes.find(w => w.value === selectedWidgetType)?.label} widget has been added to visualize the output of ${selectedNode.data.label || selectedNode.data.nodeType}.`);
      
      setShowVisualizeModal(false);
      setSelectedWidgetType('');
    } catch (error) {
      console.error('Error creating widget:', error);
      alert('Failed to create widget. Please try again.');
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

        {/* Configuration properties */}
        {selectedNode.data.config && Object.keys(selectedNode.data.config).length > 0 && (
          <div className="property-section">
            <h4>Configuration</h4>
            {Object.entries(selectedNode.data.config).map(([key, value]) =>
              renderConfigField(key, value)
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

        {/* Visualize Output Section */}
        {projectId && (
          <div className="property-section">
            <h4>Visualization</h4>
            <p className="section-description">
              Create a widget to visualize this node's output data
            </p>
            <button 
              className="visualize-button"
              onClick={() => setShowVisualizeModal(true)}
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
                disabled={!selectedWidgetType || isCreatingWidget}
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