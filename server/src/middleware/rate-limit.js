/**
 * Rate limiting middleware for Express, backed by Redis so limits hold across
 * multiple server replicas (an in-process counter would give each replica its
 * own budget, multiplying the effective limit by the replica count).
 */
class RateLimiter {
  constructor(redisClient, options = {}) {
    this.redisClient = redisClient;
    this.windowSeconds = options.windowSeconds || 1;
    this.burstSize = options.burstSize || 20;
    this.keyPrefix = options.keyPrefix || 'ratelimit:';
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
    this.logger = options.logger || null;
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
    // Fixed-window counter with the window index baked into the key: if the
    // EXPIRE below ever fails, the stranded key belongs to a window we never
    // read again, so it can't permanently lock out the caller.
    const windowMs = this.windowSeconds * 1000;
    const windowIndex = Math.floor(Date.now() / windowMs);
    const key = `${this.keyPrefix}${identifier}:${windowIndex}`;

    try {
      const current = await this.redisClient.incr(key);

      if (current === 1) {
        await this.redisClient.expire(key, this.windowSeconds);
      }

      return {
        allowed: current <= this.burstSize,
        current,
        key,
        limit: this.burstSize,
        remaining: Math.max(0, this.burstSize - current),
        resetAt: (windowIndex + 1) * windowMs,
      };
    } catch (err) {
      // Redis being unavailable must not take the API down with it - fail open.
      if (this.logger) {
        this.logger.warn('Rate limit check failed, allowing request', { error: err.message });
      } else {
        console.error('Rate limit check failed:', err.message);
      }
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
        res.set('X-RateLimit-Reset', result.resetAt);
      }

      if (!result.allowed) {
        if (this.logger) {
          this.logger.warn('Rate limit exceeded', {
            identifier,
            requests: result.current,
            limit: result.limit,
          });
        }
        return res.status(429).json({
          status: 'error',
          message: 'Rate limit exceeded',
          retryAfter: this.windowSeconds,
        });
      }

      // Skip counting if configured
      if ((this.skipSuccessfulRequests || this.skipFailedRequests) && result.key) {
        const originalJson = res.json.bind(res);
        res.json = (data) => {
          const isError = res.statusCode >= 400;
          const shouldSkip =
            (this.skipSuccessfulRequests && !isError) ||
            (this.skipFailedRequests && isError);

          if (shouldSkip) {
            // Refund this request's slot; never let a bookkeeping failure
            // break the response we're in the middle of sending.
            Promise.resolve(this.redisClient.decr(result.key)).catch(() => {});
          }

          return originalJson(data);
        };
      }

      next();
    };
  }

  /**
   * Key for the identifier's counter in the window currently in effect.
   */
  currentKey(identifier) {
    const windowMs = this.windowSeconds * 1000;
    return `${this.keyPrefix}${identifier}:${Math.floor(Date.now() / windowMs)}`;
  }

  /**
   * Reset rate limit for identifier
   */
  async reset(identifier) {
    await this.redisClient.del(this.currentKey(identifier));
  }

  /**
   * Get current count for identifier
   */
  async getCount(identifier) {
    const count = await this.redisClient.get(this.currentKey(identifier));
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
        res.set('X-RateLimit-Reset', result.resetAt);
      }

      if (!result.allowed) {
        return res.status(429).json({
          status: 'error',
          message: 'Rate limit exceeded for this endpoint',
          retryAfter: limiter.windowSeconds,
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
    windowSeconds: options.windowSeconds || 1,
    burstSize: options.burstSize || 100,
    keyPrefix: options.keyPrefix || 'ratelimit:',
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    // Don't count errors by default (?? so an explicit false is honored).
    skipFailedRequests: options.skipFailedRequests ?? true,
    logger: options.logger,
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
      windowSeconds: 1,
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
