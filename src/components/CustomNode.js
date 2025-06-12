import React from 'react';
import { Handle, Position } from '@xyflow/react';
import * as Icons from 'lucide-react';
import { nodeCategories } from '../data/nodeTypes';
import './CustomNode.css';

function CustomNode({ data, selected }) {
  const getIcon = (iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent size={14} /> : <Icons.Circle size={14} />;
  };

  const getEssentialConfig = (data) => {
    const { category, nodeType, config } = data;
    
    if (!config) return null;

    // Define what to show for each node type
    const essentialKeys = {
      // Input nodes
      button: ['text'],
      slider: ['value'],
      text: ['placeholder'],
      number: ['value'],
      
      // Output nodes
      digital: ['state'],
      analog: ['value'],
      display: ['format'],
      
      // Function nodes
      movingAverage: ['windowSize'],
      min: ['windowSize'],
      max: ['windowSize'],
      customPython: [], // Show nothing, too complex
      
      // Network nodes
      mqtt: ['topic'],
      http: ['method'],
      websocket: ['url'],
      
      // Storage nodes
      mysql: ['database'],
      postgres: ['database']
    };

    const keys = essentialKeys[nodeType] || essentialKeys[data.subtype] || [];
    if (keys.length === 0) return null;

    return keys.slice(0, 1).map(key => {
      if (!config[key]) return null;
      const value = config[key];
      const displayValue = typeof value === 'string' && value.length > 20 
        ? value.substring(0, 20) + '...' 
        : String(value);
      
      return (
        <div key={key} className="config-item">
          <span className="config-value-only">{displayValue}</span>
        </div>
      );
    }).filter(Boolean);
  };

  const getCategoryInfo = () => {
    const category = nodeCategories[data.category];
    if (!category) return { color: '#6366f1', icon: 'Circle' };
    
    const node = category.nodes[data.nodeType];
    return {
      color: category.color,
      icon: node?.icon || 'Circle'
    };
  };

  const { color, icon } = getCategoryInfo();
  const displayLabel = data.label || data.nodeType;

  // Determine if node should have input/output handles
  const hasInput = data.nodeType !== 'input' || data.category !== 'common';
  const hasOutput = data.nodeType !== 'output' || data.category !== 'common';

  return (
    <div
      className={`custom-node ${selected ? 'selected' : ''}`}
      style={{ borderColor: color }}
    >
      {/* Input Handle */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="node-handle"
        />
      )}

      {/* Node Content */}
      <div className="node-header" style={{ backgroundColor: color }}>
        <div className="node-icon">
          {getIcon(icon)}
        </div>
        <span className="node-title">{displayLabel}</span>
      </div>

      <div className="node-body">
        {/* Show subtype for nodes that have it */}
        {data.subtype && (
          <div className="node-subtype">
            {data.subtype}
          </div>
        )}

        {/* Show only the most essential config value */}
        {data.config && (
          <div className="node-config">
            {getEssentialConfig(data)}
          </div>
        )}

        {/* Node status indicator */}
        <div className="node-status">
          <div className="status-dot" />
          <span className="status-text">Ready</span>
        </div>
      </div>

      {/* Output Handle */}
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="node-handle"
        />
      )}
    </div>
  );
}

export default CustomNode;