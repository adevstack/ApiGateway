import { ArrowDown, ArrowUp, Clock, CloudLightning, RefreshCw, Upload } from "lucide-react";
import StatCard from "./StatCard";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { DashboardStats } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

export default function DashboardOverview() {
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  // Add state for displaying stats with transition
  const [displayStats, setDisplayStats] = useState<DashboardStats | null>(null);
  const isTransitioningRef = useRef(false);
  const transitionTimeoutRef = useRef<number | null>(null);
  
  // Create a simple fetcher function
  const fetchStatsData = async () => {
    const response = await fetch('/api/stats');
    const data = await response.json();
    setLastRefreshed(new Date());
    return data;
  };
  
  const { data: stats, isLoading, refetch } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    queryFn: fetchStatsData,
    refetchInterval: false, // Disable auto-refresh to prevent scroll jumps
    refetchOnWindowFocus: false,
    staleTime: Infinity, // Don't consider data stale automatically
  });
  
  // Add smooth transition logic for stats updates
  useEffect(() => {
    if (stats && !isTransitioningRef.current) {
      // If no display stats yet, set them immediately
      if (!displayStats) {
        setDisplayStats(stats);
        return;
      }
      
      // Set transitioning flag to prevent multiple transitions
      isTransitioningRef.current = true;
      
      // Clear any existing timeout
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
      
      // Use timeout to sync with browser render cycle
      transitionTimeoutRef.current = window.setTimeout(() => {
        setDisplayStats(stats);
        isTransitioningRef.current = false;
      }, 50); // slight delay to avoid visual glitches
    }
    
    // Cleanup
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [stats]);

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-5 dark:bg-gray-800 animate-pulse">
              <div className="flex justify-between items-center">
                <div>
                  <div className="h-4 w-24 bg-gray-200 rounded dark:bg-gray-700 mb-3"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded dark:bg-gray-700"></div>
                </div>
                <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-6 w-6"></div>
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <div className="h-4 w-16 bg-gray-200 rounded dark:bg-gray-700"></div>
                <div className="ml-2 h-4 w-24 bg-gray-200 rounded dark:bg-gray-700"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Dashboard Overview</h2>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              // Request fresh data without causing scroll reset
              fetch('/api/stats')
                .then(res => res.json())
                .then(data => {
                  // Update the query cache directly
                  queryClient.setQueryData(['/api/stats'], data);
                  // Update last refreshed timestamp
                  setLastRefreshed(new Date());
                })
                .catch(err => console.error('Failed to fetch stats data:', err));
            }}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <div className="text-xs text-gray-500">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={(displayStats || stats)?.totalRequests?.toLocaleString() || "0"}
          icon={<Upload className="h-6 w-6" />}
          change="12.5%"
          isIncrease={true}
          iconBgColor="bg-blue-50 dark:bg-blue-900"
          iconColor="text-blue-500 dark:text-blue-300"
        />
        
        <StatCard
          title="Requests/Second"
          value={(displayStats || stats)?.requestsPerSecond?.toString() || "0"}
          icon={<CloudLightning className="h-6 w-6" />}
          change="3.2%"
          isIncrease={true}
          iconBgColor="bg-indigo-50 dark:bg-indigo-900"
          iconColor="text-indigo-500 dark:text-indigo-300"
        />
        
        <StatCard
          title="Avg Response Time"
          value={`${(displayStats || stats)?.avgResponseTime || 0}ms`}
          icon={<Clock className="h-6 w-6" />}
          change="8.4%"
          isIncrease={false}
          iconBgColor="bg-yellow-50 dark:bg-yellow-900"
          iconColor="text-yellow-500 dark:text-yellow-300"
        />
        
        <StatCard
          title="Error Rate"
          value={(displayStats || stats)?.errorRate || "0%"}
          icon={<ArrowDown className="h-6 w-6" />}
          change="0.5%"
          isIncrease={false}
          iconBgColor="bg-red-50 dark:bg-red-900"
          iconColor="text-red-500 dark:text-red-300"
        />
      </div>
    </div>
  );
}
