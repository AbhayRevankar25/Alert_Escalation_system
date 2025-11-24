const redisHelpers = require('../utils/redisHelpers');

class RateLimitMiddleware {
  constructor() {
    this.windowMs = 15 * 60 * 1000; // 15 minutes
    this.maxRequests = 100; // max requests per windowMs
    this.message = 'Too many requests, please try again later.';
  }

  // Generic rate limiter
  limit() {
    return async (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;
      const key = `rate_limit:${clientIP}`;
      
      try {
        const current = await redisHelpers.get(key);
        
        if (current === null) {
          // First request in window
          await redisHelpers.setex(key, this.windowMs / 1000, '1');
          return next();
        }
        
        const requestCount = parseInt(current);
        
        if (requestCount >= this.maxRequests) {
          return res.status(429).json({
            success: false,
            error: this.message,
            retryAfter: Math.ceil(this.windowMs / 1000)
          });
        }
        
        // Increment counter
        await redisHelpers.incr(key);
        next();
        
      } catch (error) {
        console.error('Rate limit error:', error);
        // On error, allow the request to proceed
        next();
      }
    };
  }

  // Stricter limit for alert creation
  alertCreationLimit() {
    return async (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;
      const key = `rate_limit:alert_create:${clientIP}`;
      const windowMs = 60 * 1000; // 1 minute
      const maxRequests = 30; // max 30 alerts per minute
      
      try {
        const current = await redisHelpers.get(key);
        
        if (current === null) {
          await redisHelpers.setex(key, windowMs / 1000, '1');
          return next();
        }
        
        const requestCount = parseInt(current);
        
        if (requestCount >= maxRequests) {
          return res.status(429).json({
            success: false,
            error: 'Too many alert creation requests. Please slow down.',
            retryAfter: Math.ceil(windowMs / 1000)
          });
        }
        
        await redisHelpers.incr(key);
        next();
        
      } catch (error) {
        console.error('Alert creation rate limit error:', error);
        next();
      }
    };
  }

  // Per-user rate limiting
  userLimit() {
    return async (req, res, next) => {
      if (!req.user) {
        return next();
      }
      
      const userId = req.user.id;
      const key = `rate_limit:user:${userId}`;
      const windowMs = 60 * 1000; // 1 minute
      const maxRequests = 50; // max 50 requests per minute per user
      
      try {
        const current = await redisHelpers.get(key);
        
        if (current === null) {
          await redisHelpers.setex(key, windowMs / 1000, '1');
          return next();
        }
        
        const requestCount = parseInt(current);
        
        if (requestCount >= maxRequests) {
          return res.status(429).json({
            success: false,
            error: 'User rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil(windowMs / 1000)
          });
        }
        
        await redisHelpers.incr(key);
        next();
        
      } catch (error) {
        console.error('User rate limit error:', error);
        next();
      }
    };
  }
}

module.exports = new RateLimitMiddleware();