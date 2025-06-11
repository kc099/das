import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { authAPI } from './services/api';
import { encryptFormData } from './utils/encryption';
import './Signup.css';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [publicKey, setPublicKey] = useState(null);
  const [keyLoading, setKeyLoading] = useState(true);
  const navigate = useNavigate();
  const { signup } = useAuth();

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
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

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
      await signup({
        username: formData.name,
        email: formData.email,
        password: formData.password
      }, encryptedPayload);
      
      navigate('/');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || err.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        <div className="form-header">
          <Link to="/" className="back-home">← Back to Home</Link>
          <h2>Sign Up</h2>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="name">Full Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
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
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="signup-btn" disabled={loading || keyLoading || !publicKey}>
            {keyLoading ? 'Securing connection...' : loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <p className="login-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;