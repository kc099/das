import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, mqttAPI } from '../services/api';
import DashboardHeader from '../components/common/DashboardHeader';
import DashboardSidebar from '../components/common/DashboardSidebar';
import LoadingLayout from '../components/common/LoadingLayout';
import cacheService from '../services/cache';
import './Dashboard.css';
import '../styles/MqttPage.css';
import '../styles/BaseLayout.css';
import '../styles/MqttPage.css';
import useDashboardStore from '../store/dashboardStore';
import { useStatActions } from '../hooks/useDashboardStats';

function MqttClustersPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useDashboardStore();
  const [createForm, setCreateForm] = useState({ name: '', host: '', port: 1883, username: '', password: '' });
  const [credentialsForm, setCredentialsForm] = useState({ username: '', password: '' });
  const { incrementStat, decrementStat, refresh: refreshStats } = useStatActions();

  // Wrap loadData in useCallback so that its reference is stable across
  // renders. This prevents useEffect below from triggering on every render
  // and causing an infinite re-fetch / loading-spinner loop.
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const userResponse = await authAPI.get('/profile/');
      if (userResponse.data.status === 'success') {
        setUser(userResponse.data.user);
      }
      
      // Get clusters from database
      const clustersResponse = await mqttAPI.clusters.list();
      
      if (clustersResponse.data && Array.isArray(clustersResponse.data)) {
        const clusters = clustersResponse.data.map(cluster => ({
          id: cluster.uuid,
          uuid: cluster.uuid,
          name: cluster.name,
          host: cluster.host,
          port: cluster.port,
          username: cluster.username,
          password: cluster.password,
          cluster_type: cluster.cluster_type,
          created_at: cluster.created_at,
        }));
        setClusters(clusters);
      } else {
        setClusters([]);
      }
      
    } catch (err) {
      console.error('Error loading MQTT clusters:', err);
      setClusters([]);
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // loadData is now memoised, so this effect will only run once on mount (or
  // if navigate function changes, which is highly unlikely).
  useEffect(() => {
    const initializePage = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      await loadData();
    };

    initializePage();
  }, [navigate, loadData]);

  const handleCreateCluster = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.host || !createForm.port) return;
    
    try {
      // Create cluster in database
      const clusterData = {
        name: createForm.name,
        host: createForm.host,
        port: parseInt(createForm.port),
        username: createForm.username,
        password: createForm.password,
        cluster_type: 'external'
      };
      
      await mqttAPI.clusters.create(clusterData);
      
      // Reload clusters directly
      loadData();
      
      incrementStat('mqttClusters');
      refreshStats();
      
      // Reset form and close modal
      setCreateForm({ name: '', host: '', port: 1883, username: '', password: '' });
      setShowCreateModal(false);
      alert('External cluster added successfully');
    } catch (err) {
      console.error('Error creating cluster:', err);
      alert('Failed to create cluster: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSetCredentials = async (e) => {
    e.preventDefault();
    if (!credentialsForm.username || !credentialsForm.password) return;
    
    try {
      await mqttAPI.setPassword({
        username: credentialsForm.username,
        password: credentialsForm.password
      });
      
      // Reload clusters to show the newly created hosted cluster
      loadData();
      
      incrementStat('mqttClusters');
      refreshStats();
      
      // Reset form and close modal
      setCredentialsForm({ username: '', password: '' });
      setShowCredentialsModal(false);
      alert('MQTT credentials set successfully! Your hosted cluster has been created.');
    } catch (err) {
      console.error('Error setting credentials:', err);
      alert('Failed to set credentials: ' + (err.response?.data?.error || err.message));
    }
  };

  // Function to navigate to cluster details
  const openCluster = (cluster) => {
    // All clusters now have UUIDs, navigate with cluster parameter
    navigate(`/mqtt-dashboard?cluster=${cluster.uuid}`);
  };

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

  // Show loading state
  if (loading) {
    return <LoadingLayout user={user} message="Loading clusters..." />;
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <h2 className="empty-title">Access Denied</h2>
          <p className="empty-description">Please log in to access MQTT clusters.</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  // If no clusters exist, show empty state
  if (clusters.length === 0) {
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
            <div className="page-header">
              <div className="page-header-content">
                <h1 className="page-title">MQTT Clusters</h1>
                <p className="page-subtitle">Manage your MQTT brokers and connections</p>
              </div>
            </div>

            <div className="empty-state">
              <div className="empty-icon">🔗</div>
              <h2 className="empty-title">No MQTT Clusters Yet</h2>
              <p className="empty-description">Set up your MQTT credentials to get a free hosted cluster, or add an external cluster</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setShowCredentialsModal(true)}
                >
                  🏠 Set MQTT Credentials
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setShowCreateModal(true)}
                >
                  🌐 Add External Cluster
                </button>
              </div>
            </div>
          </main>
        </div>

        {/* MODALS MOVED HERE - they need to be rendered even in empty state */}
        {/* Create Cluster Modal */}
        {(showCreateModal || window.location.hash === '#debug-modal') && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Add External MQTT Cluster</h3>
                <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleCreateCluster}>
                  <div className="form-group">
                    <label>Cluster Name</label>
                    <input 
                      type="text"
                      value={createForm.name} 
                      onChange={e => setCreateForm({...createForm, name: e.target.value})} 
                      required
                      placeholder="e.g., My IoT Cluster"
                    />
                  </div>
                  <div className="form-group">
                    <label>Host</label>
                    <input 
                      type="text"
                      value={createForm.host} 
                      onChange={e => setCreateForm({...createForm, host: e.target.value})} 
                      required
                      placeholder="e.g., broker.example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Port</label>
                    <input 
                      type="number"
                      value={createForm.port} 
                      onChange={e => setCreateForm({...createForm, port: e.target.value})} 
                      required
                      min="1"
                      max="65535"
                      placeholder="1883"
                    />
                  </div>
                  <div className="form-group">
                    <label>Username (Optional)</label>
                    <input 
                      type="text"
                      value={createForm.username} 
                      onChange={e => setCreateForm({...createForm, username: e.target.value})} 
                      placeholder="MQTT username"
                    />
                  </div>
                  <div className="form-group">
                    <label>Password (Optional)</label>
                    <input 
                      type="password"
                      value={createForm.password} 
                      onChange={e => setCreateForm({...createForm, password: e.target.value})} 
                      placeholder="MQTT password"
                    />
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-primary" type="submit">
                      Add Cluster
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* MQTT Credentials Modal */}
        {showCredentialsModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Set MQTT Credentials</h3>
                <button className="close-btn" onClick={() => setShowCredentialsModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
                  Set your MQTT username and password to get a free hosted cluster on our servers.
                </p>
                <form onSubmit={handleSetCredentials}>
                  <div className="form-group">
                    <label>MQTT Username</label>
                    <input 
                      type="text"
                      value={credentialsForm.username} 
                      onChange={e => setCredentialsForm({...credentialsForm, username: e.target.value})} 
                      required
                      minLength="3"
                      placeholder="Enter MQTT username (3+ chars)"
                    />
                  </div>
                  <div className="form-group">
                    <label>MQTT Password</label>
                    <input 
                      type="password"
                      value={credentialsForm.password} 
                      onChange={e => setCredentialsForm({...credentialsForm, password: e.target.value})} 
                      required
                      minLength="8"
                      placeholder="Enter MQTT password (8+ chars)"
                    />
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowCredentialsModal(false)}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-primary" type="submit">
                      Set Credentials
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
          <div className="page-header">
            <div className="page-header-content">
              <h1 className="page-title">MQTT Clusters</h1>
              <p className="page-subtitle">Manage your MQTT brokers and connections</p>
            </div>
            <div className="page-actions">
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                + New Cluster
              </button>
            </div>
          </div>

          {/* Cluster Grid */}
          <div className="clusters-grid">
              {clusters.map((cluster) => (
                <div key={cluster.id} className="cluster-card" style={{cursor: 'pointer'}} onClick={() => openCluster(cluster)}>
                  <div className="card-header">
                    <h3 className="card-title">{cluster.name}</h3>
                    <span className={`status-badge ${cluster.cluster_type === 'hosted' ? 'status-success' : 'status-info'}`}>
                      {cluster.cluster_type === 'hosted' ? '🏠 Hosted' : '🌐 External'}
                    </span>
                  </div>
                  <div className="card-content">
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                      <p style={{margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)'}}><strong>Host:</strong> {cluster.host}</p>
                      <p style={{margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)'}}><strong>Port:</strong> {cluster.port}</p>
                      {cluster.cluster_type === 'hosted' && (
                        <p style={{margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)'}}><strong>Plan:</strong> Serverless</p>
                      )}
                      {cluster.total_topics !== undefined && (
                        <p style={{margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)'}}><strong>Topics:</strong> {cluster.total_topics} | <strong>Messages:</strong> {cluster.total_messages.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="card-footer">
                    <div style={{display: 'flex', gap: '0.5rem', width: '100%'}}>
                      <button className="btn btn-primary" style={{flex: 1}} onClick={(e) => { e.stopPropagation(); openCluster(cluster); }}>
                        Open
                      </button>
                      <button 
                        className="btn btn-danger"
                        style={{flex: 1}}
                        onClick={async (e) => { 
                          e.stopPropagation(); 
                          const confirmMsg = cluster.cluster_type === 'hosted' 
                            ? `Delete hosted cluster "${cluster.name}"? This will remove all your MQTT credentials and ACL rules.`
                            : `Delete cluster "${cluster.name}"?`;
                          
                          if(window.confirm(confirmMsg)) {
                            try {
                              // All clusters are now in database, delete using UUID
                              await mqttAPI.clusters.delete(cluster.uuid);
                              
                              // Reload clusters directly
                              loadData();
                              
                              decrementStat('mqttClusters');
                              refreshStats();
                              
                              alert('Cluster deleted successfully');
                            } catch (err) {
                              console.error('Error deleting cluster:', err);
                              alert('Failed to delete cluster: ' + (err.response?.data?.error || err.message));
                            }
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

            {/* Create Cluster Modal */}
            {showCreateModal && (
              <div className="modal-overlay">
                <div className="modal">
                  <div className="modal-header">
                    <h3>Add External MQTT Cluster</h3>
                    <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
                  </div>
                  <div className="modal-body">
                    <form onSubmit={handleCreateCluster}>
                      <div className="form-group">
                        <label>Cluster Name</label>
                        <input 
                          type="text"
                          value={createForm.name} 
                          onChange={e => setCreateForm({...createForm, name: e.target.value})} 
                          required
                          placeholder="e.g., My IoT Cluster"
                        />
                      </div>
                      <div className="form-group">
                        <label>Host</label>
                        <input 
                          type="text"
                          value={createForm.host} 
                          onChange={e => setCreateForm({...createForm, host: e.target.value})} 
                          required
                          placeholder="e.g., broker.example.com"
                        />
                      </div>
                      <div className="form-group">
                        <label>Port</label>
                        <input 
                          type="number"
                          value={createForm.port} 
                          onChange={e => setCreateForm({...createForm, port: e.target.value})} 
                          required
                          min="1"
                          max="65535"
                          placeholder="1883"
                        />
                      </div>
                      <div className="form-group">
                        <label>Username (Optional)</label>
                        <input 
                          type="text"
                          value={createForm.username} 
                          onChange={e => setCreateForm({...createForm, username: e.target.value})} 
                          placeholder="MQTT username"
                        />
                      </div>
                      <div className="form-group">
                        <label>Password (Optional)</label>
                        <input 
                          type="password"
                          value={createForm.password} 
                          onChange={e => setCreateForm({...createForm, password: e.target.value})} 
                          placeholder="MQTT password"
                        />
                      </div>
                      <div className="modal-footer">
                        <button 
                          type="button" 
                          className="cancel-btn" 
                          onClick={() => setShowCreateModal(false)}
                        >
                          Cancel
                        </button>
                        <button className="create-btn" type="submit">
                          Add Cluster
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* MQTT Credentials Modal */}
            {showCredentialsModal && (
              <div className="modal-overlay">
                <div className="modal">
                  <div className="modal-header">
                    <h3>Set MQTT Credentials</h3>
                    <button className="close-btn" onClick={() => setShowCredentialsModal(false)}>×</button>
                  </div>
                  <div className="modal-body">
                    <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
                      Set your MQTT username and password to get a free hosted cluster on our servers.
                    </p>
                    <form onSubmit={handleSetCredentials}>
                      <div className="form-group">
                        <label>MQTT Username</label>
                        <input 
                          type="text"
                          value={credentialsForm.username} 
                          onChange={e => setCredentialsForm({...credentialsForm, username: e.target.value})} 
                          required
                          minLength="3"
                          placeholder="Enter MQTT username (3+ chars)"
                        />
                      </div>
                      <div className="form-group">
                        <label>MQTT Password</label>
                        <input 
                          type="password"
                          value={credentialsForm.password} 
                          onChange={e => setCredentialsForm({...credentialsForm, password: e.target.value})} 
                          required
                          minLength="8"
                          placeholder="Enter MQTT password (8+ chars)"
                        />
                      </div>
                      <div className="modal-footer">
                        <button 
                          type="button" 
                          className="cancel-btn" 
                          onClick={() => setShowCredentialsModal(false)}
                        >
                          Cancel
                        </button>
                        <button className="create-btn" type="submit">
                          Set Credentials
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}

export default MqttClustersPage; 