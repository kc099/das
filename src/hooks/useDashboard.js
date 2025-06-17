import { useState, useEffect } from 'react';
import cacheService from '../services/cache';

export const useDashboardData = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    organizations: 0,
    devices: 0,
    templates: 0,
    clusters: 0,
    messages: 0,
    subscriptionType: 'freemium'
  });

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);

        const data = await cacheService.getDashboardData();
        
        if (data.profile) {
          setUser(data.profile);
          localStorage.setItem('user', JSON.stringify(data.profile));
        }

        setDashboardData({
          organizations: data.organizations.count || 0,
          devices: data.devices.count || 0,
          templates: data.templates.count || 0,
          clusters: data.clusters.count || 0,
          messages: data.mqttStats.messages || 0,
          subscriptionType: data.profile?.subscription_type || 'freemium'
        });

        cacheService.preloadCache();

      } catch (error) {
        console.error('Dashboard initialization error:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  const refreshDashboard = async () => {
    cacheService.clearAll();
    const data = await cacheService.getDashboardData();
    
    if (data.profile) {
      setUser(data.profile);
      localStorage.setItem('user', JSON.stringify(data.profile));
    }

    setDashboardData({
      organizations: data.organizations.count || 0,
      devices: data.devices.count || 0,
      templates: data.templates.count || 0,
      clusters: data.clusters.count || 0,
      messages: data.mqttStats.messages || 0,
      subscriptionType: data.profile?.subscription_type || 'freemium'
    });
  };

  return {
    user,
    loading,
    dashboardData,
    refreshDashboard
  };
};