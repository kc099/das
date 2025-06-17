import React from 'react';
import './PropertiesPanel.css';

function PropertiesPanel({ selectedNode, onUpdateNode, onClose }) {
  if (!selectedNode) return null;

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
      </div>
    </div>
  );
}

export default PropertiesPanel;