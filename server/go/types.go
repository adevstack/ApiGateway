package main

// Config holds the configuration for the API Gateway
type Config struct {
	Port         int      `json:"port"`
	LogFile      string   `json:"logFile"`
	Routes       []Route  `json:"routes"`
	GlobalRateLimit string `json:"globalRateLimit"`
}

// Route represents an API route configuration
type Route struct {
	Path         string   `json:"path"`
	Target       string   `json:"target"`
	Methods      []string `json:"methods"`
	RateLimit    string   `json:"rateLimit"`
	Timeout      int      `json:"timeout"`
	AuthRequired bool     `json:"authRequired"`
	Active       bool     `json:"active"`
}

// ConfigureLogging sets up logging based on configuration
func (c *Config) ConfigureLogging() {
	// Implementation will go here
}