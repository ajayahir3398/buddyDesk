const db = require("../models");
const TermsAcceptance = db.TermsAcceptance;
const User = db.User;
const logger = require("../utils/logger");
const { Op } = require("sequelize");

// Helper function to get client IP address
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    null
  );
};

// Helper function to get device info
const getDeviceInfo = (req) => {
  return {
    platform: req.body.platform || req.headers['x-platform'] || null,
    deviceType: req.body.deviceType || req.headers['x-device-type'] || null,
    appVersion: req.body.appVersion || req.headers['x-app-version'] || null,
    osVersion: req.body.osVersion || req.headers['x-os-version'] || null
  };
};

/**
 * Accept terms and conditions
 * @route POST /api/terms/accept
 */
exports.acceptTerms = async (req, res) => {
  try {
    const { version } = req.body;
    const user_id = req.user.id;

    // Validate version is provided
    if (!version) {
      return res.status(400).json({
        success: false,
        message: "Terms version is required"
      });
    }

    // Check if user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get client information
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || null;
    const deviceInfo = getDeviceInfo(req);

    // Create terms acceptance record
    const acceptance = await TermsAcceptance.create({
      user_id,
      version,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_info: deviceInfo,
      accepted_at: new Date()
    });

    logger.info('Terms and conditions accepted', {
      requestId: req.requestId,
      userId: user_id,
      version,
      acceptanceId: acceptance.id
    });

    res.status(201).json({
      success: true,
      message: "Terms and conditions accepted successfully",
      data: {
        id: acceptance.id,
        version: acceptance.version,
        accepted_at: acceptance.accepted_at
      }
    });
  } catch (error) {
    logger.error("Error accepting terms and conditions", {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: "Failed to accept terms and conditions",
      error: error.message
    });
  }
};

/**
 * Check if user has accepted latest terms
 * @route GET /api/terms/check
 */
exports.checkTermsAcceptance = async (req, res) => {
  try {
    const { version } = req.query;
    const user_id = req.user.id;

    // If no version specified, use a default or latest version
    const termsVersion = version || process.env.CURRENT_TERMS_VERSION || "1.0";

    // Check if user has accepted this version
    const acceptance = await TermsAcceptance.findOne({
      where: {
        user_id,
        version: termsVersion
      },
      order: [['accepted_at', 'DESC']]
    });

    const hasAccepted = !!acceptance;

    res.status(200).json({
      success: true,
      data: {
        hasAccepted,
        version: termsVersion,
        acceptedAt: acceptance ? acceptance.accepted_at : null,
        acceptanceDetails: acceptance ? {
          id: acceptance.id,
          version: acceptance.version,
          accepted_at: acceptance.accepted_at
        } : null
      }
    });
  } catch (error) {
    logger.error("Error checking terms acceptance", {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: "Failed to check terms acceptance",
      error: error.message
    });
  }
};

/**
 * Get user's terms acceptance history
 * @route GET /api/terms/history
 */
exports.getAcceptanceHistory = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: acceptances } = await TermsAcceptance.findAndCountAll({
      where: { user_id },
      attributes: [
        'id',
        'version',
        'ip_address',
        'accepted_at',
        'created_at'
      ],
      order: [['accepted_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: {
        acceptances,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalRecords: count,
          recordsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error("Error fetching acceptance history", {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch acceptance history",
      error: error.message
    });
  }
};

/**
 * Get latest acceptance for user
 * @route GET /api/terms/latest
 */
exports.getLatestAcceptance = async (req, res) => {
  try {
    const user_id = req.user.id;

    const acceptance = await TermsAcceptance.findOne({
      where: { user_id },
      attributes: [
        'id',
        'version',
        'accepted_at',
        'created_at'
      ],
      order: [['accepted_at', 'DESC']]
    });

    if (!acceptance) {
      return res.status(404).json({
        success: false,
        message: "No terms acceptance found for this user"
      });
    }

    res.status(200).json({
      success: true,
      data: acceptance
    });
  } catch (error) {
    logger.error("Error fetching latest acceptance", {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch latest acceptance",
      error: error.message
    });
  }
};

/**
 * Admin: Get all terms acceptances with filters
 * @route GET /api/terms/admin/all
 */
exports.getAllAcceptances = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      version, 
      userId,
      startDate,
      endDate 
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Apply filters
    if (version) {
      whereClause.version = version;
    }

    if (userId) {
      whereClause.user_id = userId;
    }

    if (startDate || endDate) {
      whereClause.accepted_at = {};
      if (startDate) {
        whereClause.accepted_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.accepted_at[Op.lte] = new Date(endDate);
      }
    }

    const { count, rows: acceptances } = await TermsAcceptance.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      order: [['accepted_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: {
        acceptances,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalRecords: count,
          recordsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error("Error fetching all acceptances", {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch acceptances",
      error: error.message
    });
  }
};

/**
 * Admin: Get acceptance statistics
 * @route GET /api/terms/admin/stats
 */
exports.getAcceptanceStats = async (req, res) => {
  try {
    const { version } = req.query;
    const whereClause = version ? { version } : {};

    // Total acceptances
    const totalAcceptances = await TermsAcceptance.count({
      where: whereClause
    });

    // Unique users who accepted
    const uniqueUsers = await TermsAcceptance.count({
      where: whereClause,
      distinct: true,
      col: 'user_id'
    });

    // Acceptances by version
    const acceptancesByVersion = await TermsAcceptance.findAll({
      attributes: [
        'version',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['version'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']]
    });

    // Recent acceptances (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentAcceptances = await TermsAcceptance.count({
      where: {
        ...whereClause,
        accepted_at: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalAcceptances,
        uniqueUsers,
        acceptancesByVersion,
        recentAcceptances: {
          count: recentAcceptances,
          period: 'last 7 days'
        }
      }
    });
  } catch (error) {
    logger.error("Error fetching acceptance statistics", {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message
    });
  }
};

