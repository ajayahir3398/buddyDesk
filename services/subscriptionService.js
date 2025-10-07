const db = require('../models');
const logger = require('../utils/logger');
const googlePlayService = require('./googlePlayService');
const appleAppStoreService = require('./appleAppStoreService');

/**
 * Create or update subscription in database
 * @param {number} userId - User ID
 * @param {string} platform - 'play' or 'appstore'
 * @param {Object} subscriptionData - Parsed subscription data
 * @returns {Object} Subscription record
 */
async function upsertSubscription(userId, platform, subscriptionData) {
  try {
    const {
      purchaseToken,
      originalTransactionId,
      orderId,
      productId,
      purchaseDate,
      expiryDate,
      isAutoRenewing,
      isTrial,
      status,
      cancelReason,
      acknowledged,
      appAccountToken,
      currency,
      priceAmountMicros,
      environment,
      rawData
    } = subscriptionData;

    // Find existing subscription by purchase token or original transaction ID
    const whereClause = platform === 'play'
      ? { platform, purchase_token: purchaseToken }
      : { platform, original_transaction_id: originalTransactionId };

    const [subscription, created] = await db.Subscription.findOrCreate({
      where: whereClause,
      defaults: {
        user_id: userId,
        platform,
        product_id: productId,
        status,
        is_auto_renewing: isAutoRenewing,
        is_trial: isTrial,
        purchase_token: purchaseToken,
        original_transaction_id: originalTransactionId,
        order_id: orderId,
        purchase_date: purchaseDate,
        expiry_date: expiryDate,
        price_amount_micros: priceAmountMicros,
        currency,
        acknowledged: acknowledged || false,
        cancel_reason: cancelReason,
        app_account_token: appAccountToken,
        environment,
        raw_data: rawData
      }
    });

    if (!created) {
      // Update existing subscription
      await subscription.update({
        user_id: userId, // Update in case user changed
        product_id: productId,
        status,
        is_auto_renewing: isAutoRenewing,
        expiry_date: expiryDate,
        cancel_reason: cancelReason,
        acknowledged: acknowledged !== undefined ? acknowledged : subscription.acknowledged,
        raw_data: rawData,
        updated_at: new Date()
      });
    }

    logger.info('Subscription upserted', {
      userId,
      platform,
      subscriptionId: subscription.id,
      productId,
      status,
      created
    });

    return subscription;
  } catch (error) {
    logger.error('Failed to upsert subscription', {
      userId,
      platform,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Validate and save a purchase
 * @param {number} userId - User ID
 * @param {string} platform - 'play' or 'appstore'
 * @param {string} purchaseToken - Purchase token or transaction ID
 * @param {string} productId - Product ID
 * @returns {Object} Validation result with subscription
 */
async function validatePurchase(userId, platform, purchaseToken, productId) {
  try {
    let subscriptionData;

    // Verify with the appropriate store
    if (platform === 'play') {
      subscriptionData = await googlePlayService.verifySubscription(purchaseToken);
      
      // Acknowledge if not already acknowledged
      if (!subscriptionData.acknowledged) {
        await googlePlayService.acknowledgePurchase(purchaseToken);
        subscriptionData.acknowledged = true;
      }
    } else if (platform === 'appstore') {
      subscriptionData = await appleAppStoreService.verifySubscription(purchaseToken);
    } else {
      throw new Error('Invalid platform');
    }

    // Verify product ID matches
    if (subscriptionData.productId !== productId) {
      logger.warn('Product ID mismatch', {
        expected: productId,
        received: subscriptionData.productId
      });
      throw new Error('Product ID mismatch');
    }

    // Save to database
    const subscription = await upsertSubscription(userId, platform, subscriptionData);

    return {
      success: true,
      subscription,
      isActive: subscription.status === 'active' && 
                new Date(subscription.expiry_date) > new Date()
    };
  } catch (error) {
    logger.error('Purchase validation failed', {
      userId,
      platform,
      purchaseToken: purchaseToken?.substring(0, 20) + '...',
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Process webhook event and update subscription
 * @param {string} platform - 'play' or 'appstore'
 * @param {Object} eventData - Parsed event data
 * @returns {Object} Processing result
 */
async function processWebhookEvent(platform, eventData) {
  try {
    const {
      eventType,
      purchaseToken,
      originalTransactionId,
      productId,
      notificationId,
      subscriptionDetails,
      rawPayload
    } = eventData;

    // Check for duplicate notification
    if (notificationId) {
      const existingEvent = await db.SubscriptionEvent.findOne({
        where: { platform, notification_id: notificationId }
      });

      if (existingEvent) {
        logger.info('Duplicate webhook event ignored', {
          platform,
          eventType,
          notificationId
        });
        return { success: true, duplicate: true };
      }
    }

    // Find the subscription
    const whereClause = platform === 'play'
      ? { platform, purchase_token: purchaseToken }
      : { platform, original_transaction_id: originalTransactionId };

    let subscription = await db.Subscription.findOne({ where: whereClause });

    if (!subscription) {
      // Create new subscription if it doesn't exist
      // This can happen if webhook arrives before initial validation
      logger.warn('Subscription not found for webhook, creating new', {
        platform,
        eventType,
        purchaseToken,
        originalTransactionId
      });
      
      // We need a user_id - try to get from app_account_token or set to null
      subscription = await db.Subscription.create({
        user_id: null, // Will need to be linked later
        platform,
        product_id: productId,
        purchase_token: purchaseToken,
        original_transaction_id: originalTransactionId,
        ...subscriptionDetails
      });
    } else {
      // Update existing subscription
      await subscription.update({
        status: subscriptionDetails.status,
        is_auto_renewing: subscriptionDetails.isAutoRenewing,
        expiry_date: subscriptionDetails.expiryDate,
        cancel_reason: subscriptionDetails.cancelReason,
        cancel_date: subscriptionDetails.cancelReason ? new Date() : subscription.cancel_date,
        last_notification_type: eventType,
        last_notification_date: new Date(),
        raw_data: subscriptionDetails.rawData
      });
    }

    // Log the event
    await db.SubscriptionEvent.create({
      subscription_id: subscription.id,
      event_type: eventType,
      platform,
      notification_id: notificationId,
      event_timestamp: new Date(),
      processed: true,
      processed_at: new Date(),
      raw_payload: rawPayload
    });

    logger.info('Webhook event processed', {
      platform,
      eventType,
      subscriptionId: subscription.id,
      status: subscription.status
    });

    return {
      success: true,
      subscription,
      eventType
    };
  } catch (error) {
    logger.error('Failed to process webhook event', {
      platform,
      eventType: eventData.eventType,
      error: error.message,
      stack: error.stack
    });

    // Log failed event
    try {
      await db.SubscriptionEvent.create({
        subscription_id: null,
        event_type: eventData.eventType,
        platform,
        notification_id: eventData.notificationId,
        event_timestamp: new Date(),
        processed: false,
        raw_payload: eventData.rawPayload,
        error_message: error.message
      });
    } catch (logError) {
      logger.error('Failed to log failed event', { error: logError.message });
    }

    throw error;
  }
}

/**
 * Get user's active subscriptions
 * @param {number} userId - User ID
 * @returns {Array} Active subscriptions
 */
async function getUserActiveSubscriptions(userId) {
  try {
    const subscriptions = await db.Subscription.findAll({
      where: {
        user_id: userId,
        status: 'active',
        expiry_date: {
          [db.Sequelize.Op.gt]: new Date()
        }
      },
      order: [['expiry_date', 'DESC']]
    });

    return subscriptions;
  } catch (error) {
    logger.error('Failed to get user subscriptions', {
      userId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Check if user has an active subscription for a product
 * @param {number} userId - User ID
 * @param {string} productId - Product ID (optional)
 * @returns {boolean} Whether user has active subscription
 */
async function hasActiveSubscription(userId, productId = null) {
  try {
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

    const count = await db.Subscription.count({ where: whereClause });
    return count > 0;
  } catch (error) {
    logger.error('Failed to check active subscription', {
      userId,
      productId,
      error: error.message
    });
    return false;
  }
}

/**
 * Reconcile subscription with store (for cron jobs)
 * @param {string} subscriptionId - Subscription ID
 * @returns {Object} Reconciliation result
 */
async function reconcileSubscription(subscriptionId) {
  try {
    const subscription = await db.Subscription.findByPk(subscriptionId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    let subscriptionData;

    if (subscription.platform === 'play') {
      subscriptionData = await googlePlayService.verifySubscription(
        subscription.purchase_token
      );
    } else if (subscription.platform === 'appstore') {
      subscriptionData = await appleAppStoreService.verifySubscription(
        subscription.purchase_token
      );
    }

    // Update if there are changes
    if (subscriptionData.status !== subscription.status ||
        subscriptionData.expiryDate?.getTime() !== subscription.expiry_date?.getTime()) {
      
      await subscription.update({
        status: subscriptionData.status,
        expiry_date: subscriptionData.expiryDate,
        is_auto_renewing: subscriptionData.isAutoRenewing,
        raw_data: subscriptionData.rawData
      });

      logger.info('Subscription reconciled with changes', {
        subscriptionId,
        oldStatus: subscription.status,
        newStatus: subscriptionData.status
      });

      return { updated: true, subscription };
    }

    return { updated: false, subscription };
  } catch (error) {
    logger.error('Failed to reconcile subscription', {
      subscriptionId,
      error: error.message
    });
    throw error;
  }
}

module.exports = {
  upsertSubscription,
  validatePurchase,
  processWebhookEvent,
  getUserActiveSubscriptions,
  hasActiveSubscription,
  reconcileSubscription
};

