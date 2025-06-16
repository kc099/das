import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mqttAPI } from './services/api';
import cacheService from './services/cache';
import './Dashboard.css'; // reuse core styles
import './MqttDashboard.css';
import mqtt from 'mqtt';

function MqttDashboard() {
  const navigate = useNavigate();
  const [clusters, setClusters] = useState([]);
  const [info, setInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Not Connected');
  const [testRunning, setTestRunning] = useState(false);
  const [acls, setAcls] = useState([]);
  const [aclForm, setAclForm] = useState({ topicPattern: '', accessType: 1 });
  const [stats, setStats] = useState({
    topics: 0,
    messages: 0,
    subscriptions: 0,
    activities: [],
    traffic: { today: '0 KB', week: '0 KB', lifetime: '0 KB' }
  });
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsForm, setCredentialsForm] = useState({ password: '', confirmPassword: '' });

  useEffect(() => {
    const loadAll = async () => {
      try {
        // Fetch fresh credentials data when user opens dashboard 
        const res = await mqttAPI.getInfo();
        setInfo(res.data);
        const hosted={id:'hosted',name:'Serverless',host:res.data.broker.host,port:res.data.broker.port,type:'hosted'};
        setClusters([hosted]);
        
        // Fetch fresh ACLs (sensitive data, not cached)
        const aclRes = await mqttAPI.listAcls();
        setAcls(aclRes.data);
        
        // Use cached statistics (non-sensitive, frequently updated data)
        const statsData = await cacheService.getMqttStats();
        setStats({
          topics: statsData.topics,
          messages: statsData.messages,
          subscriptions: statsData.subscriptions,
          activities: statsData.activities,
          traffic: {
            today: statsData.traffic.today_kb >= 1024 ? 
              `${(statsData.traffic.today_kb / 1024).toFixed(1)} MB` : 
              `${statsData.traffic.today_kb} KB`,
            week: statsData.traffic.week_kb >= 1024 ? 
              `${(statsData.traffic.week_kb / 1024).toFixed(1)} MB` : 
              `${statsData.traffic.week_kb} KB`,
            lifetime: statsData.traffic.lifetime_kb >= 1024 * 1024 ? 
              `${(statsData.traffic.lifetime_kb / 1024 / 1024).toFixed(1)} GB` : 
              statsData.traffic.lifetime_kb >= 1024 ? 
              `${(statsData.traffic.lifetime_kb / 1024).toFixed(1)} MB` : 
              `${statsData.traffic.lifetime_kb} KB`
          }
        });
      } catch(err){
        console.error(err);
      }
    };
    loadAll();
  }, []);

  const currentCluster = clusters[0];

  const testConnection = async () => {
    if (!currentCluster) {
      setConnectionStatus('❌ No cluster');
      return;
    }
    
    setTestRunning(true);
    setConnectionStatus('🔄 Testing...');
    
    try {
      // Try multiple connection methods and protocols
      const protocols = [
        { url: `wss://${currentCluster.host}:${currentCluster.port + 1}/mqtt`, name: 'WSS' },
        { url: `ws://${currentCluster.host}:${currentCluster.port + 1}/mqtt`, name: 'WS' },
        { url: `mqtt://${currentCluster.host}:${currentCluster.port}`, name: 'TCP' }
      ];
      
      let connected = false;
      let lastError = null;
      
      // Helper function to test a single protocol
      const testSingleProtocol = async (protocol) => {
        setConnectionStatus(`🔄 Trying ${protocol.name}...`);
        
        const options = {
          reconnectPeriod: 0,
          connectTimeout: 8000,
          clean: true,
          keepalive: 30
        };
        
        // Add credentials if available
        if (info && info.username && info.hasPassword) {
          options.username = info.username;
          options.password = info.password || '';
        } else if (currentCluster.username && currentCluster.password) {
          options.username = currentCluster.username;
          options.password = currentCluster.password;
        }
        
        const client = mqtt.connect(protocol.url, options);
        
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            client.end(true);
            reject(new Error(`${protocol.name} connection timeout`));
          }, 8000);
          
          const handleConnect = () => {
            clearTimeout(timeout);
            setConnectionStatus(`✅ Connected (${protocol.name})`);
            client.end();
            resolve({ success: true, protocol: protocol.name });
          };
          
          const handleError = (err) => {
            clearTimeout(timeout);
            client.end(true);
            reject(err);
          };
          
          client.on('connect', handleConnect);
          client.on('error', handleError);
        });
      };
      
      for (const protocol of protocols) {
        if (connected) break;
        
        try {
          await testSingleProtocol(protocol);
          connected = true;
          break;
        } catch (err) {
          lastError = err;
          console.log(`${protocol.name} failed:`, err.message);
        }
      }
      
      if (!connected) {
        setConnectionStatus('❌ Connection failed');
        
        // Provide specific error feedback
        let errorMsg = 'Connection failed. ';
        if (lastError) {
          if (lastError.message.includes('timeout')) {
            errorMsg += 'The broker is not responding. Check if it\'s running and accessible.';
          } else if (lastError.message.includes('refused')) {
            errorMsg += 'Connection refused. Check the host and port settings.';
          } else if (lastError.message.includes('unauthorized') || lastError.message.includes('authentication')) {
            errorMsg += 'Authentication failed. Check your credentials.';
          } else {
            errorMsg += `Error: ${lastError.message}`;
          }
        } else {
          errorMsg += 'Please verify the broker settings and network connectivity.';
        }
        
        alert(errorMsg);
      }
      
    } catch (err) {
      setConnectionStatus('❌ Test failed');
      console.error('Connection test error:', err);
      alert(`Connection test failed: ${err.message}`);
    } finally {
      setTestRunning(false);
    }
  };

  const switchTab = (tabName) => {
    // Remove active class from all tab headers and panels
    document.querySelectorAll('.tab-header').forEach(h => h.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    
    // Add active class to selected tab header and panel
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
  };

  return (
    <div className="mqtt-main" style={{padding:'1.5rem'}}>
      <header className="cluster-header">
        <h1>{currentCluster ? currentCluster.name : 'Hosted Broker'}</h1>
        <button className="back-btn" onClick={()=>navigate('/home')}>← Back</button>
      </header>

      <div className="cluster-cards">
        <div className="stat-card">
          <div className="stat-icon">🌐</div>
          <div className="stat-content">
            <h3>{currentCluster ? `${currentCluster.host}:${currentCluster.port}` : '...'}</h3>
            <p>Broker Host</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📶</div>
          <div className="stat-content">
            <h3>{connectionStatus}</h3>
            <p>Status</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🛠</div>
          <div className="stat-content">
            <button className="create-btn" disabled={testRunning} onClick={testConnection}>Test Connection</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mqtt-tabs">
        <div className="tab-headers">
          <button className="tab-header active" data-tab="overview" onClick={() => switchTab('overview')}>Overview</button>
          <button className="tab-header" data-tab="credentials" onClick={() => switchTab('credentials')}>Credentials</button>
          <button className="tab-header" data-tab="acls" onClick={() => switchTab('acls')}>ACLs</button>
        </div>

        {/* Overview Tab */}
        <div className="tab-panel active" id="overview">
          <div className="overview-grid">
            <div className="overview-section">
              <h3>📊 Topic Statistics</h3>
              <div className="topic-stats">
                <div className="stat-item">
                  <span className="stat-label">Active Topics:</span>
                  <span className="stat-value">{stats.topics}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Published Messages:</span>
                  <span className="stat-value">{stats.messages.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Subscriptions:</span>
                  <span className="stat-value">{stats.subscriptions}</span>
                </div>
              </div>
            </div>

            <div className="overview-section">
              <h3>🔄 Recent Activity</h3>
              <div className="activity-list">
                {stats.activities.length === 0 ? (
                  <p>No recent activity</p>
                ) : (
                  stats.activities.map((activity, idx) => (
                    <div key={idx} className="activity-item">
                      <span className="activity-type">{activity.type}</span>
                      <span className="activity-topic">{activity.topic}</span>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="overview-section">
              <h3>📈 Traffic Overview</h3>
              <div className="traffic-stats">
                <div className="traffic-item">
                  <span className="traffic-label">Today:</span>
                  <span className="traffic-value">{stats.traffic.today}</span>
                </div>
                <div className="traffic-item">
                  <span className="traffic-label">This Week:</span>
                  <span className="traffic-value">{stats.traffic.week}</span>
                </div>
                <div className="traffic-item">
                  <span className="traffic-label">Lifetime:</span>
                  <span className="traffic-value">{stats.traffic.lifetime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credentials Tab */}
        <div className="tab-panel" id="credentials">
          <div className="credentials-section">
            <h3>🔑 User Credentials</h3>
            {info && (
              <div className="credential-info">
                <div className="cred-item">
                  <span className="cred-label">Username:</span>
                  <code className="cred-value">{info.username}</code>
                </div>
                <div className="cred-item">
                  <span className="cred-label">Password:</span>
                  <span className="cred-value">{info.hasPassword ? '••••••••' : 'Not set'}</span>
                </div>
                <div className="cred-item">
                  <span className="cred-label">Connection Status:</span>
                  <span className={`status-badge ${info.hasPassword ? 'active' : 'inactive'}`}>
                    {info.hasPassword ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <button className="edit-btn" onClick={()=>setShowCredentialsModal(true)}>
                  {info.hasPassword ? 'Update Credentials' : 'Create Credentials'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ACL Tab */}
        <div className="tab-panel" id="acls">
          <div className="acl-management">
            <div className="acl-form-section">
              <h3>Add ACL Rule</h3>
              <div className="form" style={{maxWidth:'400px'}}>
                <div className="form-group">
                  <label>Topic Pattern</label>
                  <input 
                    value={aclForm.topicPattern} 
                    onChange={e=>setAclForm({...aclForm, topicPattern:e.target.value})}
                    placeholder="e.g., sensor/+/data"
                  />
                </div>
                <div className="form-group">
                  <label>Access Type</label>
                  <select value={aclForm.accessType} onChange={e=>setAclForm({...aclForm, accessType:parseInt(e.target.value)})}>
                    <option value={1}>Read (1)</option>
                    <option value={2}>Write (2)</option>
                    <option value={3}>Read/Write (3)</option>
                    <option value={4}>Subscribe (4)</option>
                  </select>
                </div>
                <button className="create-btn" onClick={async()=>{
                  if(!aclForm.topicPattern) return;
                  try{
                    const res = await mqttAPI.addAcl(aclForm);
                    const newAcl = {id: res.data.id, topicPattern: aclForm.topicPattern, accessType: aclForm.accessType};
                    setAcls([...acls, newAcl]);
                    setAclForm({topicPattern:'', accessType:1});
                    
                    // Invalidate cache and refresh statistics after adding ACL
                    cacheService.refreshAfterAction('acl_updated');
                    const statsData = await cacheService.getMqttStats();
                    setStats(prevStats => ({
                      ...prevStats,
                      topics: statsData.topics,
                      messages: statsData.messages,
                      subscriptions: statsData.subscriptions,
                      activities: statsData.activities
                    }));
                    
                    alert('ACL rule added successfully');
                  }catch(err){
                    console.error('ACL error:', err);
                    alert(err.response?.data?.error||'Error adding ACL rule');
                  }
                }}>Add ACL Rule</button>
              </div>
            </div>
            
            <div className="acl-list-section">
              <h3>Existing ACL Rules</h3>
              {acls.length === 0 ? (
                <p>No ACL rules configured</p>
              ) : (
                <div className="acl-list">
                  {acls.map(acl => (
                    <div key={acl.id} className="acl-item">
                      <div className="acl-info">
                        <strong>{acl.topicPattern}</strong>
                        <span className="acl-type">
                          Access: {acl.accessType === 1 ? 'Read' : acl.accessType === 2 ? 'Write' : acl.accessType === 3 ? 'Read/Write' : 'Subscribe'} ({acl.accessType})
                        </span>
                      </div>
                      <button 
                        className="delete-btn" 
                        onClick={async()=>{
                          if(window.confirm(`Delete ACL rule for ${acl.topicPattern}?`)) {
                            try {
                              await mqttAPI.deleteAcl(acl.id); 
                              setAcls(acls.filter(x=>x.id!==acl.id));
                              alert('ACL rule deleted successfully');
                            } catch(err) {
                              alert('Error deleting ACL rule');
                            }
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Credentials Modal */}
      {showCredentialsModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{info && info.hasPassword ? 'Update' : 'Create'} MQTT Credentials</h3>
              <button className="close-btn" onClick={() => {
                setShowCredentialsModal(false);
                setCredentialsForm({ password: '', confirmPassword: '' });
              }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (credentialsForm.password !== credentialsForm.confirmPassword) {
                  alert('Passwords do not match');
                  return;
                }
                if (credentialsForm.password.length < 6) {
                  alert('Password must be at least 6 characters');
                  return;
                }
                
                try {
                  await mqttAPI.setPassword({ password: credentialsForm.password });
                  
                  // Invalidate cache and refresh info
                  cacheService.refreshAfterAction('mqtt_credentials_updated');
                  const res = await mqttAPI.getInfo();
                  setInfo(res.data);
                  
                  setShowCredentialsModal(false);
                  setCredentialsForm({ password: '', confirmPassword: '' });
                  alert('MQTT credentials updated successfully');
                } catch (err) {
                  console.error('Error updating credentials:', err);
                  alert('Failed to update credentials: ' + (err.response?.data?.error || err.message));
                }
              }}>
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password"
                    value={credentialsForm.password} 
                    onChange={e => setCredentialsForm({...credentialsForm, password: e.target.value})} 
                    required
                    placeholder="Enter new MQTT password"
                    minLength="6"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input 
                    type="password"
                    value={credentialsForm.confirmPassword} 
                    onChange={e => setCredentialsForm({...credentialsForm, confirmPassword: e.target.value})} 
                    required
                    placeholder="Confirm new password"
                    minLength="6"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => {
                    setShowCredentialsModal(false);
                    setCredentialsForm({ password: '', confirmPassword: '' });
                  }}>Cancel</button>
                  <button type="submit" className="create-btn">
                    {info && info.hasPassword ? 'Update' : 'Create'} Credentials
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

export default MqttDashboard; 