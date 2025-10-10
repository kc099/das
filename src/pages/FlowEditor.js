import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import NodePalette from '../components/flow/NodePalette';
import CustomNode from '../components/flow/CustomNode';
import PropertiesPanel from '../components/flow/PropertiesPanel';
import { nodeCategories, flowMetadata } from '../data/nodeTypes';
import { flowAPI } from '../services/api';
import { deviceAPI } from '../services/api/device';
import '../styles/FlowEditor.css';

const nodeTypes = {
  input: CustomNode,
  output: CustomNode,
  function: CustomNode,
  network: CustomNode,
  storage: CustomNode,
  device: CustomNode,
};

// Edge styles for n8n-like appearance
const edgeOptions = {
  animated: true,
  style: { stroke: '#94a3b8', strokeWidth: 2 },
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  ...edgeOptions,
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
    (params) => setEdges((eds) => addEdge({ ...params, ...edgeOptions }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const nodeData = event.dataTransfer.getData('application/reactflow');

      if (typeof nodeData === 'undefined' || !nodeData || !reactFlowInstance) {
        return;
      }

      const parsedData = JSON.parse(nodeData);

      // Calculate position in the flow canvas using screenToFlowPosition
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

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
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((_event, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
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

  const loadFlow = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const flowData = JSON.parse(event.target.result);
            setNodes(flowData.nodes || []);
            setEdges(flowData.edges || []);
            setFlowMeta({
              name: flowData.name || 'Imported Flow',
              description: flowData.description || '',
              version: flowData.version || '1.0.0',
              tags: flowData.tags || [],
              metadata: flowData.metadata || {}
            });
          } catch (error) {
            alert('Error loading flow file: ' + error.message);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [setNodes, setEdges]);

  const executeFlow = useCallback(() => {
    alert('Flow execution not yet implemented. This will trigger the flow logic on the backend.');
  }, []);

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
          <button onClick={loadFlow} className="btn btn-secondary" title="Load Flow from File">
            Load
          </button>
          <button onClick={saveFlow} className="btn btn-success" title="Save Flow">
            Save
          </button>
          <button onClick={executeFlow} className="btn btn-primary" title="Execute Flow">
            Execute
          </button>
          <button onClick={clearFlow} className="btn btn-danger" title="Clear Flow">
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
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            defaultViewport={{ x: 250, y: 100, zoom: 1 }}
            minZoom={0.2}
            maxZoom={4}
            fitView
            snapToGrid={true}
            snapGrid={[15, 15]}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            selectNodesOnDrag={false}
          >
            <Background
              color="#94a3b8"
              gap={20}
              size={1}
              variant="dots"
            />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const category = nodeCategories[node.data.category];
                return category?.color || '#6366f1';
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
              position="bottom-right"
              style={{
                width: 150,
                height: 100,
              }}
            />

            <Panel position="top-right">
              <div className="flow-info">
                <div>Nodes: {nodes.length}</div>
                <div>Connections: {edges.length}</div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Properties Panel Container - Only show when node is selected */}
        {selectedNode && (
          <div className="properties-panel-container">
            <PropertiesPanel
              selectedNode={selectedNode}
              onUpdateNode={handleUpdateNode}
              onClose={() => setSelectedNode(null)}
              projectId={projectUuid}
              flowId={currentFlowId}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FlowEditor;
