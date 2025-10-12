# Password Reset Flow - Complete Guide

## 🔄 How It Works

The password reset system automatically handles both **mobile app users** and **web browser users** seamlessly.

## Flow Diagram

```
User Requests Password Reset
          ↓
Email Sent with Link: http://your-api.com/reset-password.html?token=xxx
          ↓
User Clicks Link
          ↓
    Opens in Browser
          ↓
    Web Page Loads
          ↓
┌─────────────────────────────┐
│  Page Tries to Open App     │
│  buddydesk://reset-password │
└─────────────────────────────┘
          ↓
    ┌─────┴─────┐
    │           │
App Installed   App NOT Installed
    │           │
    ↓           ↓
Opens App    Shows Web Form
    │           │
    ↓           ↓
Reset in App  Reset in Browser
    │           │
    └─────┬─────┘
          ↓
API: POST /api/user/reset-password
          ↓
Password Reset Successfully!
```

## 📧 Email Content

The email contains:
- **Link**: `http://localhost:3000/reset-password.html?token=xxx`
- **Button**: "Reset Password"
- **Instructions**: Explains it works for both app and browser

## 🌐 Web Page (`public/reset-password.html`)

### Features:
1. **Automatic App Detection**
   - Tries to open `buddydesk://reset-password?token=xxx`
   - If app opens → User continues in app
   - If app doesn't open → Shows web form

2. **Beautiful UI**
   - Responsive design
   - Works on mobile and desktop
   - Professional gradient design
   - Loading states and animations

3. **Full Functionality**
   - Password validation (same rules as app)
   - Real-time feedback
   - Success/error messages
   - Calls same API endpoint

## 🔧 Configuration

### Environment Variables

Add to your `.env`:
```env
# Backend URL (update for production)
BACKEND_URL=http://localhost:3000

# For production
BACKEND_URL=https://api.buddydesk.in

# React Native Deep Link Scheme
APP_SCHEME=buddydesk
```

### Server Setup

Already configured in `app.js`:
```javascript
// Serve static files from public directory
app.use(express.static('public'));
```

## 📱 React Native Setup

### 1. Configure Deep Linking

**iOS (Info.plist):**
```xml
<key>CFBundleURLSchemes</key>
<array>
  <string>buddydesk</string>
</array>
```

**Android (AndroidManifest.xml):**
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="buddydesk" />
</intent-filter>
```

### 2. Handle Deep Link in App

```javascript
// React Navigation
const linking = {
  prefixes: ['buddydesk://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
    },
  },
};

// In ResetPasswordScreen.js
const route = useRoute();
const token = route.params?.token;

// Call API
await axios.post('YOUR_API/api/user/reset-password', {
  token: token,
  new_password: newPassword,
});
```

## 🧪 Testing

### Test Complete Flow

1. **Request Password Reset**
```bash
curl -X POST http://localhost:3000/api/user/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

2. **Check Email** - Copy the link

3. **Open in Browser** - Opens `http://localhost:3000/reset-password.html?token=xxx`

4. **Observe Behavior:**
   - On **phone with app**: App opens automatically
   - On **phone without app**: Web form appears
   - On **desktop**: Web form appears (no app to open)

### Test Web Form Directly

Open in browser:
```
http://localhost:3000/reset-password.html?token=YOUR_TOKEN
```

### Test Deep Link

**iOS:**
```bash
xcrun simctl openurl booted "buddydesk://reset-password?token=test123"
```

**Android:**
```bash
adb shell am start -W -a android.intent.action.VIEW -d "buddydesk://reset-password?token=test123"
```

## 🎯 User Experience

### Scenario 1: Mobile User with App
1. Opens email on phone
2. Clicks "Reset Password"
3. **App opens immediately**
4. Sees native reset password screen
5. Enters new password
6. Success!

### Scenario 2: Mobile User without App
1. Opens email on phone
2. Clicks "Reset Password"
3. Opens in mobile browser
4. Brief message: "Opening app..." (2 seconds)
5. **Web form appears**
6. Enters new password in browser
7. Success!

### Scenario 3: Desktop User
1. Opens email on computer
2. Clicks "Reset Password"
3. Opens in browser
4. **Web form appears immediately**
5. Enters new password
6. Success!

### Scenario 4: Email Client Preview
1. Opens email
2. Copies link manually
3. Pastes in browser
4. Works same as Scenario 2 or 3

## 🔒 Security Features

### Web Page Security
- ✅ Token passed via URL (standard practice)
- ✅ Token validated by backend API
- ✅ HTTPS recommended for production
- ✅ 1-hour token expiry
- ✅ Token is one-time use

### Password Validation
Both web and app enforce:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## 📊 API Endpoint

Same endpoint for both web and app:

```
POST /api/user/reset-password

Body:
{
  "token": "a8ec2f3a559...",
  "new_password": "NewPassword123!"
}

Success Response (200):
{
  "success": true,
  "message": "Password has been reset successfully. You can now log in with your new password."
}

Error Response (400):
{
  "success": false,
  "message": "Invalid or expired reset token. Please request a new password reset."
}
```

## 🚀 Production Deployment

### Update Environment Variables

```env
# Production backend URL
BACKEND_URL=https://api.buddydesk.in

# Email sender (use your verified domain)
EMAIL_FROM=BuddyDesk <no-reply@buddydesk.in>

# Your Resend API key
EMAIL_API_KEY=re_your_production_key
```

### Enable HTTPS
- Use SSL certificate (Let's Encrypt, Cloudflare, etc.)
- Ensure `BACKEND_URL` uses `https://`
- Web page will be served over HTTPS

### Test Email Delivery
1. Test with real email addresses
2. Check spam folder
3. Test on multiple email clients (Gmail, Outlook, etc.)
4. Test on multiple devices (iPhone, Android, Desktop)

### Monitor
- Log password reset attempts
- Track success/failure rates
- Monitor for suspicious activity

## 🎨 Customization

### Update Web Page Design

Edit `public/reset-password.html`:
- Change colors (line 16: gradient colors)
- Update logo (line 214-215)
- Customize messages
- Add your branding

### Update Email Template

Edit `services/emailService.js`:
- Change email styles
- Update company name
- Modify button design
- Add footer links

### Change App Scheme

1. Update `APP_SCHEME` in `.env`
2. Update `appScheme` in `reset-password.html` (line 289)
3. Update iOS Info.plist
4. Update Android AndroidManifest.xml
5. Rebuild mobile app

## 📝 File Structure

```
project/
├── public/
│   └── reset-password.html        # Web fallback page
├── services/
│   └── emailService.js             # Email sending logic
├── controllers/
│   └── user.controller.js          # API endpoints
├── routes/
│   └── user.routes.js              # Route definitions
└── app.js                          # Express server setup
```

## 🐛 Troubleshooting

### Web Page Not Loading
- Check `app.use(express.static('public'))` in app.js
- Verify `public/reset-password.html` exists
- Check URL: `http://localhost:3000/reset-password.html?token=xxx`

### App Not Opening
- Verify deep link scheme matches
- Check iOS Info.plist / Android AndroidManifest.xml
- Rebuild mobile app after configuration changes

### Token Invalid
- Token expires after 1 hour
- Request new password reset
- Check token is complete (64 characters)

### Email Not Sending
- Verify `EMAIL_API_KEY` in `.env`
- Check Resend dashboard
- Verify sender email domain

## 💡 Best Practices

1. **Always use HTTPS in production**
2. **Set proper CORS headers**
3. **Rate limit password reset requests**
4. **Log all password reset attempts**
5. **Send confirmation email after successful reset**
6. **Invalidate all sessions after password change**
7. **Monitor for abuse patterns**

## 📱 Mobile App Integration

See complete guide: `docs/REACT_NATIVE_DEEP_LINKING_SETUP.md`

## 🎉 Summary

This implementation provides:
- ✅ Seamless experience for app users
- ✅ Fallback for users without app
- ✅ Works on any device (phone, tablet, desktop)
- ✅ Professional, modern UI
- ✅ Secure token-based authentication
- ✅ Same API for web and app
- ✅ Easy to test and deploy

Users can reset passwords from **anywhere, on any device**, whether they have the app installed or not! 🚀

