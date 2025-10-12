# Forgot Password Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install resend
```

### Step 2: Configure Environment Variables

Add to your `.env` file:
```env
# Resend Email Service
EMAIL_API_KEY=re_your_api_key_here
EMAIL_FROM=BuddyDesk <onboarding@resend.dev>

# Backend URL for password reset links (update for production)
BACKEND_URL=http://localhost:3000

# React Native Deep Link Scheme (used by the web page to open app)
APP_SCHEME=buddydesk
```

**Get your Resend API Key**:
1. Sign up at [https://resend.com](https://resend.com)
2. Go to API Keys section
3. Create a new API key
4. Copy and paste it into your `.env` file

### Step 3: Run Database Migration

Connect to your PostgreSQL database and run:
```bash
psql -U your_username -d your_database -f migrations/add_password_reset_fields.sql
```

Or copy and execute this SQL:
```sql
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) DEFAULT NULL;

ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_user_reset_token ON "user" (reset_token);
```

### Step 4: Restart Your Server
```bash
npm start
# or
npm run dev
```

## ✅ That's It! Test Your Implementation

### Test Forgot Password
```bash
curl -X POST http://localhost:3000/api/user/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com"}'
```

### Test Reset Password
1. Check your email for the reset link
2. Extract the token from the URL
3. Use it to reset password:

```bash
curl -X POST http://localhost:3000/api/user/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"your-token-here",
    "new_password":"NewPassword123!"
  }'
```

## 📱 API Endpoints

### Forgot Password
- **URL**: `POST /api/user/forgot-password`
- **Body**: `{"email": "user@example.com"}`
- **Response**: Success message (always 200, even if email doesn't exist)

### Reset Password
- **URL**: `POST /api/user/reset-password`
- **Body**: `{"token": "xxx", "new_password": "NewPassword123!"}`
- **Response**: Success message or error if token invalid/expired

## 🔒 Password Requirements

New passwords must have:
- ✅ 8-128 characters
- ✅ At least one uppercase letter
- ✅ At least one lowercase letter
- ✅ At least one number
- ✅ At least one special character (@$!%*?&)

## 🎨 Frontend Integration Example

### Forgot Password Page
```html
<form onsubmit="handleForgotPassword(event)">
  <input type="email" name="email" placeholder="Enter your email" required />
  <button type="submit">Send Reset Link</button>
</form>

<script>
async function handleForgotPassword(e) {
  e.preventDefault();
  const email = e.target.email.value;
  
  const response = await fetch('/api/user/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  const data = await response.json();
  alert(data.message);
}
</script>
```

### Reset Password Page
```html
<form onsubmit="handleResetPassword(event)">
  <input type="password" name="password" placeholder="New password" required />
  <button type="submit">Reset Password</button>
</form>

<script>
async function handleResetPassword(e) {
  e.preventDefault();
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const newPassword = e.target.password.value;
  
  const response = await fetch('/api/user/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword })
  });
  
  const data = await response.json();
  
  if (data.success) {
    alert('Password reset successful!');
    window.location.href = '/login';
  } else {
    alert(data.message);
  }
}
</script>
```

## 🐛 Troubleshooting

### Problem: Email not sending
**Solution**: 
- Check `EMAIL_API_KEY` is correct in `.env`
- Check server logs for errors
- Verify domain in Resend dashboard (production)

### Problem: Token invalid/expired
**Solution**:
- Tokens expire after 1 hour
- Request a new password reset email
- Check database has reset_token fields

### Problem: Reset link wrong domain
**Solution**:
- Update `FRONTEND_URL` in `.env` file
- Restart your server

## 📚 Full Documentation

For complete documentation, see: `docs/FORGOT_PASSWORD_IMPLEMENTATION.md`

## 🔐 Security Features

✅ Secure token generation (crypto.randomBytes)  
✅ Token hashing before database storage  
✅ 1-hour token expiry  
✅ Email enumeration protection  
✅ All sessions invalidated on password reset  
✅ Confirmation email sent  

## 🎯 Production Checklist

Before going to production:
- [ ] Set up and verify your own domain in Resend
- [ ] Update `EMAIL_FROM` with your domain
- [ ] Update `FRONTEND_URL` to production URL
- [ ] Add rate limiting to forgot-password endpoint
- [ ] Enable HTTPS
- [ ] Test thoroughly with real email accounts

## Need Help?

Check:
1. Server logs for detailed errors
2. Resend dashboard for email delivery status
3. Database for reset_token fields
4. Environment variables are set correctly

