const jwt = require('jsonwebtoken');
const db = require('../models');
const TokenBlacklist = db.TokenBlacklist;
const SessionLog = db.SessionLog;

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Check if token is blacklisted
    const blacklistedToken = await TokenBlacklist.findOne({
      where: { token: token }
    });

    if (blacklistedToken) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Check if session is still active (single device login enforcement)
    if (decoded.sessionId) {
      const session = await SessionLog.findOne({
        where: {
          session_id: decoded.sessionId,
          user_id: decoded.userId
        }
      });

      if (!session) {
        return res.status(401).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (!session.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Session has been revoked. Please login again.'
        });
      }

      // Update last_used_at timestamp
      await session.update({ last_used_at: new Date() });
    }

    // Add user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      sessionId: decoded.sessionId
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  authenticateToken
}; 