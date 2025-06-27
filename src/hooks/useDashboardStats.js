import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import useDashboardStore from '../store/dashboardStore';

// Custom hook to manage dashboard statistics
export const useDashboardStats = () => {
  const { 
    overviewStats, 
    loading, 
    error, 
    loadStats, 
    lastUpdated 
  } = useDashboardStore();

  // Use React Query for automatic background refetching
  const { refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: loadStats,
    enabled: false, // We'll trigger manually
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Initialize stats on first load
  useEffect(() => {
    if (!lastUpdated) {
      loadStats();
    }
  }, [lastUpdated, loadStats]);

  // Refresh stats if they're stale
  const refresh = async () => {
    await refetch();
  };

  return {
    stats: overviewStats,
    loading,
    error,
    refresh,
    lastUpdated
  };
};

// Hook for individual stat subscriptions (to minimize re-renders)
export const useStatValue = (statKey) => {
  return useDashboardStore((state) => state.overviewStats[statKey]);
};

// Hook for updating stats from components
export const useStatActions = () => {
  const { updateStat, incrementStat, decrementStat, loadStats } = useDashboardStore();
  
  return {
    updateStat,
    incrementStat,
    decrementStat,
    refresh: loadStats
  };
};