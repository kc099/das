import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, projectAPI, organizationAPI } from '../services/api';
import cacheService from '../services/cache';
import DashboardHeader from '../components/common/DashboardHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    organization_id: '',
    tags: []
  });

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch user profile
        const userResponse = await authAPI.get('/profile/');
        if (userResponse.data.status === 'success') {
          setUser(userResponse.data.user);
        }

        // Fetch user's organizations
        const orgResponse = await organizationAPI.getOrganizations();
        if (orgResponse.data.status === 'success') {
          setOrganizations(orgResponse.data.organizations);
          if (orgResponse.data.organizations.length > 0) {
            setNewProject(prev => ({ ...prev, organization_id: orgResponse.data.organizations[0].id }));
          }
        }

        // Fetch user's projects
        const projectsResponse = await projectAPI.getProjects();
        if (projectsResponse.data.status === 'success') {
          setProjects(projectsResponse.data.projects);
        }

      } catch (error) {
        console.error('Dashboard initialization error:', error);
        if (error.response?.status === 401) {
          localStorage.clear();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      cacheService.clearAll();
      navigate('/');
    }
  };

  const handleCreateProject = async () => {
    try {
      const response = await projectAPI.createProject(newProject);
      if (response.data.status === 'success') {
        setProjects([...projects, response.data.project]);
        setShowCreateModal(false);
        setNewProject({
          name: '',
          description: '',
          organization_id: organizations[0]?.id || '',
          tags: []
        });
        // Navigate to the new project
        navigate(`/project/${response.data.project.uuid}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <LoadingSpinner message="Loading your projects..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <h2>Access Denied</h2>
          <p>Please log in to access your dashboard.</p>
          <button onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <DashboardHeader 
        user={user} 
        subscriptionType="free" // This should come from user profile
        onLogout={handleLogout} 
      />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="projects-header">
            <div>
              <h1>Your Projects</h1>
              <p>Manage your IoT applications and data flows</p>
            </div>
            <button 
              className="create-project-button"
              onClick={() => setShowCreateModal(true)}
            >
              + New Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="empty-projects">
              <div className="empty-icon">📊</div>
              <h2>No Projects Yet</h2>
              <p>Create your first IoT project to start building data flows and dashboards</p>
              <button 
                className="primary-button"
                onClick={() => setShowCreateModal(true)}
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(project => (
                <div 
                  key={project.uuid} 
                  className="project-card"
                  onClick={() => navigate(`/project/${project.uuid}`)}
                >
                  <div className="project-card-header">
                    <h3>{project.name}</h3>
                    <span className={`status-badge ${project.status}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="project-description">{project.description}</p>
                  <div className="project-stats">
                    <span>{project.flow_count} flows</span>
                    <span>{project.dashboard_count} dashboards</span>
                  </div>
                  <div className="project-meta">
                    <span className="organization">{project.organization.name}</span>
                    <span className="updated">
                      Updated {new Date(project.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button 
                className="close-button"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="project-name">Project Name *</label>
                <input
                  id="project-name"
                  type="text"
                  value={newProject.name}
                  onChange={e => setNewProject({...newProject, name: e.target.value})}
                  placeholder="e.g., Smart Greenhouse, Factory Floor Monitors"
                />
              </div>
              <div className="form-group">
                <label htmlFor="project-description">Description</label>
                <textarea
                  id="project-description"
                  value={newProject.description}
                  onChange={e => setNewProject({...newProject, description: e.target.value})}
                  placeholder="Describe what this project will do..."
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label htmlFor="project-organization">Organization *</label>
                <select
                  id="project-organization"
                  value={newProject.organization_id}
                  onChange={e => setNewProject({...newProject, organization_id: parseInt(e.target.value)})}
                >
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="secondary-button"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button 
                className="primary-button"
                onClick={handleCreateProject}
                disabled={!newProject.name || !newProject.organization_id}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard; 