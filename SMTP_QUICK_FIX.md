# 🚨 SMTP Authentication Error - Quick Fix

## The Error You're Seeing

```
Error sending email: Invalid login: 535 Incorrect authentication data
```

---

## ⚡ Quick Fix Steps

### Step 1: Run the Test Script

I've created a diagnostic tool for you. Run this:

```bash
node test-smtp-connection.js
```

This will:
- ✅ Test multiple SMTP configurations automatically
- ✅ Show you which settings work
- ✅ Provide specific error messages
- ✅ Give you the exact settings to use

---

### Step 2: Check Your `.env` File

Make sure your `.env` has these settings:

```env
EMAIL_HOST=buddydesk.in
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=no-reply@buddydesk.in
EMAIL_PASSWORD=qjWQu!=rSw
```

**⚠️ Important:** 
- If password has special characters, try wrapping in quotes: `EMAIL_PASSWORD="qjWQu!=rSw"`
- Or try without special characters

---

### Step 3: Try Port 587 Instead

If port 465 doesn't work, try:

```env
EMAIL_HOST=buddydesk.in
EMAIL_PORT=587
EMAIL_SECURE=false
```

Then restart your app:
```bash
npm start
```

---

### Step 4: Verify in cPanel

1. **Log into cPanel:**
   - Go to: `https://buddydesk.in:2083`

2. **Check Email Accounts:**
   - Find `no-reply@buddydesk.in`
   - Verify it exists and is active

3. **Try resetting the password:**
   - Reset the password
   - Update `.env` with new password
   - Restart the application

---

### Step 5: Test Manual Login

Try logging into webmail:
- URL: `https://webmail.buddydesk.in` or `https://buddydesk.in:2096`
- Username: `no-reply@buddydesk.in`
- Password: `qjWQu!=rSw`

**If this fails** → Password is wrong, reset it in cPanel

**If this works** → SMTP might not be enabled, or port is blocked

---

## 🔧 Most Common Solutions

### Solution 1: Wrong Password (90% of cases)
```bash
# 1. Log into cPanel
# 2. Reset password for no-reply@buddydesk.in
# 3. Update .env with new password
# 4. Restart: npm start
```

### Solution 2: Use Port 587
```env
EMAIL_PORT=587
EMAIL_SECURE=false
```

### Solution 3: Password Special Characters
```env
# Wrap in quotes if password has special chars
EMAIL_PASSWORD="qjWQu!=rSw"
```

### Solution 4: Use mail subdomain
```env
EMAIL_HOST=mail.buddydesk.in
```

---

## 🧪 Testing

After making changes:

1. **Restart the app:**
   ```bash
   npm start
   ```

2. **Run the SMTP test:**
   ```bash
   node test-smtp-connection.js
   ```

3. **Try sending OTP:**
   ```bash
   curl -X POST http://localhost:3000/api/user/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"your.test@email.com"}'
   ```

---

## 📞 Need More Help?

### Check These Docs:
- `docs/SMTP_AUTHENTICATION_TROUBLESHOOTING.md` - Complete guide
- `docs/EMAIL_SERVICE_AND_FORGOT_PASSWORD.md` - Email service docs

### Contact Hosting Provider:
Ask them:
1. What are the correct SMTP settings?
2. Is SMTP enabled for `no-reply@buddydesk.in`?
3. Are there IP restrictions?
4. What port should I use?

---

## ✅ Success Looks Like

When it works, you'll see:
```
✅ Email service is ready to send messages
✅ Email sent successfully
```

And the email will be delivered!

---

## 🎯 Action Plan

1. Run: `node test-smtp-connection.js`
2. Use the configuration that works
3. Update your `.env` file
4. Restart the application
5. Test forgot password endpoint

**Good luck!** 🚀

