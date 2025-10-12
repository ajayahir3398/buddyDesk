const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const db = require('../models');
const logger = require('../utils/logger');
const iapConfig = require('../config/iap.config');

/**
 * Generate JWT token for App Store Connect API
 * @returns {string} JWT token
 */
function generateAppleJWT() {
  try {
    const privateKey = fs.readFileSync(iapConfig.APPLE_APPSTORE.PRIVATE_KEY_PATH, 'utf8');
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      iss: iapConfig.APPLE_APPSTORE.ISSUER_ID,
      iat: now,
      exp: now + (20 * 60), // 20 minutes (max allowed by Apple)
      aud: 'appstoreconnect-v1',
      bid: iapConfig.APPLE_APPSTORE.BUNDLE_ID
    };

    return jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      keyid: iapConfig.APPLE_APPSTORE.KEY_ID
    });
  } catch (error) {
    logger.error('Failed to generate Apple JWT', {
      error: error.message,
      stack: error.stack
    });
    throw new Error('Apple JWT generation failed');
  }
}

/**
 * Get base URL for App Store Server API
 * @returns {string} Base URL
 */
function getBaseURL() {
  return iapConfig.APPLE_APPSTORE.USE_SANDBOX
    ? 'https://api.storekit-sandbox.itunes.apple.com'
    : 'https://api.storekit.itunes.apple.com';
}

/**
 * Make authenticated request to App Store Server API
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Object} body - Request body (optional)
 * @returns {Object} Response data
 */
async function makeAppleAPIRequest(endpoint, method = 'GET', body = null) {
  try {
    const token = generateAppleJWT();
    const url = `${getBaseURL()}${endpoint}`;
    
    const options = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.data = body;
    }

    const response = await axios(options);
    return response.data;
  } catch (error) {
    // Axios error handling
    const errorMessage = error.response 
      ? `Apple API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      : error.message;
    
    logger.error('Apple API request failed', {
      endpoint,
      error: errorMessage,
      stack: error.stack
    });
    throw new Error(errorMessage);
  }
}

/**
 * Get transaction info from Apple
 * @param {string} transactionId - Original transaction ID
 * @returns {Object} Transaction details
 */
async function getTransactionInfo(transactionId) {
  try {
    const response = await makeAppleAPIRequest(
      `/inApps/v1/transactions/${transactionId}`
    );

    logger.info('Apple transaction info retrieved', {
      transactionId: transactionId.substring(0, 20) + '...'
    });

    return response;
  } catch (error) {
    logger.error('Failed to get Apple transaction info', {
      transactionId: transactionId.substring(0, 20) + '...',
      error: error.message
    });
    throw error;
  }
}

/**
 * Get all subscription statuses for an original transaction ID
 * @param {string} originalTransactionId - Original transaction ID
 * @returns {Object} Subscription statuses
 */
async function getAllSubscriptionStatuses(originalTransactionId) {
  try {
    const response = await makeAppleAPIRequest(
      `/inApps/v1/subscriptions/${originalTransactionId}`
    );

    logger.info('Apple subscription statuses retrieved', {
      originalTransactionId: originalTransactionId.substring(0, 20) + '...'
    });

    return response;
  } catch (error) {
    logger.error('Failed to get Apple subscription statuses', {
      originalTransactionId: originalTransactionId.substring(0, 20) + '...',
      error: error.message
    });
    throw error;
  }
}

/**
 * Decode Apple's JWS (JSON Web Signature) signed payload
 * @param {string} signedPayload - JWS string
 * @returns {Object} Decoded payload
 */
function decodeJWS(signedPayload) {
  try {
    // JWS format: header.payload.signature
    const parts = signedPayload.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWS format');
    }

    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(payload);
  } catch (error) {
    logger.error('Failed to decode Apple JWS', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Verify and parse Apple receipt (for initial purchase validation)
 * @param {string} transactionId - Transaction ID from client
 * @returns {Object} Subscription details
 */
async function verifySubscription(transactionId) {
  try {
    const transactionInfo = await getTransactionInfo(transactionId);
    
    // Decode the signed transaction info
    const decodedTransaction = decodeJWS(transactionInfo.signedTransactionInfo);
    
    logger.info('Apple subscription verified', {
      transactionId: transactionId.substring(0, 20) + '...',
      productId: decodedTransaction.productId
    });

    return parseTransactionData(decodedTransaction, transactionInfo);
  } catch (error) {
    logger.error('Apple subscription verification failed', {
      transactionId: transactionId.substring(0, 20) + '...',
      error: error.message
    });
    throw error;
  }
}

/**
 * Parse Apple transaction data into our format
 * @param {Object} transactionData - Decoded transaction from Apple
 * @param {Object} rawResponse - Raw API response
 * @returns {Object} Parsed subscription info
 */
function parseTransactionData(transactionData, rawResponse = {}) {
  // Map Apple transaction types to our status
  const typeMap = {
    'Auto-Renewable Subscription': 'active',
    'Non-Consumable': 'active',
    'Non-Renewing Subscription': 'active'
  };

  const expiresDate = transactionData.expiresDate 
    ? new Date(parseInt(transactionData.expiresDate)) 
    : null;
  
  const purchaseDate = transactionData.purchaseDate 
    ? new Date(parseInt(transactionData.purchaseDate)) 
    : null;

  // Determine status based on expiry
  let status = 'active';
  if (expiresDate && expiresDate < new Date()) {
    status = 'expired';
  }

  // Check for revocation
  if (transactionData.revocationDate) {
    status = 'revoked';
  }

  return {
    purchaseToken: transactionData.transactionId,
    originalTransactionId: transactionData.originalTransactionId,
    orderId: transactionData.webOrderLineItemId || transactionData.transactionId,
    productId: transactionData.productId,
    purchaseDate: purchaseDate,
    expiryDate: expiresDate,
    isAutoRenewing: true, // Default for auto-renewable subscriptions
    isTrial: transactionData.offerType === 5, // 5 = Free trial
    status: status,
    cancelReason: transactionData.revocationReason 
      ? `revocation_reason_${transactionData.revocationReason}` 
      : null,
    appAccountToken: transactionData.appAccountToken || null,
    currency: transactionData.currency || null,
    priceAmountMicros: transactionData.price ? transactionData.price * 1000000 : null,
    environment: transactionData.environment || 'Production',
    rawData: {
      transaction: transactionData,
      response: rawResponse
    }
  };
}

/**
 * Process App Store Server Notification v2
 * @param {Object} notification - The notification object
 * @returns {Object} Processed event data
 */
async function processServerNotification(notification) {
  try {
    const { notificationType, subtype, data } = notification;
    
    if (!data || !data.signedTransactionInfo) {
      logger.warn('Received Apple notification without transaction info', { notification });
      return null;
    }

    // Decode signed transaction and renewal info
    const transactionInfo = decodeJWS(data.signedTransactionInfo);
    const renewalInfo = data.signedRenewalInfo 
      ? decodeJWS(data.signedRenewalInfo) 
      : null;

    logger.info('Processing Apple Server Notification', {
      notificationType,
      subtype,
      transactionId: transactionInfo.transactionId?.substring(0, 20) + '...',
      productId: transactionInfo.productId
    });

    // Map notification type to event type
    const eventType = `${notificationType}${subtype ? `_${subtype}` : ''}`;

    const subscriptionDetails = parseTransactionData(transactionInfo, {
      renewalInfo,
      notificationType,
      subtype
    });

    // Update auto-renewing status from renewal info
    if (renewalInfo) {
      subscriptionDetails.isAutoRenewing = renewalInfo.autoRenewStatus === 1;
    }

    // Adjust status based on notification type
    if (notificationType === 'EXPIRED') {
      subscriptionDetails.status = 'expired';
    } else if (notificationType === 'DID_FAIL_TO_RENEW') {
      subscriptionDetails.status = 'in_retry';
    } else if (notificationType === 'GRACE_PERIOD_EXPIRED') {
      subscriptionDetails.status = 'expired';
    } else if (notificationType === 'REFUND') {
      subscriptionDetails.status = 'revoked';
      subscriptionDetails.cancelReason = 'refunded';
    }

    return {
      eventType,
      purchaseToken: transactionInfo.transactionId,
      originalTransactionId: transactionInfo.originalTransactionId,
      productId: transactionInfo.productId,
      notificationId: notification.notificationUUID || `apple_${Date.now()}`,
      subscriptionDetails,
      rawPayload: notification
    };
  } catch (error) {
    logger.error('Failed to process Apple Server Notification', {
      error: error.message,
      stack: error.stack,
      notification
    });
    throw error;
  }
}

/**
 * Get transaction history for a user (for reconciliation)
 * @param {string} originalTransactionId - Original transaction ID
 * @returns {Array} Transaction history
 */
async function getTransactionHistory(originalTransactionId) {
  try {
    const response = await makeAppleAPIRequest(
      `/inApps/v1/history/${originalTransactionId}`
    );

    const transactions = [];
    if (response.signedTransactions) {
      for (const signedTransaction of response.signedTransactions) {
        const decoded = decodeJWS(signedTransaction);
        transactions.push(decoded);
      }
    }

    logger.info('Apple transaction history retrieved', {
      originalTransactionId: originalTransactionId.substring(0, 20) + '...',
      count: transactions.length
    });

    return transactions;
  } catch (error) {
    logger.error('Failed to get Apple transaction history', {
      originalTransactionId: originalTransactionId.substring(0, 20) + '...',
      error: error.message
    });
    throw error;
  }
}

module.exports = {
  verifySubscription,
  getTransactionInfo,
  getAllSubscriptionStatuses,
  getTransactionHistory,
  processServerNotification,
  decodeJWS,
  parseTransactionData,
  generateAppleJWT
};

