import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, organizationAPI } from '../services/api';
import DashboardHeader from '../components/common/DashboardHeader';
import DashboardSidebar from '../components/common/DashboardSidebar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import cacheService from '../services/cache';
import './Organizations.css';

function Organizations() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgMembers, setOrgMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [memberFormData, setMemberFormData] = useState({
    email: '',
    role: 'user'
  });

  useEffect(() => {
    const initializeOrganizations = async () => {
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
      const errorMessage = error.response?.data?.error?.name?.[0] || 
                          error.response?.data?.error || 
                          'Failed to create organization. Please try again.';
      alert(errorMessage);
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

  const openMembersModal = async (org) => {
    setSelectedOrg(org);
    setShowMembersModal(true);
    setLoadingMembers(true);
    
    try {
      const response = await organizationAPI.getOrganizationMembers(org.id);
      if (response.data.status === 'success') {
        setOrgMembers(response.data.members);
      }
    } catch (error) {
      console.error('Error fetching organization members:', error);
      alert('Failed to load organization members. Please try again.');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddMember = async () => {
    if (!memberFormData.email) {
      alert('Please enter an email address.');
      return;
    }

    try {
      const response = await organizationAPI.addOrganizationMember(selectedOrg.id, memberFormData);
      if (response.data.status === 'success') {
        setOrgMembers([...orgMembers, response.data.member]);
        setMemberFormData({ email: '', role: 'user' });
        
        // Update organization list to reflect new member count
        const updatedOrgs = organizations.map(org => 
          org.id === selectedOrg.id 
            ? { ...org, user_count: (org.user_count || 0) + 1 }
            : org
        );
        setOrganizations(updatedOrgs);
      }
    } catch (error) {
      console.error('Error adding member:', error);
      const errorMessage = error.response?.data?.error || 'Failed to add member. Please try again.';
      alert(errorMessage);
    }
  };

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Are you sure you want to remove ${member.user.email} from this organization?`)) {
      return;
    }

    try {
      await organizationAPI.removeOrganizationMember(selectedOrg.id, member.id);
      setOrgMembers(orgMembers.filter(m => m.id !== member.id));
      
      // Update organization list to reflect removed member count
      const updatedOrgs = organizations.map(org => 
        org.id === selectedOrg.id 
          ? { ...org, user_count: Math.max((org.user_count || 1) - 1, 0) }
          : org
      );
      setOrganizations(updatedOrgs);
    } catch (error) {
      console.error('Error removing member:', error);
      const errorMessage = error.response?.data?.error || 'Failed to remove member. Please try again.';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <DashboardHeader 
          user={user}
          subscriptionType="free"
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="dashboard-layout">
          <DashboardSidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
          />
          <main className="dashboard-main">
            <div className="dashboard-content">
              <LoadingSpinner message="Loading organizations..." />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <h2>Access Denied</h2>
          <p>Please log in to access organizations.</p>
          <button onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <DashboardHeader 
        user={user}
        subscriptionType="free"
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="dashboard-layout">
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        <main className="dashboard-main">
          <div className="dashboard-content">
            <div className="projects-header">
              <div>
                <h1>Organizations</h1>
              </div>
              <button 
                className="primary-button" 
                onClick={() => setShowCreateModal(true)}
              >
                + Create Organization
              </button>
            </div>

            {organizations.length === 0 ? (
              <div className="empty-projects">
                <div className="empty-icon">🏢</div>
                <h2>No Organizations Yet</h2>
                <p>Create your first organization to start managing teams and projects</p>
                <button 
                  className="primary-button" 
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Organization
                </button>
              </div>
            ) : (
              <div className="organizations-grid">
                {organizations.map((org) => (
                  <div key={org.id} className="organization-card">
                    <div className="organization-header">
                      <div className="organization-info">
                        <h3>{org.name}</h3>
                        <p>{org.description || 'No description provided'}</p>
                      </div>
                      <div className="organization-actions">
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => openEditModal(org)}
                          title="Edit Organization"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteOrg(org.id, org.name)}
                          title="Delete Organization"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="organization-stats">
                      <div className="stat">
                        <span className="stat-value">{org.user_count || 0}</span>
                        <span className="stat-label">Members</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{org.project_count || 0}</span>
                        <span className="stat-label">Projects</span>
                      </div>
                    </div>
                    
                    <div className="organization-footer">
                      <button 
                        className="members-btn"
                        onClick={() => openMembersModal(org)}
                      >
                        👥 Manage Members
                      </button>
                      <span className="organization-date">
                        Created {new Date(org.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

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

      {/* Members Management Modal */}
      {showMembersModal && (
        <div className="modal-overlay" onClick={() => setShowMembersModal(false)}>
          <div className="modal-content members-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Members - {selectedOrg?.name}</h2>
              <button 
                className="close-button"
                onClick={() => setShowMembersModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* Add Member Section */}
              <div className="add-member-section">
                <h3>Add New Member</h3>
                <div className="form-row">
                  <div className="form-group">
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={memberFormData.email}
                      onChange={e => setMemberFormData({...memberFormData, email: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <select
                      value={memberFormData.role}
                      onChange={e => setMemberFormData({...memberFormData, role: e.target.value})}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button 
                    className="primary-button"
                    onClick={handleAddMember}
                  >
                    Add Member
                  </button>
                </div>
              </div>

              {/* Members List Section */}
              <div className="members-list-section">
                <h3>Current Members</h3>
                {loadingMembers ? (
                  <div className="loading-members">Loading members...</div>
                ) : (
                  <div className="members-list">
                    {orgMembers.map((member, index) => (
                      <div key={member.id || index} className="member-item">
                        <div className="member-info">
                          <div className="member-details">
                            <span className="member-name">
                              {member.user.first_name || member.user.last_name 
                                ? `${member.user.first_name} ${member.user.last_name}`.trim()
                                : member.user.username}
                            </span>
                            <span className="member-email">{member.user.email}</span>
                          </div>
                          <div className="member-role">
                            <span className={`role-badge ${member.role}`}>
                              {member.role === 'admin' ? 'Admin' : 'User'}
                            </span>
                            {member.user.id === selectedOrg?.owner?.id && (
                              <span className="owner-badge">Owner</span>
                            )}
                          </div>
                        </div>
                        {/* Only show remove button for non-owners */}
                        {member.user.id !== selectedOrg?.owner?.id && (
                          <button 
                            className="remove-member-button"
                            onClick={() => handleRemoveMember(member)}
                            title="Remove member"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    {orgMembers.length === 0 && !loadingMembers && (
                      <div className="no-members">No additional members found.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Organizations; 