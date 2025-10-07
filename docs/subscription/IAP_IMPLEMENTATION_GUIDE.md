# In-App Purchase (IAP) Subscription Implementation Guide

## Overview

This guide covers the complete implementation of in-app purchase subscriptions for both Google Play Store and Apple App Store in your BuddyDesk Node.js backend.

## Table of Contents

1. [Setup & Prerequisites](#setup--prerequisites)
2. [Database Schema](#database-schema)
3. [Configuration](#configuration)
4. [API Endpoints](#api-endpoints)
5. [Webhook Integration](#webhook-integration)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Setup & Prerequisites

### 1. Install Required Dependencies

```bash
npm install googleapis jsonwebtoken node-fetch
```

### 2. Google Play Setup

#### A. Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Play Android Publisher API**
4. Create a Service Account:
   - Go to **IAM & Admin** → **Service Accounts**
   - Click **Create Service Account**
   - Name it (e.g., "play-billing-service")
   - Grant **Service Account User** role
   - Create and download JSON key file
5. Save the JSON file as `config/google-service-account.json` (keep it secure, add to `.gitignore`)

#### B. Link Service Account to Play Console

1. Go to [Google Play Console](https://play.google.com/console/)
2. Navigate to **Settings** → **API access**
3. Link your Cloud project
4. Grant access to the service account:
   - Click on service account name
   - Grant permissions: **View financial data**, **Manage orders and subscriptions**

#### C. Enable Real-time Developer Notifications (RTDN)

1. In Google Cloud Console, create a **Pub/Sub topic**:
   ```
   Topic name: play-billing-notifications
   ```
2. Create a **Pub/Sub subscription** (push or pull):
   - For push: Set endpoint to `https://yourdomain.com/api/webhooks/google/pubsub`
   - For pull: Your server will poll for messages
3. In Play Console → **Monetization setup** → **Real-time developer notifications**:
   - Enable notifications
   - Enter your Pub/Sub topic name
   - Save

### 3. Apple App Store Setup

#### A. Create App Store Connect API Key

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Navigate to **Users and Access** → **Keys** (under Integrations section)
3. Click **+** to create a new key
4. Name it (e.g., "IAP Server API")
5. Select **Access**: **App Manager** role (minimum)
6. Click **Generate**
7. Download the `.p8` private key file (you can only download it once!)
8. Note the **Key ID** and **Issuer ID** displayed

Save the `.p8` file as `config/apple-private-key.p8` (add to `.gitignore`)

#### B. Enable App Store Server Notifications V2

1. In App Store Connect, go to your app
2. Navigate to **App Information** (under General section)
3. Scroll to **App Store Server Notifications**
4. Enter your production and sandbox URLs:
   - Production: `https://yourdomain.com/api/webhooks/apple/notifications`
   - Sandbox: `https://sandbox.yourdomain.com/api/webhooks/apple/notifications` (or same URL)
5. Select **Version 2**
6. Save

---

## Database Schema

The implementation uses two tables:

### 1. `subscriptions` Table

Stores all subscription records with the following key fields:

- `id` (UUID) - Primary key
- `user_id` (INTEGER) - Links to your users table
- `platform` (ENUM: 'play', 'appstore') - Purchase platform
- `product_id` (STRING) - Product SKU
- `status` (ENUM) - Subscription status (active, canceled, expired, etc.)
- `purchase_token` (TEXT) - Google token or Apple transaction ID
- `original_transaction_id` (STRING) - Apple original transaction ID
- `expiry_date` (DATE) - When subscription expires
- `is_auto_renewing` (BOOLEAN) - Auto-renewal status
- `raw_data` (JSONB) - Full store response for debugging

### 2. `subscription_events` Table

Logs all webhook events and changes:

- `subscription_id` (UUID) - References subscriptions
- `event_type` (STRING) - Event name (RENEWAL, CANCELLATION, etc.)
- `platform` (ENUM) - 'play' or 'appstore'
- `notification_id` (STRING) - Unique ID for deduplication
- `processed` (BOOLEAN) - Processing status
- `raw_payload` (JSONB) - Full webhook payload

### Database Migration

The tables will be created automatically when you start the server (Sequelize auto-sync).

For production, create a migration:

```sql
-- Run this in PostgreSQL
-- The models will handle schema creation via Sequelize
```

---

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Google Play Configuration
GOOGLE_PLAY_PACKAGE_NAME=com.yourapp.package
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./config/google-service-account.json
GOOGLE_PUBSUB_TOPIC=projects/your-project/topics/play-billing-notifications
GOOGLE_PUBSUB_SUBSCRIPTION=projects/your-project/subscriptions/play-billing-sub
GOOGLE_PUBSUB_VERIFICATION_TOKEN=your-secret-token-here

# Apple App Store Configuration
APPLE_BUNDLE_ID=com.yourapp.bundle
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_ISSUER_ID=YOUR_ISSUER_ID
APPLE_PRIVATE_KEY_PATH=./config/apple-private-key.p8
APPLE_USE_SANDBOX=true  # Set to false in production

# IAP Configuration
IAP_WEBHOOK_SECRET=change-this-secret-in-production
```

### Product IDs

Configure your subscription products in `config/iap.config.js`:

```javascript
PRODUCTS: {
  MONTHLY: {
    play: 'monthly_subscription',
    appstore: 'monthly_subscription'
  },
  YEARLY: {
    play: 'yearly_subscription',
    appstore: 'yearly_subscription'
  }
}
```

---

## API Endpoints

### 1. Validate Purchase (Client → Server)

**POST** `/api/iap/validate`

**Headers:**
```
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "platform": "play",
  "purchaseToken": "hdgfjk...token_from_store",
  "productId": "monthly_subscription",
  "appAccountToken": "optional_uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Purchase validated successfully",
  "data": {
    "subscription": {
      "id": "uuid",
      "productId": "monthly_subscription",
      "status": "active",
      "isActive": true,
      "expiryDate": "2025-11-07T12:00:00Z",
      "isAutoRenewing": true,
      "isTrial": false,
      "platform": "play"
    }
  }
}
```

### 2. Get User Subscriptions

**GET** `/api/iap/subscriptions`

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptions": [...],
    "activeCount": 1,
    "hasActiveSubscription": true
  }
}
```

### 3. Check Subscription Status

**GET** `/api/iap/status?productId=monthly_subscription`

**Response:**
```json
{
  "success": true,
  "data": {
    "hasActiveSubscription": true,
    "subscription": {
      "id": "uuid",
      "productId": "monthly_subscription",
      "status": "active",
      "expiryDate": "2025-11-07T12:00:00Z"
    }
  }
}
```

### 4. Get Subscription Details

**GET** `/api/iap/subscriptions/:id`

### 5. Refresh Subscription

**POST** `/api/iap/refresh/:id`

Forces re-validation with the store.

---

## Webhook Integration

### Google Play Webhook (RTDN)

**Endpoint:** `POST /api/webhooks/google/pubsub`

**Request Format (from Pub/Sub):**
```json
{
  "message": {
    "data": "base64_encoded_notification",
    "messageId": "123",
    "publishTime": "2025-10-07T12:00:00Z"
  },
  "subscription": "projects/.../subscriptions/..."
}
```

**Event Types Handled:**
- `SUBSCRIPTION_PURCHASED` (1)
- `SUBSCRIPTION_RENEWED` (2)
- `SUBSCRIPTION_CANCELED` (3)
- `SUBSCRIPTION_ON_HOLD` (5)
- `SUBSCRIPTION_IN_GRACE_PERIOD` (6)
- `SUBSCRIPTION_REVOKED` (12)
- `SUBSCRIPTION_EXPIRED` (13)

### Apple App Store Webhook

**Endpoint:** `POST /api/webhooks/apple/notifications`

**Request Format:**
```json
{
  "signedPayload": "eyJh...JWS_signed_payload"
}
```

**Event Types Handled:**
- `DID_RENEW`
- `DID_FAIL_TO_RENEW`
- `EXPIRED`
- `GRACE_PERIOD_EXPIRED`
- `REFUND`
- `REVOKE`
- `DID_CHANGE_RENEWAL_STATUS`

### Webhook Security

1. **Google Play**: 
   - Use verification token in query parameter
   - Verify Pub/Sub message authenticity
   - Use HTTPS only

2. **Apple**:
   - Verify JWS signature (implementation uses decode for simplicity; add signature verification for production)
   - Validate notification UUID for deduplication

---

## Testing

### Google Play Testing

1. **Create Test Account:**
   - In Play Console → **Setup** → **License testing**
   - Add test email addresses

2. **Send Test Notifications:**
   - In Play Console → **Monetization** → **Real-time developer notifications**
   - Click **Send test notification**
   - Choose notification type and send

3. **Test Purchase Flow:**
   ```javascript
   // In your React Native app
   const purchase = await RNIap.requestSubscription('monthly_subscription');
   
   // Send to backend
   await fetch('https://yourapi.com/api/iap/validate', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       platform: 'play',
       purchaseToken: purchase.purchaseToken,
       productId: 'monthly_subscription'
     })
   });
   ```

### Apple App Store Testing

1. **Create Sandbox Tester:**
   - App Store Connect → **Users and Access** → **Sandbox Testers**
   - Create test account

2. **Test in Sandbox:**
   - Use sandbox tester credentials on iOS device
   - Set `APPLE_USE_SANDBOX=true` in backend

3. **Test Notifications:**
   - Apple provides **StoreKit Testing in Xcode** for local testing
   - For server notifications, use sandbox environment URL

### Manual Testing with cURL

**Validate Purchase:**
```bash
curl -X POST https://yourapi.com/api/iap/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "play",
    "purchaseToken": "test_token",
    "productId": "monthly_subscription"
  }'
```

**Check Status:**
```bash
curl -X GET https://yourapi.com/api/iap/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Production Deployment

### Pre-deployment Checklist

- [ ] Service account JSON file is secure (not in repo)
- [ ] Apple `.p8` key is secure (not in repo)
- [ ] Environment variables are set in production
- [ ] `APPLE_USE_SANDBOX=false` in production
- [ ] Webhook URLs are HTTPS
- [ ] Database is properly migrated
- [ ] Logging is configured
- [ ] Error monitoring is set up (e.g., Sentry)

### Deployment Steps

1. **Update Environment Variables:**
   ```bash
   # In your hosting platform (Heroku, AWS, etc.)
   heroku config:set GOOGLE_PLAY_PACKAGE_NAME=com.yourapp.package
   heroku config:set APPLE_BUNDLE_ID=com.yourapp.bundle
   # ... etc
   ```

2. **Upload Credential Files:**
   - Use secure file storage or environment variable injection
   - For Heroku: use `heroku config:set` with base64-encoded files
   - For AWS/GCP: use secrets manager

3. **Set Up Monitoring:**
   - Monitor webhook endpoint health
   - Track failed subscription validations
   - Set up alerts for high error rates

4. **Configure Reconciliation Cron Job:**
   
   Create a scheduled task to reconcile subscriptions:
   
   ```javascript
   // scripts/reconcileSubscriptions.js
   const { Subscription } = require('../models');
   const subscriptionService = require('../services/subscriptionService');
   
   async function reconcileAllActiveSubscriptions() {
     const subscriptions = await Subscription.findAll({
       where: { status: 'active' }
     });
     
     for (const sub of subscriptions) {
       try {
         await subscriptionService.reconcileSubscription(sub.id);
       } catch (error) {
         console.error(`Failed to reconcile ${sub.id}:`, error);
       }
     }
   }
   
   reconcileAllActiveSubscriptions();
   ```
   
   Schedule with cron (daily):
   ```
   0 2 * * * node /app/scripts/reconcileSubscriptions.js
   ```

---

## React Native Client Integration

### Installation

```bash
npm install react-native-iap
# or
yarn add react-native-iap
```

### Example Client Code

```javascript
import React, { useEffect, useState } from 'react';
import RNIap, {
  requestSubscription,
  useIAP,
  getSubscriptions,
  finishTransaction
} from 'react-native-iap';

const subscriptionSkus = Platform.select({
  ios: ['monthly_subscription', 'yearly_subscription'],
  android: ['monthly_subscription', 'yearly_subscription']
});

function SubscriptionScreen() {
  const {
    connected,
    subscriptions,
    getSubscriptions,
    currentPurchase,
    finishTransaction
  } = useIAP();

  useEffect(() => {
    if (connected) {
      getSubscriptions({ skus: subscriptionSkus });
    }
  }, [connected]);

  useEffect(() => {
    if (currentPurchase) {
      validatePurchaseWithBackend(currentPurchase);
    }
  }, [currentPurchase]);

  const validatePurchaseWithBackend = async (purchase) => {
    try {
      const platform = Platform.OS === 'ios' ? 'appstore' : 'play';
      const purchaseToken = Platform.OS === 'ios' 
        ? purchase.transactionId 
        : purchase.purchaseToken;

      const response = await fetch('https://yourapi.com/api/iap/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform,
          purchaseToken,
          productId: purchase.productId
        })
      });

      const result = await response.json();

      if (result.success) {
        // Grant access to premium features
        console.log('Subscription validated:', result.data);
        
        // Finish the transaction
        await finishTransaction({
          purchase,
          isConsumable: false
        });
      }
    } catch (error) {
      console.error('Failed to validate purchase:', error);
    }
  };

  const handleSubscribe = async (sku) => {
    try {
      await requestSubscription({
        sku,
        ...(Platform.OS === 'android' && {
          subscriptionOffers: [{ sku, offerToken: 'base_offer' }]
        })
      });
    } catch (error) {
      console.error('Subscription failed:', error);
    }
  };

  return (
    // Your UI
    subscriptions.map(sub => (
      <Button 
        key={sub.productId}
        title={`Subscribe ${sub.localizedPrice}`}
        onPress={() => handleSubscribe(sub.productId)}
      />
    ))
  );
}
```

---

## Troubleshooting

### Common Issues

#### 1. Google Play: "Invalid purchase token"

**Solution:**
- Verify service account has correct permissions in Play Console
- Check that `GOOGLE_PLAY_PACKAGE_NAME` matches your app's package name
- Ensure purchase token is fresh (< 5 minutes old)

#### 2. Apple: "JWT generation failed"

**Solution:**
- Verify `.p8` file path is correct
- Check `APPLE_KEY_ID` and `APPLE_ISSUER_ID` are correct
- Ensure private key file format is valid

#### 3. Webhooks Not Receiving Events

**Google Play:**
- Verify Pub/Sub topic and subscription are correctly configured
- Check webhook endpoint is publicly accessible (HTTPS)
- Test with "Send test notification" in Play Console

**Apple:**
- Verify webhook URL is configured in App Store Connect
- Check endpoint is HTTPS
- Ensure server returns 200-206 status codes

#### 4. Subscription Status Not Updating

**Solution:**
- Check webhook logs for processing errors
- Run manual reconciliation
- Verify database connection and permissions

### Debugging Tips

1. **Enable Detailed Logging:**
   ```javascript
   // In your logger config
   logger.level = 'debug';
   ```

2. **Test Webhooks Locally:**
   Use ngrok to expose local server:
   ```bash
   ngrok http 3000
   # Use ngrok URL for webhook endpoints during development
   ```

3. **Check Raw Payloads:**
   All raw webhook payloads are stored in `subscription_events.raw_payload` for debugging.

4. **Monitor Database:**
   ```sql
   -- Check recent subscription events
   SELECT * FROM subscription_events 
   ORDER BY created_at DESC 
   LIMIT 10;

   -- Check failed events
   SELECT * FROM subscription_events 
   WHERE processed = false;
   ```

---

## Security Best Practices

1. **Never trust client data** - Always verify with store servers
2. **Keep credentials secure** - Use environment variables and secrets management
3. **Verify webhook authenticity** - Implement signature verification
4. **Use HTTPS** - All communication must be encrypted
5. **Log everything** - Keep audit trail for compliance and debugging
6. **Rate limit endpoints** - Prevent abuse
7. **Validate user ownership** - Ensure users can only access their subscriptions

---

## Support & Resources

### Documentation Links

- [Google Play Billing Documentation](https://developer.android.com/google/play/billing)
- [Google Play Android Publisher API](https://developers.google.com/android-publisher)
- [Apple App Store Server API](https://developer.apple.com/documentation/appstoreserverapi)
- [Apple App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications)
- [React Native IAP](https://github.com/dooboolab/react-native-iap)

### Need Help?

Check the logs in:
- `logs/combined.log` - All application logs
- `logs/error.log` - Error logs only

---

## License

This implementation is part of the BuddyDesk project.

