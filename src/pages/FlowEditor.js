import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import CommentNode from '../components/flow/CommentNode';
import PropertiesPanel from '../components/flow/PropertiesPanel';
import { nodeCategories, flowMetadata } from '../data/nodeTypes';
import { flowAPI } from '../services/api';
import '../styles/FlowEditor.css';

const nodeTypes = {
  input: CustomNode,
  output: CustomNode,
  function: CustomNode,
  network: CustomNode,
  storage: CustomNode,
  comment: CommentNode,
  debug: CustomNode
};

function FlowEditor() {
  const navigate = useNavigate();
  const { projectUuid, flowId } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowMeta, setFlowMeta] = useState(flowMetadata);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [currentFlowId, setCurrentFlowId] = useState(flowId);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);

  const loadFlowFromAPI = useCallback(async (id) => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, [setNodes, setEdges, setFlowMeta, setCurrentFlowId, setIsLoading]);

  // Load flow on component mount or flowId change
  useEffect(() => {
    if (flowId) {
      loadFlowFromAPI(flowId);
    }
  }, [flowId, loadFlowFromAPI]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeData = event.dataTransfer.getData('application/reactflow');

      if (typeof nodeData === 'undefined' || !nodeData) {
        return;
      }

      const parsedData = JSON.parse(nodeData);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `${parsedData.nodeType}-${Date.now()}`,
        type: parsedData.category === 'common' ? parsedData.nodeType : parsedData.category,
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

  const onNodeClick = useCallback((event, node) => {
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

  const loadFlow = useCallback(() => {
    // For now, redirect to flow selection/dashboard
    // TODO: Implement flow selection modal
    navigate('/home');
  }, [navigate]);

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

  const executeFlow = useCallback(async () => {
    if (!currentFlowId) {
      alert('Please save the flow first before executing');
      return;
    }

    try {
      const response = await flowAPI.executeFlow(currentFlowId);
      alert(`Flow execution started: ${response.data.message}`);
    } catch (error) {
      console.error('Error executing flow:', error);
      alert('Error executing flow: ' + (error.response?.data?.detail || error.message));
    }
  }, [currentFlowId]);

  if (isLoading) {
    return (
      <div className="flow-editor">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading flow...</p>
        </div>
      </div>
    );
  }

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
          <h1>Flow Editor</h1>
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
          <button onClick={loadFlow} className="btn btn-secondary">
            Load
          </button>
          <button onClick={saveFlow} className="btn btn-primary">
            Save
          </button>
          <button onClick={executeFlow} className="btn btn-success">
            Execute
          </button>
          <button onClick={clearFlow} className="btn btn-danger">
            Clear
          </button>
        </div>
      </header>

      <div className="flow-content">
        {/* Node Palette */}
        <NodePalette 
          categories={nodeCategories}
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
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={2}
          >
            <Controls />
            <Background color="#aaa" gap={16} />
            <Panel position="top-right">
              <div className="flow-info">
                <div>Nodes: {nodes.length}</div>
                <div>Connections: {edges.length}</div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        <PropertiesPanel
          selectedNode={selectedNode}
          onUpdateNode={handleUpdateNode}
          onClose={() => setSelectedNode(null)}
          projectId={projectUuid}
        />
      </div>
    </div>
  );
}

export default FlowEditor;