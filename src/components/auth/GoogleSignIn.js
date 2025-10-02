import React, { useEffect, useState, useCallback } from 'react';
import { authAPI } from '../../services/api';

const GoogleSignIn = ({ onSuccess, onError, disabled = false }) => {
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  const handleCredentialResponse = useCallback(async (response) => {
    try {
      const result = await authAPI.googleOAuth(response.credential);
      
      if (result.data.status === 'success') {
        // Store tokens and user data
        localStorage.setItem('access_token', result.data.token);
        localStorage.setItem('refresh_token', result.data.refresh);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        
        onSuccess && onSuccess(result.data);
      } else {
        onError && onError(result.data.error || 'Google Sign-In failed');
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Google Sign-In failed';
      onError && onError(errorMessage);
    }
  }, [onSuccess, onError]);

  const initializeGoogleSignIn = useCallback(() => {
    if (window.google) {
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        console.error('Google Client ID not found in environment');
        return;
      }
      
      console.log('Using Google Client ID:', clientId); // <-- Add this line for debugging

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        console.log('Google Sign-In ready');
        setIsGoogleLoaded(true);
      } catch (error) {
        console.error('Google OAuth error:', error);
      }
    }
  }, [handleCredentialResponse]);

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [initializeGoogleSignIn]);

  const handleGoogleSignIn = () => {
    if (window.google && isGoogleLoaded) {
      window.google.accounts.id.prompt();
    } else {
      console.log('Google Sign-In not ready');
    }
  };

  return (
    <button
      type="button"
      className={`google-signin-btn ${!isGoogleLoaded ? 'loading' : ''}`}
      onClick={handleGoogleSignIn}
      disabled={disabled || !isGoogleLoaded}
    >
      <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" style={{ opacity: isGoogleLoaded ? 1 : 0.4 }}>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {isGoogleLoaded ? 'Continue with Google' : 'Loading Google Sign-In...'}
    </button>
  );
};

export default GoogleSignIn;