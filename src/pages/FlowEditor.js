import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import NodePalette from '../components/flow/NodePalette';
import CustomNode from '../components/flow/CustomNode';
import PropertiesPanel from '../components/flow/PropertiesPanel';
import LadderRung from '../components/flow/LadderRung';
import PowerRails from '../components/flow/PowerRails';
import { nodeCategories, flowMetadata } from '../data/nodeTypes';
import { flowAPI } from '../services/api';
import { deviceAPI } from '../services/api/device';
import {
  calculateDropPositionInRung,
  getNodesInRung,
  getRungYPosition,
  getRungIndexFromPosition,
} from '../utils/LadderLayoutManager';
import '../styles/FlowEditor.css';

const nodeTypes = {
  input: CustomNode,
  output: CustomNode,
  function: CustomNode,
  network: CustomNode,
  storage: CustomNode,
  device: CustomNode,
};

function FlowEditor() {
  const navigate = useNavigate();
  const { projectUuid, flowId } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowMeta, setFlowMeta] = useState(flowMetadata);
  const [paletteCategories, setPaletteCategories] = useState(nodeCategories);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [currentFlowId, setCurrentFlowId] = useState(flowId);
  const [saveStatus, setSaveStatus] = useState('');
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [rungs, setRungs] = useState([0]); // Track manually created rungs
  const [selectedRung, setSelectedRung] = useState(0); // Currently selected rung for dropping nodes

  const loadFlowFromAPI = useCallback(async (id) => {
    try {
      const response = await flowAPI.getFlow(id);
      const flowData = response.data;

      setNodes(flowData.nodes || []);
      setEdges(flowData.edges || []);
      setFlowMeta({
        name: flowData.name,
        description: flowData.description,
        version: flowData.version,
        tags: flowData.tags,
        metadata: flowData.metadata
      });
      setCurrentFlowId(id);
    } catch (error) {
      console.error('Error loading flow:', error);
      alert('Error loading flow: ' + (error.response?.data?.detail || error.message));
    }
  }, [setNodes, setEdges, setFlowMeta, setCurrentFlowId]);

  // Load flow on component mount or flowId change
  useEffect(() => {
    if (flowId) {
      loadFlowFromAPI(flowId);
    }
  }, [flowId, loadFlowFromAPI]);

  // Fetch devices for the project and populate the Device category in the palette
  useEffect(() => {
    async function fetchDevices() {
      if (!projectUuid) return;
      try {
        const response = await deviceAPI.getDevicesByProject(projectUuid);
        const devices = response.data?.results || response.data || [];

        // Build nodes for each device
        const deviceNodes = {};
        devices.forEach((dev) => {
          deviceNodes[dev.uuid] = {
            label: dev.name,
            icon: 'HardDrive',
            config: {
              deviceUuid: dev.uuid,
              variable: ''
            }
          };
        });

        // Ensure device category exists in the global nodeCategories constant
        if (!nodeCategories.device) {
          nodeCategories.device = {
            label: 'Device',
            color: '#0ea5e9',
            nodes: {}
          };
        }

        // Mutate global constant so CustomNode can access icons/colors
        nodeCategories.device.nodes = deviceNodes;

        // Update local palette state for NodePalette component
        setPaletteCategories((prev) => ({
          ...prev,
          device: {
            ...(prev.device || { label: 'Device', color: '#0ea5e9', nodes: {} }),
            nodes: deviceNodes
          }
        }));
      } catch (err) {
        console.error('Failed to fetch devices for project', err);
      }
    }

    fetchDevices();
  }, [projectUuid]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Custom node change handler with snap-to-grid for ladder nodes
  const handleNodesChange = useCallback((changes) => {
    const snappedChanges = changes.map((change) => {
      if (change.type === 'position' && change.dragging === false && change.position) {
        // Find the node being changed
        const node = nodes.find(n => n.id === change.id);
        if (node && (node.data.category === 'input' || node.data.category === 'output' || node.data.category === 'function')) {
          // Snap to ladder grid - CENTER the node on the rung
          const NODE_HEIGHT = 28;
          const rungIndex = getRungIndexFromPosition(change.position.y + (NODE_HEIGHT / 2)); // Add half node height to get center
          const rungY = getRungYPosition(rungIndex);
          const centeredY = rungY - (NODE_HEIGHT / 2);
          return {
            ...change,
            position: { x: Math.round(change.position.x / 20) * 20, y: centeredY }
          };
        }
      }
      return change;
    });
    onNodesChange(snappedChanges);
  }, [onNodesChange, nodes]);

  // Disabled auto-generate connections - users will draw them manually
  // useEffect(() => {
  //   const rungIndices = getAllRungIndices(nodes);
  //   const newEdges = [];
  //
  //   rungIndices.forEach(rungIndex => {
  //     const rungNodes = getNodesInRung(nodes, rungIndex);
  //     if (rungNodes.length > 1) {
  //       const rungEdges = generateRungConnections(rungNodes);
  //       newEdges.push(...rungEdges);
  //     }
  //   });
  //
  //   // Only update if connections changed
  //   const existingEdgeIds = new Set(edges.map(e => e.id));
  //   const newEdgeIds = new Set(newEdges.map(e => e.id));
  //   const hasChanges = newEdges.length !== edges.length ||
  //     [...newEdgeIds].some(id => !existingEdgeIds.has(id));
  //
  //   if (hasChanges) {
  //     setEdges(newEdges);
  //   }
  // }, [nodes, edges, setEdges]);

  // Add new rung
  const addNewRung = useCallback(() => {
    const maxRung = Math.max(...rungs, -1);
    const newRungIndex = maxRung + 1;
    setRungs([...rungs, newRungIndex]);
    setSelectedRung(newRungIndex); // Auto-select new rung
  }, [rungs]);

  // Delete selected rung
  const deleteSelectedRung = useCallback(() => {
    if (rungs.length === 1) {
      alert('Cannot delete the last rung!');
      return;
    }

    if (window.confirm(`Delete rung ${selectedRung} and all its nodes?`)) {
      // Remove nodes in this rung
      const nodesToKeep = nodes.filter(node => {
        const nodeRungIndex = getRungIndexFromPosition(node.position.y);
        return nodeRungIndex !== selectedRung;
      });
      setNodes(nodesToKeep);

      // Remove rung from list
      const newRungs = rungs.filter(r => r !== selectedRung);
      setRungs(newRungs);

      // Select first available rung
      setSelectedRung(newRungs[0]);
    }
  }, [selectedRung, rungs, nodes, setNodes]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const nodeData = event.dataTransfer.getData('application/reactflow');

      if (typeof nodeData === 'undefined' || !nodeData) {
        return;
      }

      const parsedData = JSON.parse(nodeData);

      // ALWAYS use selected rung - pass complete node data for proper classification
      const position = calculateDropPositionInRung(selectedRung, parsedData, nodes);

      const newNode = {
        id: `${parsedData.nodeType}-${Date.now()}`,
        type: parsedData.category,
        position,
        data: {
          ...parsedData,
          label: parsedData.label || parsedData.nodeType
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [selectedRung, setNodes, nodes]
  );

  const onNodeClick = useCallback((_event, node) => {
    setSelectedNode(node);
  }, []);

  const handleUpdateNode = useCallback((updatedNode) => {
    setSelectedNode(updatedNode);
    setNodes((nds) =>
      nds.map((node) =>
        node.id === updatedNode.id ? updatedNode : node
      )
    );
  }, [setNodes]);

  const saveFlow = useCallback(async () => {
    if (!reactFlowInstance) return;

    try {
      setSaveStatus('Saving...');
      const flowData = {
        name: flowMeta.name,
        description: flowMeta.description,
        nodes: reactFlowInstance.toObject().nodes,
        edges: reactFlowInstance.toObject().edges,
        metadata: flowMeta.metadata || {},
        version: flowMeta.version,
        tags: flowMeta.tags || [],
        project_uuid: projectUuid || undefined
      };

      let response;
      if (currentFlowId) {
        // Update existing flow
        response = await flowAPI.updateFlow(currentFlowId, flowData);
      } else {
        // Create new flow
        response = await flowAPI.createFlow(flowData);
        setCurrentFlowId(response.data.uuid);
        // Update URL to include flow UUID
        if (projectUuid) {
          navigate(`/project/${projectUuid}/flow/${response.data.uuid}`, { replace: true });
        } else {
          navigate(`/flow-editor/${response.data.uuid}`, { replace: true });
        }
      }
      
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error saving flow:', error);
      setSaveStatus('Error saving');
      setTimeout(() => setSaveStatus(''), 3000);
      alert('Error saving flow: ' + (error.response?.data?.detail || error.message));
    }
  }, [reactFlowInstance, flowMeta, currentFlowId, navigate, projectUuid]);

  const clearFlow = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the entire flow?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
      setCurrentFlowId(null);
      setFlowMeta({
        name: 'Untitled Flow',
        description: '',
        version: '1.0.0',
        tags: [],
        metadata: {}
      });
      navigate('/flow-editor', { replace: true });
    }
  }, [setNodes, setEdges, navigate]);


  return (
    <div className="flow-editor">
      {/* Header */}
      <header className="flow-header">
        <div className="flow-header-left">
          <button
            className="back-btn"
            onClick={() => {
              if (projectUuid) {
                navigate(`/project/${projectUuid}`);
              } else {
                navigate('/dashboard');
              }
            }}
            title="Back to Project"
          >
            ← Back to Project
          </button>
          <button
            className="palette-toggle"
            onClick={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
          >
            ☰
          </button>
          {/* <h1>Flow Editor</h1> */}
          {isEditingName ? (
            <input
              className="flow-name-input"
              type="text"
              value={flowMeta.name}
              onChange={(e) => setFlowMeta({ ...flowMeta, name: e.target.value })}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  setIsEditingName(false);
                }
              }}
              autoFocus
            />
          ) : (
            <span
              className="flow-name"
              onDoubleClick={() => setIsEditingName(true)}
              style={{ cursor: 'pointer' }}
            >
              {flowMeta.name}
            </span>
          )}
          {saveStatus && <span className="save-status">{saveStatus}</span>}
        </div>
        <div className="flow-header-right">
          {/* Rung Controls in Header */}
          <div className="header-rung-controls">
            <select
              value={selectedRung}
              onChange={(e) => setSelectedRung(Number(e.target.value))}
              className="header-rung-select"
            >
              {rungs.map((rungIndex) => (
                <option key={rungIndex} value={rungIndex}>
                  Rung {rungIndex}
                </option>
              ))}
            </select>
            <button onClick={addNewRung} className="btn btn-success btn-sm" title="Add New Rung">
              + Rung
            </button>
            <button
              onClick={deleteSelectedRung}
              className="btn btn-danger btn-sm"
              disabled={rungs.length === 1}
              title="Delete Selected Rung"
            >
              Delete
            </button>
          </div>

          <button onClick={saveFlow} className="btn btn-primary">
            Save
          </button>
          <button onClick={clearFlow} className="btn btn-danger">
            Clear
          </button>
        </div>
      </header>

      <div className="flow-content">
        {/* Node Palette */}
        <NodePalette 
          categories={paletteCategories}
          isCollapsed={isPaletteCollapsed}
        />

        {/* Flow Canvas */}
        <div className="flow-canvas" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
            snapToGrid={true}
            snapGrid={[20, 20]}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            selectNodesOnDrag={false}
          >
            <Background color="#aaa" gap={16} />

            {/* Render Power Rails */}
            <PowerRails rungs={rungs} />

            {/* Render Ladder Rungs */}
            {rungs.map((rungIndex) => {
              const nodesInRung = getNodesInRung(nodes, rungIndex);
              const isSelected = rungIndex === selectedRung;
              return (
                <LadderRung
                  key={`rung-${rungIndex}`}
                  rungIndex={rungIndex}
                  yPosition={getRungYPosition(rungIndex)}
                  nodeCount={nodesInRung.length}
                  isActive={isSelected}
                />
              );
            })}

            <Panel position="top-right">
              <div className="flow-info">
                <div>Nodes: {nodes.length}</div>
                <div>Connections: {edges.length}</div>
                <div>Rungs: {rungs.length}</div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Properties Panel Container - Fixed width */}
        <div className="properties-panel-container">
          <PropertiesPanel
            selectedNode={selectedNode}
            onUpdateNode={handleUpdateNode}
            onClose={() => setSelectedNode(null)}
            projectId={projectUuid}
            flowId={currentFlowId}
          />
        </div>
      </div>
    </div>
  );
}

export default FlowEditor;