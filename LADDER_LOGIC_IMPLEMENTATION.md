# Ladder Logic Implementation Documentation

## Overview

This document explains the implementation of a ladder logic programming interface built on top of ReactFlow. The system allows users to create ladder logic programs by dragging nodes onto rungs and manually connecting them.

## Core Concepts

### Ladder Logic Basics
- **Rungs**: Horizontal lines where logic elements are placed (like rungs on a ladder)
- **Power Rails**: Vertical lines on left and right edges representing power flow
- **Nodes**: Logic elements (input contacts, output coils, functions) placed on rungs
- **Connections**: Lines drawn between nodes showing logic flow

### Key Design Principles

1. **Viewport-Relative Positioning**: All positions are calculated as percentages of viewport width, making the layout responsive to window resizing
2. **Rung-Based Snapping**: Nodes automatically snap to the center of selected rungs when dropped or dragged
3. **Manual Connections**: Users draw connections between nodes manually (auto-connect disabled)
4. **Fixed Layout Containers**: Properties panel and node palette have fixed widths to prevent layout shifts

## File Structure

### Core Components

#### 1. `/src/pages/FlowEditor.js`
**Purpose**: Main editor component that orchestrates the entire ladder logic interface

**Key Features**:
- Manages rungs state (`rungs`, `selectedRung`)
- Handles node drop with rung-based positioning
- Implements node snapping on drag end
- Renders ReactFlow canvas with power rails and rungs
- Fixed-width properties panel container (320px)

**Important State**:
```javascript
const [rungs, setRungs] = useState([0]); // Array of rung indices
const [selectedRung, setSelectedRung] = useState(0); // Currently selected rung
const [nodes, setNodes, onNodesChange] = useNodesState([]);
const [edges, setEdges, onEdgesChange] = useEdgesState([]);
```

**ReactFlow Configuration**:
- `defaultViewport={{ x: 0, y: 0, zoom: 1 }}`: Fixed zoom level
- `zoomOnScroll={false}`: Disable zoom
- `selectNodesOnDrag={false}`: Prevent grouped dragging
- `snapToGrid={true}`, `snapGrid={[20, 20]}`: Grid snapping

#### 2. `/src/utils/LadderLayoutManager.js`
**Purpose**: Core positioning logic for ladder elements

**Key Constants**:
```javascript
export const LADDER_CONFIG = {
  RUNG_HEIGHT: 80,           // Vertical spacing between rungs
  RUNG_START_Y: 100,         // Y position of first rung
  GRID_SIZE: 20,             // Grid snap size
  LEFT_RAIL_PERCENT: 0.05,   // Left rail at 5% of viewport width
  RIGHT_RAIL_PERCENT: 0.95,  // Right rail at 95% of viewport width
  INPUT_ZONE_PERCENT: 0.15,  // Input nodes at 15% from left
  FUNCTION_ZONE_PERCENT: 0.5,// Function nodes in middle (50%)
  OUTPUT_ZONE_PERCENT: 0.85, // Output nodes at 85% from left
  NODE_SPACING: 120,         // Horizontal spacing between nodes
};
```

**Key Functions**:

- `getViewportDimensions()`: Gets canvas element dimensions
- `calculateLadderPositions()`: Converts percentages to actual pixel positions
- `getRungYPosition(rungIndex)`: Calculates Y position for a rung
- `isInputNode(nodeData)`: Checks if node is an input contact
- `isOutputNode(nodeData)`: Checks if node is an output coil
- `getNodeXPosition(nodeData, positionInZone)`: Calculates X position based on node type
- `calculateDropPositionInRung(rungIndex, nodeData, existingNodes)`: Main positioning logic for dropped nodes
- `getNodesInRung(nodes, rungIndex)`: Filters nodes in a specific rung
- `getRungIndexFromPosition(yPosition)`: Determines which rung a Y position belongs to

**Positioning Algorithm**:
```javascript
// 1. Calculate rung Y position
const rungY = RUNG_START_Y + (rungIndex * RUNG_HEIGHT);

// 2. Calculate X position based on node type
const positions = calculateLadderPositions();
if (isInputNode) {
  x = positions.INPUT_ZONE_START + (count * NODE_SPACING);
} else if (isOutputNode) {
  x = positions.OUTPUT_ZONE_END - (count * NODE_SPACING);
} else {
  x = positions.FUNCTION_ZONE_START + (count * NODE_SPACING);
}

// 3. Center node on rung line (NODE_HEIGHT = 28px)
const centeredY = rungY - (NODE_HEIGHT / 2);
```

#### 3. `/src/components/flow/CustomNode.js`
**Purpose**: Renders individual nodes with consistent styling

**Node Types**:
- Input contacts: Blue background, shows tag (e.g., "I0.0")
- Output coils: Red background, shows tag (e.g., "Q0.0")
- Function blocks: Green background, shows label

**Styling**: All nodes use `custom-node-minimal` class (100-140px wide, 28px tall)

#### 4. `/src/components/flow/PowerRails.js`
**Purpose**: Renders vertical power rails on left and right

**Implementation**:
- Uses `calculateLadderPositions()` for dynamic positioning
- Rendered as absolutely positioned divs within ReactFlow
- Height spans all rungs with 50px padding above/below
- 4px wide blue vertical lines

#### 5. `/src/components/flow/LadderRung.js`
**Purpose**: Renders horizontal rung lines

**Implementation**:
- Positioned at `getRungYPosition(rungIndex)`
- Spans from LEFT_RAIL_X to RIGHT_RAIL_X
- Shows rung number on left side
- Active rung highlighted in green
- 2px height gray line (green when selected)

#### 6. `/src/components/flow/NodePalette.js`
**Purpose**: Left sidebar with draggable node templates

**Width**: 280px fixed

**Node Categories**:
- Input Contacts (blue)
- Output Coils (red)
- Function (green)
- Network (orange)
- Storage (purple)
- Device (cyan)

#### 7. `/src/components/flow/PropertiesPanel.js`
**Purpose**: Right sidebar showing selected node properties

**Container**: Wrapped in `.properties-panel-container` (320px fixed width)

### CSS Files

#### `/src/styles/CustomNode.css`
- `.custom-node-minimal`: Standard node styling (100-140px wide, 28px tall)
- `.minimal-content`: Flexbox layout for icon and label
- `.minimal-handle`: Connection point styling
- Overrides for ReactFlow default node styles

#### `/src/styles/FlowEditor.css`
- `.flow-editor`: Main container (full viewport height)
- `.flow-content`: Flex container for palette, canvas, properties
- `.flow-canvas`: Flex-grow canvas area
- `.properties-panel-container`: Fixed 320px width container
- Header and button styles

#### `/src/styles/LadderRung.css`
- `.ladder-rung`: Horizontal rung line styling
- `.ladder-rung.active`: Green highlight for selected rung
- `.rung-label`: Rung number display
- `.rung-bus-bar`: Horizontal line appearance

#### `/src/styles/PowerRails.css`
- `.power-rail`: Base rail styling
- `.left-rail`, `.right-rail`: Specific rail styles

#### `/src/styles/NodePalette.css`
- `.node-palette`: 280px fixed width sidebar
- Category and node item styling

## Data Flow

### 1. Adding a Node

```
User drags node from palette
  ↓
onDrop event fires
  ↓
Get selected rung from state
  ↓
calculateDropPositionInRung(selectedRung, nodeData, existingNodes)
  ↓
Calculate X based on node type and existing nodes in rung
Calculate Y by centering on rung line
  ↓
Create new node with calculated position
  ↓
Add to nodes state
  ↓
Node renders on canvas
```

### 2. Dragging a Node

```
User drags existing node
  ↓
handleNodesChange receives position changes
  ↓
On drag end (dragging === false):
  ↓
Calculate center Y of dragged node
  ↓
getRungIndexFromPosition(centerY)
  ↓
Calculate new position centered on that rung
  ↓
Snap to grid (20px)
  ↓
Update node position
```

### 3. Creating Connections

```
User clicks output handle
  ↓
Drags to input handle
  ↓
onConnect event fires
  ↓
addEdge(params, edges)
  ↓
Connection rendered
```

## Configuration

### Responsive Layout

All horizontal positions use viewport percentages:
- Left rail: 5% of viewport width
- Input zone: 15% of viewport width
- Function zone: 50% of viewport width (center)
- Output zone: 85% of viewport width
- Right rail: 95% of viewport width

This ensures the layout adapts to different screen sizes without hardcoded pixel values.

### Node Height Calculation

Node height: 28px (matching function blocks)
Rung line position: Y = 100 + (rungIndex × 80)
Node top-left Y: rungY - 14 (to center 28px node on line)

## User Workflow

1. **Select Rung**: Use dropdown in header to select target rung (highlighted in green)
2. **Add Nodes**: Drag nodes from palette onto canvas - they snap to selected rung
3. **Position Nodes**: Drag nodes horizontally to reorder (they snap back to same rung)
4. **Connect Nodes**: Click output handle → drag to input handle
5. **Configure**: Click node to open properties panel
6. **Add Rungs**: Click "+ Rung" to add new rungs
7. **Delete Rungs**: Select rung and click "Delete" (cannot delete last rung)

## Important Implementation Notes

### Why Percentage-Based Positioning?

Original attempts used hardcoded pixel values which broke when:
- Window was resized
- Properties panel opened/closed
- Different screen sizes were used

Solution: Calculate all X positions as percentages of viewport width in `calculateLadderPositions()`

### Why Disable fitView?

ReactFlow's `fitView` transforms the coordinate system, causing nodes to appear at wrong positions. Using `defaultViewport={{ x: 0, y: 0, zoom: 1 }}` keeps coordinates stable.

### Why Fixed-Width Containers?

When properties panel appeared/disappeared, the canvas width changed, causing rungs to resize and nodes to appear misaligned. Fixed-width containers (280px palette, 320px properties) prevent this.

### Why Disable Auto-Connect?

Auto-connect logic was unreliable for new rungs and prevented users from controlling connection order. Manual connections give users full control.

### Why selectNodesOnDrag={false}?

By default, dragging one node moves all selected nodes together. Setting this to false allows individual node dragging.

## Troubleshooting

### Nodes not snapping to rungs
- Check NODE_HEIGHT constant matches actual node height (28px)
- Verify getRungIndexFromPosition uses center Y, not top-left Y
- Ensure handleNodesChange is using correct offset calculation

### Rungs appearing in wrong position
- Check RUNG_START_Y and RUNG_HEIGHT constants
- Verify PowerRails and LadderRung use same positioning logic
- Check for CSS positioning conflicts

### Layout shifting when properties panel opens
- Verify `.properties-panel-container` has fixed width
- Check that `.flow-canvas` uses flex-grow, not fixed width

### Nodes appearing at wrong X position
- Check calculateLadderPositions() is using actual viewport width
- Verify getNodeXPosition() uses percentage-based positions
- Check for canvas offset issues

## Future Enhancements

1. **Validation**: Add logic to validate ladder programs (inputs before outputs, etc.)
2. **Export/Import**: Serialize ladder logic to IEC 61131-3 format
3. **Simulation**: Add runtime simulation mode
4. **Branching**: Support parallel branches within a rung
5. **Undo/Redo**: Implement history management
6. **Keyboard Shortcuts**: Add keyboard navigation and commands
