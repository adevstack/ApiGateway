import { Route, Service, Stats, DashboardStats, TrafficData as SchemaTrafficData, RouteStatus, ServiceStatus } from "@shared/schema";

// Additional frontend types

export type TrafficData = SchemaTrafficData;

export type SidebarItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
};

export type RouteFormData = {
  path: string;
  target: string;
  methods: string[];
  rateLimit: string;
  timeout: number;
  authRequired: boolean;
  active: boolean;
}

export type RouteWithStatus = Route & {
  statusMessage: RouteStatus;
}

export type ServiceWithTime = Service & {
  lastCheckedMessage: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';
