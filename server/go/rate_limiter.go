package main

import (
	"sync"
	"time"
)

// RateLimiter implements a token bucket rate limiter
type RateLimiter struct {
	config      *Config
	buckets     map[string]*TokenBucket
	bucketMutex sync.RWMutex
}

// TokenBucket represents a token bucket for rate limiting
type TokenBucket struct {
	tokens        float64
	capacity      float64
	refillRate    float64 // tokens per second
	lastRefillTime time.Time
	mutex         sync.Mutex
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(config *Config) *RateLimiter {
	return &RateLimiter{
		config:  config,
		buckets: make(map[string]*TokenBucket),
	}
}

// Allow checks if a request for the given path is allowed by the rate limiter
func (rl *RateLimiter) Allow(path string, rateLimit int) bool {
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
	return bucket.TakeToken()
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
		tokens:        capacity,
		capacity:      capacity,
		refillRate:    capacity / 60.0, // Refill the bucket over 1 minute
		lastRefillTime: time.Now(),
	}
	
	rl.buckets[path] = bucket
	return bucket
}

// TakeToken attempts to take a token from the bucket
func (tb *TokenBucket) TakeToken() bool {
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