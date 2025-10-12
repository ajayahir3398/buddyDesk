# Password Reset URL Configuration Guide

## 🔧 Environment Variables Explained

### BACKEND_URL vs PRODUCTION_URL

Your application uses different URLs for different purposes:

1. **PRODUCTION_URL** - Used for API endpoints
   - Example: `http://localhost:3000/api` or `https://api.buddydesk.in/api`
   - Includes `/api` path
   - Used by Swagger, API routes, etc.

2. **BACKEND_URL** - Used for static files and web pages
   - Example: `http://localhost:3000` or `https://buddydesk.in`
   - Does NOT include `/api` path
   - Used for password reset web page

## ✅ Correct Configuration

### Local Development (.env)

```env
# API endpoint URL (with /api)
PRODUCTION_URL=http://localhost:3000/api

# Base URL for static files (without /api)
BACKEND_URL=http://localhost:3000

# Email settings
EMAIL_API_KEY=re_your_api_key
EMAIL_FROM=BuddyDesk <onboarding@resend.dev>

# App scheme for deep linking
APP_SCHEME=buddydesk
```

### Production (.env or environment variables)

```env
# API endpoint URL (with /api)
PRODUCTION_URL=https://api.buddydesk.in/api

# Base URL for static files (without /api)
BACKEND_URL=https://buddydesk.in

# OR if API and static files are on same domain:
BACKEND_URL=https://api.buddydesk.in

# Email settings
EMAIL_API_KEY=re_your_production_api_key
EMAIL_FROM=BuddyDesk <no-reply@buddydesk.in>

# App scheme
APP_SCHEME=buddydesk
```

## 🎯 How It Works

### Password Reset Link Generation

The code in `services/emailService.js` does this:

```javascript
// 1. Gets BACKEND_URL or falls back to PRODUCTION_URL
let backendUrl = process.env.BACKEND_URL || process.env.PRODUCTION_URL || 'http://localhost:3000';

// 2. Removes /api suffix if present (in case PRODUCTION_URL is used)
backendUrl = backendUrl.replace(/\/api$/, '');

// 3. Generates reset link
const resetLink = `${backendUrl}/reset-password.html?token=${resetToken}`;
```

### Result:

✅ **With BACKEND_URL set:**
```
http://localhost:3000/reset-password.html?token=xxx
```

✅ **With only PRODUCTION_URL set:**
```
http://localhost:3000/reset-password.html?token=xxx  (auto strips /api)
```

❌ **Without stripping /api:**
```
http://localhost:3000/api/reset-password.html?token=xxx  (ERROR!)
```

## 🔍 Troubleshooting

### Error: Cannot GET /api/reset-password.html

**Cause:** The URL includes `/api/` but static files are served from root.

**Solution 1:** Set BACKEND_URL properly
```env
BACKEND_URL=http://localhost:3000
```

**Solution 2:** If you only have PRODUCTION_URL, the code will automatically strip `/api`

**Solution 3:** Check your .env file has the correct values and restart server

### Verify Your Configuration

1. **Check environment variables:**
```bash
node -e "console.log('BACKEND_URL:', process.env.BACKEND_URL); console.log('PRODUCTION_URL:', process.env.PRODUCTION_URL);"
```

2. **Test the reset page directly:**
```
http://localhost:3000/reset-password.html?token=test123
```

Should load the reset password page (even with invalid token).

3. **Test forgot password endpoint:**
```bash
curl -X POST http://localhost:3000/api/user/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Check the email and verify the link format.

## 📁 Static File Serving

The reset password page is served by this configuration in `app.js`:

```javascript
// Serve static files from public directory
app.use(express.static('public'));
```

This means files in `public/` directory are accessible at the root URL:
- `public/reset-password.html` → `http://localhost:3000/reset-password.html`
- `public/styles.css` → `http://localhost:3000/styles.css`
- etc.

## 🌐 Different Deployment Scenarios

### Scenario 1: Same Domain for API and Static Files

```env
BACKEND_URL=https://api.buddydesk.in
PRODUCTION_URL=https://api.buddydesk.in/api
```

Result:
- API: `https://api.buddydesk.in/api/user/login`
- Reset: `https://api.buddydesk.in/reset-password.html`

### Scenario 2: Separate Domains

```env
BACKEND_URL=https://buddydesk.in
PRODUCTION_URL=https://api.buddydesk.in/api
```

Result:
- API: `https://api.buddydesk.in/api/user/login`
- Reset: `https://buddydesk.in/reset-password.html`

Note: Requires CORS configuration if domains are different.

### Scenario 3: Subdomain Setup

```env
BACKEND_URL=https://www.buddydesk.in
PRODUCTION_URL=https://api.buddydesk.in/api
```

Result:
- API: `https://api.buddydesk.in/api/user/login`
- Reset: `https://www.buddydesk.in/reset-password.html`

## 🔒 Security Notes

1. **Always use HTTPS in production**
   ```env
   BACKEND_URL=https://buddydesk.in
   ```

2. **Set proper CORS if using different domains**
   ```javascript
   app.use(cors({
     origin: ['https://buddydesk.in', 'https://api.buddydesk.in']
   }));
   ```

3. **Verify email links before going live**
   - Send test reset emails
   - Click links on different devices
   - Check they don't include `/api/` incorrectly

## 📝 Quick Checklist

Before deploying to production:

- [ ] Set `BACKEND_URL` in .env or environment variables
- [ ] Set `PRODUCTION_URL` (for API endpoints)
- [ ] Verify both URLs use `https://`
- [ ] Test forgot password flow
- [ ] Click email link and verify it works
- [ ] Check link format (should NOT have `/api/reset-password.html`)
- [ ] Test on mobile device
- [ ] Test with app installed and without app
- [ ] Verify deep linking works
- [ ] Check web form fallback works

## 🆘 Still Having Issues?

### Debug Steps:

1. **Restart your server after changing .env:**
```bash
npm start
```

2. **Check what URL is being generated:**
Add logging to `services/emailService.js`:
```javascript
console.log('Reset Link:', resetLink);
```

3. **Test the page directly:**
```
http://localhost:3000/reset-password.html?token=anything
```

If this works, the issue is with the email URL generation.

4. **Check server logs:**
Look for errors when serving static files.

5. **Verify public directory exists:**
```bash
ls -la public/
```

Should show `reset-password.html`.

## 📞 Need Help?

If you're still experiencing issues:
1. Check server logs for errors
2. Verify .env file is in the root directory
3. Ensure you restarted the server after changes
4. Test with a fresh forgot password request

---

**Summary:** Always use `BACKEND_URL` for static file URLs (without `/api`), and the code will automatically handle cases where only `PRODUCTION_URL` is available.

