import React from "react";
import { Link2 } from "lucide-react";
import { useScrollAnchorContext } from "@/components/ScrollAnchorProvider";
import { Card } from "@/components/ui/card";

interface DashboardLink {
  id: string;
  title: string;
  description: string;
}

const dashboardLinks: DashboardLink[] = [
  {
    id: "dashboard-overview",
    title: "Dashboard Overview",
    description: "Key metrics and performance indicators"
  },
  {
    id: "traffic-monitor",
    title: "Traffic Monitor",
    description: "Real-time traffic visualization and analytics"
  },
  {
    id: "active-connections",
    title: "Active Connections",
    description: "Current client connections and status"
  },
  {
    id: "routes-configuration",
    title: "Routes Configuration",
    description: "Gateway routes and proxy settings"
  }
];

export default function DashboardLinks() {
  const { scrollToAnchor, currentHash } = useScrollAnchorContext();
  
  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Jump to Section</h3>
        <Link2 className="h-4 w-4 text-gray-500" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {dashboardLinks.map((link) => (
          <div
            key={link.id}
            className={`
              cursor-pointer rounded-lg border p-3 transition-colors 
              hover:bg-gray-50 dark:hover:bg-gray-800 
              ${currentHash === link.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-border'}
            `}
            onClick={() => scrollToAnchor(link.id)}
          >
            <div className="font-medium">{link.title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {link.description}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}