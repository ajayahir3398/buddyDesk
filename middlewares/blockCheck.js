const db = require("../models");
const User = db.User;
const logger = require("../utils/logger");

/**
 * Middleware to check if user is blocked
 * This prevents blocked users from performing certain actions
 */
const checkUserBlocked = async (req, res, next) => {
  try {
    // Get user ID from authenticated token
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Check if user exists and is blocked
    const user = await User.findByPk(userId, {
      attributes: ['id', 'is_blocked', 'report_count']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.is_blocked) {
      logger.warn('Blocked user attempted action', {
        userId: userId,
        reportCount: user.report_count,
        requestId: req.requestId,
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        success: false,
        message: "Your account has been blocked due to excessive reporting. Please contact support.",
        data: {
          is_blocked: true,
          report_count: user.report_count
        }
      });
    }

    // User is not blocked, proceed
    next();

  } catch (error) {
    logger.error("Error in checkUserBlocked middleware", {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

module.exports = {
  checkUserBlocked
};

