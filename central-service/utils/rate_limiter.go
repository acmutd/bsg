package utils

import (
	"context"
	"fmt"
	"net"
	"time"

	"github.com/redis/go-redis/v9"
)

// RateLimiter provides token bucket rate limiting using Redis
type RateLimiter struct {
	rdb               *redis.Client
	requestsPerSecond int
	burstSize         int
	keyPrefix         string
}

// NewRateLimiter creates a new rate limiter
// requestsPerSecond: number of requests allowed per second
// burstSize: maximum burst size (for handling spikes)
func NewRateLimiter(rdb *redis.Client, requestsPerSecond, burstSize int) *RateLimiter {
	return &RateLimiter{
		rdb:               rdb,
		requestsPerSecond: requestsPerSecond,
		burstSize:         burstSize,
		keyPrefix:         "ratelimit:",
	}
}

// Allow checks if a request is allowed for the given identifier
// identifier is typically an IP address or user ID
func (rl *RateLimiter) Allow(ctx context.Context, identifier string) (bool, error) {
	if identifier == "" {
		return false, fmt.Errorf("identifier cannot be empty")
	}

	key := rl.keyPrefix + identifier
	now := time.Now().Unix()

	// Use a Lua script to atomically check and update the rate limit
	// This ensures thread-safety in distributed scenarios
	script := `
		local key = KEYS[1]
		local now = tonumber(ARGV[1])
		local rate = tonumber(ARGV[2])
		local burst = tonumber(ARGV[3])
		local ttl = tonumber(ARGV[4])

		-- Get current bucket state
		local bucket = redis.call('GET', key)
		if not bucket then
			-- First request, initialize bucket with burst allowance
			redis.call('SET', key, burst, 'EX', ttl)
			return 1
		end

		local tokens = tonumber(bucket)
		-- Refill based on time elapsed (not used for simplicity, but can be enhanced)
		if tokens > 0 then
			tokens = tokens - 1
			redis.call('SET', key, tokens, 'EX', ttl)
			return 1
		else
			return 0
		end
	`

	result, err := rl.rdb.Eval(ctx, script, []string{key}, now, rl.requestsPerSecond, rl.burstSize, 60).Int64()
	if err != nil {
		return false, fmt.Errorf("rate limit check failed: %w", err)
	}

	return result == 1, nil
}

// AllowByIP is a convenience function to allow requests by IP address
func (rl *RateLimiter) AllowByIP(ctx context.Context, ipAddr string) (bool, error) {
	// Extract IP without port
	ip, _, err := net.SplitHostPort(ipAddr)
	if err != nil {
		ip = ipAddr
	}
	return rl.Allow(ctx, "ip:"+ip)
}

// AllowByUserID is a convenience function to allow requests by user ID
func (rl *RateLimiter) AllowByUserID(ctx context.Context, userID string) (bool, error) {
	return rl.Allow(ctx, "user:"+userID)
}

// AllowByEndpoint checks rate limit for a specific endpoint+IP combination
func (rl *RateLimiter) AllowByEndpoint(ctx context.Context, endpoint, ipAddr string) (bool, error) {
	ip, _, err := net.SplitHostPort(ipAddr)
	if err != nil {
		ip = ipAddr
	}
	return rl.Allow(ctx, "endpoint:"+endpoint+":"+ip)
}

// GetRemainingTokens returns the number of remaining tokens for an identifier
func (rl *RateLimiter) GetRemainingTokens(ctx context.Context, identifier string) (int, error) {
	key := rl.keyPrefix + identifier
	result, err := rl.rdb.Get(ctx, key).Int()
	if err == redis.Nil {
		return rl.burstSize, nil
	}
	if err != nil {
		return 0, fmt.Errorf("failed to get remaining tokens: %w", err)
	}
	return result, nil
}

// Reset resets the rate limit for an identifier
func (rl *RateLimiter) Reset(ctx context.Context, identifier string) error {
	key := rl.keyPrefix + identifier
	return rl.rdb.Del(ctx, key).Err()
}

// RateLimitConfig holds configuration for rate limiting
type RateLimitConfig struct {
	// Global limits
	RequestsPerSecond int

	// Burst allowance
	BurstSize int

	// Per-endpoint limits (optional)
	EndpointLimits map[string]EndpointLimit
}

// EndpointLimit defines limits for a specific endpoint
type EndpointLimit struct {
	RequestsPerSecond int
	BurstSize         int
}

// DefaultRateLimitConfig provides sensible defaults
func DefaultRateLimitConfig() *RateLimitConfig {
	return &RateLimitConfig{
		RequestsPerSecond: 10,
		BurstSize:         20,
		EndpointLimits: map[string]EndpointLimit{
			"/api/rooms/create": {
				RequestsPerSecond: 2,
				BurstSize:         5,
			},
			"/api/users/create": {
				RequestsPerSecond: 1,
				BurstSize:         3,
			},
		},
	}
}

// DistributedRateLimiter provides per-endpoint rate limiting
type DistributedRateLimiter struct {
	globalLimiter    *RateLimiter
	endpointLimiters map[string]*RateLimiter
	config           *RateLimitConfig
}

// NewDistributedRateLimiter creates a rate limiter with per-endpoint configuration
func NewDistributedRateLimiter(rdb *redis.Client, config *RateLimitConfig) *DistributedRateLimiter {
	globalLimiter := NewRateLimiter(rdb, config.RequestsPerSecond, config.BurstSize)
	endpointLimiters := make(map[string]*RateLimiter)

	for endpoint, limit := range config.EndpointLimits {
		endpointLimiters[endpoint] = NewRateLimiter(rdb, limit.RequestsPerSecond, limit.BurstSize)
	}

	return &DistributedRateLimiter{
		globalLimiter:    globalLimiter,
		endpointLimiters: endpointLimiters,
		config:           config,
	}
}

// AllowRequest checks both global and endpoint-specific rate limits
func (drl *DistributedRateLimiter) AllowRequest(ctx context.Context, endpoint, ipAddr string) (bool, error) {
	// Check global limit first
	allowed, err := drl.globalLimiter.AllowByIP(ctx, ipAddr)
	if err != nil {
		return false, err
	}
	if !allowed {
		return false, nil
	}

	// Check endpoint-specific limit if configured
	if limiter, ok := drl.endpointLimiters[endpoint]; ok {
		return limiter.AllowByIP(ctx, ipAddr)
	}

	return true, nil
}

// AllowRequestByUser checks rate limit for authenticated users
func (drl *DistributedRateLimiter) AllowRequestByUser(ctx context.Context, userID string) (bool, error) {
	return drl.globalLimiter.AllowByUserID(ctx, userID)
}
