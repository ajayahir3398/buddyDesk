# IAP Installation Instructions

## Quick Install

### 1. Install NPM Dependencies

```bash
npm install googleapis jsonwebtoken node-fetch
```

### 2. Update .gitignore

Add to your `.gitignore`:

```gitignore
# IAP Credentials - NEVER COMMIT THESE
config/google-service-account.json
config/apple-private-key.p8
```

### 3. Create Credential Files Directory

The config directory should already exist, but ensure these files will be placed there:

```
config/
  ├── google-service-account.json  (you'll add this)
  ├── apple-private-key.p8         (you'll add this)
  └── iap.config.js                (already created)
```

### 4. Set Up Environment Variables

Copy the environment variables from `docs/ENV_EXAMPLE.txt` to your `.env` file:

```env
# Google Play
GOOGLE_PLAY_PACKAGE_NAME=com.yourapp.package
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./config/google-service-account.json
GOOGLE_PUBSUB_VERIFICATION_TOKEN=your-secret-token

# Apple App Store
APPLE_BUNDLE_ID=com.yourapp.bundle
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_ISSUER_ID=YOUR_ISSUER_ID
APPLE_PRIVATE_KEY_PATH=./config/apple-private-key.p8
APPLE_USE_SANDBOX=true
```

### 5. Get Google Play Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create service account
3. Enable Google Play Android Publisher API
4. Download JSON key
5. Save as `config/google-service-account.json`
6. Link in Play Console → Settings → API Access

Full instructions: `docs/IAP_IMPLEMENTATION_GUIDE.md` → Google Play Setup

### 6. Get Apple App Store Credentials

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Users and Access → Keys → Create API Key
3. Download `.p8` file
4. Save as `config/apple-private-key.p8`
5. Note the Key ID and Issuer ID

Full instructions: `docs/IAP_IMPLEMENTATION_GUIDE.md` → Apple App Store Setup

### 7. Configure Products

Edit `config/iap.config.js` and update your product IDs:

```javascript
PRODUCTS: {
  MONTHLY: {
    play: 'your_monthly_product_id',
    appstore: 'your_monthly_product_id'
  },
  YEARLY: {
    play: 'your_yearly_product_id',
    appstore: 'your_yearly_product_id'
  }
}
```

### 8. Start Server

```bash
npm start
```

Database tables will be created automatically.

### 9. Test the Setup

```bash
# Test validation endpoint
curl -X POST http://localhost:3000/api/iap/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "play",
    "purchaseToken": "test_token",
    "productId": "monthly_subscription"
  }'
```

### 10. Configure Webhooks (Production)

**Google Play:**
- Create Pub/Sub topic in Google Cloud
- Configure endpoint: `https://yourdomain.com/api/webhooks/google/pubsub`
- Enable in Play Console → Monetization setup → Real-time developer notifications

**Apple:**
- Configure in App Store Connect → Your App → App Information
- URL: `https://yourdomain.com/api/webhooks/apple/notifications`
- Select Version 2

### 11. Set Up Reconciliation Cron Job

Add to your crontab (daily at 2 AM):

```
0 2 * * * cd /path/to/app && node scripts/reconcileSubscriptions.js
```

Or use your platform's scheduler (Heroku Scheduler, AWS EventBridge, etc.)

---

## Files Created

✅ Database Models:
- `models/subscription.model.js`
- `models/subscriptionEvent.model.js`

✅ Services:
- `services/googlePlayService.js`
- `services/appleAppStoreService.js`
- `services/subscriptionService.js`

✅ Controllers:
- `controllers/iap.controller.js`

✅ Routes:
- `routes/iap.routes.js`

✅ Configuration:
- `config/iap.config.js`

✅ Scripts:
- `scripts/reconcileSubscriptions.js`

✅ Documentation:
- `docs/IAP_IMPLEMENTATION_GUIDE.md` (Full guide)
- `docs/IAP_QUICK_START.md` (Quick start)
- `docs/IAP_SUMMARY.md` (Summary)
- `docs/IAP_FILE_STRUCTURE.md` (File structure)
- `docs/ENV_EXAMPLE.txt` (Environment template)

---

## API Endpoints Available

### Client Endpoints (Require Auth)
- `POST /api/iap/validate` - Validate purchase
- `GET /api/iap/subscriptions` - Get user subscriptions
- `GET /api/iap/subscriptions/:id` - Get subscription details
- `GET /api/iap/status` - Check subscription status
- `POST /api/iap/refresh/:id` - Refresh subscription

### Webhook Endpoints
- `POST /api/webhooks/google/pubsub` - Google Play webhook
- `POST /api/webhooks/apple/notifications` - Apple App Store webhook

---

## Next Steps

1. **Test with Sandbox:**
   - Create test accounts in both stores
   - Test purchase flow
   - Test webhook notifications

2. **React Native Integration:**
   - Install `react-native-iap`
   - Implement purchase flow
   - Call `/api/iap/validate` after purchase

3. **Production Deployment:**
   - Set production credentials
   - Set `APPLE_USE_SANDBOX=false`
   - Configure monitoring
   - Test thoroughly

---

## Documentation

📖 **Complete Guide:** `docs/IAP_IMPLEMENTATION_GUIDE.md`
🚀 **Quick Start:** `docs/IAP_QUICK_START.md`
📋 **Summary:** `docs/IAP_SUMMARY.md`
📁 **File Structure:** `docs/IAP_FILE_STRUCTURE.md`

---

## Troubleshooting

**Issue:** "Authentication failed"
→ Check credential file paths and permissions

**Issue:** "Webhooks not working"
→ Verify HTTPS endpoint and webhook configuration

**Issue:** "Invalid purchase token"
→ Ensure package name / bundle ID is correct

See full troubleshooting guide in `docs/IAP_IMPLEMENTATION_GUIDE.md`

---

## Support

All implementation files are ready to use. The system is:
✅ Secure (server-side verification)
✅ Scalable (async processing)
✅ Reliable (webhook + reconciliation)
✅ Well-documented
✅ Production-ready

**Happy coding! 🚀**

