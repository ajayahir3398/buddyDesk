const subscriptionService = require('../services/subscriptionService');
const googlePlayService = require('../services/googlePlayService');
const appleAppStoreService = require('../services/appleAppStoreService');
const db = require('../models');
const logger = require('../utils/logger');
const iapConfig = require('../config/iap.config');

/**
 * Validate a purchase from client
 * POST /api/iap/validate
 */
exports.validatePurchase = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platform, purchaseToken, productId, appAccountToken } = req.body;

    // Validate required fields
    if (!platform || !purchaseToken || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: platform, purchaseToken, productId'
      });
    }

    // Validate platform
    if (!['play', 'appstore'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be "play" or "appstore"'
      });
    }

    logger.info('Validating purchase', {
      userId,
      platform,
      productId,
      purchaseToken: purchaseToken.substring(0, 20) + '...',
      requestId: req.requestId
    });

    // Validate the purchase with the store
    const result = await subscriptionService.validatePurchase(
      userId,
      platform,
      purchaseToken,
      productId
    );

    // Return success with subscription details
    res.status(200).json({
      success: true,
      message: 'Purchase validated successfully',
      data: {
        subscription: {
          id: result.subscription.id,
          productId: result.subscription.product_id,
          status: result.subscription.status,
          isActive: result.isActive,
          expiryDate: result.subscription.expiry_date,
          isAutoRenewing: result.subscription.is_auto_renewing,
          isTrial: result.subscription.is_trial,
          platform: result.subscription.platform
        }
      }
    });

  } catch (error) {
    logger.error('Purchase validation error', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to validate purchase',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get user's subscriptions
 * GET /api/iap/subscriptions
 */
exports.getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptions = await db.Subscription.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      attributes: [
        'id',
        'platform',
        'product_id',
        'status',
        'is_auto_renewing',
        'is_trial',
        'purchase_date',
        'expiry_date',
        'cancel_date',
        'cancel_reason',
        'environment',
        'created_at'
      ]
    });

    // Determine active subscription
    const activeSubscriptions = subscriptions.filter(sub => 
      sub.status === 'active' && 
      new Date(sub.expiry_date) > new Date()
    );

    res.status(200).json({
      success: true,
      message: 'Subscriptions retrieved successfully',
      data: {
        subscriptions,
        activeCount: activeSubscriptions.length,
        hasActiveSubscription: activeSubscriptions.length > 0
      }
    });

  } catch (error) {
    logger.error('Get subscriptions error', {
      userId: req.user?.id,
      error: error.message,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get subscriptions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get specific subscription details
 * GET /api/iap/subscriptions/:id
 */
exports.getSubscriptionDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionId = req.params.id;

    const subscription = await db.Subscription.findOne({
      where: {
        id: subscriptionId,
        user_id: userId
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Get subscription events/history
    const events = await db.SubscriptionEvent.findAll({
      where: { subscription_id: subscriptionId },
      order: [['created_at', 'DESC']],
      limit: 20,
      attributes: ['event_type', 'event_timestamp', 'processed', 'created_at']
    });

    res.status(200).json({
      success: true,
      message: 'Subscription details retrieved successfully',
      data: {
        subscription,
        events
      }
    });

  } catch (error) {
    logger.error('Get subscription details error', {
      userId: req.user?.id,
      subscriptionId: req.params.id,
      error: error.message,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get subscription details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Check subscription status
 * GET /api/iap/status
 */
exports.checkSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.query;

    const hasActive = await subscriptionService.hasActiveSubscription(userId, productId);

    let activeSubscription = null;
    if (hasActive) {
      const whereClause = {
        user_id: userId,
        status: 'active',
        expiry_date: {
          [db.Sequelize.Op.gt]: new Date()
        }
      };

      if (productId) {
        whereClause.product_id = productId;
      }

      activeSubscription = await db.Subscription.findOne({
        where: whereClause,
        order: [['expiry_date', 'DESC']],
        attributes: ['id', 'product_id', 'status', 'expiry_date', 'is_auto_renewing', 'platform']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription status retrieved successfully',
      data: {
        hasActiveSubscription: hasActive,
        subscription: activeSubscription
      }
    });

  } catch (error) {
    logger.error('Check subscription status error', {
      userId: req.user?.id,
      error: error.message,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to check subscription status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Refresh subscription from store (force re-validation)
 * POST /api/iap/refresh/:id
 */
exports.refreshSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionId = req.params.id;

    const subscription = await db.Subscription.findOne({
      where: {
        id: subscriptionId,
        user_id: userId
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Reconcile with store
    const result = await subscriptionService.reconcileSubscription(subscriptionId);

    res.status(200).json({
      success: true,
      message: result.updated 
        ? 'Subscription refreshed and updated' 
        : 'Subscription is up to date',
      data: {
        subscription: result.subscription,
        updated: result.updated
      }
    });

  } catch (error) {
    logger.error('Refresh subscription error', {
      userId: req.user?.id,
      subscriptionId: req.params.id,
      error: error.message,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to refresh subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Handle Google Play webhook (RTDN via Pub/Sub)
 * POST /api/webhooks/google/pubsub
 */
exports.handleGoogleWebhook = async (req, res) => {
  try {
    // Verify Pub/Sub message format
    const message = req.body.message;
    
    if (!message || !message.data) {
      logger.warn('Invalid Google Pub/Sub message format', { body: req.body });
      return res.status(400).json({ error: 'Invalid message format' });
    }

    // Optional: Verify push token if configured
    const token = req.query.token;
    if (iapConfig.GOOGLE_PLAY.PUBSUB_VERIFICATION_TOKEN && 
        token !== iapConfig.GOOGLE_PLAY.PUBSUB_VERIFICATION_TOKEN) {
      logger.warn('Invalid Google Pub/Sub verification token');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Decode message data (base64)
    const dataString = Buffer.from(message.data, 'base64').toString('utf-8');
    const notification = JSON.parse(dataString);

    logger.info('Received Google RTDN', {
      messageId: message.messageId,
      publishTime: message.publishTime,
      notification: notification
    });

    // Process the notification
    const eventData = await googlePlayService.processRTDN(notification);
    
    if (eventData) {
      await subscriptionService.processWebhookEvent('play', eventData);
    }

    // Acknowledge receipt (200-299 status code)
    res.status(200).json({ success: true });

  } catch (error) {
    logger.error('Google webhook processing error', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    // Still return 200 to avoid Pub/Sub retries for non-recoverable errors
    // For recoverable errors, you might want to return 500
    res.status(200).json({ success: false, error: error.message });
  }
};

/**
 * Handle Apple App Store Server Notification
 * POST /api/webhooks/apple/notifications
 */
exports.handleAppleWebhook = async (req, res) => {
  try {
    const { signedPayload } = req.body;

    if (!signedPayload) {
      logger.warn('Invalid Apple notification format', { body: req.body });
      return res.status(400).json({ error: 'Invalid notification format' });
    }

    // Decode the signed payload (JWS)
    const notification = appleAppStoreService.decodeJWS(signedPayload);

    logger.info('Received Apple Server Notification', {
      notificationType: notification.notificationType,
      notificationUUID: notification.notificationUUID
    });

    // Process the notification
    const eventData = await appleAppStoreService.processServerNotification(notification);
    
    if (eventData) {
      await subscriptionService.processWebhookEvent('appstore', eventData);
    }

    // Apple expects 200-206 response
    res.status(200).json({ success: true });

  } catch (error) {
    logger.error('Apple webhook processing error', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    // Return 200 to acknowledge receipt even on processing errors
    res.status(200).json({ success: false, error: error.message });
  }
};

module.exports = exports;

