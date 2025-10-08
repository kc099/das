/**
 * LadderLayoutManager - Manages layout and positioning for ladder logic diagrams
 *
 * This utility handles:
 * - Rung-based layout with horizontal positioning
 * - Snap-to-grid positioning
 * - Node type specific placement (inputs left, outputs right, functions middle)
 * - Automatic connection generation
 */

// Ladder layout constants
// Use viewport-relative positioning for responsive layout
export const LADDER_CONFIG = {
  RUNG_HEIGHT: 80,
  RUNG_START_Y: 100,
  GRID_SIZE: 20,
  // Rails as viewport percentages (will be calculated based on viewport)
  LEFT_RAIL_PERCENT: 0.05,   // 5% from left edge
  RIGHT_RAIL_PERCENT: 0.95,  // 95% from left edge (5% from right)
  // Node zones as percentages
  INPUT_ZONE_PERCENT: 0.15,    // Inputs at 15% from left
  FUNCTION_ZONE_PERCENT: 0.5,  // Functions at 50% (middle)
  OUTPUT_ZONE_PERCENT: 0.85,   // Outputs at 85% from left
  NODE_SPACING: 120,
};

/**
 * Get viewport dimensions (should be called with viewport width)
 */
export function getViewportDimensions() {
  // Get the flow canvas element dimensions
  const canvasElement = document.querySelector('.flow-canvas');
  if (canvasElement) {
    return {
      width: canvasElement.offsetWidth,
      height: canvasElement.offsetHeight
    };
  }
  // Fallback
  return { width: 1200, height: 800 };
}

/**
 * Calculate actual X positions based on viewport
 */
export function calculateLadderPositions() {
  const { width } = getViewportDimensions();
  return {
    LEFT_RAIL_X: width * LADDER_CONFIG.LEFT_RAIL_PERCENT,
    RIGHT_RAIL_X: width * LADDER_CONFIG.RIGHT_RAIL_PERCENT,
    INPUT_ZONE_START: width * LADDER_CONFIG.INPUT_ZONE_PERCENT,
    FUNCTION_ZONE_START: width * LADDER_CONFIG.FUNCTION_ZONE_PERCENT,
    OUTPUT_ZONE_END: width * LADDER_CONFIG.OUTPUT_ZONE_PERCENT,
  };
}

/**
 * Calculate Y position for a given rung index
 */
export function getRungYPosition(rungIndex) {
  return LADDER_CONFIG.RUNG_START_Y + (rungIndex * LADDER_CONFIG.RUNG_HEIGHT);
}

/**
 * Determine which rung a dropped position belongs to
 */
export function getRungIndexFromPosition(yPosition) {
  const relativeY = yPosition - LADDER_CONFIG.RUNG_START_Y;
  const rungIndex = Math.max(0, Math.floor(relativeY / LADDER_CONFIG.RUNG_HEIGHT));
  return rungIndex;
}

/**
 * Determine if node is an input contact
 */
export function isInputNode(nodeData) {
  return nodeData.category === 'input' ||
    nodeData.nodeType === 'contact_no' ||
    nodeData.nodeType === 'contact_nc' ||
    nodeData.nodeType === 'rising_edge' ||
    nodeData.nodeType === 'falling_edge';
}

/**
 * Determine if node is an output coil
 */
export function isOutputNode(nodeData) {
  return nodeData.category === 'output' ||
    nodeData.nodeType === 'coil' ||
    nodeData.nodeType === 'coil_set' ||
    nodeData.nodeType === 'coil_reset';
}

/**
 * Get the X position for a node based on its data and position in zone
 */
export function getNodeXPosition(nodeData, positionInZone = 0) {
  const positions = calculateLadderPositions();

  // Input contacts go on the left
  if (isInputNode(nodeData)) {
    return positions.INPUT_ZONE_START + (positionInZone * LADDER_CONFIG.NODE_SPACING);
  }

  // Output coils go on the right (work backwards from right rail)
  if (isOutputNode(nodeData)) {
    return positions.OUTPUT_ZONE_END - (positionInZone * LADDER_CONFIG.NODE_SPACING);
  }

  // Everything else (functions, network, storage, etc.) goes in the middle
  return positions.FUNCTION_ZONE_START + (positionInZone * LADDER_CONFIG.NODE_SPACING);
}


/**
 * Get nodes in a specific rung
 */
export function getNodesInRung(nodes, rungIndex) {
  const rungY = getRungYPosition(rungIndex);
  const tolerance = LADDER_CONFIG.RUNG_HEIGHT / 2;

  return nodes.filter(node => {
    return Math.abs(node.position.y - rungY) < tolerance;
  }).sort((a, b) => a.position.x - b.position.x); // Sort left to right
}

/**
 * Calculate optimal position for a new node in a specific rung
 */
export function calculateDropPositionInRung(rungIndex, nodeData, existingNodes) {
  const rungY = getRungYPosition(rungIndex);
  const nodesInRung = getNodesInRung(existingNodes, rungIndex);

  // Separate nodes by type in this rung
  const inputs = nodesInRung.filter(n => isInputNode(n.data));
  const outputs = nodesInRung.filter(n => isOutputNode(n.data));
  const functions = nodesInRung.filter(n =>
    !isInputNode(n.data) && !isOutputNode(n.data)
  );

  let xPosition;

  if (isInputNode(nodeData)) {
    xPosition = getNodeXPosition(nodeData, inputs.length);
  } else if (isOutputNode(nodeData)) {
    xPosition = getNodeXPosition(nodeData, outputs.length);
  } else {
    xPosition = getNodeXPosition(nodeData, functions.length);
  }

  // CRITICAL: Center node on rung line
  // Node height is 28px (matching function blocks), so offset by -14px to center
  const NODE_HEIGHT = 28;
  const centeredY = rungY - (NODE_HEIGHT / 2);

  return { x: xPosition, y: centeredY };
}


