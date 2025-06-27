import { create } from 'zustand';
import { organizationAPI, projectAPI, mqttAPI, deviceAPI } from '../services/api';
import cacheService from '../services/cache';

const useDashboardStore = create((set, get) => ({
  // State
  overviewStats: {
    organizations: 0,
    projects: 0,
    mqttClusters: 0,
    connectedDevices: 0
  },
  loading: false,
  error: null,
  lastUpdated: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Load all stats - keeping existing logic intact
  loadStats: async () => {
    const { loading } = get();
    if (loading) return; // Prevent concurrent calls

    try {
      set({ loading: true, error: null });
      
      // Initialize stats object - same as original logic
      const stats = {
        organizations: 0,
        projects: 0,
        mqttClusters: 0,
        connectedDevices: 0
      };

      // Fetch organizations - same as original logic
      try {
        const orgResponse = await organizationAPI.getOrganizations();
        if (orgResponse.data.status === 'success' && Array.isArray(orgResponse.data.organizations)) {
          stats.organizations = orgResponse.data.organizations.length;
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      }

      // Fetch projects - same as original logic
      try {
        const projectResponse = await projectAPI.getProjects();
        if (projectResponse.data.status === 'success' && Array.isArray(projectResponse.data.projects)) {
          stats.projects = projectResponse.data.projects.length;
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }

      // Fetch MQTT clusters - same as original logic
      try {
        const clustersResponse = await mqttAPI.clusters.list();
        if (clustersResponse.data && Array.isArray(clustersResponse.data)) {
          stats.mqttClusters = clustersResponse.data.length;
        }
      } catch (error) {
        console.error('Error fetching MQTT clusters:', error);
      }

      // Fetch devices - same as original logic
      try {
        const devicesResponse = await deviceAPI.getDevices();
        if (devicesResponse.data && Array.isArray(devicesResponse.data)) {
          stats.connectedDevices = devicesResponse.data.length;
          // Update cache - same as original logic
          cacheService.setOverviewStats({
            connectedDevices: devicesResponse.data.length,
            mqttClusters: stats.mqttClusters
          });
        }
      } catch (error) {
        console.error('Error fetching devices:', error);
        // Try to get from cache if API fails - same as original logic
        try {
          const cachedStats = await cacheService.getOverviewStats();
          stats.connectedDevices = cachedStats.connectedDevices || 0;
        } catch (cacheError) {
          console.error('Error getting cached stats:', cacheError);
        }
      }
      
      set({ 
        overviewStats: stats, 
        loading: false, 
        lastUpdated: Date.now() 
      });
    } catch (error) {
      console.error('Error loading sidebar stats:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Update specific stat
  updateStat: (key, value) => set((state) => ({
    overviewStats: {
      ...state.overviewStats,
      [key]: value
    }
  })),

  // Increment stat (useful for when items are created)
  incrementStat: (key) => set((state) => ({
    overviewStats: {
      ...state.overviewStats,
      [key]: state.overviewStats[key] + 1
    }
  })),

  // Decrement stat (useful for when items are deleted)
  decrementStat: (key) => set((state) => ({
    overviewStats: {
      ...state.overviewStats,
      [key]: Math.max(0, state.overviewStats[key] - 1)
    }
  })),

  // Reset store
  reset: () => set({
    overviewStats: {
      organizations: 0,
      projects: 0,
      mqttClusters: 0,
      connectedDevices: 0
    },
    loading: false,
    error: null,
    lastUpdated: null
  }),

  // Check if data is stale (older than 5 minutes)
  isStale: () => {
    const { lastUpdated } = get();
    if (!lastUpdated) return true;
    return Date.now() - lastUpdated > 5 * 60 * 1000;
  },

  // Refresh if stale
  refreshIfStale: async () => {
    const { isStale, loadStats } = get();
    if (isStale()) {
      await loadStats();
    }
  }
}));

export default useDashboardStore;