import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mqttAPI } from './services/api';
import cacheService from './services/cache';
import './Dashboard.css';
import './MqttDashboard.css';

function MqttClustersPage() {
  const navigate = useNavigate();
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', host: '', port: 1883, username: '', password: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Use cache service to get clusters data quickly
        const clustersData = await cacheService.getMqttClusters();
        setClusters(clustersData.clusters || []);
        
      } catch (err) {
        console.error('Error loading MQTT data:', err);
        if (err.response?.status === 401) navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    
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
      
      // Invalidate cache and refresh clusters
      cacheService.refreshAfterAction('cluster_created');
      const clustersData = await cacheService.getMqttClusters();
      setClusters(clustersData.clusters || []);
      
      // Reset form and close modal
      setCreateForm({ name: '', host: '', port: 1883, username: '', password: '' });
      setShowCreateModal(false);
      alert('External cluster added successfully');
    } catch (err) {
      console.error('Error creating cluster:', err);
      alert('Failed to create cluster: ' + (err.response?.data?.error || err.message));
    }
  };

  // Function to navigate to cluster details
  const openCluster = (cluster) => {
    if (cluster.cluster_type === 'hosted') {
      navigate('/mqtt-dashboard');
    } else {
      // Navigate to external cluster dashboard with UUID
      navigate(`/mqtt-dashboard?cluster=${cluster.uuid}`);
    }
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
            <p>Add your first MQTT cluster to get started</p>
            <button className="create-btn" onClick={() => setShowCreateModal(true)}>
              + Add Cluster
            </button>
          </div>
        </div>
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
                        if (cluster.cluster_type === 'hosted') {
                          // For hosted cluster, delete MQTT credentials and ACLs
                          await mqttAPI.deleteHostedCluster();
                        } else {
                          // For external cluster, delete from database
                          await mqttAPI.clusters.delete(cluster.uuid);
                        }
                        
                        // Invalidate cache and refresh clusters
                        cacheService.refreshAfterAction('cluster_deleted');
                        const clustersData = await cacheService.getMqttClusters();
                        setClusters(clustersData.clusters || []);
                        
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
    </div>
  );
}

export default MqttClustersPage; 