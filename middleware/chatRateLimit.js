const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Rate limiting middleware for chat functionality
 * Prevents abuse and ensures system stability
 */

/**
 * Rate limiter for sending messages
 * Allows 60 messages per minute per user
 */
const messageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 messages per minute
  message: {
    success: false,
    message: 'Too many messages sent. Please wait before sending another message.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit per user
    return `message_${req.user?.id || ipKeyGenerator(req)}`;
  },
  handler: (req, res) => {
    logger.warn(`Message rate limit exceeded for user ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many messages sent. Please wait before sending another message.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  },
  skip: (req) => {
    // Skip rate limiting for system messages or admin users
    return req.body?.messageType === 'system' || req.user?.role === 'admin';
  }
});

/**
 * Rate limiter for creating conversations
 * Allows 10 conversations per hour per user
 */
const conversationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 conversations per hour
  message: {
    success: false,
    message: 'Too many conversations created. Please wait before creating another conversation.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `conversation_${req.user?.id || ipKeyGenerator(req)}`;
  },
  handler: (req, res) => {
    logger.warn(`Conversation rate limit exceeded for user ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many conversations created. Please wait before creating another conversation.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiter for file uploads
 * Allows 20 file uploads per hour per user
 */
const fileUploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 file uploads per hour
  message: {
    success: false,
    message: 'Too many files uploaded. Please wait before uploading another file.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `upload_${req.user?.id || ipKeyGenerator(req)}`;
  },
  handler: (req, res) => {
    logger.warn(`File upload rate limit exceeded for user ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many files uploaded. Please wait before uploading another file.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiter for search requests
 * Allows 100 searches per hour per user
 */
const searchRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 searches per hour
  message: {
    success: false,
    message: 'Too many search requests. Please wait before searching again.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `search_${req.user?.id || ipKeyGenerator(req)}`;
  },
  handler: (req, res) => {
    logger.warn(`Search rate limit exceeded for user ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many search requests. Please wait before searching again.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiter for general chat API requests
 * Allows 300 requests per hour per user
 */
const generalChatRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 300, // 300 requests per hour
  message: {
    success: false,
    message: 'Too many requests. Please wait before making another request.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `chat_${req.user?.id || ipKeyGenerator(req)}`;
  },
  handler: (req, res) => {
    logger.warn(`General chat rate limit exceeded for user ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please wait before making another request.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiter for typing indicators
 * Allows 120 typing updates per minute per user
 */
const typingRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 typing updates per minute
  message: {
    success: false,
    message: 'Too many typing updates. Please slow down.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `typing_${req.user?.id || ipKeyGenerator(req)}`;
  },
  handler: (req, res) => {
    logger.warn(`Typing rate limit exceeded for user ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many typing updates. Please slow down.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Socket.io rate limiting for real-time events
 * This is a custom implementation for Socket.io events
 */
class SocketRateLimiter {
  constructor() {
    this.userLimits = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Check if user has exceeded rate limit for a specific event
   * @param {string} userId - User ID
   * @param {string} eventType - Event type (message, typing, etc.)
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} True if rate limit exceeded
   */
  isRateLimited(userId, eventType, maxRequests, windowMs) {
    const key = `${userId}_${eventType}`;
    const now = Date.now();
    
    if (!this.userLimits.has(key)) {
      this.userLimits.set(key, {
        requests: 1,
        resetTime: now + windowMs
      });
      return false;
    }

    const userLimit = this.userLimits.get(key);
    
    // Reset if window has expired
    if (now > userLimit.resetTime) {
      userLimit.requests = 1;
      userLimit.resetTime = now + windowMs;
      return false;
    }

    // Check if limit exceeded
    if (userLimit.requests >= maxRequests) {
      logger.warn(`Socket rate limit exceeded for user ${userId}, event ${eventType}`);
      return true;
    }

    userLimit.requests++;
    return false;
  }

  /**
   * Clean up expired rate limit entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, limit] of this.userLimits.entries()) {
      if (now > limit.resetTime) {
        this.userLimits.delete(key);
      }
    }
  }

  /**
   * Get remaining requests for a user and event type
   * @param {string} userId - User ID
   * @param {string} eventType - Event type
   * @param {number} maxRequests - Maximum requests allowed
   * @returns {number} Remaining requests
   */
  getRemainingRequests(userId, eventType, maxRequests) {
    const key = `${userId}_${eventType}`;
    const userLimit = this.userLimits.get(key);
    
    if (!userLimit) {
      return maxRequests;
    }

    return Math.max(0, maxRequests - userLimit.requests);
  }

  /**
   * Reset rate limit for a specific user and event
   * @param {string} userId - User ID
   * @param {string} eventType - Event type
   */
  resetUserLimit(userId, eventType) {
    const key = `${userId}_${eventType}`;
    this.userLimits.delete(key);
  }

  /**
   * Destroy the rate limiter and cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.userLimits.clear();
  }
}

// Create singleton instance for Socket.io rate limiting
const socketRateLimiter = new SocketRateLimiter();

/**
 * Middleware to check Socket.io rate limits
 * @param {string} eventType - Event type
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Middleware function
 */
function createSocketRateLimit(eventType, maxRequests, windowMs) {
  return (socket, next) => {
    const userId = socket.userId?.toString();
    
    if (!userId) {
      return next(new Error('Authentication required'));
    }

    if (socketRateLimiter.isRateLimited(userId, eventType, maxRequests, windowMs)) {
      const remaining = socketRateLimiter.getRemainingRequests(userId, eventType, maxRequests);
      socket.emit('rate_limit_exceeded', {
        eventType,
        message: `Rate limit exceeded for ${eventType}`,
        remaining,
        resetTime: Date.now() + windowMs
      });
      return next(new Error(`Rate limit exceeded for ${eventType}`));
    }

    next();
  };
}

/**
 * Predefined Socket.io rate limiters
 */
const socketMessageRateLimit = createSocketRateLimit('message', 60, 60000); // 60 messages per minute
const socketTypingRateLimit = createSocketRateLimit('typing', 120, 60000); // 120 typing events per minute
const socketJoinRateLimit = createSocketRateLimit('join', 30, 60000); // 30 join events per minute

module.exports = {
  messageRateLimit,
  conversationRateLimit,
  fileUploadRateLimit,
  searchRateLimit,
  generalChatRateLimit,
  typingRateLimit,
  socketRateLimiter,
  createSocketRateLimit,
  socketMessageRateLimit,
  socketTypingRateLimit,
  socketJoinRateLimit
};