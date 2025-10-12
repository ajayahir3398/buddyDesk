# SMTP Authentication Troubleshooting Guide

## Error: 535 Incorrect authentication data

If you're seeing this error:
```
Error sending email: Invalid login: 535 Incorrect authentication data
```

This guide will help you fix it.

---

## 🔍 Common Causes

1. **Incorrect password** - The password in `.env` is wrong
2. **Wrong email format** - Username should be full email address
3. **SMTP not enabled** - Email account doesn't have SMTP access
4. **Port issues** - Using wrong port or secure settings
5. **Server restrictions** - Mail server blocking the connection
6. **Special characters** - Password has special characters that need escaping

---

## ✅ Step-by-Step Solutions

### Step 1: Verify Your Credentials

1. **Check your `.env` file:**
   ```env
   EMAIL_HOST=buddydesk.in
   EMAIL_PORT=465
   EMAIL_SECURE=true
   EMAIL_USER=no-reply@buddydesk.in
   EMAIL_PASSWORD=your_actual_password
   ```

2. **Verify the password:**
   - Log into webmail: `https://buddydesk.in:2096` or `https://webmail.buddydesk.in`
   - Try logging in with `no-reply@buddydesk.in` and your password
   - If it fails, reset the password in cPanel

---

### Step 2: Test SMTP Connection Manually

Create a test file to verify SMTP connection:

**File: `test-smtp.js`**
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: 'buddydesk.in',
  port: 465,
  secure: true,
  auth: {
    user: 'no-reply@buddydesk.in',
    pass: 'YOUR_PASSWORD_HERE'
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true, // Show debug output
  logger: true // Log information
});

transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ SMTP Connection Failed:');
    console.log(error);
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});

// Try sending a test email
transporter.sendMail({
  from: '"BuddyDesk" <no-reply@buddydesk.in>',
  to: 'YOUR_TEST_EMAIL@gmail.com',
  subject: 'Test Email',
  text: 'If you receive this, SMTP is working!'
}, (error, info) => {
  if (error) {
    console.log('❌ Send Failed:', error);
  } else {
    console.log('✅ Email sent:', info.messageId);
  }
});
```

**Run the test:**
```bash
node test-smtp.js
```

---

### Step 3: Try Different Port Configurations

If port 465 doesn't work, try port 587:

**Update `.env`:**
```env
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Or update `config/email.config.js` to try both:**
```javascript
module.exports = {
  HOST: process.env.EMAIL_HOST || 'buddydesk.in',
  PORT: process.env.EMAIL_PORT || 587, // Try 587 instead of 465
  SECURE: process.env.EMAIL_SECURE === 'true' || false, // false for 587
  USER: process.env.EMAIL_USER || 'no-reply@buddydesk.in',
  PASSWORD: process.env.EMAIL_PASSWORD,
  FROM_NAME: process.env.EMAIL_FROM_NAME || 'BuddyDesk',
  FROM_EMAIL: process.env.EMAIL_FROM_EMAIL || 'no-reply@buddydesk.in'
};
```

**Port Guide:**
- **Port 465** - SSL/TLS (secure: true)
- **Port 587** - STARTTLS (secure: false, but uses TLS)
- **Port 25** - Usually blocked by ISPs

---

### Step 4: Check cPanel/Webmail Settings

1. **Log into cPanel:**
   - URL: `https://buddydesk.in:2083` or your hosting control panel
   
2. **Navigate to Email Accounts:**
   - Find `no-reply@buddydesk.in`
   - Check if account exists and is active

3. **Verify SMTP is Enabled:**
   - Some hosts require you to enable SMTP separately
   - Look for "Email Authentication" or "SMTP Settings"

4. **Check Email Quota:**
   - Make sure the email account isn't full
   - Check if there are any restrictions

5. **Enable External SMTP (if required):**
   - Some hosts block external SMTP by default
   - Look for "Allow External SMTP" or similar setting

---

### Step 5: Password Special Characters

If your password has special characters, they might need to be URL-encoded in `.env`:

**Special characters that might cause issues:**
- `@` → Use `%40`
- `#` → Use `%23`
- `$` → Use `%24`
- `&` → Use `%26`
- `=` → Use `%3D`
- `!` → Usually OK, but try `%21` if issues persist

**Example:**
```env
# If password is: MyP@ss!word#2024
EMAIL_PASSWORD=MyP%40ss!word%232024

# Or wrap in quotes:
EMAIL_PASSWORD="MyP@ss!word#2024"
```

---

### Step 6: Alternative - Use Mail Server IP

Sometimes using the IP address works better than the domain:

```env
# Find your mail server IP
# Run: nslookup buddydesk.in

EMAIL_HOST=your_server_ip
EMAIL_PORT=465
```

---

### Step 7: Check Firewall/Security

1. **Check if port 465/587 is open:**
   ```bash
   telnet buddydesk.in 465
   # or
   telnet buddydesk.in 587
   ```

2. **If blocked, contact your hosting provider**

3. **Check if your IP is whitelisted:**
   - Some servers only allow specific IPs
   - Add your server IP to the whitelist in cPanel

---

## 🔧 Alternative Authentication Methods

### Option 1: Use App-Specific Password

If your mail server supports it, create an app-specific password:

1. Log into webmail
2. Find "Security" or "App Passwords"
3. Create a new app password for "NodeJS Application"
4. Use that password in `.env`

### Option 2: OAuth2 (Gmail/Google Workspace)

If you're using Gmail or Google Workspace:

```javascript
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: 'your-email@gmail.com',
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
    refreshToken: 'YOUR_REFRESH_TOKEN'
  }
});
```

---

## 🧪 Testing Checklist

Run through this checklist:

- [ ] Email account exists in cPanel
- [ ] Can login to webmail with these credentials
- [ ] Password has no typos
- [ ] Full email address used as username (not just the local part)
- [ ] Correct port (465 or 587)
- [ ] Secure setting matches port (true for 465, false for 587)
- [ ] SMTP is enabled for the account
- [ ] Email quota not exceeded
- [ ] Port not blocked by firewall
- [ ] No IP restrictions on mail server
- [ ] Special characters in password properly handled

---

## 📝 Debug Mode

Enable debug mode to see detailed SMTP logs:

**Update `.env`:**
```env
NODE_ENV=development
```

The updated `emailService.js` will now show detailed SMTP logs in development mode.

---

## 🆘 Common Error Messages

### Error: ECONNREFUSED
```
Error: connect ECONNREFUSED
```
**Cause:** Can't connect to mail server
**Solution:** 
- Check if HOST is correct
- Verify port is open
- Check firewall settings

### Error: ETIMEDOUT
```
Error: connect ETIMEDOUT
```
**Cause:** Connection timeout
**Solution:**
- Port might be blocked
- Try different port (587 instead of 465)
- Check network/firewall

### Error: Certificate verification failed
```
Error: unable to verify the first certificate
```
**Solution:** Already handled with `rejectUnauthorized: false`

### Error: 535 5.7.8 Authentication credentials invalid
**Cause:** Wrong username or password
**Solution:**
- Double-check credentials
- Reset password in cPanel
- Try full email address

---

## 💡 Quick Fixes to Try

### Fix 1: Reset transporter
Restart your application after changing email settings:
```bash
# Stop the app
Ctrl+C

# Start again
npm start
```

### Fix 2: Use port 587 with STARTTLS
```env
EMAIL_PORT=587
EMAIL_SECURE=false
```

### Fix 3: Test with a personal Gmail account first
To verify code is working:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your_app_password
```
Note: Gmail requires app-specific password if 2FA is enabled.

---

## 🎯 Recommended Configuration for cPanel/WHM

For most cPanel-based hosting:

```env
EMAIL_HOST=mail.buddydesk.in
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=no-reply@buddydesk.in
EMAIL_PASSWORD=your_password
```

Or:
```env
EMAIL_HOST=buddydesk.in
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=no-reply@buddydesk.in
EMAIL_PASSWORD=your_password
```

---

## 📞 Contact Hosting Provider

If nothing works, contact your hosting provider with these questions:

1. What are the correct SMTP settings for sending email?
2. Is SMTP enabled for the email account `no-reply@buddydesk.in`?
3. Are there any IP restrictions or firewall rules blocking SMTP?
4. What port should I use (465, 587, or other)?
5. Do I need to whitelist my application server's IP?
6. Are there any authentication requirements I'm missing?

---

## ✅ Success Indicators

When it's working, you should see:
```
✅ Email service is ready to send messages
✅ Email sent successfully: <message-id>
```

And the recipient should receive the email!

---

## 📚 Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [cPanel Email Configuration](https://docs.cpanel.net/cpanel/email/)
- [SMTP Ports Explained](https://www.mailgun.com/blog/which-smtp-port-understanding-ports-25-465-587/)

---

**Still having issues?** Check the application logs in `logs/error.log` for detailed error messages.

