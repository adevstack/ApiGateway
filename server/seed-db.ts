import { db } from "./db";
import { 
  routes,
  services,
  stats,
  credentials,
  type InsertRoute,
  type InsertService,
  type InsertStats,
  type InsertCredentials
} from "@shared/schema";

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Check if we have any routes already
    const existingRoutes = await db.select({ count: { value: routes.id } }).from(routes);
    if (existingRoutes[0]?.count.value > 0) {
      console.log("Database already has data, skipping seeding.");
      return;
    }

    // Sample routes
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

    console.log("Inserting routes...");
    await db.insert(routes).values(sampleRoutes);

    // Sample services
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

    console.log("Inserting services...");
    await db.insert(services).values(sampleServices);

    // Sample stats
    const sampleStats: InsertStats = {
      totalRequests: 1284943,
      requestsPerSecond: 256,
      avgResponseTime: 145,
      errorRate: "0.14%",
      activeConnections: 156,
    };

    console.log("Inserting stats...");
    await db.insert(stats).values(sampleStats);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Run the seeding function
seedDatabase();