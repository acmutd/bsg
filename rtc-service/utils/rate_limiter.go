package utils

import (
	"fmt"
	"sync"
	"time"
)

// WebSocketRateLimiter provides rate limiting for WebSocket connections
type WebSocketRateLimiter struct {
	requestsPerSecond int
	burstSize         int
	tokens            float64
	lastRefillTime    time.Time
	mu                sync.Mutex
}

// NewWebSocketRateLimiter creates a new WebSocket rate limiter
func NewWebSocketRateLimiter(requestsPerSecond, burstSize int) *WebSocketRateLimiter {
	return &WebSocketRateLimiter{
		requestsPerSecond: requestsPerSecond,
		burstSize:         burstSize,
		tokens:            float64(burstSize),
		lastRefillTime:    time.Now(),
	}
}

// Allow checks if a request is allowed
func (wrl *WebSocketRateLimiter) Allow() bool {
	wrl.mu.Lock()
	defer wrl.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(wrl.lastRefillTime).Seconds()

	// Refill tokens based on elapsed time (float precision prevents the "never-refill" bug)
	tokensToAdd := elapsed * float64(wrl.requestsPerSecond)
	wrl.tokens += tokensToAdd

	// Cap tokens at burst size
	if wrl.tokens > float64(wrl.burstSize) {
		wrl.tokens = float64(wrl.burstSize)
	}

	wrl.lastRefillTime = now

	// Check if we have at least one token
	if wrl.tokens >= 1 {
		wrl.tokens--
		return true
	}

	return false
}

// GetRemainingTokens returns the number of remaining tokens (rounded down)
func (wrl *WebSocketRateLimiter) GetRemainingTokens() int {
	wrl.mu.Lock()
	defer wrl.mu.Unlock()
	return int(wrl.tokens)
}

// ConnectionLimiter manages rate limits per connection
type ConnectionLimiter struct {
	limiter      *WebSocketRateLimiter
	lastActivity time.Time
	mu           sync.Mutex
}

// NewConnectionLimiter creates a new connection limiter
func NewConnectionLimiter(messagesPerSecond, burstSize int) *ConnectionLimiter {
	return &ConnectionLimiter{
		limiter:      NewWebSocketRateLimiter(messagesPerSecond, burstSize),
		lastActivity: time.Now(),
	}
}

// Allow checks if a message is allowed
func (cl *ConnectionLimiter) Allow() bool {
	cl.mu.Lock()
	cl.lastActivity = time.Now()
	cl.mu.Unlock()

	return cl.limiter.Allow()
}

// GetLastActivity returns the last time activity occurred
func (cl *ConnectionLimiter) GetLastActivity() time.Time {
	cl.mu.Lock()
	defer cl.mu.Unlock()
	return cl.lastActivity
}

// GetIdleDuration returns how long the connection has been idle
func (cl *ConnectionLimiter) GetIdleDuration() time.Duration {
	cl.mu.Lock()
	defer cl.mu.Unlock()
	return time.Since(cl.lastActivity)
}

// ConnectionPool manages rate limiters for multiple connections
type ConnectionPool struct {
	limiters        map[string]*ConnectionLimiter
	maxIdleDuration time.Duration
	messagesPerSec  int
	burstSize       int
	mu              sync.RWMutex
	cleanupTicker   *time.Ticker
	stopCleanup     chan struct{}
}

// NewConnectionPool creates a new connection pool
func NewConnectionPool(messagesPerSecond, burstSize int, maxIdleDuration time.Duration) *ConnectionPool {
	cp := &ConnectionPool{
		limiters:        make(map[string]*ConnectionLimiter),
		maxIdleDuration: maxIdleDuration,
		messagesPerSec:  messagesPerSecond,
		burstSize:       burstSize,
		cleanupTicker:   time.NewTicker(30 * time.Second),
		stopCleanup:     make(chan struct{}),
	}

	// Start cleanup goroutine
	go cp.cleanupIdleConnections()

	return cp
}

// GetOrCreateLimiter gets an existing limiter or creates a new one
func (cp *ConnectionPool) GetOrCreateLimiter(connectionID string) *ConnectionLimiter {
	cp.mu.Lock()
	defer cp.mu.Unlock()

	if limiter, exists := cp.limiters[connectionID]; exists {
		return limiter
	}

	limiter := NewConnectionLimiter(cp.messagesPerSec, cp.burstSize)
	cp.limiters[connectionID] = limiter
	return limiter
}

// RemoveLimiter removes a limiter for a connection
func (cp *ConnectionPool) RemoveLimiter(connectionID string) {
	cp.mu.Lock()
	defer cp.mu.Unlock()
	delete(cp.limiters, connectionID)
}

// cleanupIdleConnections removes limiters for idle connections
func (cp *ConnectionPool) cleanupIdleConnections() {
	for {
		select {
		case <-cp.cleanupTicker.C:
			cp.mu.Lock()
			now := time.Now()
			for id, limiter := range cp.limiters {
				if now.Sub(limiter.GetLastActivity()) > cp.maxIdleDuration {
					delete(cp.limiters, id)
				}
			}
			cp.mu.Unlock()
		case <-cp.stopCleanup:
			cp.cleanupTicker.Stop()
			return
		}
	}
}

// Stop stops the connection pool cleanup
func (cp *ConnectionPool) Stop() {
	close(cp.stopCleanup)
}

// GetPoolStats returns statistics about the connection pool
func (cp *ConnectionPool) GetPoolStats() map[string]interface{} {
	cp.mu.RLock()
	defer cp.mu.RUnlock()

	return map[string]interface{}{
		"total_connections": len(cp.limiters),
		"idle_timeout":      cp.maxIdleDuration.String(),
		"messages_per_sec":  cp.messagesPerSec,
		"burst_size":        cp.burstSize,
	}
}

// InputValidator provides validation for WebSocket message inputs
type InputValidator struct{}

// ValidateJSON validates that input is valid JSON and not too large
func (iv *InputValidator) ValidateJSON(data []byte, maxSize int) error {
	if len(data) > maxSize {
		return fmt.Errorf("message exceeds maximum size of %d bytes", maxSize)
	}

	if len(data) == 0 {
		return fmt.Errorf("empty message")
	}

	return nil
}

// ValidateRequired validates that a field is not empty
func (iv *InputValidator) ValidateRequired(value string, fieldName string) error {
	if value == "" {
		return fmt.Errorf("%s is required", fieldName)
	}
	return nil
}

// ValidateMaxLength validates that a string doesn't exceed max length
func (iv *InputValidator) ValidateMaxLength(value string, maxLength int, fieldName string) error {
	if len(value) > maxLength {
		return fmt.Errorf("%s exceeds maximum length of %d characters", fieldName, maxLength)
	}
	return nil
}

// ValidateUUID validates that a string is a valid UUID
func (iv *InputValidator) ValidateUUID(value string, fieldName string) error {
	if value == "" {
		return nil // Optional validation
	}
	// Basic UUID pattern check (UUID v4)
	if len(value) != 36 {
		return fmt.Errorf("%s is not a valid UUID", fieldName)
	}
	return nil
}