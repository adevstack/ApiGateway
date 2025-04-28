import { 
  routes, type Route, type InsertRoute,
  services, type Service, type InsertService,
  stats, type Stats, type InsertStats,
  credentials, type Credentials, type InsertCredentials,
  users, type User, type InsertUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    return !!deletedUser;
  }

  // Routes
  async getRoutes(): Promise<Route[]> {
    return await db.select().from(routes);
  }

  async getRoute(id: number): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.id, id));
    return route || undefined;
  }

  async getRouteByPath(path: string): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.path, path));
    return route || undefined;
  }

  async createRoute(route: InsertRoute): Promise<Route> {
    const [newRoute] = await db.insert(routes).values(route).returning();
    return newRoute;
  }

  async updateRoute(id: number, routeUpdate: Partial<InsertRoute>): Promise<Route | undefined> {
    const [updatedRoute] = await db
      .update(routes)
      .set(routeUpdate)
      .where(eq(routes.id, id))
      .returning();
    return updatedRoute || undefined;
  }

  async deleteRoute(id: number): Promise<boolean> {
    const [deletedRoute] = await db
      .delete(routes)
      .where(eq(routes.id, id))
      .returning({ id: routes.id });
    return !!deletedRoute;
  }

  // Services
  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: number, serviceUpdate: Partial<InsertService>): Promise<Service | undefined> {
    const [updatedService] = await db
      .update(services)
      .set(serviceUpdate)
      .where(eq(services.id, id))
      .returning();
    return updatedService || undefined;
  }

  async deleteService(id: number): Promise<boolean> {
    const [deletedService] = await db
      .delete(services)
      .where(eq(services.id, id))
      .returning({ id: services.id });
    return !!deletedService;
  }

  // Stats
  async getLatestStats(): Promise<Stats | undefined> {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const [latestStats] = await db
          .select()
          .from(stats)
          .orderBy(desc(stats.timestamp))
          .limit(1);
        return latestStats || undefined;
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) {
          console.error('Max retries reached for database connection');
          throw error;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
      }
    }
  }

  async createStats(statsData: InsertStats): Promise<Stats> {
    const [newStats] = await db.insert(stats).values(statsData).returning();
    return newStats;
  }

  async updateStats(id: number, statsUpdate: Partial<InsertStats>): Promise<Stats | undefined> {
    const [updatedStats] = await db
      .update(stats)
      .set(statsUpdate)
      .where(eq(stats.id, id))
      .returning();
    return updatedStats || undefined;
  }

  // Credentials
  async getCredentials(): Promise<Credentials[]> {
    return await db.select().from(credentials);
  }

  async getCredentialsByRoute(routeId: number): Promise<Credentials[]> {
    return await db
      .select()
      .from(credentials)
      .where(eq(credentials.routeId, routeId));
  }

  async createCredentials(credential: InsertCredentials): Promise<Credentials> {
    const [newCredential] = await db.insert(credentials).values(credential).returning();
    return newCredential;
  }

  async deleteCredentials(id: number): Promise<boolean> {
    const [deletedCredential] = await db
      .delete(credentials)
      .where(eq(credentials.id, id))
      .returning({ id: credentials.id });
    return !!deletedCredential;
  }
}