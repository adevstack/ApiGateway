import DashboardOverview from "@/components/dashboard/DashboardOverview";
import TrafficChart from "@/components/dashboard/TrafficChart";
import ActiveConnections from "@/components/dashboard/ActiveConnections";
import RoutesTable from "@/components/routes/RoutesTable";
import DashboardLinks from "@/components/dashboard/DashboardLinks";
import { useLiveUpdates } from "@/hooks/use-live-updates";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { Wifi, WifiOff } from "lucide-react";
import ScrollAnchorSection from "@/components/ScrollAnchorSection";

export default function Dashboard() {
  const { isConnected, getRealTimeStatus } = useLiveUpdates();
  const realtimeStatus = getRealTimeStatus();
  
  // Use the scroll lock hook to prevent scroll position resets during data refresh
  useScrollLock();
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Dashboard Status */}
      <div className="flex items-center mb-6">
        <div className="mr-2">
          {isConnected ? 
            <Wifi className="h-4 w-4 text-green-500" /> : 
            <WifiOff className="h-4 w-4 text-gray-400" />
          }
        </div>
        <span className={realtimeStatus.className}>
          {realtimeStatus.label}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
          {isConnected ? 
            "Data updates automatically in real-time" : 
            "Refreshing data periodically"
          }
        </span>
      </div>
      
      {/* Navigation Links */}
      <DashboardLinks />
      
      {/* Dashboard Overview with Scroll Anchor */}
      <ScrollAnchorSection 
        id="dashboard-overview" 
        title="Dashboard Overview"
      >
        <div className="p-4">
          <DashboardOverview />
        </div>
      </ScrollAnchorSection>

      {/* Traffic Monitor & Active Connections with Scroll Anchors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ScrollAnchorSection 
          id="traffic-monitor" 
          title="Traffic Monitor"
          className="lg:col-span-2"
        >
          <TrafficChart />
        </ScrollAnchorSection>
        
        <ScrollAnchorSection 
          id="active-connections" 
          title="Active Connections"
          maxHeight="400px"
        >
          <div className="p-4">
            <ActiveConnections />
          </div>
        </ScrollAnchorSection>
      </div>

      {/* Routes Configuration with Scroll Anchor */}
      <ScrollAnchorSection 
        id="routes-configuration" 
        title="Routes Configuration"
        maxHeight="600px"
      >
        <div className="p-4">
          <RoutesTable />
        </div>
      </ScrollAnchorSection>
    </div>
  );
}
