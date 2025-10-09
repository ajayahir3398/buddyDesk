# User Model Update - Verification and Subscription Fields

## Overview
Added two new fields to the User model to track user verification status and subscription information.

---

## New Fields Added

### 1. `is_verified` (BOOLEAN)
- **Type:** BOOLEAN
- **Default:** `false`
- **Description:** Indicates whether the user is verified (email verified, identity verified, Aadhaar verified, etc.)
- **Use Cases:**
  - Email verification status
  - Identity verification (Aadhaar, etc.)
  - Badge/badge display on profile
  - Access control for verified-only features
  - Trust indicators in the platform

### 2. `subscription_tier` (ENUM)
- **Type:** ENUM
- **Values:** `'free'`, `'basic'`, `'premium'`, `'enterprise'`
- **Default:** `'free'`
- **Description:** Current subscription tier of the user
- **Use Cases:**
  - Quick access to user's subscription level
  - Feature gating based on tier
  - UI customization
  - Analytics and reporting

### 3. `subscription_details` (Object - Computed)
- **Type:** Object (not stored in user table, fetched from subscriptions table)
- **Nullable:** `true` (null if no active subscription)
- **Description:** Full details of user's active subscription
- **Includes:**
  - `id` - Subscription UUID
  - `platform` - 'play' or 'appstore'
  - `product_id` - Product/SKU identifier
  - `status` - Current subscription status
  - `is_auto_renewing` - Auto-renewal status
  - `purchase_date` - Subscription purchase date
  - `expiry_date` - Subscription expiry date
  - `is_trial` - Whether it's a trial subscription

---

## Database Schema Changes

### SQL Migration
Run this SQL to add the new columns to your database:

```sql
-- Add is_verified field
ALTER TABLE user 
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE 
COMMENT 'Whether the user is verified (e.g., email verified, identity verified)';

-- Add subscription_tier field
ALTER TABLE user 
ADD COLUMN subscription_tier ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free' 
COMMENT 'Current subscription tier of the user';
```

### Indexes (Optional - for performance)
```sql
-- Add index for verified users queries
CREATE INDEX idx_user_is_verified ON user(is_verified);

-- Add index for subscription tier queries
CREATE INDEX idx_user_subscription_tier ON user(subscription_tier);
```

---

## Model Changes

### Updated User Model (`models/user.model.js`)

```javascript
is_verified: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
  comment: 'Whether the user is verified (e.g., email verified, identity verified)'
},
subscription_tier: {
  type: DataTypes.ENUM('free', 'basic', 'premium', 'enterprise'),
  defaultValue: 'free',
  comment: 'Current subscription tier of the user'
}
```

### New Association
```javascript
// Subscription-related associations
User.hasMany(models.Subscription, { foreignKey: 'user_id', as: 'subscriptions' });
```

---

## API Response Changes

### Profile Endpoints Updated

Both `GET /api/users/profile` and `GET /api/users/profile/:id` now include:

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "referral_code": "ABC123",
    "referred_user_count": 5,
    "is_blocked": false,
    "report_count": 0,
    "is_verified": true,
    "subscription_tier": "premium",
    "subscription_details": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "platform": "play",
      "product_id": "premium_monthly",
      "status": "active",
      "is_auto_renewing": true,
      "purchase_date": "2024-01-01T00:00:00.000Z",
      "expiry_date": "2024-02-01T00:00:00.000Z",
      "is_trial": false
    },
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-15T12:00:00.000Z",
    "profile": { ... },
    "work_profiles": [ ... ],
    "addresses": [ ... ]
  }
}
```

**Note:** `subscription_details` will be `null` if the user has no active subscription.

---

## Usage Examples

### 1. Check if User is Verified

```javascript
// In controller
const user = await User.findByPk(userId);
if (user.is_verified) {
  // Grant access to verified-only features
}
```

### 2. Check Subscription Tier

```javascript
// In controller
const user = await User.findByPk(userId);
switch (user.subscription_tier) {
  case 'free':
    // Free tier features
    break;
  case 'basic':
    // Basic tier features
    break;
  case 'premium':
    // Premium tier features
    break;
  case 'enterprise':
    // Enterprise tier features
    break;
}
```

### 3. Get Full Subscription Details

```javascript
// In controller
const activeSubscription = await Subscription.findOne({
      where: {
        user_id: userId,
        status: ['active', 'grace_period']
      },
      attributes: ['id', 'platform', 'product_id', 'status', 'is_auto_renewing', 'purchase_date', 'expiry_date', 'is_trial'],
      order: [['expiry_date', 'DESC']]
    });

    if (activeSubscription) {
      // User has active subscription
      console.log('Expires:', activeSubscription.expiry_date);
      console.log('Purchased:', activeSubscription.purchase_date);
    }
```

### 4. Update Verification Status

```javascript
// Mark user as verified after email verification
await user.update({ is_verified: true });

// Or after Aadhaar verification
const aadhaarVerification = await AadhaarVerification.findOne({
  where: { user_id: userId, status: 'verified' }
});

if (aadhaarVerification) {
  await user.update({ is_verified: true });
}
```

### 5. Update Subscription Tier

```javascript
// When subscription is activated
await user.update({ subscription_tier: 'premium' });

// When subscription expires
await user.update({ subscription_tier: 'free' });
```

---

## Frontend Integration

### Display Verification Badge

```javascript
function UserProfile({ user }) {
  return (
    <div>
      <h1>{user.name}</h1>
      {user.is_verified && (
        <span className="verified-badge">✓ Verified</span>
      )}
    </div>
  );
}
```

### Show Subscription Status

```javascript
function SubscriptionStatus({ user }) {
  return (
    <div>
      <p>Tier: {user.subscription_tier.toUpperCase()}</p>
      {user.subscription_details ? (
        <div>
          <p>Status: {user.subscription_details.status}</p>
          <p>Expires: {new Date(user.subscription_details.expiry_date).toLocaleDateString()}</p>
          {user.subscription_details.is_trial && (
            <span className="trial-badge">Trial</span>
          )}
        </div>
      ) : (
        <p>No active subscription</p>
      )}
    </div>
  );
}
```

### Feature Gating

```javascript
function PremiumFeature({ user }) {
  if (user.subscription_tier === 'free') {
    return <div>Upgrade to Premium to unlock this feature!</div>;
  }
  
  return <div>Premium content here...</div>;
}
```

---

## Verification Workflow Example

### Email Verification

```javascript
// After user clicks verification link
exports.verifyEmail = async (req, res) => {
  const { token } = req.params;
  
  // Verify token and find user
  const user = await User.findOne({ where: { email_verification_token: token } });
  
  if (user) {
    await user.update({ 
      is_verified: true,
      email_verification_token: null 
    });
    
    return res.json({
      success: true,
      message: 'Email verified successfully'
    });
  }
  
  return res.status(400).json({
    success: false,
    message: 'Invalid verification token'
  });
};
```

### Aadhaar Verification

```javascript
// After successful Aadhaar verification
exports.completeAadhaarVerification = async (req, res) => {
  const userId = req.user.id;
  
  // Update Aadhaar verification status
  await AadhaarVerification.update(
    { status: 'verified' },
    { where: { user_id: userId } }
  );
  
  // Mark user as verified
  await User.update(
    { is_verified: true },
    { where: { id: userId } }
  );
  
  return res.json({
    success: true,
    message: 'Aadhaar verification completed. You are now a verified user!'
  });
};
```

---

## Subscription Management

### Update Subscription Tier on Purchase

```javascript
// In IAP controller after successful purchase
exports.handleSubscriptionPurchase = async (req, res) => {
  const { userId, productId } = req.body;
  
  // Determine tier from product ID
  let tier = 'free';
  if (productId.includes('basic')) tier = 'basic';
  else if (productId.includes('premium')) tier = 'premium';
  else if (productId.includes('enterprise')) tier = 'enterprise';
  
  // Update user's subscription tier
  await User.update(
    { subscription_tier: tier },
    { where: { id: userId } }
  );
  
  // Create subscription record
  await Subscription.create({
    user_id: userId,
    product_id: productId,
    status: 'active',
    // ... other fields
  });
  
  return res.json({
    success: true,
    message: 'Subscription activated successfully'
  });
};
```

### Handle Subscription Expiry

```javascript
// Cron job or scheduled task
exports.checkExpiredSubscriptions = async () => {
  const expiredSubscriptions = await Subscription.findAll({
    where: {
      status: 'active',
      expiry_date: { [Op.lt]: new Date() }
    }
  });
  
  for (const subscription of expiredSubscriptions) {
    // Update subscription status
    await subscription.update({ status: 'expired' });
    
    // Downgrade user to free tier
    await User.update(
      { subscription_tier: 'free' },
      { where: { id: subscription.user_id } }
    );
  }
};
```

---

## Swagger Documentation

The Swagger UI has been updated to include these new fields in the User schema. Visit `/api-docs` to see:

- Updated User schema with `is_verified`, `subscription_tier`, and `subscription_details`
- Updated profile response examples
- Full subscription object structure

---

## Testing

### Manual Testing Checklist

- [ ] Create new user - verify `is_verified` defaults to `false`
- [ ] Create new user - verify `subscription_tier` defaults to `'free'`
- [ ] Fetch profile - verify new fields are included
- [ ] Update `is_verified` to `true` - verify change persists
- [ ] Update `subscription_tier` - verify change persists
- [ ] Create active subscription - verify `subscription_details` is populated
- [ ] Test with no active subscription - verify `subscription_details` is `null`
- [ ] Test expired subscription - verify correct handling
- [ ] Verify Swagger UI displays new fields correctly

### Test Data

```sql
-- Test: Create user with verification
INSERT INTO user (name, email, password, is_verified, subscription_tier) 
VALUES ('Test User', 'test@example.com', 'hashed_password', TRUE, 'premium');

-- Test: Update existing user
UPDATE user SET is_verified = TRUE, subscription_tier = 'basic' WHERE id = 1;
```

---

## Migration Steps

1. **Backup Database**
   ```bash
   mysqldump -u username -p buddydesk > backup_before_migration.sql
   ```

2. **Run SQL Migration**
   ```sql
   ALTER TABLE user 
   ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
   ADD COLUMN subscription_tier ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free';
   ```

3. **Restart Server**
   - The Sequelize models will recognize the new columns
   - No code changes needed beyond what's already implemented

4. **Verify Changes**
   - Check API responses include new fields
   - Test Swagger UI documentation
   - Verify default values are applied

---

## Rollback Plan

If you need to rollback:

```sql
-- Remove the new columns
ALTER TABLE user DROP COLUMN is_verified;
ALTER TABLE user DROP COLUMN subscription_tier;
```

Then revert the code changes in:
- `models/user.model.js`
- `controllers/user.controller.js`
- `config/swagger.config.js`

---

## Performance Considerations

- **Indexes:** Consider adding indexes on `is_verified` and `subscription_tier` if you frequently query by these fields
- **Subscription Lookup:** The `subscription_details` is fetched with an additional query. This is acceptable for profile endpoints but consider caching for high-traffic scenarios
- **Query Optimization:** The subscription query uses `status IN ['active', 'grace_period']` with proper indexes

---

## Security Considerations

- **Verification Status:** Should only be updated by backend logic, never directly by user input
- **Subscription Tier:** Should only be updated through verified payment/subscription flows
- **Admin Access:** Consider creating admin endpoints to manually verify users if needed

---

## Future Enhancements

1. **Multiple Verification Types**
   - Email verified
   - Phone verified
   - Identity verified (Aadhaar)
   - Business verified
   
2. **Subscription History**
   - Track all subscription changes
   - Billing history
   - Upgrade/downgrade tracking

3. **Verification Levels**
   - Basic verification (email)
   - Standard verification (phone + email)
   - Premium verification (identity documents)

4. **Custom Subscription Tiers**
   - Allow custom tier definitions
   - Feature matrix per tier
   - Dynamic pricing

---

## Support

For questions or issues regarding these changes:
- Check the updated Swagger documentation at `/api-docs`
- Review the controller implementations
- Contact the development team

---

## Changelog

### Version 1.0.0
- Added `is_verified` field to User model
- Added `subscription_tier` field to User model
- Added `subscription_details` computed field in profile responses
- Updated Swagger documentation
- Created comprehensive documentation

