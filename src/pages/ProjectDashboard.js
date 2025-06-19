import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectAPI, flowAPI, dashboardAPI } from '../services/api';
import DashboardHeader from '../components/common/DashboardHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FlowEditor from './FlowEditor';
import DashboardCreator from './DashboardCreator';
import './ProjectDashboard.css';

function ProjectDashboard() {
  const navigate = useNavigate();
  const { projectUuid } = useParams();
  const [project, setProject] = useState(null);
  const [activeView, setActiveView] = useState('overview'); // 'overview', 'flow', 'dashboard'
  const [flows, setFlows] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true);
        
        // Load project details
        const projectResponse = await projectAPI.getProject(projectUuid);
        if (projectResponse.data.status === 'success') {
          setProject(projectResponse.data.project);
        }

        // Load project flows
        const flowsResponse = await flowAPI.getFlows();
        if (flowsResponse.data) {
          const projectFlows = flowsResponse.data.filter(
            flow => flow.project_uuid === projectUuid
          );
          setFlows(projectFlows);
        }

        // Load project dashboard templates
        const dashboardsResponse = await dashboardAPI.getTemplates();
        if (dashboardsResponse.data.status === 'success') {
          const projectDashboards = dashboardsResponse.data.templates.filter(
            template => template.project && template.project.uuid === projectUuid
          );
          setDashboards(projectDashboards);
        }

      } catch (error) {
        console.error('Error loading project data:', error);
        setError('Failed to load project data');
        if (error.response?.status === 401) {
          navigate('/login');
        } else if (error.response?.status === 404) {
          setError('Project not found');
        }
      } finally {
        setLoading(false);
      }
    };

    if (projectUuid) {
      loadProjectData();
    }
  }, [projectUuid, navigate]);

  const handleCreateFlow = async () => {
    try {
      const newFlowData = {
        name: 'New Flow',
        description: 'A new flow diagram',
        project_uuid: projectUuid,
        nodes: [],
        edges: [],
        metadata: {},
        tags: []
      };
      
      const response = await flowAPI.createFlow(newFlowData);
      if (response.data) {
        // Navigate to flow editor with the new flow
        navigate(`/project/${projectUuid}/flow/${response.data.uuid}`);
      }
    } catch (error) {
      console.error('Error creating flow:', error);
    }
  };

  const handleCreateDashboard = async () => {
    try {
      const newDashboardData = {
        name: 'New Dashboard',
        description: 'A new dashboard template',
        organization_id: project.organization.id,
        project_id: project.id,
        layout: {},
        widgets: [],
        datasources: []
      };
      
      const response = await dashboardAPI.createTemplate(newDashboardData);
      if (response.data.status === 'success') {
        // Navigate to dashboard creator with the new template
        navigate(`/project/${projectUuid}/dashboard/${response.data.template.uuid}`);
      }
    } catch (error) {
      console.error('Error creating dashboard:', error);
    }
  };

  const handleDeleteFlow = async (event, flowUuid) => {
    event.stopPropagation(); // Prevent card click
    if (window.confirm('Are you sure you want to delete this flow?')) {
      try {
        await flowAPI.deleteFlow(flowUuid);
        // Refresh flows list
        setFlows(flows.filter(f => f.uuid !== flowUuid));
      } catch (error) {
        console.error('Error deleting flow:', error);
        alert('Failed to delete flow');
      }
    }
  };

  const handleDeleteDashboard = async (event, dashboardUuid) => {
    event.stopPropagation(); // Prevent card click
    if (window.confirm('Are you sure you want to delete this dashboard?')) {
      try {
        await dashboardAPI.deleteTemplate(dashboardUuid);
        // Refresh dashboards list
        setDashboards(dashboards.filter(d => d.uuid !== dashboardUuid));
      } catch (error) {
        console.error('Error deleting dashboard:', error);
        alert('Failed to delete dashboard');
      }
    }
  };

  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this entire project? This action cannot be undone.')) {
      try {
        await projectAPI.deleteProject(projectUuid);
        alert('Project deleted successfully');
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
      }
    }
  };

  if (loading) {
    return (
      <div className="project-dashboard-container">
        <LoadingSpinner message="Loading project..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-dashboard-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')}>Back to Projects</button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-dashboard-container">
        <div className="error-state">
          <h2>Project Not Found</h2>
          <button onClick={() => navigate('/dashboard')}>Back to Projects</button>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="project-overview">
      <div className="project-info">
        <h2>{project.name}</h2>
        <p>{project.description}</p>
        <div className="project-stats">
          <div className="stat-card">
            <h3>{flows.length}</h3>
            <p>Flow{flows.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="stat-card">
            <h3>{dashboards.length}</h3>
            <p>Dashboard{dashboards.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="stat-card">
            <h3>{project.status}</h3>
            <p>Status</p>
          </div>
        </div>
      </div>

      <div className="project-actions">
        <div className="action-section">
          <h3>Flows</h3>
          <p>Design your data processing pipelines</p>
          <button className="primary-button" onClick={handleCreateFlow}>
            Create New Flow
          </button>
          <div className="items-list">
            {flows.map(flow => (
              <div key={flow.uuid} className="item-card" 
                   onClick={() => navigate(`/project/${projectUuid}/flow/${flow.uuid}`)}>
                <div className="item-content">
                  <h4>{flow.name}</h4>
                  <p>{flow.description}</p>
                  <span className="item-meta">
                    Updated {new Date(flow.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <button 
                  className="delete-button"
                  onClick={(e) => handleDeleteFlow(e, flow.uuid)}
                  title="Delete Flow"
                >
                  🗑️
                </button>
              </div>
            ))}
            {flows.length === 0 && (
              <p className="empty-state">No flows created yet. Start by creating your first flow!</p>
            )}
          </div>
        </div>

        <div className="action-section">
          <h3>Dashboards</h3>
          <p>Visualize your data and insights</p>
          <button className="primary-button" onClick={handleCreateDashboard}>
            Create New Dashboard
          </button>
          <div className="items-list">
            {dashboards.map(dashboard => (
              <div key={dashboard.uuid} className="item-card"
                   onClick={() => navigate(`/project/${projectUuid}/dashboard/${dashboard.uuid}`)}>
                <div className="item-content">
                  <h4>{dashboard.name}</h4>
                  <p>{dashboard.description}</p>
                  <span className="item-meta">
                    Updated {new Date(dashboard.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <button 
                  className="delete-button"
                  onClick={(e) => handleDeleteDashboard(e, dashboard.uuid)}
                  title="Delete Dashboard"
                >
                  🗑️
                </button>
              </div>
            ))}
            {dashboards.length === 0 && (
              <p className="empty-state">No dashboards created yet. Create widgets from your flow outputs!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="project-dashboard-container">
      <DashboardHeader 
        user={{ username: 'User' }} // This should come from auth context
        subscriptionType="free"
        onLogout={() => navigate('/login')}
      />
      
      <div className="project-navigation">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back to Projects
        </button>
        <div className="project-title">
          <h1>{project.name}</h1>
          <span className="project-org">{project.organization.name}</span>
        </div>
        <div className="project-actions-nav">
          <div className="view-tabs">
            <button 
              className={activeView === 'overview' ? 'active' : ''}
              onClick={() => setActiveView('overview')}
            >
              Overview
            </button>
          </div>
          <button 
            className="delete-project-button"
            onClick={handleDeleteProject}
            title="Delete Project"
          >
            🗑️ Delete Project
          </button>
        </div>
      </div>

      <main className="project-main">
        {activeView === 'overview' && renderOverview()}
      </main>
    </div>
  );
}

export default ProjectDashboard; 