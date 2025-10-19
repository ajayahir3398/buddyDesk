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
 * @param {string} purchaseToken - Transaction ID (StoreKit 2) or receipt data (StoreKit 1)
 * @returns {Object} Subscription details
 */
async function verifySubscription(purchaseToken) {
  try {
    // Determine if this is StoreKit 1 receipt or StoreKit 2 transaction ID
    if (isReceiptData(purchaseToken)) {
      // StoreKit 1: Base64 receipt validation
      return await verifyReceipt(purchaseToken);
    } else {
      // StoreKit 2: Transaction ID validation
      const transactionInfo = await getTransactionInfo(purchaseToken);
      
      // Decode the signed transaction info
      const decodedTransaction = decodeJWS(transactionInfo.signedTransactionInfo);
      
      logger.info('Apple subscription verified (StoreKit 2)', {
        transactionId: purchaseToken.substring(0, 20) + '...',
        productId: decodedTransaction.productId
      });

      return parseTransactionData(decodedTransaction, transactionInfo);
    }
  } catch (error) {
    logger.error('Apple subscription verification failed', {
      purchaseToken: purchaseToken.substring(0, 20) + '...',
      error: error.message
    });
    throw error;
  }
}

/**
 * Check if the input is a base64 receipt (StoreKit 1) or transaction ID (StoreKit 2)
 * @param {string} input - The input string to check
 * @returns {boolean} True if it's a receipt, false if it's a transaction ID
 */
function isReceiptData(input) {
  // Receipt data is typically much longer and contains specific patterns
  // Transaction IDs are usually shorter alphanumeric strings
  return input.length > 500 && input.includes('MII'); // Common receipt pattern
}

/**
 * Get human-readable error message for Apple receipt validation status codes
 * @param {number} status - Apple status code
 * @returns {string} Human-readable error message
 */
function getAppleErrorMessage(status) {
  const errorMessages = {
    21000: 'The App Store could not read the JSON object you provided',
    21002: 'The data in the receipt-data property was malformed or missing',
    21003: 'The receipt could not be authenticated',
    21004: 'The shared secret you provided does not match the shared secret on file for your account',
    21005: 'The receipt server is not currently available',
    21006: 'This receipt is valid but the subscription has expired',
    21007: 'This receipt is from the sandbox environment, but it was sent to the production environment for verification',
    21008: 'This receipt is from the production environment, but it was sent to the sandbox environment for verification',
    21009: 'Internal data access error',
    21010: 'The user account cannot be found or has been deleted'
  };
  
  return errorMessages[status] || `Unknown Apple error code: ${status}`;
}

/**
 * Verify Apple receipt using StoreKit 1 API
 * @param {string} receiptData - Base64 encoded receipt
 * @returns {Object} Subscription details
 */
async function verifyReceipt(receiptData) {
  let cleanReceiptData;
  
  try {
    // Validate receipt data
    if (!receiptData || typeof receiptData !== 'string') {
      throw new Error('Receipt data is required and must be a string');
    }

    // Clean the receipt data - remove any extra whitespace, quotes, or JSON formatting
    cleanReceiptData = receiptData.trim();
    
    // Check if this might be JSON-encoded data
    if (cleanReceiptData.startsWith('{') || cleanReceiptData.startsWith('[')) {
      logger.warn('Receipt data appears to be JSON encoded, this should be raw base64');
      try {
        const parsed = JSON.parse(cleanReceiptData);
        if (typeof parsed === 'string') {
          cleanReceiptData = parsed;
        } else if (parsed.receipt || parsed.receiptData) {
          cleanReceiptData = parsed.receipt || parsed.receiptData;
        } else {
          throw new Error('Unable to extract receipt data from JSON');
        }
      } catch (jsonError) {
        logger.warn('Failed to parse JSON receipt data', { error: jsonError.message });
      }
    }
    
    // Remove any surrounding quotes if they exist
    if ((cleanReceiptData.startsWith('"') && cleanReceiptData.endsWith('"')) ||
        (cleanReceiptData.startsWith("'") && cleanReceiptData.endsWith("'"))) {
      cleanReceiptData = cleanReceiptData.slice(1, -1);
    }

    // Remove any whitespace characters (newlines, tabs, etc.)
    cleanReceiptData = cleanReceiptData.replace(/\s/g, '');

    if (cleanReceiptData.length < 100) {
      throw new Error('Receipt data appears to be too short (likely truncated)');
    }

    // Check if it's valid base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanReceiptData)) {
      logger.error('Receipt data validation failed', {
        originalLength: receiptData.length,
        cleanedLength: cleanReceiptData.length,
        originalStart: receiptData.substring(0, 50),
        cleanedStart: cleanReceiptData.substring(0, 50),
        hasInvalidChars: !base64Regex.test(cleanReceiptData)
      });
      throw new Error('Receipt data is not valid base64 after cleaning');
    }

    // Log receipt info for debugging (first/last 20 chars)
    logger.info('Validating Apple receipt', {
      originalLength: receiptData.length,
      cleanedLength: cleanReceiptData.length,
      receiptStart: cleanReceiptData.substring(0, 20),
      receiptEnd: cleanReceiptData.substring(cleanReceiptData.length - 20),
      hasSharedSecret: !!iapConfig.APPLE_APPSTORE.SHARED_SECRET,
      environment: iapConfig.APPLE_APPSTORE.USE_SANDBOX ? 'sandbox' : 'production'
    });

    const url = iapConfig.APPLE_APPSTORE.USE_SANDBOX
      ? 'https://sandbox.itunes.apple.com/verifyReceipt'
      : 'https://buy.itunes.apple.com/verifyReceipt';

    const body = {
      'receipt-data': cleanReceiptData, // Use the cleaned receipt data
      'password': iapConfig.APPLE_APPSTORE.SHARED_SECRET || '', // App-specific shared secret
      'exclude-old-transactions': true
    };

    logger.info('Sending request to Apple', {
      url,
      hasPassword: !!body.password,
      passwordLength: body.password ? body.password.length : 0
    });

    const response = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' }
    });

    const result = response.data;

    logger.info('Apple response received', {
      status: result.status,
      environment: result.environment,
      hasReceipt: !!result.receipt,
      hasLatestReceiptInfo: !!(result.latest_receipt_info && result.latest_receipt_info.length)
    });

    // Handle sandbox/production receipt mismatch
    if (result.status === 21007 && !iapConfig.APPLE_APPSTORE.USE_SANDBOX) {
      // Receipt is from sandbox but we're in production, retry with sandbox
      logger.info('Retrying receipt validation with sandbox');
      const sandboxResponse = await axios.post(
        'https://sandbox.itunes.apple.com/verifyReceipt',
        body,
        { headers: { 'Content-Type': 'application/json' } }
      );
      return parseReceiptResponse(sandboxResponse.data, cleanReceiptData);
    }

    return parseReceiptResponse(result, cleanReceiptData);
  } catch (error) {
    logger.error('Apple receipt verification failed', {
      error: error.message,
      originalLength: receiptData?.length || 0,
      cleanedLength: cleanReceiptData?.length || 0,
      receiptStart: cleanReceiptData?.substring(0, 20) || 'N/A',
      hasSharedSecret: !!iapConfig.APPLE_APPSTORE.SHARED_SECRET,
      environment: iapConfig.APPLE_APPSTORE.USE_SANDBOX ? 'sandbox' : 'production'
    });
    throw error;
  }
}

/**
 * Parse Apple receipt response into our format
 * @param {Object} receiptResponse - Apple's receipt verification response
 * @param {string} receiptData - Original receipt data
 * @returns {Object} Parsed subscription info
 */
function parseReceiptResponse(receiptResponse, receiptData) {
  if (receiptResponse.status !== 0) {
    const errorMessage = getAppleErrorMessage(receiptResponse.status);
    logger.error('Apple receipt verification failed', {
      status: receiptResponse.status,
      error: errorMessage,
      receiptLength: receiptData?.length || 0,
      environment: receiptResponse.environment
    });
    throw new Error(`Apple receipt verification failed with status: ${receiptResponse.status} - ${errorMessage}`);
  }

  const receipt = receiptResponse.receipt;
  const latestReceiptInfo = receiptResponse.latest_receipt_info || [];

  if (!latestReceiptInfo.length) {
    throw new Error('No subscription found in receipt');
  }

  // Get the latest transaction (most recent subscription)
  const latestTransaction = latestReceiptInfo.reduce((latest, current) => {
    const currentDate = new Date(parseInt(current.expires_date_ms));
    const latestDate = new Date(parseInt(latest.expires_date_ms));
    return currentDate > latestDate ? current : latest;
  });

  // Determine status based on expiry
  const expiryDate = new Date(parseInt(latestTransaction.expires_date_ms));
  const now = new Date();
  let status = 'active';
  
  if (expiryDate < now) {
    status = 'expired';
  }

  // Check for cancellation
  if (receiptResponse.pending_renewal_info) {
    const renewalInfo = receiptResponse.pending_renewal_info.find(
      info => info.original_transaction_id === latestTransaction.original_transaction_id
    );
    if (renewalInfo && renewalInfo.auto_renew_status === '0') {
      status = 'cancelled';
    }
  }

  logger.info('Apple receipt verified (StoreKit 1)', {
    productId: latestTransaction.product_id,
    status,
    expiresDate: expiryDate
  });

  return {
    purchaseToken: latestTransaction.transaction_id,
    originalTransactionId: latestTransaction.original_transaction_id,
    orderId: latestTransaction.web_order_line_item_id || latestTransaction.transaction_id,
    productId: latestTransaction.product_id,
    purchaseDate: new Date(parseInt(latestTransaction.purchase_date_ms)),
    expiryDate: expiryDate,
    isAutoRenewing: receiptResponse.pending_renewal_info ? 
      receiptResponse.pending_renewal_info.some(info => info.auto_renew_status === '1') : true,
    isTrial: latestTransaction.is_trial_period === 'true',
    status: status,
    cancelReason: null,
    appAccountToken: latestTransaction.app_account_token || null,
    currency: latestTransaction.currency || null,
    priceAmountMicros: latestTransaction.price ? parseFloat(latestTransaction.price) * 1000000 : null,
    environment: receiptResponse.environment || 'Production',
    rawData: {
      receipt: receipt,
      latestReceiptInfo: latestReceiptInfo,
      pendingRenewalInfo: receiptResponse.pending_renewal_info,
      response: receiptResponse
    }
  };
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

