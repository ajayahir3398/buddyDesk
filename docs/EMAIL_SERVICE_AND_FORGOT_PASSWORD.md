# Email Service & Forgot Password Implementation

## Overview
This document describes the SMTP email service implementation using Nodemailer and the forgot password functionality with email OTP verification for the BuddyDesk application.

## Table of Contents
- [Email Service Configuration](#email-service-configuration)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Email Templates](#email-templates)
- [Security Features](#security-features)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

---

## Email Service Configuration

### SMTP Settings
The application uses the following SMTP configuration for webmail:

```
Host: buddydesk.in
Port: 465 (SMTP with SSL/TLS)
Username: no-reply@buddydesk.in
Authentication: Required
```

### Files Created
1. **config/email.config.js** - Email configuration settings
2. **services/emailService.js** - Email service with nodemailer
3. **models/passwordResetOTP.model.js** - Database model for OTP storage
4. **controllers/user.controller.js** - Added forgot password methods
5. **middlewares/validation.js** - Added validation for forgot password
6. **routes/user.routes.js** - Added forgot password routes

---

## Environment Variables

Add the following variables to your `.env` file:

```env
# Email Configuration
EMAIL_HOST=buddydesk.in
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=no-reply@buddydesk.in
EMAIL_PASSWORD=your_email_password_here
EMAIL_FROM_NAME=BuddyDesk
EMAIL_FROM_EMAIL=no-reply@buddydesk.in

# Existing JWT Configuration
JWT_SECRET=your_jwt_secret_here
```

---

## Database Schema

### Table: `password_reset_otp`

```sql
CREATE TABLE password_reset_otp (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(255) NOT NULL,  -- Hashed OTP
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_password_reset_otp_user_id ON password_reset_otp(user_id);
CREATE INDEX idx_password_reset_otp_email ON password_reset_otp(email);
CREATE INDEX idx_password_reset_otp_expires_at ON password_reset_otp(expires_at);
```

The table will be created automatically by Sequelize when the application starts.

---

## API Endpoints

### 1. Request Password Reset (Send OTP)

**Endpoint:** `POST /api/user/forgot-password`

**Description:** Sends a 6-digit OTP to the user's email address.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP has been sent to your email address. Please check your inbox.",
  "data": {
    "email": "user@example.com",
    "expires_in_minutes": 10
  }
}
```

**Error Responses:**
- `404`: User not found
- `500`: Email sending failed

---

### 2. Verify OTP

**Endpoint:** `POST /api/user/verify-reset-otp`

**Description:** Verifies the OTP and returns a reset token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully. You can now reset your password.",
  "data": {
    "reset_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in_minutes": 15
  }
}
```

**Error Responses:**
- `400`: Invalid OTP, expired OTP, or maximum attempts exceeded
- `404`: User not found

**Security Features:**
- Maximum 5 verification attempts
- OTP expires after 10 minutes
- Attempts counter increments on each verification

---

### 3. Reset Password

**Endpoint:** `POST /api/user/reset-password`

**Description:** Resets the user's password using the verified reset token.

**Request Body:**
```json
{
  "reset_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "new_password": "NewSecure@Pass123"
}
```

**Password Requirements:**
- Minimum 8 characters
- Maximum 128 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password has been reset successfully. Please login with your new password."
}
```

**Error Responses:**
- `400`: Invalid or expired reset token
- `404`: User not found

**Additional Actions:**
- All active user sessions are invalidated
- Password changed confirmation email is sent
- OTP record is deleted

---

## Email Templates

### 1. OTP Email Template
- **Subject:** "Password Reset OTP - BuddyDesk"
- **Content:** Professional HTML template with 6-digit OTP
- **Features:**
  - Clear OTP display
  - 10-minute expiration notice
  - Security warnings
  - Responsive design

### 2. Password Changed Email Template
- **Subject:** "Password Changed Successfully - BuddyDesk"
- **Content:** Confirmation of password change
- **Features:**
  - Success notification
  - Security alert for unauthorized changes
  - Contact support information

### 3. Welcome Email Template (Optional)
- **Subject:** "Welcome to BuddyDesk!"
- **Content:** Welcome message for new users
- **Features:**
  - Greeting message
  - Getting started guide
  - Brand identity

---

## Security Features

### 1. OTP Security
- **Hashing:** OTPs are hashed using bcrypt (salt rounds: 10) before storage
- **Expiration:** OTPs expire after 10 minutes
- **Single Use:** OTPs are deleted after successful password reset
- **Attempt Limiting:** Maximum 5 verification attempts per OTP
- **Auto Cleanup:** Expired OTPs should be cleaned periodically

### 2. Reset Token Security
- **JWT-based:** Reset tokens use JWT with 15-minute expiration
- **Type Verification:** Token type is validated ('password_reset')
- **OTP Linkage:** Token is linked to specific OTP record
- **Single Use:** OTP record is deleted after password reset

### 3. Password Security
- **Hashing:** Passwords are hashed using bcrypt (salt rounds: 10)
- **Validation:** Strong password requirements enforced
- **Session Invalidation:** All sessions are revoked on password reset

### 4. Email Security
- **TLS/SSL:** Secure SMTP connection (port 465)
- **Authentication:** Required for sending emails
- **Rate Limiting:** Should be implemented at application level

---

## Usage Examples

### Frontend Flow Example

```javascript
// Step 1: Request OTP
async function requestPasswordReset(email) {
  const response = await fetch('/api/user/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await response.json();
  
  if (data.success) {
    console.log('OTP sent to email');
    // Show OTP input form
  }
}

// Step 2: Verify OTP
async function verifyOTP(email, otp) {
  const response = await fetch('/api/user/verify-reset-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  const data = await response.json();
  
  if (data.success) {
    const resetToken = data.data.reset_token;
    // Store reset token and show password reset form
    return resetToken;
  }
}

// Step 3: Reset Password
async function resetPassword(resetToken, newPassword) {
  const response = await fetch('/api/user/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      reset_token: resetToken, 
      new_password: newPassword 
    })
  });
  const data = await response.json();
  
  if (data.success) {
    console.log('Password reset successful');
    // Redirect to login page
  }
}
```

### cURL Examples

**1. Request OTP:**
```bash
curl -X POST http://localhost:3000/api/user/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**2. Verify OTP:**
```bash
curl -X POST http://localhost:3000/api/user/verify-reset-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","otp":"123456"}'
```

**3. Reset Password:**
```bash
curl -X POST http://localhost:3000/api/user/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "reset_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "new_password":"NewSecure@Pass123"
  }'
```

---

## Troubleshooting

### Email Not Sending

**Problem:** OTP emails are not being delivered.

**Solutions:**
1. Verify SMTP credentials in `.env` file
2. Check email account settings:
   - Ensure IMAP/POP3/SMTP authentication is enabled
   - Verify port 465 is not blocked by firewall
3. Test email connection:
   ```javascript
   const emailService = require('./services/emailService');
   emailService.verifyConnection();
   ```
4. Check application logs for email errors
5. Verify email service is not rate-limited

### OTP Not Working

**Problem:** OTP verification fails even with correct code.

**Solutions:**
1. Check if OTP has expired (10-minute limit)
2. Verify maximum attempts not exceeded (5 attempts)
3. Ensure OTP is 6 digits and numeric only
4. Check database for OTP record existence
5. Verify email matches the one used for OTP request

### Reset Token Issues

**Problem:** Reset token is invalid or expired.

**Solutions:**
1. Verify token hasn't expired (15-minute limit)
2. Ensure OTP was verified before using reset token
3. Check JWT_SECRET in environment variables
4. Verify token format and structure
5. Ensure OTP record still exists in database

### Database Issues

**Problem:** Database table not created or errors occur.

**Solutions:**
1. Ensure database connection is working
2. Check if model is imported in `models/index.js`
3. Verify database user has CREATE TABLE permissions
4. Manually create table using SQL schema provided above
5. Check Sequelize sync logs during startup

### Password Validation Fails

**Problem:** New password is rejected.

**Solutions:**
1. Verify password meets all requirements:
   - At least 8 characters
   - Contains uppercase letter
   - Contains lowercase letter
   - Contains number
   - Contains special character
2. Check for whitespace or hidden characters
3. Verify password doesn't exceed 128 characters

---

## Additional Features

### Email Service Methods

The email service provides the following methods:

```javascript
const emailService = require('./services/emailService');

// Send custom email
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Subject',
  text: 'Plain text content',
  html: '<p>HTML content</p>'
});

// Send OTP email (used by forgot password)
await emailService.sendOTPEmail(email, otp, userName);

// Send welcome email
await emailService.sendWelcomeEmail(email, userName);

// Send password changed confirmation
await emailService.sendPasswordChangedEmail(email, userName);

// Verify email connection
await emailService.verifyConnection();
```

### Cleanup Recommendations

**Expired OTP Cleanup:**

Consider adding a scheduled job to clean up expired OTP records:

```javascript
// Example cleanup function
const cleanupExpiredOTPs = async () => {
  const db = require('./models');
  const { Op } = require('sequelize');
  
  await db.PasswordResetOTP.destroy({
    where: {
      expires_at: {
        [Op.lt]: new Date()
      }
    }
  });
};

// Run daily at midnight
// Use node-cron or similar scheduler
```

---

## Testing

### Manual Testing Checklist

- [ ] Request OTP with valid email
- [ ] Request OTP with invalid email
- [ ] Verify OTP with correct code
- [ ] Verify OTP with incorrect code (5 attempts)
- [ ] Verify OTP after expiration (10 minutes)
- [ ] Reset password with valid token
- [ ] Reset password with expired token
- [ ] Reset password with invalid password format
- [ ] Check email delivery for all templates
- [ ] Verify session invalidation after password reset
- [ ] Check password changed confirmation email

### Integration Testing

Consider testing the following scenarios:
1. Complete flow: Request OTP → Verify OTP → Reset Password
2. Multiple OTP requests for same user
3. Concurrent OTP requests
4. Email service failure handling
5. Database connection failure handling

---

## Support

For issues or questions:
- Check application logs in `logs/` directory
- Review error messages from API responses
- Verify environment variables are set correctly
- Test email service connection
- Check database connectivity

---

## Changelog

### Version 1.0.0 (Current)
- Initial implementation of SMTP email service with Nodemailer
- Forgot password functionality with OTP verification
- Email templates for OTP and password change confirmation
- Security features: OTP hashing, attempt limiting, token expiration
- Comprehensive validation and error handling

---

## License

This implementation is part of the BuddyDesk application.

