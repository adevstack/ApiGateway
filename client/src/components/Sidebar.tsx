import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Home,
  Layers,
  Settings,
  BarChart2,
  Activity,
  X,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { type SidebarItem } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

const sidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    path: "/",
    icon: <Home className="h-5 w-5 mr-3" />,
  },
  {
    name: "Routes",
    path: "/routes",
    icon: <Layers className="h-5 w-5 mr-3" />,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: <Settings className="h-5 w-5 mr-3" />,
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: <BarChart2 className="h-5 w-5 mr-3" />,
  },
  {
    name: "Service Health",
    path: "/health",
    icon: <Activity className="h-5 w-5 mr-3" />,
  },
  {
    name: "Tutorial",
    path: "/tutorial",
    icon: <HelpCircle className="h-5 w-5 mr-3" />,
  },
];

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ isOpen, toggleSidebar, isMobile = false }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get first letter of username or fullName for avatar
  const getInitial = () => {
    if (user?.fullName) {
      return user.fullName.charAt(0).toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return '?';
  };

  return (
    <div
      className={cn(
        "bg-gray-800 text-white w-64 flex-shrink-0 fixed inset-y-0 z-50 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className="text-xl font-semibold">API Gateway</h1>
        <button
          className="p-2 rounded-md hover:bg-gray-700 flex items-center justify-center"
          onClick={toggleSidebar}
          aria-label="Close sidebar"
        >
          <X className="h-6 w-6 text-white" />
        </button>
      </div>

      <nav className="mt-4">
        {sidebarItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <div
              className={cn(
                "flex items-center px-4 py-3 transition-colors duration-200 cursor-pointer",
                location === item.path
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
            >
              {item.icon}
              {item.name}
            </div>
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full bg-gray-800 p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium">
              {getInitial()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.username || 'Guest'}</p>
              <p className="text-xs text-gray-400">{user?.email || ''}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-md hover:bg-gray-700"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
