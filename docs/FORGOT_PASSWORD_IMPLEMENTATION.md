# Forgot Password Implementation Guide

## Overview
This guide documents the forgot password functionality with email authentication using Resend email service.

## Features Implemented
1. **Forgot Password Endpoint** - Sends password reset email with secure token
2. **Reset Password Endpoint** - Validates token and updates password
3. **Email Service** - Professional email templates for reset and confirmation
4. **Security Features**:
   - Secure token generation using crypto
   - Token hashing before storage
   - Token expiry (1 hour)
   - Email enumeration protection
   - Session invalidation on password reset

## Database Changes

### Migration File
Location: `migrations/add_password_reset_fields.sql`

Run the migration to add required fields to the user table:
```sql
-- Connect to your PostgreSQL database and run:
psql -U your_username -d your_database -f migrations/add_password_reset_fields.sql
```

Or manually execute:
```sql
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) DEFAULT NULL;

ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_user_reset_token ON "user" (reset_token);
```

### User Model Changes
File: `models/user.model.js`

Added two new fields:
- `reset_token` - VARCHAR(255), stores hashed reset token
- `reset_token_expiry` - TIMESTAMP, stores token expiry time

## Environment Variables

Add the following to your `.env` file:

```env
# Resend Email Service
EMAIL_API_KEY=your_resend_api_key_here
EMAIL_FROM=BuddyDesk <onboarding@resend.dev>

# Frontend URL for reset link (update with your actual frontend URL)
FRONTEND_URL=http://localhost:3000
```

**Important**: Replace `onboarding@resend.dev` with your verified domain in production.

## API Endpoints

### 1. Forgot Password

**Endpoint**: `POST /api/user/forgot-password`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

**Error Response** (500):
```json
{
  "success": false,
  "message": "Failed to send password reset email. Please try again later."
}
```

**Notes**:
- Always returns success (200) even if email doesn't exist (prevents email enumeration)
- Token expires in 1 hour
- Email contains reset link with token

### 2. Reset Password

**Endpoint**: `POST /api/user/reset-password`

**Request Body**:
```json
{
  "token": "32-character-hex-token-from-email",
  "new_password": "NewSecurePassword123!"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

**Error Response** (400):
```json
{
  "success": false,
  "message": "Invalid or expired reset token. Please request a new password reset."
}
```

**Notes**:
- Token must be valid and not expired
- Password must meet validation requirements (8+ chars, uppercase, lowercase, number, special char)
- All active sessions are invalidated after password reset
- Confirmation email is sent to user

## Password Validation Rules

New passwords must contain:
- Minimum 8 characters
- Maximum 128 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

## Email Templates

### Password Reset Email
- Professional HTML design
- Reset button with link
- Token expires in 1 hour warning
- Security notice

### Password Reset Confirmation Email
- Confirms successful password reset
- Security notice for unauthorized resets

## Security Features

### 1. Token Security
- Generated using `crypto.randomBytes(32)` for high entropy
- Hashed with SHA-256 before database storage
- Plain token only sent in email, never stored
- 1-hour expiry enforced

### 2. Email Enumeration Protection
- Always returns success message
- No indication if email exists or not
- Prevents user discovery attacks

### 3. Session Management
- All active sessions invalidated on password reset
- Forces re-login with new password
- Prevents unauthorized access

### 4. Rate Limiting
Consider adding rate limiting to forgot-password endpoint:
```javascript
const rateLimit = require('express-rate-limit');

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window
  message: 'Too many password reset requests, please try again later.'
});

router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, userController.forgotPassword);
```

## Testing

### Test Forgot Password
```bash
curl -X POST http://localhost:3000/api/user/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Test Reset Password
```bash
curl -X POST http://localhost:3000/api/user/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"token-from-email",
    "new_password":"NewPassword123!"
  }'
```

## Frontend Integration

### Forgot Password Flow

1. User clicks "Forgot Password" on login page
2. Show form with email input
3. Submit email to `/api/user/forgot-password`
4. Show success message: "If an account exists, a reset link has been sent to your email"
5. User checks email and clicks reset link

### Reset Password Flow

1. User clicks reset link from email
2. Extract token from URL query parameter: `/reset-password?token=xxx`
3. Show new password form
4. Submit token and new_password to `/api/user/reset-password`
5. On success, redirect to login with success message
6. On error, show error and option to request new reset email

### Example Frontend Routes

```javascript
// React Router example
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
```

### Example Frontend Code

**Forgot Password Component**:
```javascript
const handleForgotPassword = async (email) => {
  try {
    const response = await fetch('/api/user/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('If an account exists, a reset link has been sent to your email');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
};
```

**Reset Password Component**:
```javascript
const handleResetPassword = async (token, newPassword) => {
  try {
    const response = await fetch('/api/user/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Password reset successful! Please login with your new password.');
      navigate('/login');
    } else {
      alert(data.message || 'Token is invalid or expired');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
};
```

## Files Modified/Created

### New Files
1. `services/emailService.js` - Email sending functionality
2. `migrations/add_password_reset_fields.sql` - Database migration
3. `docs/FORGOT_PASSWORD_IMPLEMENTATION.md` - This documentation

### Modified Files
1. `models/user.model.js` - Added reset token fields
2. `controllers/user.controller.js` - Added forgotPassword and resetPassword methods
3. `routes/user.routes.js` - Added forgot/reset password routes
4. `middlewares/validation.js` - Added validation for forgot/reset endpoints
5. `package.json` - Added resend package

## Troubleshooting

### Email Not Sending

1. **Check API Key**: Verify `EMAIL_API_KEY` in `.env` is correct
2. **Check Domain**: In production, verify sender domain in Resend dashboard
3. **Check Logs**: Look at server console for detailed error messages
4. **Check Resend Dashboard**: View delivery status in Resend dashboard

### Token Issues

1. **Token Expired**: Tokens expire after 1 hour - request new reset email
2. **Token Invalid**: Token may have been used already or tampered with
3. **Check Database**: Verify reset_token and reset_token_expiry fields exist

### Frontend URL Issues

1. **Reset Link Wrong**: Update `FRONTEND_URL` in `.env` to match your frontend
2. **CORS Issues**: Ensure CORS is configured to allow your frontend domain

## Production Considerations

1. **Email Domain**: Set up and verify your own domain in Resend
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Monitoring**: Monitor email delivery rates and failures
4. **Logging**: Log all password reset attempts (with privacy considerations)
5. **Security Headers**: Ensure proper security headers are set
6. **HTTPS**: Always use HTTPS in production for reset links
7. **Token Length**: Current 32-byte token provides 256 bits of entropy (secure)

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify all environment variables are set
3. Ensure database migration was run successfully
4. Test email sending with Resend dashboard

## Next Steps

Consider implementing:
1. **Email Verification**: Send verification email on registration
2. **2FA**: Two-factor authentication for enhanced security
3. **Account Recovery**: Additional recovery methods (SMS, security questions)
4. **Password History**: Prevent reuse of recent passwords
5. **Suspicious Activity Alerts**: Notify users of password reset attempts

