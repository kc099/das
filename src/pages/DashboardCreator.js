import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { projectAPI, dashboardAPI } from '../services/api';
import WidgetFactory from '../components/widgets/WidgetFactory';
import WidgetPropertiesPanel from '../components/widgets/WidgetPropertiesPanel';
import '../styles/DashboardCreator.css';
import '../styles/Widgets.css';
import GridLayout from 'react-grid-layout';
import { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
const ReactGridLayout = WidthProvider(GridLayout);

// Draggable Widget Item Component
const DraggableWidget = ({ widget, onDrag }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'widget',
    item: { widgetType: widget },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`widget-library-item ${isDragging ? 'dragging' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="widget-icon">{widget.icon}</div>
      <div className="widget-info">
        <h4>{widget.label}</h4>
        <p>{widget.description}</p>
      </div>
    </div>
  );
};

// Drop Zone Component
const DropZone = ({ onDrop, children, isEmpty }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'widget',
    drop: (item) => {
      onDrop(item.widgetType);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`drop-zone ${isOver ? 'drop-over' : ''} ${isEmpty ? 'empty' : ''}`}
    >
      {isEmpty ? (
        <div className="drop-zone-placeholder">
          <div className="placeholder-icon">📊</div>
          <h3>Drag widgets here to build your dashboard</h3>
          <p>Select widgets from the library on the left and drop them here</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
};

function DashboardCreator() {
  const navigate = useNavigate();
  const { projectUuid, templateId } = useParams();
  const [project, setProject] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);

  // Widget Library
  const widgetLibrary = [
    { 
      value: 'time_series', 
      label: 'Time Series', 
      icon: '📈',
      description: 'Display data over time with line charts'
    },
    { 
      value: 'bar_chart', 
      label: 'Bar Chart', 
      icon: '📊',
      description: 'Compare values with vertical bars'
    },
    { 
      value: 'gauge', 
      label: 'Gauge', 
      icon: '⏲️',
      description: 'Show single values with circular gauge'
    },
    { 
      value: 'stat_panel', 
      label: 'Stat Panel', 
      icon: '🔢',
      description: 'Display key metrics and statistics'
    },
    { 
      value: 'pie_chart', 
      label: 'Pie Chart', 
      icon: '🥧',
      description: 'Show proportions with circular chart'
    },
    { 
      value: 'table', 
      label: 'Table', 
      icon: '📋',
      description: 'Display data in tabular format'
    }
  ];

  useEffect(() => {
    const initializeDashboardCreator = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

        // If no project, go back to dashboard
        if (!projectUuid) {
          navigate('/dashboard');
          return;
        }

        // Fetch project details
        const projectResponse = await projectAPI.getProject(projectUuid);
        if (projectResponse.data.status === 'success') {
          setProject(projectResponse.data.project);
        }

        // If templateId is provided, load that specific template
        if (templateId) {
          const templateResponse = await dashboardAPI.getTemplate(templateId);
          if (templateResponse.data.status === 'success') {
            const template = templateResponse.data.template;
            
            console.log('📋 Loading dashboard template:', template.name);
            console.log('🔧 Template widgets:', template.widgets);
            console.log('📐 Template layout:', template.layout);
            
            // Ensure widgets and layout are always arrays
            const processedTemplate = {
              ...template,
              widgets: Array.isArray(template.widgets) ? template.widgets : [],
              layout: Array.isArray(template.layout) ? template.layout : [],
              datasources: Array.isArray(template.datasources) ? template.datasources : []
            };
            
            // console.log('✅ Processed template widgets:', processedTemplate.widgets.length);
            // console.log('✅ Processed template layout:', processedTemplate.layout.length);
            
            setCurrentTemplate(processedTemplate);
          }
        } else {
          // Create a new empty template for the project
          const newTemplate = {
            name: `${projectResponse.data.project.name} Dashboard`,
            description: `Dashboard for ${projectResponse.data.project.name} project`,
            widgets: [],
            layout: [],
            datasources: []
          };
          setCurrentTemplate(newTemplate);
        }

      } catch (error) {
        console.error('Dashboard Creator initialization error:', error);
        setError('Failed to load project or template');
        if (error.response?.status === 401) {
          localStorage.clear();
          navigate('/login');
        } else if (error.response?.status === 404) {
          setError('Project or template not found');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeDashboardCreator();
  }, [navigate, projectUuid, templateId]);

  const getWidgetDimensions = (widgetType) => {
    const dimensionMap = {
      'time_series': { w: 6, h: 8, minW: 4, minH: 6 },
      'bar_chart': { w: 6, h: 8, minW: 4, minH: 6 },
      'pie_chart': { w: 6, h: 6, minW: 3, minH: 4 },
      'gauge': { w: 4, h: 4, minW: 3, minH: 3 },
      'stat_panel': { w: 3, h: 3, minW: 2, minH: 2 },
      'table': { w: 8, h: 6, minW: 4, minH: 4 }
    };
    return dimensionMap[widgetType] || { w: 6, h: 6, minW: 3, minH: 4 };
  };

  const handleWidgetDrop = (widgetType) => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType.value,
      title: `New ${widgetType.label}`,
      config: {
        type: widgetType.value
      }
    };

    const dimensions = getWidgetDimensions(widgetType.value);
    const newLayout = {
      i: newWidget.id,
      x: 0,
      y: Infinity,
      ...dimensions
    };

    setCurrentTemplate(prev => ({
      ...prev,
      widgets: [...(prev.widgets || []), newWidget],
      layout: [...(prev.layout || []), newLayout]
    }));
  };

  const handleSaveTemplate = async () => {
    if (!currentTemplate || !project) return;

    try {
      setIsSaving(true);
      
      const templateData = {
        name: currentTemplate.name,
        description: currentTemplate.description,
        organization_id: project.organization.id,
        project_id: project.id,
        widgets: currentTemplate.widgets || [],
        layout: currentTemplate.layout || [],
        datasources: currentTemplate.datasources || []
      };

      if (templateId) {
        // Update existing template
        await dashboardAPI.updateTemplate(templateId, templateData);
        alert('Dashboard template updated successfully!');
      } else {
        // Create new template
        const response = await dashboardAPI.createTemplate(templateData);
        if (response.data.status === 'success') {
          alert('Dashboard template created successfully!');
          // Navigate to the project dashboard
          navigate(`/project/${projectUuid}`);
        }
      }
    } catch (error) {
      // console.error('Error saving template:', error);
      alert('Failed to save dashboard template. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWidget = (widgetId, event) => {
    // Prevent event propagation to avoid triggering drag
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    setCurrentTemplate(prev => ({
      ...prev,
      widgets: (prev.widgets || []).filter(w => w.id !== widgetId),
      layout: (prev.layout || []).filter(l => l.i !== widgetId)
    }));
  };

  const handleLayoutChange = (newLayout) => {
    setCurrentTemplate(prev => ({
      ...prev,
      layout: newLayout
    }));
  };

  const handleDeleteTemplate = async () => {
    if (!templateId) return;
    
    if (window.confirm('Are you sure you want to delete this dashboard template?')) {
      try {
        await dashboardAPI.deleteTemplate(templateId);
        alert('Dashboard template deleted successfully!');
        navigate(`/project/${projectUuid}`);
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete dashboard template.');
      }
    }
  };

  const handleShowWidgetProperties = (widget, event) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedWidget(widget);
    setShowPropertiesPanel(true);
  };

  const handleClosePropertiesPanel = () => {
    setShowPropertiesPanel(false);
    setSelectedWidget(null);
  };

  const handleUpdateWidgetProperties = (widgetId, updatedProperties) => {
    setCurrentTemplate(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget => 
        widget.id === widgetId 
          ? { ...widget, ...updatedProperties }
          : widget
      )
    }));
  };

  if (loading) {
    return (
      <div className="dashboard-creator-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: '#9ca3af',
          fontStyle: 'italic'
        }}>
          <p>Loading Dashboard Creator...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-creator-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(`/project/${projectUuid}`)}>
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="dashboard-creator-container">
        {/* Header */}
        <header className="creator-header">
          <div className="header-left">
            <button 
              className="back-btn" 
              onClick={() => navigate(`/project/${projectUuid}`)}
            >
              ← Back to Project
            </button>
            <div className="title-section">
              {isEditingName ? (
                <input
                  type="text"
                  value={currentTemplate?.name || ''}
                  onChange={(e) => setCurrentTemplate((prev) => ({ ...prev, name: e.target.value }))}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      setIsEditingName(false);
                    }
                  }}
                  className="dashboard-name-input"
                  autoFocus
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    minWidth: '200px'
                  }}
                />
              ) : (
                <h1
                  onDoubleClick={() => setIsEditingName(true)}
                  style={{ cursor: 'pointer', margin: 0, fontSize: '1.8rem', fontWeight: 600 }}
                >
                  {currentTemplate?.name || 'Dashboard Editor'}
                </h1>
              )}
              <span className="project-name">{project?.name}</span>
            </div>
          </div>
          <div className="header-right">
            {templateId && (
              <button 
                className="delete-btn"
                onClick={handleDeleteTemplate}
                title="Delete Dashboard"
              >
                🗑️ Delete
              </button>
            )}
            <button 
              className="save-btn" 
              onClick={handleSaveTemplate}
              disabled={isSaving}
            >
              {isSaving ? '💾 Saving...' : '💾 Save Dashboard'}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="creator-main">
          <div className="template-editor">
            <div className="editor-sidebar">
              <div className="sidebar-header">
                <h3>Widget Library</h3>
                <p>Drag widgets to the canvas</p>
              </div>
              <div className="widget-library">
                {widgetLibrary.map(widget => (
                  <DraggableWidget 
                    key={widget.value} 
                    widget={widget}
                  />
                ))}
              </div>
            </div>
            
            <div className="editor-canvas">
              <DropZone 
                onDrop={handleWidgetDrop}
                isEmpty={!currentTemplate?.widgets?.length}
              >
                {!currentTemplate?.widgets?.length ? (
                  <div className="drop-zone-placeholder">
                    <div className="placeholder-icon">📊</div>
                    <h3>Drag widgets here to build your dashboard</h3>
                    <p>Select widgets from the library on the left and drop them here</p>
                  </div>
                ) : (
                  <ReactGridLayout
                    className="widgets-grid"
                    layout={currentTemplate.layout || []}
                    cols={12}
                    rowHeight={60}
                    compactType="vertical"
                    isResizable
                    isDraggable
                    onLayoutChange={(newLayout) => {
                      // console.log('🔄 Grid layout changed:', newLayout);
                      // console.log('📏 Current layout before change:', currentTemplate.layout);
                      handleLayoutChange(newLayout);
                    }}
                    margin={[16, 16]}
                  >
                    {(currentTemplate.widgets || []).map(widget => (
                      <div key={widget.id} className="grid-widget-wrapper">
                        <div className="widget-controls">
                          <button 
                            className="widget-properties-btn"
                            onClick={(e) => handleShowWidgetProperties(widget, e)}
                            onMouseDown={(e) => e.stopPropagation()}
                            title="Widget Properties"
                          >
                            ⚙️
                          </button>
                          <button 
                            className="delete-widget-btn"
                            onClick={(e) => handleDeleteWidget(widget.id, e)}
                            onMouseDown={(e) => e.stopPropagation()}
                            title="Remove Widget"
                          >
                            −
                          </button>
                        </div>
                        <WidgetFactory
                          key={widget.id}
                          widget={{
                            ...widget,
                            data: []
                          }}
                          dashboardUuid={templateId}
                          onUpdate={() => {}}
                        />
                      </div>
                    ))}
                  </ReactGridLayout>
                )}
              </DropZone>
            </div>
          </div>
        </main>

        {/* Widget Properties Panel */}
        {showPropertiesPanel && selectedWidget && (
          <WidgetPropertiesPanel
            widget={selectedWidget}
            onClose={handleClosePropertiesPanel}
            onUpdate={(updatedProperties) => handleUpdateWidgetProperties(selectedWidget.id, updatedProperties)}
            projectUuid={projectUuid}
          />
        )}
      </div>
    </DndProvider>
  );
}

export default DashboardCreator;
