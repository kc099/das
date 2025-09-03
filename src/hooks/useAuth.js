import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { getToken, setToken, removeToken, getUser, setUser } from '../utils/auth';

export const useAuthState = () => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      const savedUser = getUser();

      if (token && savedUser) {
        setUserState(savedUser);
        setIsAuthenticated(true);
        
        try {
          const currentUser = await authAPI.getCurrentUser();
          setUserState(currentUser);
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to fetch current user:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials, encryptedData = null) => {
    try {
      const response = await authAPI.login(credentials, encryptedData);
      if (response.token) {
        setToken(response.token);
        if (response.user) {
          setUser(response.user);
          setUserState(response.user);
        }
        setIsAuthenticated(true);
        return response;
      }
    } catch (error) {
      throw error;
    }
  };

  const signup = async (userData, encryptedData = null) => {
    try {
      const response = await authAPI.signup(userData, encryptedData);
      if (response.token) {
        setToken(response.token);
        if (response.user) {
          setUser(response.user);
          setUserState(response.user);
        }
        setIsAuthenticated(true);
        return response;
      }
    } catch (error) {
      throw error;
    }
  };

  const googleSignIn = async (credential) => {
    try {
      const response = await authAPI.googleOAuth(credential);
      if (response.data.status === 'success') {
        setToken(response.data.token);
        if (response.data.user) {
          setUser(response.data.user);
          setUserState(response.data.user);
        }
        setIsAuthenticated(true);
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      removeToken();
      setUserState(null);
      setIsAuthenticated(false);
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    signup,
    googleSignIn,
    logout
  };
};