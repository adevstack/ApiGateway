import { useContext } from 'react';
import { WebSocketContext } from '@/App';
import { useQuery } from '@tanstack/react-query';

// Custom hook for components that need real-time data and connection status
export function useLiveUpdates() {
  const wsContext = useContext(WebSocketContext);
  
  return {
    isConnected: wsContext.isConnected,
    lastUpdate: wsContext.lastUpdate,
    
    // Helper that adds real-time update indicator to components
    getRealTimeStatus: () => {
      if (wsContext.isConnected) {
        return {
          status: 'connected',
          label: 'Real-time updates active',
          className: 'text-xs text-green-600 dark:text-green-500 font-medium'
        };
      } else {
        return {
          status: 'disconnected',
          label: 'Real-time updates disconnected',
          className: 'text-xs text-gray-500 dark:text-gray-400 font-medium'
        };
      }
    }
  };
}

// Hook for components that need traffic data
export function useTrafficData() {
  const { isConnected } = useLiveUpdates();
  
  // Set a short stale time when real-time updates are not available
  const staleTime = isConnected ? Infinity : 30000; // 30 seconds when disconnected
  
  return useQuery({
    queryKey: ['/api/traffic'],
    staleTime: Infinity, // Never consider data stale
    refetchInterval: false, // Never auto-refresh
    refetchOnWindowFocus: false, // Don't refresh on window focus
  });
}

// Hook for components that need stats data
export function useStatsData() {
  const { isConnected } = useLiveUpdates();
  
  // Set a short stale time when real-time updates are not available
  const staleTime = isConnected ? Infinity : 30000; // 30 seconds when disconnected
  
  return useQuery({
    queryKey: ['/api/stats'],
    staleTime: Infinity, // Never consider data stale
    refetchInterval: false, // Never auto-refresh
    refetchOnWindowFocus: false, // Don't refresh on window focus
  });
}

// Hook for components that need routes data
export function useRoutesData() {
  const { isConnected } = useLiveUpdates();
  
  return useQuery({
    queryKey: ['/api/routes'],
    staleTime: Infinity, // Never consider data stale
    refetchInterval: false, // Never auto-refresh
    refetchOnWindowFocus: false, // Don't refresh on window focus
  });
}

// Hook for components that need services data
export function useServicesData() {
  const { isConnected } = useLiveUpdates();
  
  return useQuery({
    queryKey: ['/api/services'],
    staleTime: Infinity, // Never consider data stale
    refetchInterval: false, // Never auto-refresh
    refetchOnWindowFocus: false, // Don't refresh on window focus
  });
}