import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps,
} from "recharts";
import { TrafficData } from "@/lib/types";
import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NameType, 
  ValueType 
} from "recharts/types/component/DefaultTooltipContent";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TrafficChartProps {
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const time = new Date(label).toLocaleTimeString();
    return (
      <div className="custom-tooltip p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-medium mb-2">{time}</p>
        {payload.map((entry, index) => (
          <div key={`tooltip-item-${index}`} className="flex items-center mb-1">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-sm font-medium">{entry.name}:</span>
            <span className="text-sm ml-2">
              {entry.name === "Latency (ms)" 
                ? `${entry.value} ms` 
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default function TrafficChart({ className }: TrafficChartProps) {
  const [timeRange, setTimeRange] = useState<"hourly" | "daily" | "weekly">("hourly");
  // Set the default refresh interval to 0 (disabled) to prevent automatic refreshes
  const [refreshInterval, setRefreshInterval] = useState<number>(0); // 0 means no auto-refresh
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
  // Use refs to hold and transition data smoothly
  const currentDataRef = useRef<TrafficData[]>([]);
  const [displayData, setDisplayData] = useState<TrafficData[]>([]);
  const isTransitioningRef = useRef(false);
  const transitionTimeoutRef = useRef<number | null>(null);
  
  // Create a simple fetcher function
  const fetchTrafficData = async () => {
    const response = await fetch('/api/traffic');
    const data = await response.json();
    setLastRefreshed(new Date());
    return data;
  };
  
  // Query with our fetcher, but with auto-refresh disabled by default
  const { data: trafficData, isLoading, refetch } = useQuery<TrafficData[]>({
    queryKey: ["/api/traffic"], 
    queryFn: fetchTrafficData,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false, // Only auto-refresh if interval > 0
    refetchOnWindowFocus: false,
    staleTime: Infinity, // Don't consider data stale automatically
  });
  
  // Smooth transition for data updates to prevent glitches
  useEffect(() => {
    if (trafficData && !isTransitioningRef.current) {
      // Store new data in ref
      currentDataRef.current = trafficData;
      
      // If it's the first load, set display data directly
      if (displayData.length === 0) {
        setDisplayData(trafficData);
        return;
      }
      
      // Set flag to prevent multiple transitions
      isTransitioningRef.current = true;
      
      // Clear any existing timeout
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
      
      // Use timeout to sync with browser render cycle
      transitionTimeoutRef.current = window.setTimeout(() => {
        setDisplayData(trafficData);
        isTransitioningRef.current = false;
      }, 50); // slight delay to avoid visual glitches
    }
    
    // Cleanup
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [trafficData]);
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    
    switch (timeRange) {
      case "hourly":
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case "daily":
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case "weekly":
        return date.toLocaleDateString([], { weekday: 'short' });
      default:
        return date.toLocaleTimeString();
    }
  };

  if (isLoading) {
    return (
      <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden dark:bg-gray-800">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Traffic Monitor</h3>
            <div className="flex space-x-3">
              <button className="px-3 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                Hourly
              </button>
              <button className="px-3 py-1 text-xs font-medium rounded-md text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700">
                Daily
              </button>
              <button className="px-3 py-1 text-xs font-medium rounded-md text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700">
                Weekly
              </button>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="h-64 w-full flex items-center justify-center">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-6 py-1">
                <div className="h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-4 bg-gray-200 rounded col-span-2 dark:bg-gray-700"></div>
                    <div className="h-4 bg-gray-200 rounded col-span-1 dark:bg-gray-700"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`lg:col-span-2 bg-white rounded-lg shadow overflow-hidden dark:bg-gray-800 ${className}`}>
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mr-3">Traffic Monitor</h3>
            <div className="flex items-center flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  // Request fresh data without causing scroll reset
                  fetch('/api/traffic')
                    .then(res => res.json())
                    .then(data => {
                      // Update the query cache directly
                      queryClient.setQueryData(['/api/traffic'], data);
                      // Update last refreshed timestamp
                      setLastRefreshed(new Date());
                    })
                    .catch(err => console.error('Failed to fetch traffic data:', err));
                }}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <Select 
                  defaultValue="0"
                  onValueChange={(val) => setRefreshInterval(parseInt(val))}
                >
                  <SelectTrigger className="h-8 w-40">
                    <SelectValue placeholder="Refresh rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Manual refresh</SelectItem>
                    <SelectItem value="5000">5 seconds</SelectItem>
                    <SelectItem value="10000">10 seconds</SelectItem>
                    <SelectItem value="15000">15 seconds</SelectItem>
                    <SelectItem value="30000">30 seconds</SelectItem>
                    <SelectItem value="60000">1 minute</SelectItem>
                    <SelectItem value="300000">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-xs text-gray-500">
                Last updated: {lastRefreshed.toLocaleTimeString()}
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                timeRange === "hourly"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
              onClick={() => setTimeRange("hourly")}
            >
              Hourly
            </button>
            <button
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                timeRange === "daily"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
              onClick={() => setTimeRange("daily")}
            >
              Daily
            </button>
            <button
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                timeRange === "weekly"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
              onClick={() => setTimeRange("weekly")}
            >
              Weekly
            </button>
          </div>
        </div>
      </div>
      <div className="px-6 py-5">
        <div className="h-64 w-full">
          {/* Use our displayData instead of trafficData directly to prevent glitches */}
          {(displayData.length > 0 || (trafficData && trafficData.length > 0)) ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={displayData.length > 0 ? displayData : trafficData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTime}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  content={<CustomTooltip />}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="requests"
                  name="Requests"
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="errors"
                  name="Errors"
                  stroke="#ef4444"
                  fill="#f87171"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="latency"
                  name="Latency (ms)"
                  stroke="#f59e0b"
                  fill="#fbbf24"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No traffic data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}