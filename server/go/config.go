package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
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

// LoadConfig loads configuration from a file
func LoadConfig(configPath string) (*Config, error) {
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
		if err := config.Save(); err != nil {
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

// ConfigureLogging configures logging based on config settings
func (c *Config) ConfigureLogging() {
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

// Save saves the configuration to the config file
func (c *Config) Save() error {
	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}
	return ioutil.WriteFile(c.configFilePath, data, 0644)
}

// GetRoutes returns all routes
func (c *Config) GetRoutes() []Route {
	c.routesMutex.RLock()
	defer c.routesMutex.RUnlock()
	
	// Create a copy to avoid race conditions
	routes := make([]Route, len(c.Routes))
	copy(routes, c.Routes)
	return routes
}

// GetRoute returns a route by ID
func (c *Config) GetRoute(id int) (Route, bool) {
	c.routesMutex.RLock()
	defer c.routesMutex.RUnlock()
	
	for _, route := range c.Routes {
		if route.ID == id {
			return route, true
		}
	}
	return Route{}, false
}

// AddRoute adds a new route and returns its ID
func (c *Config) AddRoute(route Route) int {
	c.routesMutex.Lock()
	defer c.routesMutex.Unlock()
	
	route.ID = c.nextRouteID
	c.nextRouteID++
	c.Routes = append(c.Routes, route)
	return route.ID
}

// UpdateRoute updates an existing route
func (c *Config) UpdateRoute(route Route) bool {
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

// DeleteRoute removes a route by ID
func (c *Config) DeleteRoute(id int) bool {
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

// FindRouteByPath finds a route that matches the given path and method
func (c *Config) FindRouteByPath(path string, method string) (Route, bool) {
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