import React from 'react';
import { Handle, Position } from '@xyflow/react';
import * as Icons from 'lucide-react';
import { nodeCategories } from '../../data/nodeTypes';
import '../../styles/CustomNode.css';

function CustomNode({ data, selected }) {
  const getIcon = (iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent size={14} /> : <Icons.Circle size={14} />;
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

  // Determine configuration display
  const getConfigDisplay = () => {
    if (!data.config) return null;

    // For device nodes, show device name and variable
    if (data.category === 'device') {
      return data.config.variable || 'Select variable';
    }

    // For input/output nodes, show tag
    if (data.config.tag) {
      return data.config.tag;
    }

    // For function nodes, show first config value
    const configValues = Object.values(data.config);
    if (configValues.length > 0 && configValues[0]) {
      return String(configValues[0]).substring(0, 20);
    }

    return null;
  };

  const configDisplay = getConfigDisplay();

  return (
    <div
      className={`n8n-node ${selected ? 'selected' : ''}`}
      style={{ '--node-color': color }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="n8n-handle"
      />

      {/* Node Content */}
      <div className="n8n-node-content">
        <div className="n8n-icon" style={{ backgroundColor: color }}>
          {getIcon(icon)}
        </div>
        <div className="n8n-text">
          <div className="n8n-label">{displayLabel}</div>
          {configDisplay && (
            <div className="n8n-subtitle">{configDisplay}</div>
          )}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="n8n-handle"
      />
    </div>
  );
}

export default CustomNode;
