// Structured logging middleware for Express
// Provides JSON-formatted logs with context

const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARNING',
  ERROR: 'ERROR',
};

// Logger class for structured logging
class StructuredLogger {
  constructor(service) {
    this.service = service;
    this.requestCounter = 0;
  }

  /**
   * Logs a message with the specified level
   */
  log(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      ...metadata,
    };

    console.log(JSON.stringify(logEntry));
  }

  debug(message, metadata) {
    this.log(LOG_LEVELS.DEBUG, message, metadata);
  }

  info(message, metadata) {
    this.log(LOG_LEVELS.INFO, message, metadata);
  }

  warn(message, metadata) {
    this.log(LOG_LEVELS.WARN, message, metadata);
  }

  error(message, error, metadata = {}) {
    const fullMetadata = {
      ...metadata,
      error: error ? error.message : null,
      stack: error ? error.stack : null,
    };
    this.log(LOG_LEVELS.ERROR, message, fullMetadata);
  }
}

/**
 * Creates an Express middleware for structured request logging
 */
function createStructuredLoggingMiddleware(logger) {
  return (req, res, next) => {
    const startTime = Date.now();
    const requestId = ++logger.requestCounter;

    // Capture response.json to log response data
    const originalJson = res.json;
    res.json = function(data) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      logger.info(`${req.method} ${req.path}`, {
        request_id: requestId,
        method: req.method,
        path: req.path,
        status_code: statusCode,
        duration_ms: duration,
        user_id: req.user ? req.user.id : null,
        ip: req.ip,
      });

      return originalJson.call(this, data);
    };

    // Capture response.status for error handling
    const originalStatus = res.status;
    res.status = function(code) {
      if (code >= 400) {
        logger.warn(`${req.method} ${req.path}`, {
          request_id: requestId,
          status_code: code,
          path: req.path,
        });
      }
      return originalStatus.call(this, code);
    };

    next();
  };
}

/**
 * Creates an Express middleware for rate limiting with logging
 */
function createRateLimitMiddleware(logger, options = {}) {
  const { requestsPerMinute = 60, timeWindow = 60000 } = options;
  const clientRequests = new Map();

  return (req, res, next) => {
    const clientIP = req.ip;
    const now = Date.now();

    // Initialize or get client request records
    if (!clientRequests.has(clientIP)) {
      clientRequests.set(clientIP, []);
    }

    const requests = clientRequests.get(clientIP);

    // Remove old requests outside the time window
    const validRequests = requests.filter(time => now - time < timeWindow);
    clientRequests.set(clientIP, validRequests);

    // Check rate limit
    if (validRequests.length >= requestsPerMinute) {
      logger.warn('Rate limit exceeded', {
        ip: clientIP,
        requests: validRequests.length,
        limit: requestsPerMinute,
      });

      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(timeWindow / 1000),
      });
    }

    // Add current request
    validRequests.push(now);
    clientRequests.set(clientIP, validRequests);

    next();
  };
}

/**
 * Creates an Express middleware for input validation and logging
 */
function createValidationMiddleware(logger) {
  return (req, res, next) => {
    // Validate Content-Type for POST/PUT requests with a body
    if (['POST', 'PUT'].includes(req.method)) {
      const contentType = req.headers['content-type'];
      const contentLength = req.headers['content-length'];
      
      // Only require Content-Type if there's actual content being sent
      if ((contentLength && contentLength > 0) || req.body) {
        if (!contentType || !contentType.includes('application/json')) {
          logger.warn('Invalid Content-Type', {
            path: req.path,
            received: contentType,
            expected: 'application/json',
          });

          return res.status(400).json({
            error: 'Invalid Content-Type. Expected application/json',
          });
        }
      }
    }

    // Validate request size
    const maxSize = 1048576; // 1MB
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxSize) {
        logger.error('Request payload too large', null, {
          path: req.path,
          size,
          maxSize,
        });
        req.pause();
        res.status(413).json({
          error: 'Payload too large',
        });
      }
    });

    next();
  };
}

/**
 * Creates context-aware logger for requests
 */
function createRequestLogger(logger, req) {
  return {
    info: (message, metadata = {}) => {
      logger.info(message, {
        request_id: req.id,
        user_id: req.user ? req.user.id : null,
        path: req.path,
        ...metadata,
      });
    },
    error: (message, error, metadata = {}) => {
      logger.error(message, error, {
        request_id: req.id,
        user_id: req.user ? req.user.id : null,
        path: req.path,
        ...metadata,
      });
    },
    warn: (message, metadata = {}) => {
      logger.warn(message, {
        request_id: req.id,
        user_id: req.user ? req.user.id : null,
        path: req.path,
        ...metadata,
      });
    },
  };
}

module.exports = {
  StructuredLogger,
  LOG_LEVELS,
  createStructuredLoggingMiddleware,
  createRateLimitMiddleware,
  createValidationMiddleware,
  createRequestLogger,
};
