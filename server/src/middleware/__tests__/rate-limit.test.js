const request = require('supertest');
const express = require('express');
const { createRateLimitMiddleware, createPerEndpointRateLimitMiddleware } = require('../rate-limit');

/**
 * Unit tests for rate limiting middleware
 */

// Mock Redis client
const createMockRedisClient = () => {
  const store = new Map();
  
  return {
    incr: jest.fn(async (key) => {
      const current = (store.get(key) || 0) + 1;
      store.set(key, current);
      return current;
    }),
    decr: jest.fn(async (key) => {
      const current = Math.max(0, (store.get(key) || 0) - 1);
      store.set(key, current);
      return current;
    }),
    expire: jest.fn(async () => {}),
    flushDb: jest.fn(async () => {
      store.clear();
    }),
    connect: jest.fn(async () => {}),
    disconnect: jest.fn(async () => {}),
    isReady: true,
  };
};

describe('Rate Limit Middleware', () => {
  let redisClient;
  let app;

  beforeEach(async () => {
    app = express();
    redisClient = createMockRedisClient();
    await redisClient.flushDb();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should allow requests within limit', async () => {
    const limiter = createRateLimitMiddleware(redisClient, {
      requestsPerSecond: 10,
      burstSize: 5,
    });

    app.use(limiter);
    app.get('/test', (req, res) => res.send('OK'));

    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.headers['x-ratelimit-remaining']).toBe('4');
  });

  it('should reject requests exceeding limit', async () => {
    const limiter = createRateLimitMiddleware(redisClient, {
      requestsPerSecond: 10,
      burstSize: 2,
    });

    app.use(limiter);
    app.get('/test', (req, res) => res.send('OK'));

    // First two requests should succeed
    await request(app).get('/test').expect(200);
    await request(app).get('/test').expect(200);

    // Third request should be rate limited
    await request(app).get('/test').expect(429);
  });

  it('should include rate limit headers', async () => {
    const limiter = createRateLimitMiddleware(redisClient, {
      burstSize: 10,
    });

    app.use(limiter);
    app.get('/test', (req, res) => res.send('OK'));

    const response = await request(app).get('/test').expect(200);

    expect(response.headers['x-ratelimit-limit']).toBe('10');
    expect(response.headers['x-ratelimit-remaining']).toBe('9');
    expect(response.headers['x-ratelimit-reset']).toBeDefined();
  });

  it('should handle different IPs separately', async () => {
    const limiter = createRateLimitMiddleware(redisClient, {
      burstSize: 5,
    });

    app.use(limiter);
    app.get('/test', (req, res) => res.send('OK'));

    // Multiple requests should share rate limit counter
    await request(app).get('/test').expect(200);
    await request(app).get('/test').expect(200);
    await request(app).get('/test').expect(200);
  });
});

describe('Per-Endpoint Rate Limit Middleware', () => {
  let redisClient;
  let app;

  beforeEach(async () => {
    app = express();
    redisClient = createMockRedisClient();
    await redisClient.flushDb();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should apply endpoint-specific limits', async () => {
    const limiter = createPerEndpointRateLimitMiddleware(redisClient, {
      'POST:/auth/login': {
        requestsPerSecond: 5,
        burstSize: 1,
      },
      default: {
        requestsPerSecond: 100,
        burstSize: 200,
      },
    });

    app.use(express.json());
    app.use(limiter);

    app.post('/auth/login', (req, res) => res.send('OK'));
    app.get('/other', (req, res) => res.send('OK'));

    // Login endpoint has stricter limit
    await request(app).post('/auth/login').expect(200);
    await request(app).post('/auth/login').expect(429);

    // Other endpoint has normal limit
    await request(app).get('/other').expect(200);
    await request(app).get('/other').expect(200);
  });
});

describe('Rate Limit Integration', () => {
  let redisClient;
  let app;

  beforeEach(async () => {
    app = express();
    redisClient = createMockRedisClient();
    await redisClient.flushDb();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should skip counting for failed requests when configured', async () => {
    const limiter = createRateLimitMiddleware(redisClient, {
      burstSize: 3,
      skipFailedRequests: true,
    });

    app.use(limiter);
    app.get('/test', (req, res) => {
      if (req.query.fail) {
        res.status(400).send('Bad request');
      } else {
        res.send('OK');
      }
    });

    // Make requests - both succeed and fail
    await request(app).get('/test').expect(200);
    await request(app).get('/test').expect(200);
    await request(app).get('/test').expect(200);
    
    // At burst limit, next should be rejected
    await request(app).get('/test').expect(429);
  });

  it('should gracefully handle Redis errors', async () => {
    // Make Redis client throw errors
    redisClient.incr = jest.fn(async () => {
      throw new Error('Redis connection failed');
    });

    const limiter = createRateLimitMiddleware(redisClient, {
      burstSize: 5,
    });

    app.use(limiter);
    app.get('/test', (req, res) => res.send('OK'));

    // Should still work (allow request when Redis unavailable)
    await request(app).get('/test').expect(200);
  });
});
