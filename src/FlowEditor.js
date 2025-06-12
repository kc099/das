import React, { useState, useCallback, useRef } from 'react';
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

import NodePalette from './components/NodePalette';
import CustomNode from './components/CustomNode';
import CommentNode from './components/CommentNode';
import PropertiesPanel from './components/PropertiesPanel';
import { nodeCategories, defaultFlowData, flowMetadata } from './data/nodeTypes';
import './FlowEditor.css';

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
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultFlowData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultFlowData.edges);
  const [flowMeta, setFlowMeta] = useState(flowMetadata);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

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

    const flowData = {
      ...flowMeta,
      nodes: reactFlowInstance.toObject().nodes,
      edges: reactFlowInstance.toObject().edges,
      updatedAt: new Date().toISOString()
    };

    // TODO: Implement API call to save flow
    console.log('Saving flow:', flowData);
    
    // For now, save to localStorage
    localStorage.setItem('savedFlow', JSON.stringify(flowData));
    alert('Flow saved successfully!');
  }, [reactFlowInstance, flowMeta]);

  const loadFlow = useCallback(() => {
    const savedFlow = localStorage.getItem('savedFlow');
    if (savedFlow) {
      const flowData = JSON.parse(savedFlow);
      setNodes(flowData.nodes || []);
      setEdges(flowData.edges || []);
      setFlowMeta(flowData);
    }
  }, [setNodes, setEdges]);

  const clearFlow = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the entire flow?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
    }
  }, [setNodes, setEdges]);

  return (
    <div className="flow-editor">
      {/* Header */}
      <header className="flow-header">
        <div className="flow-header-left">
          <button
            className="palette-toggle"
            onClick={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
          >
            ☰
          </button>
          <h1>Flow Editor</h1>
          <span className="flow-name">{flowMeta.name}</span>
        </div>
        <div className="flow-header-right">
          <button onClick={loadFlow} className="btn btn-secondary">
            Load
          </button>
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
        />
      </div>
    </div>
  );
}

export default FlowEditor;