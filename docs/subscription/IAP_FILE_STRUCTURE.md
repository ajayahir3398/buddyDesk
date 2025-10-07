# IAP Implementation File Structure

## Overview
This document shows all files related to the In-App Purchase (IAP) implementation.

## File Tree

```
buddyDesk/
│
├── config/
│   ├── iap.config.js                    # IAP configuration
│   ├── google-service-account.json      # Google service account (NOT in git)
│   └── apple-private-key.p8             # Apple private key (NOT in git)
│
├── models/
│   ├── subscription.model.js            # Subscription database model
│   ├── subscriptionEvent.model.js       # Webhook event logs
│   └── index.js                          # Updated to include new models
│
├── services/
│   ├── googlePlayService.js             # Google Play verification service
│   ├── appleAppStoreService.js          # Apple App Store verification service
│   └── subscriptionService.js           # Core subscription business logic
│
├── controllers/
│   └── iap.controller.js                # IAP API endpoints controller
│
├── routes/
│   └── iap.routes.js                    # IAP route definitions
│
├── scripts/
│   └── reconcileSubscriptions.js        # Daily reconciliation cron job
│
├── docs/
│   ├── IAP_IMPLEMENTATION_GUIDE.md      # Complete guide (40+ pages)
│   ├── IAP_QUICK_START.md               # Quick start guide
│   ├── IAP_SUMMARY.md                   # Implementation summary
│   ├── IAP_FILE_STRUCTURE.md            # This file
│   └── ENV_EXAMPLE.txt                  # Environment variables template
│
├── app.js                               # Updated to register IAP routes
├── package.json                         # Update with new dependencies
└── .gitignore                           # Add credential files
```

## File Descriptions

### Configuration Files

**`config/iap.config.js`**
- Google Play configuration (package name, Pub/Sub settings)
- Apple App Store configuration (bundle ID, key IDs)
- Product ID mappings
- Webhook secrets

**`config/google-service-account.json`** ⚠️ SECRET
- Google Cloud service account credentials
- Downloaded from Google Cloud Console
- **MUST be in .gitignore**

**`config/apple-private-key.p8`** ⚠️ SECRET
- Apple App Store Connect API private key
- Downloaded from App Store Connect
- **MUST be in .gitignore**

### Database Models

**`models/subscription.model.js`**
- Main subscription table
- Fields: user_id, platform, product_id, status, expiry_date, etc.
- Associations: belongsTo User

**`models/subscriptionEvent.model.js`**
- Webhook event logging table
- Fields: event_type, platform, notification_id, raw_payload, etc.
- Associations: belongsTo Subscription

### Services (Business Logic)

**`services/googlePlayService.js`**
- `verifySubscription()` - Verify purchase with Google Play
- `acknowledgePurchase()` - Acknowledge purchase
- `processRTDN()` - Process webhook notifications
- `parseSubscriptionData()` - Parse Google response

**`services/appleAppStoreService.js`**
- `verifySubscription()` - Verify purchase with App Store
- `getTransactionInfo()` - Get transaction details
- `getAllSubscriptionStatuses()` - Get subscription statuses
- `processServerNotification()` - Process webhook notifications
- `decodeJWS()` - Decode Apple signed payloads
- `generateAppleJWT()` - Generate JWT for API requests

**`services/subscriptionService.js`**
- `validatePurchase()` - Main purchase validation logic
- `upsertSubscription()` - Create/update subscription
- `processWebhookEvent()` - Process webhook events
- `getUserActiveSubscriptions()` - Get user's active subscriptions
- `hasActiveSubscription()` - Check if user has active subscription
- `reconcileSubscription()` - Reconcile with store

### Controllers (API Endpoints)

**`controllers/iap.controller.js`**
- `validatePurchase()` - POST /api/iap/validate
- `getUserSubscriptions()` - GET /api/iap/subscriptions
- `getSubscriptionDetails()` - GET /api/iap/subscriptions/:id
- `checkSubscriptionStatus()` - GET /api/iap/status
- `refreshSubscription()` - POST /api/iap/refresh/:id
- `handleGoogleWebhook()` - POST /api/webhooks/google/pubsub
- `handleAppleWebhook()` - POST /api/webhooks/apple/notifications

### Routes

**`routes/iap.routes.js`**
- Route definitions with validation middleware
- Swagger documentation annotations
- Authentication middleware for client endpoints
- No auth for webhook endpoints

### Scripts

**`scripts/reconcileSubscriptions.js`**
- Daily cron job to reconcile subscriptions
- Fetches all active subscriptions
- Verifies with store servers
- Updates database if status changed
- Marks expired subscriptions
- Run: `node scripts/reconcileSubscriptions.js`
- Cron: `0 2 * * * node /app/scripts/reconcileSubscriptions.js`

### Documentation

**`docs/IAP_IMPLEMENTATION_GUIDE.md`**
- Complete implementation guide
- Setup instructions for Google Play and Apple
- API endpoint documentation
- Testing procedures
- Troubleshooting guide
- Security best practices
- React Native integration examples

**`docs/IAP_QUICK_START.md`**
- Quick start guide
- Step-by-step setup
- Essential configuration
- Testing commands
- Troubleshooting tips

**`docs/IAP_SUMMARY.md`**
- High-level overview
- Architecture summary
- File listing
- Flow diagrams
- Deployment checklist

**`docs/ENV_EXAMPLE.txt`**
- Environment variable template
- All required configuration
- Copy to `.env` and update

## Dependencies Added

```json
{
  "googleapis": "^126.0.0",      // Google Play API client
  "jsonwebtoken": "^9.0.2",      // JWT for Apple API
  "node-fetch": "^2.7.0"         // HTTP client for Apple API
}
```

Install with:
```bash
npm install googleapis jsonwebtoken node-fetch
```

## Database Tables Created

### `subscriptions`
Automatically created by Sequelize when server starts.

### `subscription_events`
Automatically created by Sequelize when server starts.

## Environment Variables Required

See `docs/ENV_EXAMPLE.txt` for complete list.

Minimum required:
- `GOOGLE_PLAY_PACKAGE_NAME`
- `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`
- `APPLE_BUNDLE_ID`
- `APPLE_KEY_ID`
- `APPLE_ISSUER_ID`
- `APPLE_PRIVATE_KEY_PATH`

## .gitignore Updates

Add these lines:
```
# IAP Credentials
config/google-service-account.json
config/apple-private-key.p8
```

## API Endpoints Summary

### Client Endpoints (Authenticated)
- POST `/api/iap/validate` - Validate purchase
- GET `/api/iap/subscriptions` - List subscriptions
- GET `/api/iap/subscriptions/:id` - Get details
- GET `/api/iap/status` - Check status
- POST `/api/iap/refresh/:id` - Refresh from store

### Webhook Endpoints (Verified Differently)
- POST `/api/webhooks/google/pubsub` - Google webhooks
- POST `/api/webhooks/apple/notifications` - Apple webhooks

## Testing Files Needed

Create these for testing:
- `tests/iap/google-play.test.js` - Google Play tests
- `tests/iap/apple-appstore.test.js` - Apple App Store tests
- `tests/iap/subscription-service.test.js` - Service tests

## Deployment Checklist

- [ ] Install dependencies: `npm install googleapis jsonwebtoken node-fetch`
- [ ] Add credential files (not in git)
- [ ] Set environment variables
- [ ] Update .gitignore
- [ ] Configure webhook URLs in store consoles
- [ ] Test with sandbox accounts
- [ ] Set up monitoring
- [ ] Schedule reconciliation cron job
- [ ] Deploy to production

## Security Notes

⚠️ **NEVER commit these files:**
- `config/google-service-account.json`
- `config/apple-private-key.p8`
- `.env`

✅ **Always verify:**
- Server-side validation
- HTTPS for webhooks
- User authentication for client endpoints
- Webhook signature verification

## Next Steps

1. Read `docs/IAP_QUICK_START.md` for setup
2. Follow `docs/IAP_IMPLEMENTATION_GUIDE.md` for detailed implementation
3. Test with sandbox accounts
4. Deploy to production

## Support

For questions or issues:
1. Check `docs/IAP_IMPLEMENTATION_GUIDE.md` troubleshooting section
2. Review code comments in service files
3. Check application logs in `logs/combined.log`
4. Review `subscription_events` table for webhook issues

