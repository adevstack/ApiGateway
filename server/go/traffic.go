package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// TrafficAnalytics handles collecting and analyzing traffic data
type TrafficAnalytics struct {
	// Historical traffic data points
	hourlyData   []TrafficData
	dailyData    []TrafficData
	weeklyData   []TrafficData
	
	// Cache for path distribution, error types, and latency distribution
	pathDistribution   map[string]int
	errorTypes         map[string]int
	latencyDistribution map[string]int
	
	// Mutex for thread safety
	mu sync.RWMutex
	
	// The proxy instance to get data from
	proxy *Proxy
}

// PathDistributionItem represents an item in the path distribution
type PathDistributionItem struct {
	Path  string `json:"path"`
	Count int    `json:"count"`
}

// ErrorTypeItem represents an error type and its count
type ErrorTypeItem struct {
	Type  string `json:"type"`
	Count int    `json:"count"`
}

// LatencyDistributionItem represents a latency range and its count
type LatencyDistributionItem struct {
	Range string `json:"range"`
	Count int    `json:"count"`
}

// NewTrafficAnalytics creates a new traffic analytics instance
func NewTrafficAnalytics(proxy *Proxy) *TrafficAnalytics {
	ta := &TrafficAnalytics{
		hourlyData:   make([]TrafficData, 0, 60),  // Last 60 minutes
		dailyData:    make([]TrafficData, 0, 24),  // Last 24 hours
		weeklyData:   make([]TrafficData, 0, 7),   // Last 7 days
		pathDistribution:   make(map[string]int),
		errorTypes:         make(map[string]int),
		latencyDistribution: make(map[string]int),
		proxy: proxy,
	}
	
	// Start background data collection
	go ta.startDataCollection()
	
	return ta
}

// startDataCollection starts periodic data collection
func (ta *TrafficAnalytics) startDataCollection() {
	// Collect initial data
	ta.collectData()
	
	// Set up tickers for different time periods
	minuteTicker := time.NewTicker(time.Minute)
	hourTicker := time.NewTicker(time.Hour)
	dayTicker := time.NewTicker(24 * time.Hour)
	
	for {
		select {
		case <-minuteTicker.C:
			ta.collectData()
		case <-hourTicker.C:
			ta.aggregateHourlyData()
		case <-dayTicker.C:
			ta.aggregateDailyData()
		}
	}
}

// collectData collects the current traffic data
func (ta *TrafficAnalytics) collectData() {
	// Get traffic data from proxy
	data := ta.proxy.GetTrafficData()
	
	// If no data, return
	if len(data) == 0 {
		return
	}
	
	// Get latest data point
	latestData := data[len(data)-1]
	
	ta.mu.Lock()
	defer ta.mu.Unlock()
	
	// Update hourly data
	ta.hourlyData = append(ta.hourlyData, latestData)
	if len(ta.hourlyData) > 60 {
		ta.hourlyData = ta.hourlyData[len(ta.hourlyData)-60:]
	}
	
	// Update path distribution (mocked for demo)
	ta.updateMockData()
}

// aggregateHourlyData aggregates hourly data into daily data
func (ta *TrafficAnalytics) aggregateHourlyData() {
	ta.mu.Lock()
	defer ta.mu.Unlock()
	
	if len(ta.hourlyData) == 0 {
		return
	}
	
	// Calculate average for the hour
	var totalRequests, totalErrors, totalLatency, count int
	for _, data := range ta.hourlyData {
		totalRequests += data.Requests
		totalErrors += data.Errors
		totalLatency += data.Latency
		count++
	}
	
	avgRequests := totalRequests / count
	avgErrors := totalErrors / count
	avgLatency := totalLatency / count
	
	// Create new data point for the hour
	hourData := TrafficData{
		Timestamp: time.Now().Format(time.RFC3339),
		Requests:  avgRequests,
		Errors:    avgErrors,
		Latency:   avgLatency,
	}
	
	// Add to daily data
	ta.dailyData = append(ta.dailyData, hourData)
	if len(ta.dailyData) > 24 {
		ta.dailyData = ta.dailyData[len(ta.dailyData)-24:]
	}
}

// aggregateDailyData aggregates daily data into weekly data
func (ta *TrafficAnalytics) aggregateDailyData() {
	ta.mu.Lock()
	defer ta.mu.Unlock()
	
	if len(ta.dailyData) == 0 {
		return
	}
	
	// Calculate average for the day
	var totalRequests, totalErrors, totalLatency, count int
	for _, data := range ta.dailyData {
		totalRequests += data.Requests
		totalErrors += data.Errors
		totalLatency += data.Latency
		count++
	}
	
	avgRequests := totalRequests / count
	avgErrors := totalErrors / count
	avgLatency := totalLatency / count
	
	// Create new data point for the day
	dayData := TrafficData{
		Timestamp: time.Now().Format(time.RFC3339),
		Requests:  avgRequests,
		Errors:    avgErrors,
		Latency:   avgLatency,
	}
	
	// Add to weekly data
	ta.weeklyData = append(ta.weeklyData, dayData)
	if len(ta.weeklyData) > 7 {
		ta.weeklyData = ta.weeklyData[len(ta.weeklyData)-7:]
	}
}

// GetTrafficData returns traffic data for the specified time range
func (ta *TrafficAnalytics) GetTrafficData(timeRange string) []TrafficData {
	ta.mu.RLock()
	defer ta.mu.RUnlock()
	
	switch timeRange {
	case "hourly":
		return ta.hourlyData
	case "daily":
		return ta.dailyData
	case "weekly":
		return ta.weeklyData
	default:
		return ta.hourlyData
	}
}

// GetPathDistribution returns the path distribution data
func (ta *TrafficAnalytics) GetPathDistribution() []PathDistributionItem {
	ta.mu.RLock()
	defer ta.mu.RUnlock()
	
	result := make([]PathDistributionItem, 0, len(ta.pathDistribution))
	for path, count := range ta.pathDistribution {
		result = append(result, PathDistributionItem{
			Path:  path,
			Count: count,
		})
	}
	
	return result
}

// GetErrorTypes returns the error types data
func (ta *TrafficAnalytics) GetErrorTypes() []ErrorTypeItem {
	ta.mu.RLock()
	defer ta.mu.RUnlock()
	
	result := make([]ErrorTypeItem, 0, len(ta.errorTypes))
	for errType, count := range ta.errorTypes {
		result = append(result, ErrorTypeItem{
			Type:  errType,
			Count: count,
		})
	}
	
	return result
}

// GetLatencyDistribution returns the latency distribution data
func (ta *TrafficAnalytics) GetLatencyDistribution() []LatencyDistributionItem {
	ta.mu.RLock()
	defer ta.mu.RUnlock()
	
	result := make([]LatencyDistributionItem, 0, len(ta.latencyDistribution))
	for latencyRange, count := range ta.latencyDistribution {
		result = append(result, LatencyDistributionItem{
			Range: latencyRange,
			Count: count,
		})
	}
	
	return result
}

// SaveAnalyticsData saves the analytics data to JSON
func (ta *TrafficAnalytics) SaveAnalyticsData() ([]byte, error) {
	ta.mu.RLock()
	defer ta.mu.RUnlock()
	
	data := struct {
		HourlyData        []TrafficData             `json:"hourlyData"`
		DailyData         []TrafficData             `json:"dailyData"`
		WeeklyData        []TrafficData             `json:"weeklyData"`
		PathDistribution  map[string]int            `json:"pathDistribution"`
		ErrorTypes        map[string]int            `json:"errorTypes"`
		LatencyDistribution map[string]int          `json:"latencyDistribution"`
	}{
		HourlyData:        ta.hourlyData,
		DailyData:         ta.dailyData,
		WeeklyData:        ta.weeklyData,
		PathDistribution:  ta.pathDistribution,
		ErrorTypes:        ta.errorTypes,
		LatencyDistribution: ta.latencyDistribution,
	}
	
	return json.Marshal(data)
}

// LoadAnalyticsData loads analytics data from JSON
func (ta *TrafficAnalytics) LoadAnalyticsData(data []byte) error {
	var analyticsData struct {
		HourlyData        []TrafficData             `json:"hourlyData"`
		DailyData         []TrafficData             `json:"dailyData"`
		WeeklyData        []TrafficData             `json:"weeklyData"`
		PathDistribution  map[string]int            `json:"pathDistribution"`
		ErrorTypes        map[string]int            `json:"errorTypes"`
		LatencyDistribution map[string]int          `json:"latencyDistribution"`
	}
	
	if err := json.Unmarshal(data, &analyticsData); err != nil {
		return err
	}
	
	ta.mu.Lock()
	defer ta.mu.Unlock()
	
	ta.hourlyData = analyticsData.HourlyData
	ta.dailyData = analyticsData.DailyData
	ta.weeklyData = analyticsData.WeeklyData
	ta.pathDistribution = analyticsData.PathDistribution
	ta.errorTypes = analyticsData.ErrorTypes
	ta.latencyDistribution = analyticsData.LatencyDistribution
	
	return nil
}

// updateMockData updates the mock analytics data for demonstration
func (ta *TrafficAnalytics) updateMockData() {
	// Predefined paths and counts
	paths := map[string]int{
		"/api/users":    rand.Intn(20) + 40,
		"/api/products": rand.Intn(15) + 25,
		"/api/orders":   rand.Intn(10) + 15, 
		"/api/payments": rand.Intn(5) + 5,
		"/api/other":    rand.Intn(5) + 5,
	}
	
	// Predefined error types and counts
	errorTypes := map[string]int{
		"Rate Limit Exceeded": rand.Intn(30) + 140,
		"Service Unavailable": rand.Intn(20) + 90,
		"Timeout":             rand.Intn(15) + 80,
		"Bad Gateway":         rand.Intn(10) + 60,
		"Authentication Failed": rand.Intn(5) + 40,
	}
	
	// Predefined latency ranges and counts
	latencyRanges := map[string]int{
		"0-50ms":    rand.Intn(100) + 1200,
		"51-100ms":  rand.Intn(80) + 950,
		"101-200ms": rand.Intn(60) + 700,
		"201-500ms": rand.Intn(40) + 500,
		"501-1000ms": rand.Intn(30) + 300,
		">1000ms":   rand.Intn(20) + 200,
	}
	
	// Update the maps
	ta.pathDistribution = paths
	ta.errorTypes = errorTypes
	ta.latencyDistribution = latencyRanges
}