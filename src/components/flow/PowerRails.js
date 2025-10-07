import React from 'react';
import { LADDER_CONFIG, calculateLadderPositions } from '../../utils/LadderLayoutManager';
import '../../styles/PowerRails.css';

/**
 * PowerRails - Renders vertical power rails for ladder logic
 *
 * These rails are rendered within ReactFlow's coordinate system
 * so they pan and zoom with the canvas correctly
 */
function PowerRails({ rungs }) {
  const positions = calculateLadderPositions();

  // Calculate the height needed to span all rungs
  const maxRungIndex = Math.max(...rungs);
  const minY = LADDER_CONFIG.RUNG_START_Y - 50; // Start above first rung
  const maxY = LADDER_CONFIG.RUNG_START_Y + (maxRungIndex * LADDER_CONFIG.RUNG_HEIGHT) + 50; // End below last rung
  const height = maxY - minY;

  return (
    <>
      {/* Left Power Rail */}
      <div
        className="power-rail left-rail"
        style={{
          position: 'absolute',
          left: `${positions.LEFT_RAIL_X}px`,
          top: `${minY}px`,
          width: '4px',
          height: `${height}px`,
          backgroundColor: '#2563eb',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Right Power Rail */}
      <div
        className="power-rail right-rail"
        style={{
          position: 'absolute',
          left: `${positions.RIGHT_RAIL_X}px`,
          top: `${minY}px`,
          width: '4px',
          height: `${height}px`,
          backgroundColor: '#2563eb',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
    </>
  );
}

export default PowerRails;
