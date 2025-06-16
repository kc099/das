import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mqttAPI } from './services/api';
import './Dashboard.css';
import './MqttDashboard.css';

function MqttClustersPage() {
  const navigate = useNavigate();
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', host: '', port: 1883, username: '', password: '' });
  const [credentialsForm, setCredentialsForm] = useState({ username: '', password: '' });

    const loadData = async () => {
    try {
      console.log('Loading MQTT clusters...');
      
      // Get ALL clusters (both hosted and external) from database
      const clustersResponse = await mqttAPI.clusters.list();
      console.log('Clusters response:', clustersResponse);
      
      const clusters = [];
      
      // All clusters now come from database with UUIDs
      if (clustersResponse.data && Array.isArray(clustersResponse.data)) {
        clusters.push(...clustersResponse.data.map(cluster => ({
          id: cluster.uuid,
          uuid: cluster.uuid,
          name: cluster.name,
          host: cluster.host,
          port: cluster.port,
          username: cluster.username,
          password: cluster.password,
          cluster_type: cluster.cluster_type,
          created_at: cluster.created_at,
        })));
      }
      
      console.log('Final clusters:', clusters);
      setClusters(clusters);
      
    } catch (err) {
      console.error('Error loading MQTT clusters:', err);
      setClusters([]); // Set empty array on error
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [navigate]);

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

  // Show loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>MQTT Clusters</h1>
            <button className="back-btn" onClick={() => navigate('/home')}>← Back</button>
          </div>
        </header>
        <div className="tab-content" style={{textAlign: 'center', marginTop: '3rem'}}>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading clusters...</p>
          </div>
        </div>
      </div>
    );
  }

  // If no clusters exist, show empty state
  if (clusters.length === 0) {
    console.log('Empty state - showCreateModal:', showCreateModal, 'showCredentialsModal:', showCredentialsModal);
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>MQTT Clusters</h1>
            <button className="back-btn" onClick={() => navigate('/home')}>← Back</button>
          </div>
        </header>

        <div className="tab-content" style={{maxWidth: '600px', margin: '2rem auto'}}>
          <div className="empty-state">
            <div className="empty-icon">🔒</div>
            <h3>No MQTT clusters configured</h3>
            <p>Set up your MQTT credentials to get a free hosted cluster, or add an external cluster</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button className="create-btn" onClick={() => {
                console.log('Credentials button clicked');
                setShowCredentialsModal(true);
              }} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                🏠 Set MQTT Credentials
              </button>
              <button className="create-btn" onClick={() => {
                console.log('External cluster button clicked');
                setShowCreateModal(true);
              }} style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                🌐 Add External Cluster
              </button>
            </div>
          </div>
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
      </div>
    );
  }

    return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>MQTT Clusters</h1>
          <button className="back-btn" onClick={() => navigate('/home')}>← Back</button>
        </div>
      </header>

      {/* Cluster Grid */}
      <div className="tab-content">
        <div className="items-grid">
          {clusters.map((cluster) => (
            <div key={cluster.id} className="item-card cluster-card" onClick={() => openCluster(cluster)}>
              <div className="item-header">
                <h3>{cluster.name}</h3>
                <span className={`item-badge ${cluster.cluster_type}`}>
                  {cluster.cluster_type === 'hosted' ? '🏠 Hosted' : '🌐 External'}
                </span>
              </div>
              <div className="cluster-info">
                <p><strong>Host:</strong> {cluster.host}</p>
                <p><strong>Port:</strong> {cluster.port}</p>
                {cluster.cluster_type === 'hosted' && (
                  <p><strong>Plan:</strong> Serverless</p>
                )}
                {cluster.total_topics !== undefined && (
                  <p><strong>Topics:</strong> {cluster.total_topics} | <strong>Messages:</strong> {cluster.total_messages.toLocaleString()}</p>
                )}
              </div>
              <div className="item-actions">
                <button className="view-btn" onClick={(e) => { e.stopPropagation(); openCluster(cluster); }}>
                  Open
                </button>
                <button 
                  className="delete-btn" 
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
          ))}
        </div>
      </div>

      {/* Floating Add Button */}
      <button className="floating-add-btn" onClick={() => setShowCreateModal(true)}>
        <span>+</span>
      </button>

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
    </div>
  );
}

export default MqttClustersPage; 