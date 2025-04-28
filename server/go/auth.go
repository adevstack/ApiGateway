package main

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"
)

// Credential represents an API key credential
type Credential struct {
	ID         int       `json:"id"`
	RouteID    int       `json:"routeId"`
	Name       string    `json:"name"`
	APIKey     string    `json:"apiKey"`
	APISecret  string    `json:"apiSecret,omitempty"` // Not returned in responses
	Created    time.Time `json:"created"`
	LastUsed   time.Time `json:"lastUsed,omitempty"`
	Enabled    bool      `json:"enabled"`
}

// Auth handles authentication and authorization
type Auth struct {
	credentials map[string]Credential // Map of API key -> Credential
	routeAuth   map[int][]string      // Map of route ID -> list of API keys
	mu          sync.RWMutex
	config      *Config
}

// NewAuth creates a new authentication handler
func NewAuth(config *Config) *Auth {
	return &Auth{
		credentials: make(map[string]Credential),
		routeAuth:   make(map[int][]string),
		config:      config,
	}
}

// AddCredential adds a new credential
func (a *Auth) AddCredential(cred Credential) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	// Check if credential already exists
	if _, exists := a.credentials[cred.APIKey]; exists {
		return fmt.Errorf("credential with API key already exists")
	}

	// Set created time if not provided
	if cred.Created.IsZero() {
		cred.Created = time.Now()
	}

	// Add credential
	a.credentials[cred.APIKey] = cred

	// Add to route credentials
	keys := a.routeAuth[cred.RouteID]
	a.routeAuth[cred.RouteID] = append(keys, cred.APIKey)

	return nil
}

// DeleteCredential removes a credential by ID
func (a *Auth) DeleteCredential(id int) bool {
	a.mu.Lock()
	defer a.mu.Unlock()

	// Find credential by ID
	var apiKey string
	var routeID int
	for k, cred := range a.credentials {
		if cred.ID == id {
			apiKey = k
			routeID = cred.RouteID
			break
		}
	}

	// If credential not found, return false
	if apiKey == "" {
		return false
	}

	// Remove credential
	delete(a.credentials, apiKey)

	// Remove from route credentials
	keys := a.routeAuth[routeID]
	for i, k := range keys {
		if k == apiKey {
			a.routeAuth[routeID] = append(keys[:i], keys[i+1:]...)
			break
		}
	}

	return true
}

// GetCredentials returns all credentials (with secrets redacted)
func (a *Auth) GetCredentials() []Credential {
	a.mu.RLock()
	defer a.mu.RUnlock()

	creds := make([]Credential, 0, len(a.credentials))
	for _, cred := range a.credentials {
		// Redact secret
		credCopy := cred
		credCopy.APISecret = ""
		creds = append(creds, credCopy)
	}

	return creds
}

// GetCredentialsByRoute returns credentials for a specific route
func (a *Auth) GetCredentialsByRoute(routeID int) []Credential {
	a.mu.RLock()
	defer a.mu.RUnlock()

	keys := a.routeAuth[routeID]
	creds := make([]Credential, 0, len(keys))
	for _, key := range keys {
		if cred, exists := a.credentials[key]; exists {
			// Redact secret
			credCopy := cred
			credCopy.APISecret = ""
			creds = append(creds, credCopy)
		}
	}

	return creds
}

// Authenticate checks if a request is authenticated
func (a *Auth) Authenticate(r *http.Request, routeID int) bool {
	a.mu.RLock()
	defer a.mu.RUnlock()

	// Get authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return false
	}

	// Parse authorization header
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || strings.ToLower(parts[0]) != "basic" {
		return false
	}

	// Decode base64 credential
	decoded, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return false
	}

	// Parse key:secret
	creds := strings.SplitN(string(decoded), ":", 2)
	if len(creds) != 2 {
		return false
	}

	apiKey, apiSecret := creds[0], creds[1]

	// Find credential
	cred, exists := a.credentials[apiKey]
	if !exists || !cred.Enabled {
		return false
	}

	// Check if credential is for this route
	validForRoute := false
	for _, key := range a.routeAuth[routeID] {
		if key == apiKey {
			validForRoute = true
			break
		}
	}

	if !validForRoute {
		return false
	}

	// Verify secret
	secretHash := hashSecret(apiSecret)
	if secretHash != cred.APISecret {
		return false
	}

	// Update last used time
	credCopy := cred
	credCopy.LastUsed = time.Now()
	a.credentials[apiKey] = credCopy

	return true
}

// GenerateAPIKey generates a new API key
func GenerateAPIKey() string {
	// In a real implementation, this would use a secure random generator
	return fmt.Sprintf("apk_%d", time.Now().UnixNano())
}

// GenerateAPISecret generates a new API secret
func GenerateAPISecret() string {
	// In a real implementation, this would use a secure random generator
	return fmt.Sprintf("aps_%d", time.Now().UnixNano())
}

// hashSecret hashes an API secret for storage
func hashSecret(secret string) string {
	hash := sha256.Sum256([]byte(secret))
	return fmt.Sprintf("%x", hash)
}

// LoadCredentials loads credentials from JSON
func (a *Auth) LoadCredentials(data []byte) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	var creds []Credential
	if err := json.Unmarshal(data, &creds); err != nil {
		return err
	}

	// Clear existing credentials
	a.credentials = make(map[string]Credential)
	a.routeAuth = make(map[int][]string)

	// Add credentials
	for _, cred := range creds {
		a.credentials[cred.APIKey] = cred

		// Add to route credentials
		keys := a.routeAuth[cred.RouteID]
		a.routeAuth[cred.RouteID] = append(keys, cred.APIKey)
	}

	return nil
}

// SaveCredentials saves credentials to JSON
func (a *Auth) SaveCredentials() ([]byte, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	creds := make([]Credential, 0, len(a.credentials))
	for _, cred := range a.credentials {
		creds = append(creds, cred)
	}

	return json.Marshal(creds)
}