# Quick Test After Password Reset

## After resetting password in cPanel:

### 1. Update .env file
```env
EMAIL_PASSWORD="your_new_password"
```

### 2. Stop the running app (if running)
Press `Ctrl+C` in the terminal where the app is running

### 3. Run the SMTP test
```bash
node test-smtp-connection.js
```

### 4. If test passes, start the app
```bash
npm start
```

### 5. Test forgot password endpoint
```bash
curl -X POST http://localhost:3000/api/user/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"bandhiya.ajay@gmail.com"}'
```

## Expected Success Output:

```
✅ SUCCESS: SMTP connection verified!
✅ This configuration works!
```

Then you should receive the OTP email!

