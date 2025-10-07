# IAP Quick Start Guide

## Step-by-Step Implementation

### 1. Install Dependencies

```bash
npm install googleapis jsonwebtoken node-fetch
```

### 2. Setup Google Play

1. Create service account in Google Cloud Console
2. Download JSON key → save as `config/google-service-account.json`
3. Enable Google Play Android Publisher API
4. Link service account in Play Console
5. Setup Pub/Sub for RTDN notifications

### 3. Setup Apple App Store

1. Create API Key in App Store Connect
2. Download `.p8` file → save as `config/apple-private-key.p8`
3. Note Key ID and Issuer ID
4. Configure Server Notifications V2 webhook URL

### 4. Environment Variables

Create/update `.env`:

```env
# Google Play
GOOGLE_PLAY_PACKAGE_NAME=com.yourapp.package
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./config/google-service-account.json
GOOGLE_PUBSUB_VERIFICATION_TOKEN=your-secret-token

# Apple App Store
APPLE_BUNDLE_ID=com.yourapp.bundle
APPLE_KEY_ID=ABC123XYZ
APPLE_ISSUER_ID=12345678-1234-1234-1234-123456789012
APPLE_PRIVATE_KEY_PATH=./config/apple-private-key.p8
APPLE_USE_SANDBOX=true

# IAP
IAP_WEBHOOK_SECRET=change-this-in-production
```

### 5. Update Product IDs

Edit `config/iap.config.js`:

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

### 6. Add to .gitignore

```
# IAP Credentials
config/google-service-account.json
config/apple-private-key.p8
```

### 7. Start Server

```bash
npm start
```

Database tables will be created automatically.

### 8. Test Endpoints

**Validate Purchase:**
```bash
curl -X POST http://localhost:3000/api/iap/validate \
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
curl -X GET http://localhost:3000/api/iap/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 9. Configure Webhooks

**Google Play:**
- Endpoint: `https://yourdomain.com/api/webhooks/google/pubsub`
- Configure in Google Cloud Pub/Sub

**Apple:**
- Endpoint: `https://yourdomain.com/api/webhooks/apple/notifications`
- Configure in App Store Connect

### 10. React Native Integration

```javascript
// Install
npm install react-native-iap

// Usage
import { requestSubscription } from 'react-native-iap';

const purchase = await requestSubscription({ sku: 'monthly_subscription' });

await fetch('https://yourapi.com/api/iap/validate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    platform: Platform.OS === 'ios' ? 'appstore' : 'play',
    purchaseToken: Platform.OS === 'ios' 
      ? purchase.transactionId 
      : purchase.purchaseToken,
    productId: 'monthly_subscription'
  })
});
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/iap/validate` | Validate a purchase |
| GET | `/api/iap/subscriptions` | Get user subscriptions |
| GET | `/api/iap/subscriptions/:id` | Get subscription details |
| GET | `/api/iap/status` | Check subscription status |
| POST | `/api/iap/refresh/:id` | Refresh subscription from store |
| POST | `/api/webhooks/google/pubsub` | Google webhook |
| POST | `/api/webhooks/apple/notifications` | Apple webhook |

## Testing

### Google Play Test
1. Add test account in Play Console
2. Send test notification from Play Console
3. Test with real Android device

### Apple App Store Test
1. Create sandbox tester in App Store Connect
2. Set `APPLE_USE_SANDBOX=true`
3. Test with real iOS device

## Troubleshooting

**Issue: "Authentication failed"**
- Check credential file paths
- Verify Key IDs and Issuer IDs
- Ensure service account has correct permissions

**Issue: "Webhooks not working"**
- Verify HTTPS endpoint is accessible
- Check webhook URL configuration in console
- Test locally with ngrok

**Issue: "Product not found"**
- Verify product IDs match store configuration
- Check products are active in store console
- Ensure app has correct bundle ID / package name

## What Data is Stored?

### Required Fields
- User ID (your internal user)
- Platform (play/appstore)
- Product ID (subscription SKU)
- Purchase token / Transaction ID
- Expiry date
- Status (active, canceled, expired, etc.)

### Additional Fields
- Auto-renewal status
- Trial status
- Price and currency
- Cancel reason
- Full raw response (JSONB for debugging)

## Security Checklist

- [ ] Credentials not in git repository
- [ ] `.env` file in `.gitignore`
- [ ] HTTPS enabled for webhooks
- [ ] Environment variables set in production
- [ ] Webhook endpoints verified
- [ ] Server-side validation always performed
- [ ] User authentication required for all endpoints

## Next Steps

1. Set up monitoring (Sentry, LogRocket, etc.)
2. Configure reconciliation cron job
3. Test all subscription scenarios
4. Set up customer support workflows
5. Configure analytics tracking

## Resources

- Full Guide: `docs/IAP_IMPLEMENTATION_GUIDE.md`
- Config: `config/iap.config.js`
- Models: `models/subscription.model.js`
- Services: `services/googlePlayService.js`, `services/appleAppStoreService.js`

