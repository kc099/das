import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, projectAPI, organizationAPI } from '../services/api';
import cacheService from '../services/cache';
import DashboardHeader from '../components/common/DashboardHeader';
import DashboardSidebar from '../components/common/DashboardSidebar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useStatActions } from '../hooks/useDashboardStats';
import useDashboardStore from '../store/dashboardStore';
import './Dashboard.css';
import '../styles/BaseLayout.css';
import '../styles/ProjectsPage.css';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useDashboardStore();
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    organization_id: '',
    tags: []
  });
  const { updateStat, incrementStat, refresh: refreshStats } = useStatActions();

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
        incrementStat('projects');
        refreshStats();
        navigate(`/project/${response.data.project.uuid}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <DashboardHeader 
          user={user} 
          subscriptionType="free"
          onLogout={handleLogout}
          onToggleSidebar={toggleSidebar}
        />
        <div className="layout">
          <DashboardSidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
          />
          <main className="main-content">
            <div className="content-wrapper">
              <LoadingSpinner message="Loading your projects..." />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <h2 className="empty-title">Access Denied</h2>
          <p className="empty-description">Please log in to access your dashboard.</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <DashboardHeader 
        user={user} 
        subscriptionType="free" // This should come from user profile
        onLogout={handleLogout}
        onToggleSidebar={toggleSidebar}
      />
      
      <div className="layout">
        {/* Shared Sidebar Component */}
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />

        {/* Main Content */}
        <main className="main-content">
          <div className="content-wrapper">
            <div className="page-header">
              <div className="page-header-content">
                <h1 className="page-title">Your Projects</h1>
                <p className="page-subtitle">Manage your IoT applications and data flows</p>
              </div>
              <div className="page-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  + New Project
                </button>
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h2 className="empty-title">No Projects Yet</h2>
                <p className="empty-description">Create your first IoT project to start building data flows and dashboards</p>
                <button 
                  className="btn btn-primary"
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
                      <h3 className="project-title">{project.name}</h3>
                      <span className={`project-status ${project.status === 'active' ? 'active' : 'inactive'}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="project-description">{project.description || 'No description provided'}</p>
                    <div className="project-stats">
                      <div className="stat-item">
                        <span className="stat-number">{project.flow_count || 0}</span>
                        <span className="stat-label">Flows</span>
                      </div>
                      <div className="stat-divider"></div>
                      <div className="stat-item">
                        <span className="stat-number">{project.dashboard_count || 0}</span>
                        <span className="stat-label">Dashboards</span>
                      </div>
                    </div>
                    <div className="project-footer">
                      <span className="organization-name">{project.organization.name}</span>
                      <span className="last-updated">
                        {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Project</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="project-name">Project Name *</label>
                <input
                  className="form-input"
                  id="project-name"
                  type="text"
                  placeholder="Enter project name"
                  value={newProject.name}
                  onChange={e => setNewProject({...newProject, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="project-org">Organization *</label>
                <select
                  className="form-select"
                  id="project-org"
                  value={newProject.organization_id}
                  onChange={e => setNewProject({...newProject, organization_id: e.target.value})}
                  required
                >
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="project-desc">Description</label>
                <textarea
                  className="form-textarea"
                  id="project-desc"
                  placeholder="Describe your project"
                  value={newProject.description}
                  onChange={e => setNewProject({...newProject, description: e.target.value})}
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
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