const { google } = require('googleapis');
const db = require('../models');
const logger = require('../utils/logger');
const iapConfig = require('../config/iap.config');

/**
 * Initialize Google Auth Client
 */
async function getAuthClient() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: iapConfig.GOOGLE_PLAY.SERVICE_ACCOUNT_KEY_PATH,
      scopes: ['https://www.googleapis.com/auth/androidpublisher']
    });
    return await auth.getClient();
  } catch (error) {
    logger.error('Failed to initialize Google Auth Client', {
      error: error.message,
      stack: error.stack
    });
    throw new Error('Google Play authentication failed');
  }
}

/**
 * Verify and get subscription details from Google Play
 * @param {string} purchaseToken - The purchase token from the client
 * @returns {Object} Subscription details
 */
async function verifySubscription(purchaseToken) {
  try {
    const authClient = await getAuthClient();
    const androidpublisher = google.androidpublisher({ 
      version: 'v3', 
      auth: authClient 
    });

    const response = await androidpublisher.purchases.subscriptionsv2.get({
      packageName: iapConfig.GOOGLE_PLAY.PACKAGE_NAME,
      token: purchaseToken
    });

    const subscriptionData = response.data;
    logger.info('Google Play subscription verified', {
      purchaseToken: purchaseToken.substring(0, 20) + '...',
      state: subscriptionData.subscriptionState
    });

    return parseSubscriptionData(subscriptionData);
  } catch (error) {
    logger.error('Google Play subscription verification failed', {
      purchaseToken: purchaseToken.substring(0, 20) + '...',
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Parse Google Play subscription data into our format
 * @param {Object} subscriptionData - Raw subscription data from Google
 * @returns {Object} Parsed subscription info
 */
function parseSubscriptionData(subscriptionData) {
  const lineItem = subscriptionData.lineItems?.[0] || {};
  const expiryTime = lineItem.expiryTime;
  const startTime = subscriptionData.startTime;
  
  // Map Google subscription states to our status
  const statusMap = {
    'SUBSCRIPTION_STATE_ACTIVE': 'active',
    'SUBSCRIPTION_STATE_CANCELED': 'canceled',
    'SUBSCRIPTION_STATE_IN_GRACE_PERIOD': 'grace_period',
    'SUBSCRIPTION_STATE_ON_HOLD': 'on_hold',
    'SUBSCRIPTION_STATE_PAUSED': 'paused',
    'SUBSCRIPTION_STATE_EXPIRED': 'expired',
    'SUBSCRIPTION_STATE_PENDING': 'pending'
  };

  const status = statusMap[subscriptionData.subscriptionState] || 'pending';
  
  // Extract cancel reason if exists
  let cancelReason = null;
  if (subscriptionData.canceledStateContext) {
    const userCanceled = subscriptionData.canceledStateContext.userInitiatedCancellation;
    const systemCanceled = subscriptionData.canceledStateContext.systemInitiatedCancellation;
    const replaced = subscriptionData.canceledStateContext.replacedWithAnotherSubscription;
    
    if (userCanceled) {
      cancelReason = 'user_canceled';
    } else if (systemCanceled) {
      cancelReason = 'system_canceled';
    } else if (replaced) {
      cancelReason = 'replaced';
    }
  }

  return {
    purchaseToken: subscriptionData.latestOrderId,
    orderId: subscriptionData.latestOrderId,
    productId: lineItem.productId,
    purchaseDate: startTime ? new Date(startTime) : null,
    expiryDate: expiryTime ? new Date(expiryTime) : null,
    isAutoRenewing: lineItem.autoRenewingPlan != null,
    isTrial: subscriptionData.testPurchase != null,
    status: status,
    cancelReason: cancelReason,
    acknowledged: subscriptionData.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    currency: lineItem.offerDetails?.pricingPhases?.[0]?.priceCurrencyCode || null,
    priceAmountMicros: lineItem.offerDetails?.pricingPhases?.[0]?.priceAmountMicros || null,
    environment: subscriptionData.testPurchase ? 'sandbox' : 'production',
    rawData: subscriptionData
  };
}

/**
 * Acknowledge a Google Play purchase
 * @param {string} purchaseToken - The purchase token
 * @returns {boolean} Success status
 */
async function acknowledgePurchase(purchaseToken) {
  try {
    const authClient = await getAuthClient();
    const androidpublisher = google.androidpublisher({ 
      version: 'v3', 
      auth: authClient 
    });

    await androidpublisher.purchases.subscriptions.acknowledge({
      packageName: iapConfig.GOOGLE_PLAY.PACKAGE_NAME,
      subscriptionId: purchaseToken,
      requestBody: {}
    });

    logger.info('Google Play purchase acknowledged', {
      purchaseToken: purchaseToken.substring(0, 20) + '...'
    });

    return true;
  } catch (error) {
    logger.error('Failed to acknowledge Google Play purchase', {
      purchaseToken: purchaseToken.substring(0, 20) + '...',
      error: error.message
    });
    return false;
  }
}

/**
 * Process Google Play Real-time Developer Notification (RTDN)
 * @param {Object} notification - The RTDN notification object
 * @returns {Object} Processed event data
 */
async function processRTDN(notification) {
  try {
    const subscriptionNotification = notification.subscriptionNotification;
    
    if (!subscriptionNotification) {
      logger.warn('Received RTDN without subscriptionNotification', { notification });
      return null;
    }

    const { 
      version, 
      notificationType, 
      purchaseToken, 
      subscriptionId 
    } = subscriptionNotification;

    // Notification type mapping
    const notificationTypeMap = {
      1: 'SUBSCRIPTION_RECOVERED',
      2: 'SUBSCRIPTION_RENEWED',
      3: 'SUBSCRIPTION_CANCELED',
      4: 'SUBSCRIPTION_PURCHASED',
      5: 'SUBSCRIPTION_ON_HOLD',
      6: 'SUBSCRIPTION_IN_GRACE_PERIOD',
      7: 'SUBSCRIPTION_RESTARTED',
      8: 'SUBSCRIPTION_PRICE_CHANGE_CONFIRMED',
      9: 'SUBSCRIPTION_DEFERRED',
      10: 'SUBSCRIPTION_PAUSED',
      11: 'SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED',
      12: 'SUBSCRIPTION_REVOKED',
      13: 'SUBSCRIPTION_EXPIRED'
    };

    const eventType = notificationTypeMap[notificationType] || `UNKNOWN_${notificationType}`;

    logger.info('Processing Google RTDN', {
      eventType,
      notificationType,
      purchaseToken: purchaseToken?.substring(0, 20) + '...',
      subscriptionId
    });

    // Fetch full subscription details
    const subscriptionDetails = await verifySubscription(purchaseToken);

    return {
      eventType,
      purchaseToken,
      productId: subscriptionId,
      notificationId: `google_${version}_${Date.now()}`,
      subscriptionDetails,
      rawPayload: notification
    };
  } catch (error) {
    logger.error('Failed to process Google RTDN', {
      error: error.message,
      stack: error.stack,
      notification
    });
    throw error;
  }
}

/**
 * Refund a subscription (for testing or customer support)
 * Note: Actual refunds must be initiated from Google Play Console
 * This function only checks refund status
 */
async function checkRefundStatus(purchaseToken) {
  try {
    const subscriptionData = await verifySubscription(purchaseToken);
    return {
      isRefunded: subscriptionData.status === 'revoked',
      subscriptionData
    };
  } catch (error) {
    logger.error('Failed to check refund status', {
      purchaseToken: purchaseToken.substring(0, 20) + '...',
      error: error.message
    });
    throw error;
  }
}

module.exports = {
  verifySubscription,
  acknowledgePurchase,
  processRTDN,
  checkRefundStatus,
  parseSubscriptionData
};

