import React from 'react';
import { Handle, Position } from '@xyflow/react';
import * as Icons from 'lucide-react';
import { nodeCategories } from '../../data/nodeTypes';
import '../../styles/CustomNode.css';

function CustomNode({ data, selected }) {
  const getIcon = (iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent size={12} /> : <Icons.Circle size={12} />;
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

  // Check if this is an input/output element
  const isInput = data.category === 'input';
  const isOutput = data.category === 'output';
  const isContact = data.nodeType === 'contact_no' || data.nodeType === 'contact_nc';
  const isCoil = data.nodeType === 'coil' || data.nodeType === 'coil_set' || data.nodeType === 'coil_reset';
  const isEdge = data.nodeType === 'rising_edge' || data.nodeType === 'falling_edge';

  // Determine if node should have input/output handles
  const hasInput = data.nodeType !== 'input' || data.category !== 'common';
  const hasOutput = data.nodeType !== 'output' || data.category !== 'common';

  // Render input/output nodes (same style as function blocks)
  if (isInput || isOutput) {
    return (
      <div
        className={`custom-node-minimal ${selected ? 'selected' : ''}`}
        style={{ backgroundColor: color }}
      >
        {!isInput && (
          <Handle
            type="target"
            position={Position.Left}
            id="input"
            className="minimal-handle"
          />
        )}

        <div className="minimal-content">
          <div className="minimal-icon">
            {getIcon(icon)}
          </div>
          <span className="minimal-title">{data.config?.tag || displayLabel}</span>
        </div>

        {!isOutput && (
          <Handle
            type="source"
            position={Position.Right}
            id="output"
            className="minimal-handle"
          />
        )}
      </div>
    );
  }

  // Render standard node (for function blocks, etc.)
  return (
    <div
      className={`custom-node-minimal ${selected ? 'selected' : ''}`}
      style={{ backgroundColor: color }}
    >
      {/* Input Handle */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="minimal-handle"
        />
      )}

      {/* Node Content - Just icon and name */}
      <div className="minimal-content">
        <div className="minimal-icon">
          {getIcon(icon)}
        </div>
        <span className="minimal-title">{displayLabel}</span>
      </div>

      {/* Output Handle */}
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="minimal-handle"
        />
      )}
    </div>
  );
}

export default CustomNode;