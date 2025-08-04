/**
 * Request ID middleware
 * Adds a unique request ID to each request for better tracking and debugging
 */

const { v4: uuidv4 } = require('uuid');

const requestIdMiddleware = (req, res, next) => {
  // Generate unique request ID
  req.id = uuidv4();
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.id);
  
  // Add request ID to request object for logging
  req.requestId = req.id;
  
  next();
};

module.exports = requestIdMiddleware; 