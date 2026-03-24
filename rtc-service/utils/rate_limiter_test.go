package utils

import (
	"testing"
	"time"
)

// TestWebSocketRateLimiter tests basic rate limiting
func TestWebSocketRateLimiter(t *testing.T) {
	limiter := NewWebSocketRateLimiter(10, 20)

	// Should allow initial burst
	for i := 0; i < 20; i++ {
		if !limiter.Allow() {
			t.Errorf("Allow() failed on iteration %d, expected true", i)
		}
	}

	// Should deny after burst exhausted
	if limiter.Allow() {
		t.Error("Allow() should return false when tokens exhausted")
	}
}

// TestRateLimiterRefill tests token refill over time
func TestRateLimiterRefill(t *testing.T) {
	limiter := NewWebSocketRateLimiter(1, 5)

	// Exhaust tokens
	for i := 0; i < 5; i++ {
		if !limiter.Allow() {
			t.Errorf("Allow() failed on iteration %d", i)
		}
	}

	// Wait for refill
	time.Sleep(1100 * time.Millisecond)

	// Should allow again
	if !limiter.Allow() {
		t.Error("Allow() should succeed after refill")
	}
}

// TestConnectionLimiter tests connection-specific rate limiting
func TestConnectionLimiter(t *testing.T) {
	limiter := NewConnectionLimiter(10, 20)

	// Should allow messages
	allowed := limiter.Allow()
	if !allowed {
		t.Error("Allow() should return true initially")
	}

	// Check idle duration
	lastActivity := limiter.GetLastActivity()
	if lastActivity.IsZero() {
		t.Error("GetLastActivity() should not return zero time")
	}

	idleDuration := limiter.GetIdleDuration()
	if idleDuration < 0 {
		t.Error("GetIdleDuration() should return positive duration")
	}
}

// TestConnectionPoolCreation tests pool creation
func TestConnectionPoolCreation(t *testing.T) {
	pool := NewConnectionPool(10, 20, 5*time.Minute)
	defer pool.Stop()

	if pool == nil {
		t.Error("NewConnectionPool() returned nil")
	}

	// Test getting limiter
	limiter1 := pool.GetOrCreateLimiter("conn-1")
	if limiter1 == nil {
		t.Error("GetOrCreateLimiter() returned nil")
	}

	// Test getting same limiter
	limiter2 := pool.GetOrCreateLimiter("conn-1")
	if limiter1 != limiter2 {
		t.Error("GetOrCreateLimiter() should return same limiter for same ID")
	}
}

// TestConnectionPoolRemove tests removing limiters
func TestConnectionPoolRemove(t *testing.T) {
	pool := NewConnectionPool(10, 20, 5*time.Minute)
	defer pool.Stop()

	pool.GetOrCreateLimiter("conn-1")
	pool.RemoveLimiter("conn-1")

	// After removal, should create new limiter
	limiter1 := pool.GetOrCreateLimiter("conn-1")
	limiter2 := pool.GetOrCreateLimiter("conn-1")

	if limiter1 != limiter2 {
		t.Error("RemoveLimiter() should properly clean up")
	}
}

// TestConnectionPoolStats tests stats retrieval
func TestConnectionPoolStats(t *testing.T) {
	pool := NewConnectionPool(10, 20, 5*time.Minute)
	defer pool.Stop()

	pool.GetOrCreateLimiter("conn-1")
	pool.GetOrCreateLimiter("conn-2")

	stats := pool.GetPoolStats()
	if stats["total_connections"] != 2 {
		t.Errorf("GetPoolStats() total_connections = %v, want 2", stats["total_connections"])
	}
}

// TestInputValidator tests JSON validation
func TestInputValidatorJSON(t *testing.T) {
	validator := &InputValidator{}

	// Test valid JSON
	err := validator.ValidateJSON([]byte("{\"test\": \"data\"}"), 1000)
	if err != nil {
		t.Errorf("ValidateJSON() failed on valid JSON: %v", err)
	}

	// Test empty JSON
	err = validator.ValidateJSON([]byte(""), 1000)
	if err == nil {
		t.Error("ValidateJSON() should reject empty message")
	}

	// Test oversized JSON
	largeData := make([]byte, 2000)
	err = validator.ValidateJSON(largeData, 1000)
	if err == nil {
		t.Error("ValidateJSON() should reject oversized message")
	}
}

// TestInputValidatorRequired tests required field validation
func TestInputValidatorRequired(t *testing.T) {
	validator := &InputValidator{}

	// Test valid required field
	err := validator.ValidateRequired("test-value", "fieldName")
	if err != nil {
		t.Errorf("ValidateRequired() failed: %v", err)
	}

	// Test empty required field
	err = validator.ValidateRequired("", "fieldName")
	if err == nil {
		t.Error("ValidateRequired() should reject empty field")
	}
}

// TestInputValidatorMaxLength tests max length validation
func TestInputValidatorMaxLength(t *testing.T) {
	validator := &InputValidator{}

	// Test within limits
	err := validator.ValidateMaxLength("test", 10, "fieldName")
	if err != nil {
		t.Errorf("ValidateMaxLength() failed: %v", err)
	}

	// Test exceeding limits
	err = validator.ValidateMaxLength("toolongstring", 5, "fieldName")
	if err == nil {
		t.Error("ValidateMaxLength() should reject oversized field")
	}
}

// TestInputValidatorUUID tests UUID validation
func TestInputValidatorUUID(t *testing.T) {
	validator := &InputValidator{}

	// Test valid UUID
	validUUID := "550e8400-e29b-41d4-a716-446655440000"
	err := validator.ValidateUUID(validUUID, "uuid")
	if err != nil {
		t.Errorf("ValidateUUID() failed on valid UUID: %v", err)
	}

	// Test empty UUID (optional)
	err = validator.ValidateUUID("", "uuid")
	if err != nil {
		t.Errorf("ValidateUUID() should accept empty UUID: %v", err)
	}

	// Test invalid UUID
	err = validator.ValidateUUID("not-a-uuid", "uuid")
	if err == nil {
		t.Error("ValidateUUID() should reject invalid UUID")
	}
}
