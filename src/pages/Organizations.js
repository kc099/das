import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizationAPI } from '../services/api';
import DashboardHeader from '../components/common/DashboardHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './Organizations.css';

function Organizations() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    const initializeOrganizations = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Get user data
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }

        // Fetch organizations
        const response = await organizationAPI.getOrganizations();
        if (response.data.status === 'success') {
          setOrganizations(response.data.organizations);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
        if (error.response?.status === 401) {
          localStorage.clear();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeOrganizations();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleCreateOrg = async () => {
    try {
      const response = await organizationAPI.createOrganization(formData);
      if (response.data.status === 'success') {
        setOrganizations([...organizations, response.data.organization]);
        setShowCreateModal(false);
        setFormData({ name: '', description: '' });
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Failed to create organization. Please try again.');
    }
  };

  const handleEditOrg = async () => {
    try {
      const response = await organizationAPI.updateOrganization(selectedOrg.id, formData);
      if (response.data.status === 'success') {
        setOrganizations(organizations.map(org => 
          org.id === selectedOrg.id ? response.data.organization : org
        ));
        setShowEditModal(false);
        setSelectedOrg(null);
        setFormData({ name: '', description: '' });
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      alert('Failed to update organization. Please try again.');
    }
  };

  const handleDeleteOrg = async (orgId, orgName) => {
    if (!window.confirm(`Are you sure you want to delete "${orgName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await organizationAPI.deleteOrganization(orgId);
      setOrganizations(organizations.filter(org => org.id !== orgId));
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('Failed to delete organization. Please try again.');
    }
  };

  const openEditModal = (org) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      description: org.description || ''
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="organizations-container">
        <LoadingSpinner message="Loading organizations..." />
      </div>
    );
  }

  return (
    <div className="organizations-container">
      <DashboardHeader 
        user={user} 
        subscriptionType="free"
        onLogout={handleLogout}
      />
      
      <main className="organizations-main">
        <div className="organizations-content">
          <div className="organizations-header">
            <div>
              <div className="page-navigation">
                <button 
                  className="back-button"
                  onClick={() => navigate('/home')}
                >
                  ← Back to Home
                </button>
              </div>
              <h1>Organizations</h1>
              <p>Manage your organization settings and members</p>
            </div>
            <button 
              className="create-organization-button"
              onClick={() => setShowCreateModal(true)}
            >
              + New Organization
            </button>
          </div>

          {organizations.length === 0 ? (
            <div className="empty-organizations">
              <div className="empty-icon">🏢</div>
              <h2>No Organizations Yet</h2>
              <p>Create your first organization to start managing projects and teams</p>
              <button 
                className="primary-button"
                onClick={() => setShowCreateModal(true)}
              >
                Create Your First Organization
              </button>
            </div>
          ) : (
            <div className="organizations-grid">
              {organizations.map(org => (
                <div key={org.id} className="organization-card">
                  <div className="organization-card-header">
                    <h3>{org.name}</h3>
                    <div className="organization-actions">
                      <button 
                        className="edit-button"
                        onClick={() => openEditModal(org)}
                        title="Edit organization"
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteOrg(org.id, org.name)}
                        title="Delete organization"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="organization-description">
                    {org.description || 'No description provided'}
                  </p>
                  <div className="organization-stats">
                    <span>{org.project_count || 0} projects</span>
                    <span>{org.member_count || 1} members</span>
                  </div>
                  <div className="organization-meta">
                    <span className="created">
                      Created {new Date(org.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Organization</h2>
              <button 
                className="close-button"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="org-name">Organization Name *</label>
                <input
                  id="org-name"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Acme Corp, My Company"
                />
              </div>
              <div className="form-group">
                <label htmlFor="org-description">Description</label>
                <textarea
                  id="org-description"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your organization..."
                  rows={3}
                />
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
                onClick={handleCreateOrg}
                disabled={!formData.name}
              >
                Create Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Organization</h2>
              <button 
                className="close-button"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-org-name">Organization Name *</label>
                <input
                  id="edit-org-name"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Acme Corp, My Company"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-org-description">Description</label>
                <textarea
                  id="edit-org-description"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your organization..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="secondary-button"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button 
                className="primary-button"
                onClick={handleEditOrg}
                disabled={!formData.name}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Organizations; 