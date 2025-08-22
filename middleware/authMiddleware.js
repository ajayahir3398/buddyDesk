const { authenticateToken } = require('../middlewares/auth');

/**
 * Authentication middleware for chat routes
 * This is a wrapper around the main authentication middleware
 * to maintain consistency with the chat module structure
 */
module.exports = authenticateToken;