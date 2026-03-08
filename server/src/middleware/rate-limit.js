const express = require('express');
const Redis = require('redis');

/**
 * Rate limiting middleware for Express using Redis token bucket algorithm
 */
class RateLimiter {
  constructor(redisClient, options = {}) {
    this.redisClient = redisClient;
    this.requestsPerSecond = options.requestsPerSecond || 10;
    this.burstSize = options.burstSize || 20;
    this.keyPrefix = options.keyPrefix || 'ratelimit:';
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
  }

  /**
   * Extracts IP address from request
   */
  getIdentifier(req, useUser = false) {
    if (useUser && req.user) {
      return `user:${req.user.id}`;
    }
    return `ip:${req.ip}`;
  }

  /**
   * Check if request is allowed (main rate limiter function)
   */
  async checkLimit(identifier) {
    const key = `${this.keyPrefix}${identifier}`;

    try {
      const current = await this.redisClient.incr(key);

      if (current === 1) {
        // First request, set expiry
        await this.redisClient.expire(key, 1);
      }

      return {
        allowed: current <= this.burstSize,
        current,
        limit: this.burstSize,
        remaining: Math.max(0, this.burstSize - current),
      };
    } catch (err) {
      console.error('Rate limit check failed:', err.message);
      // On error, allow request to pass through
      return { allowed: true, error: true };
    }
  }

  /**
   * Express middleware handler
   */
  middleware() {
    return async (req, res, next) => {
      const identifier = this.getIdentifier(req, !!req.user);
      const result = await this.checkLimit(identifier);

      // Add rate limit info to response headers
      if (result.limit) {
        res.set('X-RateLimit-Limit', result.limit);
        res.set('X-RateLimit-Remaining', Math.max(0, result.remaining));
        res.set('X-RateLimit-Reset', Date.now() + 1000);
      }

      if (!result.allowed) {
        return res.status(429).json({
          status: 'error',
          message: 'Rate limit exceeded',
          retryAfter: 1,
        });
      }

      // Skip counting if configured
      if (this.skipSuccessfulRequests || this.skipFailedRequests) {
        const originalJson = res.json;
        res.json = function(data) {
          const isError = res.statusCode >= 400;
          const shouldSkip =
            (this.skipSuccessfulRequests && !isError) ||
            (this.skipFailedRequests && isError);

          if (shouldSkip) {
            // Decrement counter if we should skip
            this.redisClient.decr(`${this.keyPrefix}${identifier}`).catch(console.error);
          }

          return originalJson.call(this, data);
        }.bind(this);
      }

      next();
    };
  }

  /**
   * Reset rate limit for identifier
   */
  async reset(identifier) {
    const key = `${this.keyPrefix}${identifier}`;
    await this.redisClient.del(key);
  }

  /**
   * Get current count for identifier
   */
  async getCount(identifier) {
    const key = `${this.keyPrefix}${identifier}`;
    const count = await this.redisClient.get(key);
    return parseInt(count || '0', 10);
  }
}

/**
 * Per-endpoint rate limiting
 */
class PerEndpointRateLimiter {
  constructor(redisClient, config = {}) {
    this.redisClient = redisClient;
    this.config = config;
    this.limiters = new Map();
    this.defaultLimiter = new RateLimiter(redisClient, config.default || {});
  }

  /**
   * Get or create limiter for endpoint
   */
  getLimiter(endpoint) {
    if (!this.limiters.has(endpoint)) {
      const config = this.config[endpoint] || this.config.default;
      this.limiters.set(endpoint, new RateLimiter(this.redisClient, config));
    }
    return this.limiters.get(endpoint);
  }

  /**
   * Express middleware handler
   */
  middleware() {
    return async (req, res, next) => {
      const endpoint = `${req.method}:${req.path}`;
      const limiter = this.getLimiter(endpoint);
      const identifier = limiter.getIdentifier(req, !!req.user);
      const result = await limiter.checkLimit(identifier);

      if (result.limit) {
        res.set('X-RateLimit-Limit', result.limit);
        res.set('X-RateLimit-Remaining', Math.max(0, result.remaining));
      }

      if (!result.allowed) {
        return res.status(429).json({
          status: 'error',
          message: 'Rate limit exceeded for this endpoint',
          retryAfter: 1,
        });
      }

      next();
    };
  }
}

/**
 * Creates rate limiting middleware with sensible defaults
 */
function createRateLimitMiddleware(redisClient, options = {}) {
  const config = {
    requestsPerSecond: options.requestsPerSecond || 50,
    burstSize: options.burstSize || 100,
    keyPrefix: options.keyPrefix || 'ratelimit:',
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || true, // Don't count errors by default
  };

  const limiter = new RateLimiter(redisClient, config);
  return limiter.middleware();
}

/**
 * Creates per-endpoint rate limiting with custom config per endpoint
 */
function createPerEndpointRateLimitMiddleware(redisClient, endpointConfig = {}) {
  const config = {
    default: {
      requestsPerSecond: 50,
      burstSize: 100,
    },
    ...endpointConfig,
  };

  const limiter = new PerEndpointRateLimiter(redisClient, config);
  return limiter.middleware();
}

module.exports = {
  RateLimiter,
  PerEndpointRateLimiter,
  createRateLimitMiddleware,
  createPerEndpointRateLimitMiddleware,
};
