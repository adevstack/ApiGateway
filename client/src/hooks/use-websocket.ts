import { useState, useEffect, useCallback, useRef } from 'react';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type WebSocketMessage = {
  type: string;
  data?: any;
  message?: string;
  timestamp?: string;
  // Removed isPaused field as we're using configurable refresh intervals instead
};

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  // Removed pause state - now using configurable refresh intervals instead
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const updateThrottleRef = useRef<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  // Throttle updates to prevent excessive rendering
  const throttleUpdate = useCallback((type: string, callback: () => void) => {
    // If we're already throttling this update type, don't proceed
    if (updateThrottleRef.current[type]) {
      return;
    }
    
    // Set this update type as throttled
    updateThrottleRef.current[type] = true;
    
    // Execute the callback
    callback();
    
    // Release the throttle after 3 seconds
    setTimeout(() => {
      updateThrottleRef.current[type] = false;
    }, 3000); // Only allow updates every 3 seconds
  }, []);

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    // Close existing connection if any
    if (ws.current) {
      ws.current.close();
    }

    // Create WebSocket URL with correct protocol based on page protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('WebSocket connection attempt');
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      
      // Clear any reconnect timeout
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
      
      // Set a timeout to reconnect
      reconnectTimeout.current = setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        connectWebSocket();
      }, 5000); // Try to reconnect after 5 seconds
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Error handling is covered by onclose
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        console.log('WebSocket message received:', message);
        setLastMessage(message);
        
        // We're completely turning off automatic updates to prevent automatic scrolling
        // User will need to manually refresh data
        // Commenting out the WebSocket handlers
        /*
        if (message.type === 'stats_update' && message.data) {
          throttleUpdate('stats', () => {
            // Update the cache directly without triggering a refetch
            queryClient.setQueryData(['/api/stats'], message.data);
          });
        } else if (message.type === 'traffic_update' && message.data) {
          throttleUpdate('traffic', () => {
            // Get existing traffic data
            const trafficData = queryClient.getQueryData(['/api/traffic']) || [];
            
            // Add new data point to the array (limited to last 20 points)
            const newTrafficData = [message.data, ...Array.isArray(trafficData) ? trafficData.slice(0, 19) : []];
            
            // Update the cache directly
            queryClient.setQueryData(['/api/traffic'], newTrafficData);
          });
        } else if (message.type === 'service_update' && message.data) {
          // Service updates don't need to be as frequent
          throttleUpdate('services', () => {
            // Update the cache directly
            queryClient.setQueryData(['/api/services'], message.data);
          });
        } else if (message.type === 'route_update' && message.data) {
          // Route updates don't need to be as frequent
          throttleUpdate('routes', () => {
            // Update the cache directly
            queryClient.setQueryData(['/api/routes'], message.data);
          });
        */
        // Removed pause_state_changed handler - now using configurable refresh intervals instead
        if (message.type === 'error') {
          // Show error notification (immediate, not throttled)
          toast({
            title: 'Server Error',
            description: message.message || 'An unknown error occurred',
            variant: 'destructive',
          });
        } else if (message.type === 'notification') {
          // Show general notification (immediate, not throttled)
          toast({
            title: 'Gateway Notification',
            description: message.message,
          });
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    ws.current = socket;
    
    // Clean up on unmount
    return () => {
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [toast, throttleUpdate]);

  // Connect on component mount and handle cleanup
  useEffect(() => {
    const cleanup = connectWebSocket();
    
    // Clean up on component unmount
    return () => {
      cleanup();
    };
  }, [connectWebSocket]);

  // Send a message through the WebSocket
  const sendMessage = useCallback((type: string, data?: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: new Date().toISOString(),
      };
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Removed pauseToggle functionality - now using configurable refresh intervals instead

  return {
    isConnected,
    lastMessage,
    sendMessage
  };
}