import React from 'react';
import { Handle, Position } from '@xyflow/react';
import './CommentNode.css';

function CommentNode({ data, selected }) {
  const commentText = data.config?.text || 'Add your comment...';
  const displayLabel = data.label || 'Comment';

  return (
    <div className={`comment-node ${selected ? 'selected' : ''}`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="comment-handle"
      />

      {/* Speech Bubble */}
      <div className="speech-bubble">
        <div className="bubble-header">
          <span className="comment-title">{displayLabel}</span>
        </div>
        <div className="bubble-content">
          {commentText}
        </div>
        <div className="bubble-tail"></div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="comment-handle"
      />
    </div>
  );
}

export default CommentNode;