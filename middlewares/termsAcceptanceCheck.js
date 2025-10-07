const db = require("../models");
const logger = require("../utils/logger");

/**
 * Middleware to check if user has accepted the current terms and conditions
 * Add this middleware to routes that require terms acceptance
 * 
 * Usage:
 * router.get('/protected-route', authenticate, requireTermsAcceptance, controller.method);
 */
const requireTermsAcceptance = async (req, res, next) => {
  try {
    // Get current terms version from environment or default
    const currentVersion = process.env.CURRENT_TERMS_VERSION || "1.0";
    
    // Get user ID from authenticated session
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Check if user has accepted the current version
    const acceptance = await db.TermsAcceptance.findOne({
      where: {
        user_id: userId,
        version: currentVersion
      },
      order: [['accepted_at', 'DESC']]
    });

    if (!acceptance) {
      logger.warn('User attempted to access resource without accepting current terms', {
        requestId: req.requestId,
        userId,
        requiredVersion: currentVersion,
        path: req.path
      });

      return res.status(403).json({
        success: false,
        message: "Terms and conditions acceptance required",
        error: "TERMS_NOT_ACCEPTED",
        data: {
          requiredVersion: currentVersion,
          checkEndpoint: "/api/terms/check",
          acceptEndpoint: "/api/terms/accept"
        }
      });
    }

    // User has accepted terms, continue to next middleware
    logger.debug('Terms acceptance verified', {
      requestId: req.requestId,
      userId,
      version: currentVersion,
      acceptedAt: acceptance.accepted_at
    });

    next();
  } catch (error) {
    logger.error('Error checking terms acceptance', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    // In case of error, allow request to continue (fail open)
    // Change this to fail closed if stricter enforcement is needed
    next();
  }
};

/**
 * Optional: Middleware that checks terms but doesn't block the request
 * Just adds a flag to the request object
 */
const checkTermsAcceptance = async (req, res, next) => {
  try {
    const currentVersion = process.env.CURRENT_TERMS_VERSION || "1.0";
    const userId = req.user?.id;

    if (userId) {
      const acceptance = await db.TermsAcceptance.findOne({
        where: {
          user_id: userId,
          version: currentVersion
        }
      });

      req.hasAcceptedTerms = !!acceptance;
      req.termsVersion = currentVersion;
      req.termsAcceptedAt = acceptance?.accepted_at || null;
    }
  } catch (error) {
    logger.error('Error in checkTermsAcceptance middleware', {
      error: error.message
    });
    req.hasAcceptedTerms = null;
  }

  next();
};

module.exports = {
  requireTermsAcceptance,
  checkTermsAcceptance
};

