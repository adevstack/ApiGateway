import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRouteSchema, insertServiceSchema, insertStatsSchema, insertCredentialsSchema } from "@shared/schema";
import { z } from "zod";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { WebSocketServer, WebSocket } from 'ws';
import { setupAuth } from "./auth";

// Helper to run Go server in child process
let goServerProcess: any = null;

async function startGoServer() {
  if (goServerProcess) {
    console.log("Go server already running");
    return;
  }

  const goServerDir = path.join(import.meta.dirname, "go");
  const goGatewayDir = path.join(goServerDir, "cmd", "gateway");
  const goServerPath = path.join(goGatewayDir, "main.go");
  
  // Check if Go file exists
  if (!fs.existsSync(goServerPath)) {
    console.error(`Go server file not found at ${goServerPath}`);
    return;
  }

  // PDF Documentation endpoint
  app.get('/api/download-docs', async (_req, res) => {
    try {
      const { generateProjectDocumentation } = await import('./pdf-generator');
      await generateProjectDocumentation();
      
      const filePath = path.join(process.cwd(), 'project-documentation.pdf');
      res.download(filePath, 'project-documentation.pdf', (err) => {
        if (err) {
          console.error('Error sending documentation:', err);
        }
        // Clean up the file after sending
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error cleaning up documentation file:', unlinkErr);
          }
        });
      });
    } catch (error) {
      console.error('Error generating documentation:', error);
      res.status(500).json({ message: 'Failed to generate documentation' });
    }
  });

  console.log("Starting Go server...");
  goServerProcess = exec(`cd ${goGatewayDir} && go run main.go`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Go server error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Go server stderr: ${stderr}`);
      return;
    }
    console.log(`Go server stdout: ${stdout}`);
  });

  goServerProcess.on('exit', (code: number) => {
    console.log(`Go server process exited with code ${code}`);
    goServerProcess = null;
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Express routes first
  app.get('/api/download-docs', async (_req, res) => {
    try {
      const { generateProjectDocumentation } = await import('./pdf-generator');
      await generateProjectDocumentation();
      
      const filePath = path.join(process.cwd(), 'project-documentation.pdf');
      res.download(filePath, 'project-documentation.pdf', (err) => {
        if (err) {
          console.error('Error sending documentation:', err);
          return res.status(500).json({ message: 'Error sending documentation' });
        }
        // Clean up the file after sending
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error cleaning up documentation file:', unlinkErr);
          }
        });
      });
    } catch (error) {
      console.error('Error generating documentation:', error);
      res.status(500).json({ message: 'Failed to generate documentation' });
    }
  });

  // Start the Go server component that will handle the actual proxy functionality
  try {
    await startGoServer();
  } catch (error) {
    console.error("Failed to start Go server:", error);
    // Continue anyway to make sure the dashboard works
  }

  // Set up authentication routes and middleware
  // This sets up /api/register, /api/login, /api/logout, /api/user endpoints
  setupAuth(app);

  // API routes for the dashboard
  
  // Routes management
  app.get('/api/routes', async (req, res) => {
    try {
      const routes = await storage.getRoutes();
      res.json(routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
      res.status(500).json({ message: 'Failed to fetch routes' });
    }
  });

  app.get('/api/routes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const route = await storage.getRoute(id);
      
      if (!route) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      res.json(route);
    } catch (error) {
      console.error('Error fetching route:', error);
      res.status(500).json({ message: 'Failed to fetch route' });
    }
  });

  app.post('/api/routes', async (req, res) => {
    try {
      const validatedData = insertRouteSchema.parse(req.body);
      const newRoute = await storage.createRoute(validatedData);
      res.status(201).json(newRoute);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid route data', errors: error.errors });
      } else {
        console.error('Error creating route:', error);
        res.status(500).json({ message: 'Failed to create route' });
      }
    }
  });

  app.put('/api/routes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRouteSchema.partial().parse(req.body);
      
      const updatedRoute = await storage.updateRoute(id, validatedData);
      
      if (!updatedRoute) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      res.json(updatedRoute);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid route data', errors: error.errors });
      } else {
        console.error('Error updating route:', error);
        res.status(500).json({ message: 'Failed to update route' });
      }
    }
  });

  app.delete('/api/routes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRoute(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting route:', error);
      res.status(500).json({ message: 'Failed to delete route' });
    }
  });

  // Services health
  app.get('/api/services', async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ message: 'Failed to fetch services' });
    }
  });

  app.post('/api/services', async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const newService = await storage.createService(validatedData);
      res.status(201).json(newService);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid service data', errors: error.errors });
      } else {
        console.error('Error creating service:', error);
        res.status(500).json({ message: 'Failed to create service' });
      }
    }
  });

  app.put('/api/services/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertServiceSchema.partial().parse(req.body);
      
      const updatedService = await storage.updateService(id, validatedData);
      
      if (!updatedService) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      res.json(updatedService);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid service data', errors: error.errors });
      } else {
        console.error('Error updating service:', error);
        res.status(500).json({ message: 'Failed to update service' });
      }
    }
  });

  // Stats
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getLatestStats();
      
      if (!stats) {
        return res.status(404).json({ message: 'No stats available' });
      }
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  app.post('/api/stats', async (req, res) => {
    try {
      const validatedData = insertStatsSchema.parse(req.body);
      const newStats = await storage.createStats(validatedData);
      res.status(201).json(newStats);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid stats data', errors: error.errors });
      } else {
        console.error('Error creating stats:', error);
        res.status(500).json({ message: 'Failed to create stats' });
      }
    }
  });

  // Credentials for route authentication
  app.get('/api/credentials', async (req, res) => {
    try {
      const credentials = await storage.getCredentials();
      res.json(credentials);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      res.status(500).json({ message: 'Failed to fetch credentials' });
    }
  });

  app.get('/api/routes/:routeId/credentials', async (req, res) => {
    try {
      const routeId = parseInt(req.params.routeId);
      const credentials = await storage.getCredentialsByRoute(routeId);
      res.json(credentials);
    } catch (error) {
      console.error('Error fetching credentials for route:', error);
      res.status(500).json({ message: 'Failed to fetch credentials for route' });
    }
  });

  app.post('/api/credentials', async (req, res) => {
    try {
      const validatedData = insertCredentialsSchema.parse(req.body);
      const newCredentials = await storage.createCredentials(validatedData);
      res.status(201).json(newCredentials);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid credentials data', errors: error.errors });
      } else {
        console.error('Error creating credentials:', error);
        res.status(500).json({ message: 'Failed to create credentials' });
      }
    }
  });

  app.delete('/api/credentials/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCredentials(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Credentials not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting credentials:', error);
      res.status(500).json({ message: 'Failed to delete credentials' });
    }
  });

  // Traffic data for charts
  app.get('/api/traffic', (req, res) => {
    // Generate sample traffic data for the last 24 hours
    const now = new Date();
    const data = Array.from({ length: 24 }, (_, index) => {
      const timestamp = new Date(now);
      timestamp.setHours(timestamp.getHours() - 23 + index);
      
      // Generate realistic but random data points
      const requests = Math.floor(200 + Math.random() * 300);
      const errors = Math.floor(requests * (Math.random() * 0.02)); // 0-2% error rate
      const latency = Math.floor(100 + Math.random() * 150); // 100-250ms latency
      
      return {
        timestamp: timestamp.toISOString(),
        requests,
        errors,
        latency
      };
    });
    
    res.json(data);
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients with their pause state
  type ClientState = {
    socket: WebSocket;
    isPaused: boolean;
  };
  
  const clients = new Map<WebSocket, ClientState>();
  
  wss.on('connection', (ws) => {
    // Add new client to map with default pause state = false
    clients.set(ws, { socket: ws, isPaused: false });
    console.log(`WebSocket client connected. Total clients: ${clients.size}`);
    
    // Send initial data
    const initialData = {
      type: 'connected',
      message: 'Connected to API Gateway WebSocket server'
    };
    ws.send(JSON.stringify(initialData));
    
    // Handle client messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle different message types
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
        else if (data.type === 'pause_toggle') {
          // Toggle pause state for this client
          const clientState = clients.get(ws);
          if (clientState) {
            const newPauseState = !clientState.isPaused;
            clients.set(ws, { ...clientState, isPaused: newPauseState });
            console.log(`Client paused state changed to: ${newPauseState}`);
            
            // Send confirmation of pause state change
            ws.send(JSON.stringify({
              type: 'pause_state_changed',
              isPaused: newPauseState,
              timestamp: new Date().toISOString()
            }));
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      clients.delete(ws);
      console.log(`WebSocket client disconnected. Remaining clients: ${clients.size}`);
    });
  });
  
  // Broadcast updates to all non-paused clients
  function broadcastToAll(data: any) {
    clients.forEach((clientState, _) => {
      const { socket, isPaused } = clientState;
      if (socket.readyState === WebSocket.OPEN && !isPaused) {
        socket.send(JSON.stringify(data));
      }
    });
  }
  
  // Start periodic updates for real-time data
  setInterval(async () => {
    try {
      // Get latest stats
      const stats = await storage.getLatestStats();
      if (stats) {
        broadcastToAll({
          type: 'stats_update',
          data: stats,
          timestamp: new Date().toISOString()
        });
      }
      
      // Send traffic update
      const now = new Date();
      const trafficUpdate = {
        timestamp: now.toISOString(),
        requests: Math.floor(20 + Math.random() * 30),
        errors: Math.floor(Math.random() * 2),
        latency: Math.floor(80 + Math.random() * 50)
      };
      
      broadcastToAll({
        type: 'traffic_update',
        data: trafficUpdate,
        timestamp: now.toISOString()
      });
      
    } catch (error) {
      console.error('Error broadcasting updates:', error);
    }
  }, 5000); // Update every 5 seconds
  
  return httpServer;
}
