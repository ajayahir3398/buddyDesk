module.exports = {
  // Google Play Configuration
  GOOGLE_PLAY: {
    PACKAGE_NAME: process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.yourapp.package',
    SERVICE_ACCOUNT_KEY_PATH: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || './config/google-service-account.json',
    PUBSUB_TOPIC: process.env.GOOGLE_PUBSUB_TOPIC || '',
    PUBSUB_SUBSCRIPTION: process.env.GOOGLE_PUBSUB_SUBSCRIPTION || '',
    PUBSUB_VERIFICATION_TOKEN: process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN || '', // Optional: for push endpoint verification
  },

  // Apple App Store Configuration
  APPLE_APPSTORE: {
    BUNDLE_ID: process.env.APPLE_BUNDLE_ID || 'com.yourapp.bundle',
    KEY_ID: process.env.APPLE_KEY_ID || '', // Your App Store Connect API Key ID
    ISSUER_ID: process.env.APPLE_ISSUER_ID || '', // Your App Store Connect Issuer ID
    PRIVATE_KEY_PATH: process.env.APPLE_PRIVATE_KEY_PATH || './config/apple-private-key.p8',
    SHARED_SECRET: process.env.APPLE_SHARED_SECRET || '', // App-specific shared secret for receipt validation
    // Use sandbox for testing
    USE_SANDBOX: process.env.APPLE_USE_SANDBOX === 'true' || process.env.NODE_ENV !== 'production',
  },

  // Subscription Product IDs (configure your products)
  PRODUCTS: {
    MONTHLY: {
      play: 'monthly_subscription',
      appstore: 'monthly_subscription'
    },
    YEARLY: {
      play: 'yearly_subscription',
      appstore: 'yearly_subscription'
    },
    // Add more products as needed
  },

  // Grace period settings (in days)
  GRACE_PERIOD_DAYS: 3,

  // Webhook verification
  WEBHOOK_SECRET: process.env.IAP_WEBHOOK_SECRET || 'change-this-secret-in-production'
};

