import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Routes table for API Gateway routes
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  path: text("path").notNull(),
  target: text("target").notNull(),
  methods: text("methods").array().notNull(),
  rateLimit: text("rate_limit").notNull().default("100/minute"),
  timeout: integer("timeout").notNull().default(5000), // in milliseconds
  authRequired: boolean("auth_required").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service health information
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  status: text("status").notNull().default("unknown"), // unknown, healthy, warning, error
  uptime: text("uptime").notNull().default("0%"),
  responseTime: integer("response_time").notNull().default(0), // in milliseconds
  lastChecked: timestamp("last_checked").defaultNow(),
});

// Statistics for the dashboard
export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  totalRequests: integer("total_requests").notNull().default(0),
  requestsPerSecond: integer("requests_per_second").notNull().default(0),
  avgResponseTime: integer("avg_response_time").notNull().default(0), // in milliseconds
  errorRate: text("error_rate").notNull().default("0%"),
  activeConnections: integer("active_connections").notNull().default(0),
});

// Authentication credentials for protected routes
export const credentials = pgTable("credentials", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  routeId: integer("route_id").references(() => routes.id),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  lastChecked: true
});

export const insertStatsSchema = createInsertSchema(stats).omit({
  id: true,
  timestamp: true
});

export const insertCredentialsSchema = createInsertSchema(credentials).omit({
  id: true
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;

export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Route = typeof routes.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertStats = z.infer<typeof insertStatsSchema>;
export type Stats = typeof stats.$inferSelect;

export type InsertCredentials = z.infer<typeof insertCredentialsSchema>;
export type Credentials = typeof credentials.$inferSelect;

// Extended types for frontend use
export const routeStatusEnum = z.enum(["active", "inactive", "warning", "error"]);
export type RouteStatus = z.infer<typeof routeStatusEnum>;

export const serviceStatusEnum = z.enum(["unknown", "healthy", "warning", "error"]);
export type ServiceStatus = z.infer<typeof serviceStatusEnum>;

export const userRoleEnum = z.enum(["user", "admin"]);
export type UserRole = z.infer<typeof userRoleEnum>;

export type TrafficData = {
  timestamp: string;
  requests: number;
  errors: number;
  latency: number;
};

export type DashboardStats = {
  totalRequests: number;
  requestsPerSecond: number;
  avgResponseTime: number;
  errorRate: string;
  activeConnections: number;
  change?: {
    totalRequests: string;
    requestsPerSecond: string;
    avgResponseTime: string;
    errorRate: string;
  };
};
