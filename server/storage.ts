import {
  routes,
  services,
  stats,
  credentials,
  users,
  type Route,
  type InsertRoute,
  type Service,
  type InsertService,
  type Stats,
  type InsertStats,
  type Credentials,
  type InsertCredentials,
  type User,
  type InsertUser,
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Routes
  getRoutes(): Promise<Route[]>;
  getRoute(id: number): Promise<Route | undefined>;
  getRouteByPath(path: string): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: number, route: Partial<InsertRoute>): Promise<Route | undefined>;
  deleteRoute(id: number): Promise<boolean>;

  // Services
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  // Stats
  getLatestStats(): Promise<Stats | undefined>;
  createStats(stat: InsertStats): Promise<Stats>;
  updateStats(id: number, stat: Partial<InsertStats>): Promise<Stats | undefined>;

  // Credentials
  getCredentials(): Promise<Credentials[]>;
  getCredentialsByRoute(routeId: number): Promise<Credentials[]>;
  createCredentials(credential: InsertCredentials): Promise<Credentials>;
  deleteCredentials(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private routes: Map<number, Route>;
  private services: Map<number, Service>;
  private stats: Map<number, Stats>;
  private credentials: Map<number, Credentials>;
  private userIdCounter: number;
  private routeIdCounter: number;
  private serviceIdCounter: number;
  private statIdCounter: number;
  private credentialIdCounter: number;

  constructor() {
    this.users = new Map();
    this.routes = new Map();
    this.services = new Map();
    this.stats = new Map();
    this.credentials = new Map();
    this.userIdCounter = 1;
    this.routeIdCounter = 1;
    this.serviceIdCounter = 1;
    this.statIdCounter = 1;
    this.credentialIdCounter = 1;

    // Add some initial demo data
    this.initializeDemoData();
  }

  // Initialize with demo data
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username === username
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const newUser: User = { 
      id, 
      username: userData.username,
      password: userData.password,
      email: userData.email || null,
      fullName: userData.fullName || null,
      role: userData.role || "user",
      createdAt: now
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  private initializeDemoData() {
    // Add sample routes
    const sampleRoutes: InsertRoute[] = [
      {
        path: "/api/users",
        target: "http://user-service:8080",
        methods: ["GET", "POST"],
        rateLimit: "100/minute",
        timeout: 5000,
        authRequired: true,
        active: true,
      },
      {
        path: "/api/products",
        target: "http://product-service:8081",
        methods: ["GET", "PUT"],
        rateLimit: "200/minute",
        timeout: 5000,
        authRequired: true,
        active: true,
      },
      {
        path: "/api/orders",
        target: "http://order-service:8082",
        methods: ["GET", "POST", "DELETE"],
        rateLimit: "50/minute",
        timeout: 5000,
        authRequired: true,
        active: true,
      },
      {
        path: "/api/payments",
        target: "http://payment-service:8083",
        methods: ["POST"],
        rateLimit: "20/minute",
        timeout: 5000,
        authRequired: true,
        active: true,
      }
    ];

    sampleRoutes.forEach(route => this.createRoute(route));

    // Add sample services
    const sampleServices: InsertService[] = [
      {
        name: "User Service",
        url: "http://user-service:8080",
        status: "healthy",
        uptime: "99.9%",
        responseTime: 42,
      },
      {
        name: "Product Service",
        url: "http://product-service:8081",
        status: "healthy",
        uptime: "99.8%",
        responseTime: 56,
      },
      {
        name: "Order Service",
        url: "http://order-service:8082",
        status: "warning",
        uptime: "98.2%",
        responseTime: 234,
      },
      {
        name: "Payment Service",
        url: "http://payment-service:8083",
        status: "error",
        uptime: "87.5%",
        responseTime: 1245,
      }
    ];

    sampleServices.forEach(service => this.createService(service));

    // Add sample stats
    this.createStats({
      totalRequests: 1284943,
      requestsPerSecond: 256,
      avgResponseTime: 145,
      errorRate: "0.14%",
      activeConnections: 156,
    });
  }

  // Routes
  async getRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }

  async getRoute(id: number): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async getRouteByPath(path: string): Promise<Route | undefined> {
    return Array.from(this.routes.values()).find(
      route => route.path === path
    );
  }

  async createRoute(route: InsertRoute): Promise<Route> {
    const id = this.routeIdCounter++;
    const now = new Date();
    const newRoute: Route = { 
      ...route, 
      id, 
      createdAt: now,
      rateLimit: route.rateLimit || "100/minute",
      timeout: route.timeout || 5000,
      authRequired: route.authRequired ?? false,
      active: route.active ?? true
    };
    this.routes.set(id, newRoute);
    return newRoute;
  }

  async updateRoute(id: number, routeUpdate: Partial<InsertRoute>): Promise<Route | undefined> {
    const route = this.routes.get(id);
    if (!route) return undefined;

    const updatedRoute: Route = { ...route, ...routeUpdate };
    this.routes.set(id, updatedRoute);
    return updatedRoute;
  }

  async deleteRoute(id: number): Promise<boolean> {
    return this.routes.delete(id);
  }

  // Services
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(service: InsertService): Promise<Service> {
    const id = this.serviceIdCounter++;
    const now = new Date();
    const newService: Service = { 
      ...service, 
      id, 
      lastChecked: now,
      status: service.status || "unknown",
      uptime: service.uptime || "0%",
      responseTime: service.responseTime || 0
    };
    this.services.set(id, newService);
    return newService;
  }

  async updateService(id: number, serviceUpdate: Partial<InsertService>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;

    const updatedService: Service = { 
      ...service, 
      ...serviceUpdate,
      lastChecked: new Date()
    };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }

  // Stats
  async getLatestStats(): Promise<Stats | undefined> {
    const statsArray = Array.from(this.stats.values());
    if (statsArray.length === 0) return undefined;
    
    return statsArray.reduce((latest, current) => {
      if (!latest.timestamp || (current.timestamp && current.timestamp > latest.timestamp)) {
        return current;
      }
      return latest;
    });
  }

  async createStats(statsData: InsertStats): Promise<Stats> {
    const id = this.statIdCounter++;
    const now = new Date();
    const newStats: Stats = { 
      ...statsData, 
      id, 
      timestamp: now,
      totalRequests: statsData.totalRequests ?? 0,
      requestsPerSecond: statsData.requestsPerSecond ?? 0,
      avgResponseTime: statsData.avgResponseTime ?? 0,
      errorRate: statsData.errorRate ?? "0%",
      activeConnections: statsData.activeConnections ?? 0
    };
    this.stats.set(id, newStats);
    return newStats;
  }

  async updateStats(id: number, statsUpdate: Partial<InsertStats>): Promise<Stats | undefined> {
    const stats = this.stats.get(id);
    if (!stats) return undefined;

    const updatedStats: Stats = { ...stats, ...statsUpdate };
    this.stats.set(id, updatedStats);
    return updatedStats;
  }

  // Credentials
  async getCredentials(): Promise<Credentials[]> {
    return Array.from(this.credentials.values());
  }

  async getCredentialsByRoute(routeId: number): Promise<Credentials[]> {
    return Array.from(this.credentials.values()).filter(
      credential => credential.routeId === routeId
    );
  }

  async createCredentials(credential: InsertCredentials): Promise<Credentials> {
    const id = this.credentialIdCounter++;
    const newCredential: Credentials = { 
      ...credential, 
      id,
      routeId: credential.routeId ?? null
    };
    this.credentials.set(id, newCredential);
    return newCredential;
  }

  async deleteCredentials(id: number): Promise<boolean> {
    return this.credentials.delete(id);
  }
}

// Import the DatabaseStorage class
import { DatabaseStorage } from "./database-storage";

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
