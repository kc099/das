import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from './services/api';
import { encryptAuthData } from './utils/encryption';
import './Signup.css';

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [publicKey, setPublicKey] = useState(null);
  const [keyLoading, setKeyLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load public key on component mount - REQUIRED for secure registration
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

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      // Prepare data for backend (exclude confirmPassword)
      const signupData = {
        username: formData.username,
        email: formData.email,
        password: formData.password
      };

      // Encrypt data - REQUIRED for registration
      const encryptedPayload = await encryptAuthData(signupData, publicKey);
      
      if (!encryptedPayload.data || !encryptedPayload.key) {
        throw new Error('Failed to encrypt registration data');
      }

      const response = await authAPI.signup(encryptedPayload);
      
      if (response.data.status === 'success') {
        // Store tokens and user data
        localStorage.setItem('access_token', response.data.token);
        localStorage.setItem('refresh_token', response.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(response.data.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorData = error.response?.data?.error || error.message;
      
      if (typeof errorData === 'object') {
        // Handle validation errors from Django
        const errorMessages = Object.values(errorData).flat();
        setError(errorMessages.join('. '));
      } else {
        setError(errorData || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        <div className="form-header">
          <Link to="/" className="back-home">← Back to Home</Link>
          <h2>Sign up for EdgeSync</h2>
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
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading || !publicKey}
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
              minLength="6"
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
              disabled={loading || !publicKey}
            />
          </div>
          <button type="submit" className="signup-btn" disabled={loading || !publicKey || keyLoading}>
            {keyLoading ? 'Initializing...' : loading ? 'Creating account...' : 'Secure Sign Up'}
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