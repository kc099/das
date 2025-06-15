import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from './services/api';
import { encryptAuthData } from './utils/encryption';
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [publicKey, setPublicKey] = useState(null);
  const [keyLoading, setKeyLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load public key on component mount - REQUIRED for secure authentication
    const loadPublicKey = async () => {
      try {
        const response = await authAPI.getPublicKey();
        setPublicKey(response.data.public_key);
        setError('');
      } catch (error) {
        console.error('Failed to load encryption key:', error);
        setError('Unable to establish secure connection. Please refresh the page.');
      } finally {
        setKeyLoading(false);
      }
    };
    
    loadPublicKey();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!publicKey) {
      setError('Secure connection not available. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Encrypt data - REQUIRED for authentication
      const encryptedPayload = await encryptAuthData(formData, publicKey);
      
      if (!encryptedPayload.data || !encryptedPayload.key) {
        throw new Error('Failed to encrypt authentication data');
      }

      const response = await authAPI.login(encryptedPayload);
      
      if (response.data.status === 'success') {
        // Store tokens and user data
        localStorage.setItem('access_token', response.data.token);
        localStorage.setItem('refresh_token', response.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Redirect to dashboard
        navigate('/home');
      } else {
        setError(response.data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Login failed. Please try again.';
      setError(typeof errorMessage === 'string' ? errorMessage : 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="form-header">
          <Link to="/" className="back-home">← Back to Home</Link>
          <h2>Login to EdgeSync</h2>
          {keyLoading ? (
            <div className="encryption-status loading">
              🔐 Establishing secure connection...
            </div>
          ) : publicKey ? (
            <div className="encryption-status">
              🔒 Secure connection established
            </div>
          ) : (
            <div className="encryption-status error">
              ❌ Secure connection failed
            </div>
          )}
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading || !publicKey}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading || !publicKey}
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading || !publicKey || keyLoading}>
            {keyLoading ? 'Initializing...' : loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
        <p className="signup-link">
          Don't have an account? <Link to="/signup">Sign up here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;