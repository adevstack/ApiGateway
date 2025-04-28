package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"sync"
	"time"
)

// Service represents a backend service
type Service struct {
	Name    string    `json:"name"`
	URL     string    `json:"url"`
	Status  string    `json:"status"`
	LastCheck time.Time `json:"lastCheck"`
}

// Stats represents gateway statistics
type Stats struct {
	TotalRequests      int64             `json:"totalRequests"`
	RequestsPerSecond  float64           `json:"requestsPerSecond"`
	AvgResponseTime    float64           `json:"avgResponseTime"`
	ErrorRate          float64           `json:"errorRate"`
	ActiveConnections  int               `json:"activeConnections"`
	Uptime             int64             `json:"uptime"`
	RouteStats         map[string]RouteStat `json:"routeStats"`
}

// RouteStat represents statistics for a specific route
type RouteStat struct {
	Requests     int64   `json:"requests"`
	Errors       int64   `json:"errors"`
	AvgLatency   float64 `json:"avgLatency"`
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

// NewProxy creates a new proxy with the given configuration
func NewProxy(config *Config) *Proxy {
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
	for _, route := range p.config.GetRoutes() {
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
				Name:    serviceName,
				URL:     route.Target,
				Status:  "unknown",
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
			p.CheckHealth()
		}
	}
}

// ProxyRequest forwards the request to the appropriate backend service
func (p *Proxy) ProxyRequest(w http.ResponseWriter, r *http.Request, route Route) error {
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

// GetStats returns the current gateway statistics
func (p *Proxy) GetStats() Stats {
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

// GetServices returns information about all backend services
func (p *Proxy) GetServices() []Service {
	p.servicesMutex.RLock()
	defer p.servicesMutex.RUnlock()
	
	services := make([]Service, 0, len(p.services))
	for _, svc := range p.services {
		services = append(services, *svc)
	}
	
	return services
}

// CheckHealth performs health checks on all backend services
func (p *Proxy) CheckHealth() []Service {
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