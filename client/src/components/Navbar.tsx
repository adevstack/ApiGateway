import { Bell, Clock, Menu, Moon, Sun, Wifi, WifiOff } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useState, useContext, useEffect, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { WebSocketContext } from "@/App";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavbarProps {
  toggleSidebar: () => void;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  const { toast } = useToast();
  const wsStatus = useContext(WebSocketContext);
  const { sessionExpiresAt, refreshSession, user } = useAuth();
  const [timeLeft, setTimeLeft] = useState<string>("");
  
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New route added",
      message: "A new route has been configured successfully.",
      time: "5m ago",
      read: false
    },
    {
      id: 2,
      title: "Service warning",
      message: "User Service showing increased latency.",
      time: "15m ago",
      read: false
    },
    {
      id: 3,
      title: "Rate limit reached",
      message: "Product service rate limit threshold reached.",
      time: "1h ago",
      read: true
    }
  ]);
  
  // Add new notifications when specific events occur
  useEffect(() => {
    if (wsStatus.lastUpdate && wsStatus.isConnected) {
      // Check if we need to add a notification for an important update
      const now = new Date();
      const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Add a notification about reconnection if previously disconnected
      if (wsStatus.lastUpdate) {
        const newNotification = {
          id: Date.now(),
          title: "Real-time updates active",
          message: "Gateway is sending real-time updates to dashboard.",
          time: timeString,
          read: false
        };
        
        setNotifications(prev => [newNotification, ...prev]);
      }
    }
  }, [wsStatus.isConnected]);

  // Format the time remaining in the session
  const formatTimeRemaining = useCallback(() => {
    if (!sessionExpiresAt || !user) {
      return "";
    }

    const now = new Date();
    const expiry = new Date(sessionExpiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) {
      return "Expired";
    }
    
    // Calculate hours, minutes, seconds
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }, [sessionExpiresAt, user]);

  // Update the time remaining every minute
  useEffect(() => {
    if (user && sessionExpiresAt) {
      const updateTimeLeft = () => {
        setTimeLeft(formatTimeRemaining());
      };
      
      // Update immediately
      updateTimeLeft();
      
      // Then set interval to update every minute
      const interval = setInterval(updateTimeLeft, 60000);
      
      return () => clearInterval(interval);
    }
  }, [sessionExpiresAt, user, formatTimeRemaining]);

  // Handle session refresh
  const handleSessionRefresh = () => {
    refreshSession();
    toast({
      title: "Session Refreshed",
      description: "Your session has been extended",
    });
  };

  // Get the current page title based on location
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/routes":
        return "Routes";
      case "/settings":
        return "Settings";
      case "/analytics":
        return "Analytics";
      case "/health":
        return "Service Health";
      case "/tutorial":
        return "Tutorial";
      default:
        return "API Gateway";
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification, 
      read: true
    })));
    
    toast({
      title: "All notifications marked as read",
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            className="mr-4 text-gray-600 dark:text-gray-300 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Session timer */}
          {user && sessionExpiresAt && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleSessionRefresh}
                    className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{timeLeft}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Session expires in {timeLeft}. Click to refresh.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* WebSocket connection status indicator */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  {wsStatus.isConnected ? (
                    <Wifi className="h-5 w-5 text-green-500" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {wsStatus.isConnected 
                    ? "Connected to real-time updates" 
                    : "Real-time updates disconnected"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:text-gray-300 dark:hover:text-white">
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary"></span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex justify-between items-center">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead} 
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      Mark all as read
                    </button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="py-4 px-2 text-center text-sm text-gray-500 dark:text-gray-400">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="cursor-pointer">
                      <div className={`py-2 ${!notification.read ? 'font-medium' : ''}`}>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{notification.title}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{notification.time}</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          {notification.message}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <button
            className={cn(
              "p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
              theme === "dark"
                ? "bg-gray-600 text-yellow-200"
                : "bg-gray-200 text-gray-800"
            )}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <span className="sr-only">Toggle dark mode</span>
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
