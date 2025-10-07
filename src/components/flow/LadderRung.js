import React from 'react';
import '../../styles/LadderRung.css';
import { LADDER_CONFIG, calculateLadderPositions } from '../../utils/LadderLayoutManager';

/**
 * LadderRung - Visual representation of a ladder logic rung
 *
 * Shows:
 * - Rung number
 * - Left and right power rails
 * - Horizontal bus bar
 */
function LadderRung({ rungIndex, yPosition, isActive, nodeCount }) {
  const positions = { LEFT_RAIL_X: LADDER_CONFIG.LEFT_RAIL_X, RIGHT_RAIL_X: LADDER_CONFIG.RIGHT_RAIL_X, ...calculateLadderPositions() };
  const width = positions.RIGHT_RAIL_X - positions.LEFT_RAIL_X;

  return (
    <div
      className={`ladder-rung ${isActive ? 'active' : ''}`}
      style={{
        position: 'absolute',
        top: `${yPosition}px`,
        left: `${positions.LEFT_RAIL_X}px`,
        width: `${width}px`,
        height: '2px',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Rung Number Label */}
      <div className="rung-label">
        {rungIndex}
      </div>

      {/* Left Power Rail Connection Point */}
      <div
        className="rail-connection left"
        style={{ left: '0px' }}
      />

      {/* Horizontal Bus Bar */}
      <div className="rung-bus-bar" />

      {/* Right Power Rail Connection Point */}
      <div
        className="rail-connection right"
        style={{ right: '0px' }}
      />
    </div>
  );
}

export default LadderRung;
