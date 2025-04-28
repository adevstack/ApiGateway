package main

import (
        "encoding/json"
        "fmt"
        "io/ioutil"
        "log"
        "net/http"
        "net/http/httputil"
        "net/url"
        "os"
        "strconv"
        "strings"
        "sync"
        "time"
)

// Route represents an API route configuration
type Route struct {
        ID           int      `json:"id"`
        Path         string   `json:"path"`
        Target       string   `json:"target"`
        Methods      []string `json:"methods"`
        RateLimit    int      `json:"rateLimit"`
        Timeout      int      `json:"timeout"`
        AuthRequired bool     `json:"authRequired"`
        Active       bool     `json:"active"`
}

// Config represents the gateway configuration
type Config struct {
        Port             int     `json:"port"`
        LogLevel         string  `json:"logLevel"`
        LogFile          string  `json:"logFile"`
        EnableRateLimit  bool    `json:"enableRateLimit"`
        DefaultRateLimit int     `json:"defaultRateLimit"`
        DefaultTimeout   int     `json:"defaultTimeout"`
        Routes           []Route `json:"routes"`

        configFilePath string
        routesMutex    sync.RWMutex
        nextRouteID    int
}

// Service represents a backend service
type Service struct {
        Name      string    `json:"name"`
        URL       string    `json:"url"`
        Status    string    `json:"status"`
        LastCheck time.Time `json:"lastCheck"`
}

// Stats represents gateway statistics
type Stats struct {
        TotalRequests      int64                `json:"totalRequests"`
        RequestsPerSecond  float64              `json:"requestsPerSecond"`
        AvgResponseTime    float64              `json:"avgResponseTime"`
        ErrorRate          float64              `json:"errorRate"`
        ActiveConnections  int                  `json:"activeConnections"`
        Uptime             int64                `json:"uptime"`
        RouteStats         map[string]RouteStat `json:"routeStats"`
}

// RouteStat represents statistics for a specific route
type RouteStat struct {
        Requests   int64   `json:"requests"`
        Errors     int64   `json:"errors"`
        AvgLatency float64 `json:"avgLatency"`
}

// Proxy handles the proxying of requests to backend services
type Proxy struct {
        config         *Config
        stats          Stats
        services       map[string]*Service
        statsMutex     sync.RWMutex
        servicesMutex  sync.RWMutex
        startTime      time.Time
        activeRequests int32
        reqMutex       sync.RWMutex
}

// RateLimiter implements a token bucket rate limiter
type RateLimiter struct {
        config      *Config
        buckets     map[string]*TokenBucket
        bucketMutex sync.RWMutex
}

// TokenBucket represents a token bucket for rate limiting
type TokenBucket struct {
        tokens         float64
        capacity       float64
        refillRate     float64 // tokens per second
        lastRefillTime time.Time
        mutex          sync.Mutex
}

const (
        defaultConfigPath = "config.json"
        defaultPort       = 8000
        apiPrefix         = "/api"
)

var (
        config      *Config
        proxy       *Proxy
        rateLimiter *RateLimiter
)

func main() {
        // Load configuration
        var err error
        configPath := defaultConfigPath
        if len(os.Args) > 1 {
                configPath = os.Args[1]
        }

        config, err = loadConfig(configPath)
        if err != nil {
                log.Fatalf("Failed to load config: %v", err)
        }

        // Configure logging
        config.configureLogging()

        // Set up the proxy
        proxy = newProxy(config)

        // Set up rate limiter
        rateLimiter = newRateLimiter(config)

        // Register handlers
        http.HandleFunc(apiPrefix+"/routes", handleRoutes)
        http.HandleFunc(apiPrefix+"/routes/", handleRoute)
        http.HandleFunc(apiPrefix+"/stats", handleStats)
        http.HandleFunc(apiPrefix+"/services", handleServices)
        http.HandleFunc(apiPrefix+"/health", handleHealth)
        http.HandleFunc(apiPrefix+"/config", handleConfig)

        // Default handler for proxying requests
        http.HandleFunc("/", handleProxyRequest)

        // Start server
        port := config.Port
        if port == 0 {
                port = defaultPort
        }

        log.Printf("Starting API Gateway on port %d", port)
        if err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil); err != nil {
                log.Fatalf("Failed to start server: %v", err)
        }
}

// loadConfig loads configuration from a file
func loadConfig(configPath string) (*Config, error) {
        // Default config
        config := &Config{
                Port:             8000,
                LogLevel:         "info",
                EnableRateLimit:  true,
                DefaultRateLimit: 100,
                DefaultTimeout:   30,
                configFilePath:   configPath,
        }

        // Check if config file exists
        if _, err := os.Stat(configPath); os.IsNotExist(err) {
                // Create default config
                config.Routes = []Route{
                        {
                                ID:           1,
                                Path:         "/api/users",
                                Target:       "http://user-service:8080",
                                Methods:      []string{"GET", "POST", "PUT", "DELETE"},
                                RateLimit:    100,
                                Timeout:      30,
                                AuthRequired: true,
                                Active:       true,
                        },
                        {
                                ID:           2,
                                Path:         "/api/products",
                                Target:       "http://product-service:8080",
                                Methods:      []string{"GET", "POST", "PUT", "DELETE"},
                                RateLimit:    50,
                                Timeout:      30,
                                AuthRequired: true,
                                Active:       true,
                        },
                        {
                                ID:           3,
                                Path:         "/api/auth",
                                Target:       "http://auth-service:8080",
                                Methods:      []string{"POST"},
                                RateLimit:    20,
                                Timeout:      10,
                                AuthRequired: false,
                                Active:       true,
                        },
                        {
                                ID:           4,
                                Path:         "/public",
                                Target:       "http://static-service:8080",
                                Methods:      []string{"GET"},
                                RateLimit:    500,
                                Timeout:      5,
                                AuthRequired: false,
                                Active:       true,
                        },
                }
                config.nextRouteID = 5

                // Save default config
                if err := config.save(); err != nil {
                        return nil, err
                }

                return config, nil
        }

        // Read config file
        data, err := ioutil.ReadFile(configPath)
        if err != nil {
                return nil, err
        }

        // Parse config
        if err := json.Unmarshal(data, config); err != nil {
                return nil, err
        }

        // Set next route ID
        config.nextRouteID = 1
        for _, route := range config.Routes {
                if route.ID >= config.nextRouteID {
                        config.nextRouteID = route.ID + 1
                }
        }

        return config, nil
}

// configureLogging configures logging based on config settings
func (c *Config) configureLogging() {
        if c.LogFile != "" {
                file, err := os.OpenFile(c.LogFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
                if err != nil {
                        log.Printf("Failed to open log file %s: %v", c.LogFile, err)
                        return
                }
                log.SetOutput(file)
        }

        // Set log flags
        log.SetFlags(log.LstdFlags | log.Lshortfile)
}

// save saves the configuration to the config file
func (c *Config) save() error {
        data, err := json.MarshalIndent(c, "", "  ")
        if err != nil {
                return err
        }
        return ioutil.WriteFile(c.configFilePath, data, 0644)
}

// getRoutes returns all routes
func (c *Config) getRoutes() []Route {
        c.routesMutex.RLock()
        defer c.routesMutex.RUnlock()

        // Create a copy to avoid race conditions
        routes := make([]Route, len(c.Routes))
        copy(routes, c.Routes)
        return routes
}

// getRoute returns a route by ID
func (c *Config) getRoute(id int) (Route, bool) {
        c.routesMutex.RLock()
        defer c.routesMutex.RUnlock()

        for _, route := range c.Routes {
                if route.ID == id {
                        return route, true
                }
        }
        return Route{}, false
}

// addRoute adds a new route and returns its ID
func (c *Config) addRoute(route Route) int {
        c.routesMutex.Lock()
        defer c.routesMutex.Unlock()

        route.ID = c.nextRouteID
        c.nextRouteID++
        c.Routes = append(c.Routes, route)
        return route.ID
}

// updateRoute updates an existing route
func (c *Config) updateRoute(route Route) bool {
        c.routesMutex.Lock()
        defer c.routesMutex.Unlock()

        for i, r := range c.Routes {
                if r.ID == route.ID {
                        c.Routes[i] = route
                        return true
                }
        }
        return false
}

// deleteRoute removes a route by ID
func (c *Config) deleteRoute(id int) bool {
        c.routesMutex.Lock()
        defer c.routesMutex.Unlock()

        for i, route := range c.Routes {
                if route.ID == id {
                        // Remove route from slice
                        c.Routes = append(c.Routes[:i], c.Routes[i+1:]...)
                        return true
                }
        }
        return false
}

// findRouteByPath finds a route that matches the given path and method
func (c *Config) findRouteByPath(path string, method string) (Route, bool) {
        c.routesMutex.RLock()
        defer c.routesMutex.RUnlock()

        for _, route := range c.Routes {
                if !route.Active {
                        continue
                }

                // Check if path matches
                if pathMatches(path, route.Path) {
                        // Check if method is allowed
                        for _, m := range route.Methods {
                                if m == "*" || m == method {
                                        return route, true
                                }
                        }
                }
        }
        return Route{}, false
}

// pathMatches checks if a request path matches a route path
func pathMatches(requestPath, routePath string) bool {
        // Simple exact match
        if requestPath == routePath {
                return true
        }

        // Simple prefix match (e.g., /api/users matches /api/users/123)
        if strings.HasPrefix(requestPath, routePath+"/") {
                return true
        }

        // TODO: Implement more sophisticated path matching with patterns and params

        return false
}

// newProxy creates a new proxy with the given configuration
func newProxy(config *Config) *Proxy {
        p := &Proxy{
                config:    config,
                services:  make(map[string]*Service),
                startTime: time.Now(),
                stats: Stats{
                        RouteStats: make(map[string]RouteStat),
                },
        }

        // Initialize services from routes
        p.initServices()

        // Start background service health check
        go p.backgroundHealthCheck()

        return p
}

// initServices initializes the service map from route targets
func (p *Proxy) initServices() {
        p.servicesMutex.Lock()
        defer p.servicesMutex.Unlock()

        // Find unique services from routes
        for _, route := range p.config.getRoutes() {
                if route.Target == "" {
                        continue
                }

                targetURL, err := url.Parse(route.Target)
                if err != nil {
                        log.Printf("Invalid target URL %s: %v", route.Target, err)
                        continue
                }

                serviceName := targetURL.Hostname()
                if _, exists := p.services[serviceName]; !exists {
                        p.services[serviceName] = &Service{
                                Name:   serviceName,
                                URL:    route.Target,
                                Status: "unknown",
                        }
                }
        }
}

// backgroundHealthCheck periodically checks the health of backend services
func (p *Proxy) backgroundHealthCheck() {
        ticker := time.NewTicker(60 * time.Second)
        defer ticker.Stop()

        for {
                select {
                case <-ticker.C:
                        p.checkHealth()
                }
        }
}

// ProxyRequest forwards the request to the appropriate backend service
func (p *Proxy) proxyRequest(w http.ResponseWriter, r *http.Request, route Route) error {
        startTime := time.Now()

        // Increment active requests
        p.reqMutex.Lock()
        p.activeRequests++
        p.reqMutex.Unlock()

        // Decrement active requests when done
        defer func() {
                p.reqMutex.Lock()
                p.activeRequests--
                p.reqMutex.Unlock()
        }()

        // Create target URL
        target, err := url.Parse(route.Target)
        if err != nil {
                return fmt.Errorf("invalid target URL: %v", err)
        }

        // Create reverse proxy
        proxy := httputil.NewSingleHostReverseProxy(target)

        // Set timeout if configured
        timeout := route.Timeout
        if timeout <= 0 {
                timeout = p.config.DefaultTimeout
        }
        if timeout > 0 {
                proxy.Transport = &http.Transport{
                        ResponseHeaderTimeout: time.Duration(timeout) * time.Second,
                }
        }

        // Handle proxy errors
        proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
                log.Printf("Proxy error: %v", err)

                // Update error stats
                p.updateStats(route.Path, time.Since(startTime), true)

                if err.Error() == "net/http: timeout awaiting response headers" {
                        http.Error(w, "gateway timeout", http.StatusGatewayTimeout)
                } else {
                        http.Error(w, "service unavailable", http.StatusServiceUnavailable)
                }
        }

        // Log the request
        log.Printf("Proxying request: %s %s -> %s", r.Method, r.URL.Path, route.Target)

        // Serve the request
        proxy.ServeHTTP(w, r)

        // Update stats
        p.updateStats(route.Path, time.Since(startTime), false)

        return nil
}

// updateStats updates the request statistics
func (p *Proxy) updateStats(path string, latency time.Duration, isError bool) {
        p.statsMutex.Lock()
        defer p.statsMutex.Unlock()

        // Update total stats
        p.stats.TotalRequests++

        // Calculate requests per second
        elapsed := time.Since(p.startTime).Seconds()
        p.stats.RequestsPerSecond = float64(p.stats.TotalRequests) / elapsed

        // Update route stats
        routeStat, exists := p.stats.RouteStats[path]
        if !exists {
                routeStat = RouteStat{}
        }

        routeStat.Requests++
        routeStat.AvgLatency = (routeStat.AvgLatency*float64(routeStat.Requests-1) + latency.Seconds()) / float64(routeStat.Requests)

        if isError {
                routeStat.Errors++
                p.stats.ErrorRate = float64(routeStat.Errors) / float64(routeStat.Requests)
        }

        p.stats.RouteStats[path] = routeStat

        // Update average response time
        p.stats.AvgResponseTime = 0
        totalRequests := int64(0)
        for _, rs := range p.stats.RouteStats {
                p.stats.AvgResponseTime += rs.AvgLatency * float64(rs.Requests)
                totalRequests += rs.Requests
        }
        if totalRequests > 0 {
                p.stats.AvgResponseTime /= float64(totalRequests)
        }
}

// getStats returns the current gateway statistics
func (p *Proxy) getStats() Stats {
        p.statsMutex.RLock()
        defer p.statsMutex.RUnlock()

        // Make a copy of the stats to avoid race conditions
        stats := p.stats

        // Update dynamic fields
        p.reqMutex.RLock()
        stats.ActiveConnections = int(p.activeRequests)
        p.reqMutex.RUnlock()

        stats.Uptime = int64(time.Since(p.startTime).Seconds())

        return stats
}

// getServices returns information about all backend services
func (p *Proxy) getServices() []Service {
        p.servicesMutex.RLock()
        defer p.servicesMutex.RUnlock()

        services := make([]Service, 0, len(p.services))
        for _, svc := range p.services {
                services = append(services, *svc)
        }

        return services
}

// checkHealth performs health checks on all backend services
func (p *Proxy) checkHealth() []Service {
        p.servicesMutex.Lock()
        defer p.servicesMutex.Unlock()

        // Perform health check on each service
        for name, svc := range p.services {
                p.checkServiceHealth(svc)
                log.Printf("Service %s health check: %s", name, svc.Status)
        }

        // Return services
        services := make([]Service, 0, len(p.services))
        for _, svc := range p.services {
                services = append(services, *svc)
        }

        return services
}

// checkServiceHealth checks the health of a single service
func (p *Proxy) checkServiceHealth(svc *Service) {
        svc.LastCheck = time.Now()

        // Parse URL
        targetURL, err := url.Parse(svc.URL)
        if err != nil {
                svc.Status = "error"
                return
        }

        // Create health check URL (could be customized in a real system)
        healthURL := fmt.Sprintf("%s://%s/health", targetURL.Scheme, targetURL.Host)

        // Send request with timeout
        client := &http.Client{
                Timeout: 5 * time.Second,
        }

        req, err := http.NewRequest("GET", healthURL, nil)
        if err != nil {
                svc.Status = "error"
                return
        }

        resp, err := client.Do(req)
        if err != nil {
                svc.Status = "error"
                return
        }
        defer resp.Body.Close()

        // Read response
        body, err := ioutil.ReadAll(resp.Body)
        if err != nil {
                svc.Status = "warning"
                return
        }

        // Check status code
        if resp.StatusCode < 200 || resp.StatusCode >= 300 {
                svc.Status = "warning"
                return
        }

        // For simplicity, any successful response indicates health
        svc.Status = "healthy"

        // In a real system, we would parse the response and look for specific health indicators
        _ = body // Use body in real implementation
}

// newRateLimiter creates a new rate limiter
func newRateLimiter(config *Config) *RateLimiter {
        return &RateLimiter{
                config:  config,
                buckets: make(map[string]*TokenBucket),
        }
}

// Allow checks if a request for the given path is allowed by the rate limiter
func (rl *RateLimiter) allow(path string, rateLimit int) bool {
        // Skip rate limiting if disabled
        if !rl.config.EnableRateLimit {
                return true
        }

        // If no specific rate limit is provided, use the default
        if rateLimit <= 0 {
                rateLimit = rl.config.DefaultRateLimit
        }

        // Get or create the bucket for this path
        bucket := rl.getBucket(path, rateLimit)

        // Try to take a token
        return bucket.takeToken()
}

// getBucket gets or creates a token bucket for the given path
func (rl *RateLimiter) getBucket(path string, rateLimit int) *TokenBucket {
        rl.bucketMutex.RLock()
        bucket, exists := rl.buckets[path]
        rl.bucketMutex.RUnlock()

        if exists {
                return bucket
        }

        // Create a new bucket
        rl.bucketMutex.Lock()
        defer rl.bucketMutex.Unlock()

        // Check again in case another goroutine created it
        bucket, exists = rl.buckets[path]
        if exists {
                return bucket
        }

        capacity := float64(rateLimit)
        bucket = &TokenBucket{
                tokens:         capacity,
                capacity:       capacity,
                refillRate:     capacity / 60.0, // Refill the bucket over 1 minute
                lastRefillTime: time.Now(),
        }

        rl.buckets[path] = bucket
        return bucket
}

// takeToken attempts to take a token from the bucket
func (tb *TokenBucket) takeToken() bool {
        tb.mutex.Lock()
        defer tb.mutex.Unlock()

        // Refill the bucket based on elapsed time
        now := time.Now()
        elapsed := now.Sub(tb.lastRefillTime).Seconds()
        tb.lastRefillTime = now

        // Add tokens based on elapsed time
        tb.tokens += elapsed * tb.refillRate

        // Cap at capacity
        if tb.tokens > tb.capacity {
                tb.tokens = tb.capacity
        }

        // Check if we have tokens available
        if tb.tokens < 1.0 {
                return false
        }

        // Take a token
        tb.tokens--
        return true
}

// handleRoutes handles GET and POST requests for routes
func handleRoutes(w http.ResponseWriter, r *http.Request) {
        switch r.Method {
        case http.MethodGet:
                // Return all routes
                routes := config.getRoutes()
                writeJSON(w, routes)

        case http.MethodPost:
                // Create a new route
                var route Route
                if err := json.NewDecoder(r.Body).Decode(&route); err != nil {
                        http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
                        return
                }

                // Validate route
                if err := validateRoute(route); err != nil {
                        http.Error(w, err.Error(), http.StatusBadRequest)
                        return
                }

                // Add route to config
                id := config.addRoute(route)

                // Save config
                if err := config.save(); err != nil {
                        http.Error(w, fmt.Sprintf("Failed to save config: %v", err), http.StatusInternalServerError)
                        return
                }

                // Return the new route with ID
                route.ID = id
                w.WriteHeader(http.StatusCreated)
                writeJSON(w, route)

        default:
                http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        }
}

// handleRoute handles GET, PUT, and DELETE requests for a specific route
func handleRoute(w http.ResponseWriter, r *http.Request) {
        // Extract route ID from URL
        parts := strings.Split(r.URL.Path, "/")
        if len(parts) < 4 {
                http.Error(w, "Invalid route ID", http.StatusBadRequest)
                return
        }

        idStr := parts[3]
        id, err := strconv.Atoi(idStr)
        if err != nil {
                http.Error(w, "Invalid route ID", http.StatusBadRequest)
                return
        }

        switch r.Method {
        case http.MethodGet:
                // Get route by ID
                route, found := config.getRoute(id)
                if !found {
                        http.Error(w, "Route not found", http.StatusNotFound)
                        return
                }
                writeJSON(w, route)

        case http.MethodPut:
                // Update route
                var route Route
                if err := json.NewDecoder(r.Body).Decode(&route); err != nil {
                        http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
                        return
                }

                // Ensure ID matches
                route.ID = id

                // Validate route
                if err := validateRoute(route); err != nil {
                        http.Error(w, err.Error(), http.StatusBadRequest)
                        return
                }

                // Update route in config
                if !config.updateRoute(route) {
                        http.Error(w, "Route not found", http.StatusNotFound)
                        return
                }

                // Save config
                if err := config.save(); err != nil {
                        http.Error(w, fmt.Sprintf("Failed to save config: %v", err), http.StatusInternalServerError)
                        return
                }

                writeJSON(w, route)

        case http.MethodDelete:
                // Delete route
                if !config.deleteRoute(id) {
                        http.Error(w, "Route not found", http.StatusNotFound)
                        return
                }

                // Save config
                if err := config.save(); err != nil {
                        http.Error(w, fmt.Sprintf("Failed to save config: %v", err), http.StatusInternalServerError)
                        return
                }

                w.WriteHeader(http.StatusNoContent)

        default:
                http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        }
}

// handleStats returns current gateway statistics
func handleStats(w http.ResponseWriter, r *http.Request) {
        stats := proxy.getStats()
        writeJSON(w, stats)
}

// handleServices returns information about backend services
func handleServices(w http.ResponseWriter, r *http.Request) {
        services := proxy.getServices()
        writeJSON(w, services)
}

// handleHealth performs health checks on backend services
func handleHealth(w http.ResponseWriter, r *http.Request) {
        health := proxy.checkHealth()
        writeJSON(w, health)
}

// handleConfig handles configuration settings
func handleConfig(w http.ResponseWriter, r *http.Request) {
        switch r.Method {
        case http.MethodGet:
                // Return current config (excluding routes for brevity)
                configCopy := *config
                configCopy.Routes = nil
                writeJSON(w, configCopy)

        case http.MethodPut:
                // Update config
                var newConfig Config
                if err := json.NewDecoder(r.Body).Decode(&newConfig); err != nil {
                        http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
                        return
                }

                // Preserve routes and other non-serialized fields
                newConfig.Routes = config.getRoutes() // Use getter to get a copy

                // Update config
                *config = newConfig

                // Apply new configuration
                config.configureLogging()

                // Save config
                if err := config.save(); err != nil {
                        http.Error(w, fmt.Sprintf("Failed to save config: %v", err), http.StatusInternalServerError)
                        return
                }

                writeJSON(w, newConfig)

        default:
                http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        }
}

// handleProxyRequest proxies all other requests to the appropriate backend
func handleProxyRequest(w http.ResponseWriter, r *http.Request) {
        // Look up route
        route, found := config.findRouteByPath(r.URL.Path, r.Method)
        if !found {
                http.Error(w, "Not found", http.StatusNotFound)
                return
        }

        // Check rate limit
        if config.EnableRateLimit {
                if !rateLimiter.allow(route.Path, route.RateLimit) {
                        http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
                        return
                }
        }

        // Check authentication if required
        if route.AuthRequired {
                // Authentication logic would go here
                authHeader := r.Header.Get("Authorization")
                if authHeader == "" {
                        http.Error(w, "Authentication required", http.StatusUnauthorized)
                        return
                }
                // In a real implementation, we would validate the authentication token
        }

        // Proxy the request
        if err := proxy.proxyRequest(w, r, route); err != nil {
                status := http.StatusInternalServerError
                if err.Error() == "gateway timeout" {
                        status = http.StatusGatewayTimeout
                } else if err.Error() == "service unavailable" {
                        status = http.StatusServiceUnavailable
                }
                http.Error(w, err.Error(), status)
        }
}

// validateRoute validates a route configuration
func validateRoute(route Route) error {
        if route.Path == "" {
                return fmt.Errorf("path is required")
        }
        if !strings.HasPrefix(route.Path, "/") {
                return fmt.Errorf("path must start with /")
        }
        if route.Target == "" {
                return fmt.Errorf("target is required")
        }
        if len(route.Methods) == 0 {
                return fmt.Errorf("at least one HTTP method must be specified")
        }
        return nil
}

// writeJSON writes JSON response with proper headers
func writeJSON(w http.ResponseWriter, data interface{}) {
        w.Header().Set("Content-Type", "application/json")
        if err := json.NewEncoder(w).Encode(data); err != nil {
                http.Error(w, fmt.Sprintf("Failed to encode response: %v", err), http.StatusInternalServerError)
        }
}