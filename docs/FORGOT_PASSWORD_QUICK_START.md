# Forgot Password - Quick Start Guide

## Overview
This guide will help you quickly set up and test the forgot password functionality with email OTP verification.

## Prerequisites
- Node.js and npm installed
- PostgreSQL database running
- Email account configured (no-reply@buddydesk.in)

## Setup Steps

### 1. Install Dependencies
The nodemailer package has already been installed. If you need to reinstall:
```bash
npm install nodemailer
```

### 2. Configure Environment Variables
Add these variables to your `.env` file:

```env
# Email Configuration
EMAIL_HOST=buddydesk.in
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=no-reply@buddydesk.in
EMAIL_PASSWORD=your_actual_email_password
EMAIL_FROM_NAME=BuddyDesk
EMAIL_FROM_EMAIL=no-reply@buddydesk.in

# JWT Secret (if not already set)
JWT_SECRET=your_secret_key_here
```

### 3. Database Setup
The table will be created automatically by Sequelize. However, if you need to create it manually:

```bash
# Run the migration SQL
psql -U your_db_user -d your_db_name -f migrations/create_password_reset_otp_table.sql
```

### 4. Restart Your Application
```bash
npm start
# or for development
npm run dev
```

### 5. Verify Email Service Connection
Add this to your `index.js` or `app.js` (optional, for testing):

```javascript
const emailService = require('./services/emailService');

// Verify email connection on startup
emailService.verifyConnection()
  .then(success => {
    if (success) {
      console.log('✅ Email service connected successfully');
    } else {
      console.log('❌ Email service connection failed');
    }
  });
```

## Testing the Forgot Password Flow

### Step 1: Request OTP

**Endpoint:** `POST /api/user/forgot-password`

```bash
curl -X POST http://localhost:3000/api/user/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP has been sent to your email address. Please check your inbox.",
  "data": {
    "email": "test@example.com",
    "expires_in_minutes": 10
  }
}
```

Check the email inbox for the 6-digit OTP code.

### Step 2: Verify OTP

**Endpoint:** `POST /api/user/verify-reset-otp`

```bash
curl -X POST http://localhost:3000/api/user/verify-reset-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

**Expected Response:**
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

Copy the `reset_token` for the next step.

### Step 3: Reset Password

**Endpoint:** `POST /api/user/reset-password`

```bash
curl -X POST http://localhost:3000/api/user/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "reset_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "new_password": "NewSecure@Pass123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully. Please login with your new password."
}
```

A confirmation email will be sent to the user's email address.

## Frontend Integration Example

```javascript
// 1. Request OTP
async function handleForgotPassword(email) {
  try {
    const response = await fetch('/api/user/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('OTP sent to your email. Please check your inbox.');
      // Show OTP input form
      showOTPForm();
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to send OTP. Please try again.');
  }
}

// 2. Verify OTP
async function handleVerifyOTP(email, otp) {
  try {
    const response = await fetch('/api/user/verify-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store reset token
      sessionStorage.setItem('reset_token', data.data.reset_token);
      alert('OTP verified! Please enter your new password.');
      // Show password reset form
      showPasswordResetForm();
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to verify OTP. Please try again.');
  }
}

// 3. Reset Password
async function handleResetPassword(newPassword) {
  try {
    const resetToken = sessionStorage.getItem('reset_token');
    
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
      sessionStorage.removeItem('reset_token');
      alert('Password reset successful! Please login with your new password.');
      // Redirect to login page
      window.location.href = '/login';
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to reset password. Please try again.');
  }
}
```

## HTML Form Examples

### 1. Forgot Password Form
```html
<form id="forgot-password-form">
  <h2>Forgot Password</h2>
  <input type="email" name="email" placeholder="Enter your email" required>
  <button type="submit">Send OTP</button>
</form>

<script>
document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  await handleForgotPassword(email);
});
</script>
```

### 2. OTP Verification Form
```html
<form id="verify-otp-form" style="display: none;">
  <h2>Enter OTP</h2>
  <input type="hidden" name="email" id="email-hidden">
  <input type="text" name="otp" placeholder="Enter 6-digit OTP" maxlength="6" pattern="[0-9]{6}" required>
  <button type="submit">Verify OTP</button>
  <p>Didn't receive OTP? <a href="#" onclick="resendOTP()">Resend</a></p>
</form>

<script>
function showOTPForm() {
  document.getElementById('verify-otp-form').style.display = 'block';
  document.getElementById('forgot-password-form').style.display = 'none';
}

document.getElementById('verify-otp-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email-hidden').value;
  const otp = e.target.otp.value;
  await handleVerifyOTP(email, otp);
});
</script>
```

### 3. Password Reset Form
```html
<form id="reset-password-form" style="display: none;">
  <h2>Reset Password</h2>
  <input type="password" name="new_password" placeholder="Enter new password" required>
  <input type="password" name="confirm_password" placeholder="Confirm new password" required>
  <button type="submit">Reset Password</button>
  <small>
    Password must contain:
    <ul>
      <li>At least 8 characters</li>
      <li>One uppercase letter</li>
      <li>One lowercase letter</li>
      <li>One number</li>
      <li>One special character</li>
    </ul>
  </small>
</form>

<script>
function showPasswordResetForm() {
  document.getElementById('reset-password-form').style.display = 'block';
  document.getElementById('verify-otp-form').style.display = 'none';
}

document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPassword = e.target.new_password.value;
  const confirmPassword = e.target.confirm_password.value;
  
  if (newPassword !== confirmPassword) {
    alert('Passwords do not match!');
    return;
  }
  
  await handleResetPassword(newPassword);
});
</script>
```

## Security Considerations

1. **OTP Expiration:** OTPs expire after 10 minutes
2. **Attempt Limiting:** Maximum 5 verification attempts per OTP
3. **Reset Token Expiration:** Reset tokens expire after 15 minutes
4. **Password Requirements:** Strong password validation enforced
5. **Session Invalidation:** All user sessions are invalidated after password reset
6. **OTP Hashing:** OTPs are hashed before storage
7. **Email Confirmation:** Confirmation email sent after successful password reset

## Troubleshooting

### Email Not Received
1. Check spam/junk folder
2. Verify email configuration in `.env`
3. Check application logs for email sending errors
4. Test email service connection
5. Verify SMTP port (465) is not blocked

### OTP Verification Fails
1. Ensure OTP hasn't expired (10 minutes)
2. Check for typos in OTP entry
3. Verify email address matches
4. Check if maximum attempts (5) exceeded
5. Request a new OTP if needed

### Reset Token Issues
1. Use reset token within 15 minutes
2. Ensure OTP was verified successfully
3. Check JWT_SECRET is configured
4. Don't refresh the page (token stored in sessionStorage)

## API Response Codes

- `200` - Success
- `400` - Bad request (validation error, expired OTP, etc.)
- `404` - User not found
- `500` - Server error (email sending failed, database error, etc.)

## Rate Limiting Recommendations

Consider implementing rate limiting for these endpoints:
- `/forgot-password` - 3 requests per 15 minutes per IP
- `/verify-reset-otp` - 10 requests per 15 minutes per IP
- `/reset-password` - 5 requests per 15 minutes per IP

## Next Steps

1. ✅ Test the complete flow with a real email account
2. ✅ Implement frontend integration
3. ⚠️ Add rate limiting to prevent abuse
4. ⚠️ Set up email template customization
5. ⚠️ Configure automated cleanup of expired OTPs
6. ⚠️ Add monitoring and alerting for email failures
7. ⚠️ Update Swagger documentation

## Support

For detailed documentation, see: `docs/EMAIL_SERVICE_AND_FORGOT_PASSWORD.md`

For issues or questions, check:
- Application logs in `logs/` directory
- Email service configuration
- Database connectivity
- Environment variables

---

**Implementation Complete!** 🎉

The forgot password functionality with email OTP verification is now ready to use.

