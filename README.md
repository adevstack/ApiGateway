# API Gateway with Go and React Dashboard

A lightweight API Gateway/Proxy Service built with Go, featuring a React Dashboard for configuration and monitoring.

## Overview

This project demonstrates concurrent programming, networking, and web development skills by implementing a reverse proxy server that can route requests to multiple backend services. The React dashboard provides real-time statistics, configuration management, and service health monitoring.

## Features

### API Gateway (Go)
- Reverse proxy for routing requests to backend services
- Concurrent request handling using goroutines and channels
- Rate limiting with token bucket algorithm
- Basic authentication and authorization
- Request/response logging
- Load balancing
- Request timeout handling

### Dashboard (React)
- Real-time proxy statistics display
- Route configuration management
- Traffic analytics and visualization
- Service health monitoring
- Dark/light theme support
- Responsive design

## Project Structure

```
├── client/               # React frontend
│   ├── components/       # UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and types
│   ├── pages/            # Page components
│   └── ...
├── server/               # Backend server
│   ├── go/               # Go-based API Gateway
│   │   ├── main.go       # Entry point
│   │   ├── proxy.go      # Proxy implementation
│   │   ├── rate_limiter.go # Rate limiting logic
│   │   ├── auth.go       # Authentication
│   │   └── config.go     # Configuration handling
│   └── ...
└── shared/               # Shared types and schemas
```

## Running the Project

### Prerequisites
- Node.js v20+ and npm
- Go 1.20+

### Setup and Installation
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser to the URL shown in the console (typically http://localhost:5000)

### Development

The project uses Vite for frontend development and Go for the backend proxy service. The development server will automatically restart when changes are detected.

## API Gateway Configuration

Routes can be configured through the dashboard interface or directly via the API:

- **Path**: The URL path to match (e.g., /api/users)
- **Target**: The backend service URL to forward requests to
- **Methods**: Allowed HTTP methods (GET, POST, PUT, DELETE, etc.)
- **Rate Limit**: Request limits per time period
- **Timeout**: Maximum time to wait for backend response
- **Authentication**: Whether authentication is required

## Goroutines and Channels

The API Gateway leverages Go's concurrency model:

- Each incoming request is handled in a separate goroutine
- Rate limiting uses channels to control concurrency
- Request cancellation is implemented with context and channels
- Load balancing distributes requests across multiple backend instances

## Best Practices

This implementation follows Go best practices:
- Proper error handling with appropriate logging
- Context-based timeout and cancellation
- Clean separation of concerns (proxy, rate limiting, auth)
- Efficient memory usage with pooled buffers
- Comprehensive tests for core functionality

## Contact

For questions or issues, please contact: afrozaman123@gmail.com
