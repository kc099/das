import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { authAPI } from './services/api';
import { encryptFormData } from './utils/encryption';
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
  const { login } = useAuth();

  // Fetch public key on component mount
  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const key = await authAPI.getPublicKey();
        setPublicKey(key);
      } catch (err) {
        console.error('Failed to fetch public key:', err);
        setError('Failed to initialize secure connection. Please refresh the page.');
      } finally {
        setKeyLoading(false);
      }
    };

    fetchPublicKey();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
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
      // Encrypt sensitive data
      const encryptedPayload = await encryptFormData(formData, publicKey);
      
      // Send encrypted data to backend through auth context
      await login({
        email: formData.email,
        password: formData.password
      }, encryptedPayload);
      
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || err.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="form-header">
          <Link to="/" className="back-home">← Back to Home</Link>
          <h2>Login</h2>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
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
              disabled={loading}
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading || keyLoading || !publicKey}>
            {keyLoading ? 'Securing connection...' : loading ? 'Logging in...' : 'Login'}
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