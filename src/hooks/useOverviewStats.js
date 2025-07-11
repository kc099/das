import { useQuery } from '@tanstack/react-query';
import { organizationAPI, projectAPI, mqttAPI, deviceAPI } from '../services/api';

const fetchOverviewStats = async () => {
  const results = await Promise.allSettled([
    organizationAPI.getOrganizations(),
    projectAPI.getProjects(),
    mqttAPI.clusters.list(),
    deviceAPI.getDevices()
  ]);

  const [orgs, projects, clusters, devices] = results;

  const stats = {
    organizations: orgs.status === 'fulfilled' && orgs.value.data.status === 'success' ? orgs.value.data.organizations.length : 0,
    projects: projects.status === 'fulfilled' && projects.value.data.status === 'success' ? projects.value.data.projects.length : 0,
    mqttClusters: clusters.status === 'fulfilled' && clusters.value.data ? clusters.value.data.length : 0,
    connectedDevices: devices.status === 'fulfilled' && devices.value.data ? devices.value.data.length : 0,
  };

  return stats;
};

export const useOverviewStats = () => {
  return useQuery({
    queryKey: ['overviewStats'],
    queryFn: fetchOverviewStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Optional: depending on your app's needs
  });
};
