import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { authAPI } from './services/api';
import WidgetFactory from './components/widgets/WidgetFactory';
import './DashboardCreator.css';
import './components/widgets/Widgets.css';

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
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrganization, setNewOrganization] = useState({
    name: '',
    description: '',
    slug: ''
  });
  const navigate = useNavigate();

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    organization_id: '',
    update_frequency: 30,
    connection_timeout: 10,
    widgets: [],
    datasources: [],
    layout: []
  });

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
    },
    { 
      value: 'histogram', 
      label: 'Histogram', 
      icon: '📊',
      description: 'Show distribution of values'
    },
    { 
      value: 'xy_chart', 
      label: 'XY Chart', 
      icon: '📈',
      description: 'Plot data points on X-Y axis'
    },
    { 
      value: 'trend_chart', 
      label: 'Trend Chart', 
      icon: '📉',
      description: 'Show trends and patterns'
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

        // Fetch user's organizations
        const orgResponse = await authAPI.get('/organizations/');
        if (orgResponse.data.status === 'success') {
          setOrganizations(orgResponse.data.organizations);
          if (orgResponse.data.organizations.length > 0) {
            setSelectedOrg(orgResponse.data.organizations[0].id);
            setNewTemplate(prev => ({ ...prev, organization_id: orgResponse.data.organizations[0].id }));
          } else {
            // No organizations found, create a default one
            await createDefaultOrganization();
          }
        }

        // Fetch dashboard templates
        const templatesResponse = await authAPI.get('/dashboard-templates/');
        if (templatesResponse.data.status === 'success') {
          setTemplates(templatesResponse.data.templates);
        }

      } catch (error) {
        console.error('Dashboard Creator initialization error:', error);
        if (error.response?.status === 401) {
          localStorage.clear();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeDashboardCreator();
  }, [navigate]);

  const createDefaultOrganization = async () => {
    try {
      const response = await authAPI.post('/organizations/', {
        name: 'My Organization',
        description: 'Default organization for dashboard templates',
        slug: `org-${Date.now()}`
      });
      
      if (response.data.status === 'success') {
        const org = response.data.organization;
        setOrganizations([org]);
        setSelectedOrg(org.id);
        setNewTemplate(prev => ({ ...prev, organization_id: org.id }));
      }
    } catch (error) {
      console.error('Error creating default organization:', error);
    }
  };

  const handleCreateOrganization = async () => {
    try {
      const orgData = {
        ...newOrganization,
        slug: newOrganization.slug || newOrganization.name.toLowerCase().replace(/\s+/g, '-')
      };

      const response = await authAPI.post('/organizations/', orgData);
      if (response.data.status === 'success') {
        const org = response.data.organization;
        setOrganizations([...organizations, org]);
        setSelectedOrg(org.id);
        setNewTemplate(prev => ({ ...prev, organization_id: org.id }));
        setShowCreateOrgModal(false);
        setNewOrganization({ name: '', description: '', slug: '' });
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      if (error.response?.data?.error) {
        const errorMsg = typeof error.response.data.error === 'object' 
          ? JSON.stringify(error.response.data.error) 
          : error.response.data.error;
        alert(`Error creating organization: ${errorMsg}`);
      } else {
        alert('Error creating organization. Please try again.');
      }
    }
  };

  const handleCreateTemplate = async () => {
    try {
      if (!selectedOrg) {
        alert('Please select an organization first');
        return;
      }

      const templateData = {
        ...newTemplate,
        organization_id: parseInt(selectedOrg)
      };

      const response = await authAPI.post('/dashboard-templates/', templateData);
      if (response.data.status === 'success') {
        const template = response.data.template;
        setTemplates([...templates, template]);
        setCurrentTemplate(template);
        setIsEditing(true);
        setShowCreateModal(false);
        setNewTemplate({
          name: '',
          description: '',
          organization_id: selectedOrg,
          update_frequency: 30,
          connection_timeout: 10,
          widgets: [],
          datasources: [],
          layout: []
        });
      }
    } catch (error) {
      console.error('Error creating template:', error);
      if (error.response?.data?.error) {
        const errorMsg = typeof error.response.data.error === 'object' 
          ? JSON.stringify(error.response.data.error) 
          : error.response.data.error;
        alert(`Error creating template: ${errorMsg}`);
      } else {
        alert('Error creating template. Please try again.');
      }
    }
  };

  const handleWidgetDrop = (widgetType) => {
    // Use functional state update to always work with the latest template
    setCurrentTemplate(prevTemplate => {
      if (!prevTemplate) return prevTemplate; // Safety check

      // Calculate grid position for new widget based on current number of widgets
      const gridCols = 4; // 4-column grid
      const existingWidgets = prevTemplate.widgets.length;
      const gridX = existingWidgets % gridCols; // Column position (0-3)
      const gridY = Math.floor(existingWidgets / gridCols); // Row position

      const newWidget = {
        id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: widgetType.value,
        title: `${widgetType.label} Widget`,
        query: '',
        datasource: 'mysql',
        config: {},
        gridPosition: {
          x: gridX,
          y: gridY,
          width: 1,
          height: 1
        }
      };

      return {
        ...prevTemplate,
        widgets: [...prevTemplate.widgets, newWidget]
      };
    });
  };

  const handleSaveTemplate = async () => {
    if (currentTemplate) {
      try {
        const response = await authAPI.put(`/dashboard-templates/${currentTemplate.id}/`, currentTemplate);
        if (response.data.status === 'success') {
          alert('Template saved successfully!');
        }
      } catch (error) {
        console.error('Error saving template:', error);
        alert('Error saving template');
      }
    }
  };

  const handleDeleteWidget = (widgetId) => {
    if (currentTemplate) {
      const updatedTemplate = {
        ...currentTemplate,
        widgets: currentTemplate.widgets.filter(w => w.id !== widgetId),
        layout: (currentTemplate.layout || []).filter(l => l.i !== widgetId)
      };

      // Update state immediately (frontend only)
      setCurrentTemplate(updatedTemplate);
      console.log('Widget deleted (frontend only)');
    }
  };

  const handleEditTemplate = async (template) => {
    try {
      // Use template from list directly - no API call
      console.log('Using template from list directly (no API call)');
      
      // Ensure all widgets have grid positions for backward compatibility
      const widgetsWithPositions = template.widgets.map((widget, index) => {
        if (!widget.gridPosition) {
          const gridCols = 4;
          return {
            ...widget,
            gridPosition: {
              x: index % gridCols,
              y: Math.floor(index / gridCols),
              width: 1,
              height: 1
            }
          };
        }
        return widget;
      });
      
      const templateWithPositions = {
        ...template,
        widgets: widgetsWithPositions
      };
      
      setCurrentTemplate(templateWithPositions);
      setIsEditing(true);
    } catch (error) {
      console.error('Error fetching latest template data:', error);
      // Fallback to the template from list
      setCurrentTemplate(template);
      setIsEditing(true);
    }
  };

  const handleBackToList = async () => {
    setCurrentTemplate(null);
    setIsEditing(false);
    
    // Refresh templates to get latest data
    try {
      const templatesResponse = await authAPI.get('/dashboard-templates/');
      if (templatesResponse.data.status === 'success') {
        setTemplates(templatesResponse.data.templates);
      }
    } catch (error) {
      console.error('Error refreshing templates:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-creator-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Dashboard Creator...</p>
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
            <button className="back-btn" onClick={() => navigate('/dashboard')}>
              ← Back to Dashboard
            </button>
            <h1>Dashboard Creator</h1>
            {currentTemplate && (
              <span className="current-template">Editing: {currentTemplate.name}</span>
            )}
          </div>
          <div className="header-right">
            {!isEditing && (
              <>
                <div className="org-controls">
                  <select 
                    value={selectedOrg} 
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    className="org-selector"
                  >
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                  <button 
                    className="create-org-btn"
                    onClick={() => setShowCreateOrgModal(true)}
                    title="Create New Organization"
                  >
                    + Org
                  </button>
                </div>
                <button 
                  className="create-btn"
                  onClick={() => setShowCreateModal(true)}
                  disabled={!selectedOrg}
                >
                  + New Template
                </button>
              </>
            )}
            {isEditing && (
              <>
                <button className="save-btn" onClick={handleSaveTemplate}>
                  💾 Save Template
                </button>
                <button className="back-btn" onClick={handleBackToList}>
                  ← Back to List
                </button>
              </>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="creator-main">
          {!isEditing ? (
            /* Template List View */
            <div className="templates-section">
              <div className="section-header">
                <h2>Dashboard Templates</h2>
                <p>Create and manage your dashboard templates with various chart widgets</p>
              </div>
              
              {templates.filter(t => t.organization.id === parseInt(selectedOrg)).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3>No templates yet</h3>
                  <p>Create your first dashboard template to get started</p>
                  <button 
                    className="create-first-btn"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Create First Template
                  </button>
                </div>
              ) : (
                <div className="templates-grid">
                  {templates.filter(t => t.organization.id === parseInt(selectedOrg)).map(template => (
                    <div key={template.id} className="template-card">
                      <div className="template-header">
                        <h3>{template.name}</h3>
                        <div className="template-meta">
                          <span className="widget-count">{template.widgets.length} widgets</span>
                          <span className="update-freq">Updates every {template.update_frequency}s</span>
                        </div>
                      </div>
                      <div className="template-description">
                        <p>{template.description}</p>
                      </div>
                      <div className="template-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEditTemplate(template)}
                        >
                          ✏️ Edit Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Template Editor View */
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
                    <div className="widgets-grid" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '20px',
                      padding: '20px',
                      minHeight: '400px'
                    }}>
                      {currentTemplate.widgets.map((widget, index) => (
                          <div 
                            key={widget.id} 
                            className="widget-container-item"
                            style={{
                              gridColumn: widget.gridPosition ? widget.gridPosition.x + 1 : (index % 4) + 1,
                              gridRow: widget.gridPosition ? widget.gridPosition.y + 1 : Math.floor(index / 4) + 1,
                              width: '100%',
                              height: '200px',
                              padding: '10px',
                              border: '2px solid #e2e8f0',
                              borderRadius: '8px',
                              background: 'white',
                              position: 'relative'
                            }}
                            title={`Widget ${index + 1}: ${widget.id}`}
                          >
                            <div style={{ 
                              position: 'absolute', 
                              top: '5px', 
                              right: '5px', 
                              zIndex: 10 
                            }}>
                              <button 
                                onClick={() => handleDeleteWidget(widget.id)}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                ×
                              </button>
                            </div>
                            <div style={{ height: '100%', overflow: 'hidden' }}>
                              <div style={{ 
                                position: 'absolute', 
                                top: '30px', 
                                left: '5px', 
                                background: 'rgba(0,0,0,0.7)', 
                                color: 'white', 
                                padding: '2px 6px', 
                                borderRadius: '3px', 
                                fontSize: '10px',
                                zIndex: 5
                              }}>
                                #{index + 1}
                              </div>
                              <WidgetFactory widget={widget} />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </DropZone>
              </div>
            </div>
          )}
        </main>

        {/* Create Organization Modal */}
        {showCreateOrgModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Create New Organization</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowCreateOrgModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Organization Name</label>
                  <input
                    type="text"
                    value={newOrganization.name}
                    onChange={(e) => setNewOrganization({...newOrganization, name: e.target.value})}
                    placeholder="Enter organization name"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newOrganization.description}
                    onChange={(e) => setNewOrganization({...newOrganization, description: e.target.value})}
                    placeholder="Describe your organization"
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Slug (URL identifier)</label>
                  <input
                    type="text"
                    value={newOrganization.slug}
                    onChange={(e) => setNewOrganization({...newOrganization, slug: e.target.value})}
                    placeholder="Auto-generated from name if empty"
                  />
                  <small>Used in URLs. Leave empty to auto-generate from name.</small>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowCreateOrgModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="create-btn"
                  onClick={handleCreateOrganization}
                  disabled={!newOrganization.name.trim()}
                >
                  Create Organization
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Template Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Create New Template</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Template Name</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    placeholder="Enter template name"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                    placeholder="Describe your dashboard template"
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Organization</label>
                  <select
                    value={newTemplate.organization_id}
                    onChange={(e) => setNewTemplate({...newTemplate, organization_id: e.target.value})}
                  >
                    <option value="">Select an organization</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Update Frequency (seconds)</label>
                    <input
                      type="number"
                      value={newTemplate.update_frequency}
                      onChange={(e) => setNewTemplate({...newTemplate, update_frequency: parseInt(e.target.value)})}
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Connection Timeout (seconds)</label>
                    <input
                      type="number"
                      value={newTemplate.connection_timeout}
                      onChange={(e) => setNewTemplate({...newTemplate, connection_timeout: parseInt(e.target.value)})}
                      min="1"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="create-btn"
                  onClick={handleCreateTemplate}
                  disabled={!newTemplate.name.trim() || !newTemplate.organization_id}
                >
                  Create Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

export default DashboardCreator; 