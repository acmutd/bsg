const request = require('supertest');
const express = require('express');
const Redis = require('redis');
const { createRateLimitMiddleware, createPerEndpointRateLimitMiddleware } = require('./rate-limit');

/**
 * Unit tests for rate limiting middleware
 */

describe('Rate Limit Middleware', () => {
  let redisClient;
  let app;

  beforeEach(async () => {
    app = express();
    redisClient = Redis.createClient({
      host: 'localhost',
      port: 6379,
      db: 15, // Use test database
    });

    try {
      await redisClient.connect();
      await redisClient.flushDb(); // Clear test database
    } catch (err) {
      // Redis not available, skip tests
      console.warn('Redis not available for tests:', err.message);
    }
  });

  afterEach(async () => {
    if (redisClient && redisClient.isReady) {
      await redisClient.disconnect();
    }
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
      burstSize: 2,
    });

    app.use(limiter);
    app.get('/test', (req, res) => res.send('OK'));

    // Same IP should be rate limited
    const client1 = request(app);
    await client1.get('/test').expect(200);
    await client1.get('/test').expect(200);
    await client1.get('/test').expect(429);

    // Different IP should have own limit
    const client2 = request(app).set('X-Forwarded-For', '192.168.1.2');
    await client2.get('/test').expect(200);
  });
});

describe('Per-Endpoint Rate Limit Middleware', () => {
  let redisClient;
  let app;

  beforeEach(async () => {
    app = express();
    redisClient = Redis.createClient({
      host: 'localhost',
      port: 6379,
      db: 15,
    });

    try {
      await redisClient.connect();
      await redisClient.flushDb();
    } catch (err) {
      console.warn('Redis not available for tests:', err.message);
    }
  });

  afterEach(async () => {
    if (redisClient && redisClient.isReady) {
      await redisClient.disconnect();
    }
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
    redisClient = Redis.createClient({
      host: 'localhost',
      port: 6379,
      db: 15,
    });

    try {
      await redisClient.connect();
      await redisClient.flushDb();
    } catch (err) {
      console.warn('Redis not available for tests:', err.message);
    }
  });

  afterEach(async () => {
    if (redisClient && redisClient.isReady) {
      await redisClient.disconnect();
    }
  });

  it('should skip counting for failed requests when configured', async () => {
    const limiter = createRateLimitMiddleware(redisClient, {
      burstSize: 2,
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

    // Successful request counts
    await request(app).get('/test').expect(200);

    // Failed request doesn't count
    await request(app).get('/test?fail=1').expect(400);

    // Can still make one more successful request
    await request(app).get('/test').expect(200);

    // Third request is limited
    await request(app).get('/test').expect(429);
  });

  it('should gracefully handle Redis errors', async () => {
    // Disconnect Redis to simulate error
    if (redisClient.isReady) {
      await redisClient.disconnect();
    }

    const limiter = createRateLimitMiddleware(redisClient, {
      burstSize: 5,
    });

    app.use(limiter);
    app.get('/test', (req, res) => res.send('OK'));

    // Should still work (allow request when Redis unavailable)
    await request(app).get('/test').expect(200);
  });
});
