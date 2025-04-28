import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Dashboard from "@/pages/Dashboard";
import Routes from "@/pages/Routes";
import Settings from "@/pages/Settings";
import Analytics from "@/pages/Analytics";
import Health from "@/pages/Health";
import Tutorial from "@/pages/Tutorial";
import AuthPage from "@/pages/auth-page";
import { useWebSocket } from "@/hooks/use-websocket";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/use-auth";
// Removed ScrollMemory import to prevent automatic scrolling issues
// Removed ScrollAnchorProvider import to fix automatic scrolling issues
import { useScrollLock } from "@/hooks/use-scroll-lock";
import React from "react";

function Router() {
  // Initialize sidebar to closed by default
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Initialize sidebar state based on viewport width on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSidebarOpen(window.innerWidth > 768);
    }
  }, []);

  // Track if we're in mobile view
  const [isMobileView, setIsMobileView] = useState(false);
  
  // Update mobile state on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Check initially
    if (typeof window !== 'undefined') {
      checkMobile();
      
      // Add resize listener
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Toggle sidebar with different behavior on mobile vs desktop
  const toggleSidebar = () => {
    // Make sure the sidebar always collapses no matter what
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Create a wrapper component for our main application layout
  // This helps us avoid repetition and ensures consistent behavior
  const AppLayout = ({ children }: { children: React.ReactNode }) => {
    // Disabled scroll lock to fix automatic scrolling issues
    // useScrollLock();
    
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} isMobile={isMobileView} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-y-auto scroll-container" data-scroll-id="main-content">
            {children}
          </main>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Removed ScrollMemory component to fix automatic scrolling issues */}
      <Switch>
        <Route path="/auth" component={AuthPage} />
        
        {/* Dashboard route */}
        <ProtectedRoute path="/" component={() => (
          <AppLayout>
            <Dashboard />
          </AppLayout>
        )} />
        
        {/* Routes page */}
        <ProtectedRoute path="/routes" component={() => (
          <AppLayout>
            <Routes />
          </AppLayout>
        )} />
        
        {/* Settings page */}
        <ProtectedRoute path="/settings" component={() => (
          <AppLayout>
            <Settings />
          </AppLayout>
        )} />
        
        {/* Analytics page */}
        <ProtectedRoute path="/analytics" component={() => (
          <AppLayout>
            <Analytics />
          </AppLayout>
        )} />
        
        {/* Health page */}
        <ProtectedRoute path="/health" component={() => (
          <AppLayout>
            <Health />
          </AppLayout>
        )} />
        
        {/* Tutorial page */}
        <ProtectedRoute path="/tutorial" component={() => (
          <AppLayout>
            <Tutorial />
          </AppLayout>
        )} />
        
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

// Create a context for WebSocket status
type WebSocketContextType = {
  isConnected: boolean;
  lastUpdate: Date | null;
};

export const WebSocketContext = React.createContext<WebSocketContextType>({
  isConnected: false,
  lastUpdate: null,
});

function App() {
  // Track WebSocket connection status for UI indicators
  const [wsStatus, setWsStatus] = useState<WebSocketContextType>({
    isConnected: false,
    lastUpdate: null,
  });

  // Use our custom WebSocket hook to establish connection
  const { isConnected, lastMessage } = useWebSocket();
  
  // Update context when connection state changes
  useEffect(() => {
    setWsStatus(prev => ({
      ...prev,
      isConnected,
      lastUpdate: lastMessage ? new Date() : prev.lastUpdate,
    }));
  }, [isConnected, lastMessage]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WebSocketContext.Provider value={wsStatus}>
          <AuthProvider>
            {/* Removed ScrollAnchorProvider to fix automatic scrolling issues */}
            <Toaster />
            <Router />
          </AuthProvider>
        </WebSocketContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
