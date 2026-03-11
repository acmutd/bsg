package utils

import (
	"context"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

// EchoRateLimitMiddleware creates a rate limiting middleware for Echo
type EchoRateLimitMiddleware struct {
	rateLimiter *RateLimiter
}

// NewEchoRateLimitMiddleware creates a new Echo rate limit middleware
func NewEchoRateLimitMiddleware(limiter *RateLimiter) *EchoRateLimitMiddleware {
	return &EchoRateLimitMiddleware{rateLimiter: limiter}
}

// Handler returns an Echo middleware handler
func (m *EchoRateLimitMiddleware) Handler() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			ip := c.RealIP()
			ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
			defer cancel()

			allowed, err := m.rateLimiter.AllowByIP(ctx, ip)
			if err != nil {
				return echo.NewHTTPError(http.StatusInternalServerError, "Rate limit check failed")
			}

			if !allowed {
				return echo.NewHTTPError(http.StatusTooManyRequests, "Rate limit exceeded")
			}

			return next(c)
		}
	}
}

// EchoLoggingMiddleware creates a structured logging middleware for Echo
type EchoLoggingMiddleware struct {
	logger *StructuredLogger
}

// NewEchoLoggingMiddleware creates a new Echo logging middleware
func NewEchoLoggingMiddleware(logger *StructuredLogger) *EchoLoggingMiddleware {
	return &EchoLoggingMiddleware{logger: logger}
}

// Handler returns an Echo middleware handler
func (m *EchoLoggingMiddleware) Handler() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			reqLog := m.logger.NewRequestLog(c.Request().Method, c.Request().URL.Path)

			// Extract user ID if available
			if userID, ok := c.Get("userAuthID").(string); ok {
				reqLog.UserID = userID
			}

			err := next(c)

			statusCode := c.Response().Status
			if err != nil {
				if echoErr, ok := err.(*echo.HTTPError); ok {
					statusCode = echoErr.Code
				}
			}

			reqLog.Complete(statusCode, err)
			return err
		}
	}
}
