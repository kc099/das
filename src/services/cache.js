// Centralized cache service for dashboard data
import { authAPI, mqttAPI, deviceAPI } from './api';

class CacheService {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.cacheDurations = {
      profile: 5 * 60 * 1000,        // 5 minutes - user profile changes rarely
      organizations: 10 * 60 * 1000,  // 10 minutes - organizations change rarely
      dashboardTemplates: 3 * 60 * 1000, // 3 minutes - templates might be added/edited
      devices: 2 * 60 * 1000,         // 2 minutes - devices might be added/removed
      mqttClusters: 2 * 60 * 1000,    // 2 minutes - clusters might be added/removed
      mqttInfo: 1 * 60 * 1000,        // 1 minute - MQTT status can change
      mqttStats: 30 * 1000,           // 30 seconds - statistics change frequently
    };
  }

  // Check if cache is valid
  isCacheValid(key) {
    const timestamp = this.cacheTimestamps.get(key);
    const duration = this.cacheDurations[key];
    
    if (!timestamp || !duration) return false;
    return Date.now() - timestamp < duration;
  }

  // Get from cache or fetch fresh data
  async get(key, fetchFunction) {
    if (this.isCacheValid(key)) {
      console.log(`Cache hit for ${key}`);
      return this.cache.get(key);
    }

    console.log(`Cache miss for ${key}, fetching fresh data`);
    try {
      const data = await fetchFunction();
      this.cache.set(key, data);
      this.cacheTimestamps.set(key, Date.now());
      return data;
    } catch (error) {
      // If fetch fails and we have stale cache, return it
      if (this.cache.has(key)) {
        console.log(`Fetch failed for ${key}, returning stale cache`);
        return this.cache.get(key);
      }
      throw error;
    }
  }

  // Clear specific cache entry
  invalidate(key) {
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
    console.log(`Cache invalidated for ${key}`);
  }

  // Clear all cache
  clearAll() {
    this.cache.clear();
    this.cacheTimestamps.clear();
    console.log('All cache cleared');
  }

  // Clear cache for a specific user (on logout)
  clearUserData() {
    const userKeys = ['profile', 'organizations', 'dashboardTemplates', 'devices', 'mqttClusters', 'mqttInfo', 'mqttStats'];
    userKeys.forEach(key => this.invalidate(key));
  }

  // Fetch user profile with minimal data for dashboard
  async getProfile() {
    return this.get('profile', async () => {
      const response = await authAPI.getProfile();
      if (response.data.status === 'success') {
        // Cache only non-sensitive profile data
        return {
          username: response.data.user.username,
          email: response.data.user.email,
          id: response.data.user.id,
          // Don't cache sensitive data like tokens
        };
      }
      throw new Error('Failed to fetch profile');
    });
  }

  // Fetch organizations summary
  async getOrganizations() {
    return this.get('organizations', async () => {
      const response = await authAPI.get('/organizations/');
      if (response.data.status === 'success') {
        // Cache only summary data for tiles
        return {
          count: response.data.organizations.length,
          organizations: response.data.organizations.map(org => ({
            id: org.id,
            name: org.name,
            description: org.description,
            // Don't cache sensitive org details
          }))
        };
      }
      throw new Error('Failed to fetch organizations');
    });
  }

  // Fetch dashboard templates summary
  async getDashboardTemplates() {
    return this.get('dashboardTemplates', async () => {
      const response = await authAPI.get('/dashboard-templates/');
      if (response.data.status === 'success') {
        // Cache only summary data for tiles
        return {
          count: response.data.templates.length,
          templates: response.data.templates.map(template => ({
            id: template.id,
            name: template.name,
            description: template.description,
            created_at: template.created_at,
            // Don't cache full template configuration
          }))
        };
      }
      throw new Error('Failed to fetch dashboard templates');
    });
  }

  // Fetch MQTT clusters summary
  async getMqttClusters() {
    return this.get('mqttClusters', async () => {
      try {
        // Get ALL clusters (both hosted and external) from the database
        const clustersResponse = await mqttAPI.clusters.list();
        const clusters = [];

        // All clusters now come from the database with UUIDs
        if (clustersResponse.data && Array.isArray(clustersResponse.data)) {
          clusters.push(...clustersResponse.data.map(cluster => ({
            id: cluster.uuid,
            uuid: cluster.uuid,
            name: cluster.name,
            host: cluster.host,
            port: cluster.port,
            username: cluster.username,
            password: cluster.password,
            cluster_type: cluster.cluster_type,
            created_at: cluster.created_at,
          })));
        }

        return {
          count: clusters.length,
          clusters: clusters
        };
      } catch (error) {
        console.error('Error fetching MQTT clusters:', error);
        // Return empty clusters list instead of failing
        return {
          count: 0,
          clusters: []
        };
      }
    });
  }

  // Fetch MQTT connection info (lightweight)
  async getMqttInfo() {
    return this.get('mqttInfo', async () => {
      try {
        const response = await mqttAPI.getInfo();
        // Cache only connection status, not credentials
        return {
          hasPassword: response.data.hasPassword,
          username: response.data.username,
          broker: response.data.broker,
          connected: response.data.connected,
        };
      } catch (error) {
        console.log('Could not load MQTT info:', error);
        // Return default values
        return {
          hasPassword: false,
          username: null,
          broker: { host: '13.203.165.247', port: 1883 },
          connected: false,
        };
      }
    });
  }

  // Fetch MQTT statistics
  async getMqttStats() {
    return this.get('mqttStats', async () => {
      const response = await mqttAPI.getStats();
      return response.data; // Stats are not sensitive, can cache as-is
    });
  }

  // Fetch devices summary
  async getDevices() {
    return this.get('devices', async () => {
      try {
        const response = await deviceAPI.getDevices();
        if (response.data && Array.isArray(response.data)) {
          // Cache only summary data for tiles
          return {
            count: response.data.length,
            devices: response.data.map(device => ({
              uuid: device.uuid,
              name: device.name,
              description: device.description,
              status: device.status,
              organization_name: device.organization_name,
              project_count: device.project_count,
              is_active: device.is_active,
              created_at: device.created_at,
              // Don't cache sensitive device details like tokens
            }))
          };
        }
        return {
          count: 0,
          devices: []
        };
      } catch (error) {
        console.error('Error fetching devices:', error);
        // Return empty devices list instead of failing
        return {
          count: 0,
          devices: []
        };
      }
    });
  }

  // Helper to get all dashboard data efficiently
  async getDashboardData() {
    try {
      // Fetch all data in parallel using cache
      const [profile, organizations, templates, devices, clusters, mqttInfo, mqttStats] = await Promise.all([
        this.getProfile().catch(() => null),
        this.getOrganizations().catch(() => ({ count: 0, organizations: [] })),
        this.getDashboardTemplates().catch(() => ({ count: 0, templates: [] })),
        this.getDevices().catch(() => ({ count: 0, devices: [] })),
        this.getMqttClusters().catch(() => ({ count: 0, clusters: [] })),
        this.getMqttInfo().catch(() => ({ hasPassword: false })),
        this.getMqttStats().catch(() => ({ topics: 0, messages: 0, subscriptions: 0 }))
      ]);

      return {
        profile,
        organizations,
        templates,
        devices,
        clusters,
        mqttInfo,
        mqttStats
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  // Method to refresh specific data when user performs actions
  async refreshAfterAction(action) {
    switch (action) {
      case 'template_created':
      case 'template_updated':
      case 'template_deleted':
        this.invalidate('dashboardTemplates');
        break;
      
      case 'device_created':
      case 'device_updated':
      case 'device_deleted':
        this.invalidate('devices');
        break;
      
      case 'cluster_created':
      case 'cluster_deleted':
        this.invalidate('mqttClusters');
        this.invalidate('mqttInfo');
        break;
      
      case 'mqtt_credentials_updated':
        this.invalidate('mqttInfo');
        this.invalidate('mqttStats');
        break;
      
      case 'acl_updated':
        this.invalidate('mqttStats');
        break;
      
      case 'profile_updated':
        this.invalidate('profile');
        break;
      
      default:
        console.log(`Unknown action: ${action}`);
    }
  }

  // Preload cache in background
  async preloadCache() {
    console.log('Preloading cache in background...');
    try {
      // Fire all requests but don't wait for them
      this.getProfile().catch(() => {});
      this.getOrganizations().catch(() => {});
      this.getDashboardTemplates().catch(() => {});
      this.getDevices().catch(() => {});
      this.getMqttClusters().catch(() => {});
      this.getMqttInfo().catch(() => {});
      this.getMqttStats().catch(() => {});
    } catch (error) {
      console.log('Background cache preload error:', error);
    }
  }

  // Get overview stats (for backward compatibility)
  async getOverviewStats() {
    try {
      const cachedStats = this.cache.get('overviewStats');
      if (cachedStats) {
        return cachedStats;
      }
      // Return default if no cache
      return {
        connectedDevices: 0,
        mqttClusters: 0
      };
    } catch (error) {
      console.error('Error getting overview stats:', error);
      return {
        connectedDevices: 0,
        mqttClusters: 0
      };
    }
  }

  // Set overview stats (for backward compatibility)
  setOverviewStats(stats) {
    this.cache.set('overviewStats', stats);
    this.cacheTimestamps.set('overviewStats', Date.now());
  }
}

// Create singleton instance
const cacheService = new CacheService();

export default cacheService; 