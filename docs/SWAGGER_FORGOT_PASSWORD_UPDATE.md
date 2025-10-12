# Swagger Documentation Update - Forgot Password API

## Overview
The Swagger API documentation has been updated to include comprehensive documentation for the new forgot password functionality with email OTP verification.

---

## What Was Added

### 1. Schema Definitions (Components)

Added 8 new schema definitions to `components.schemas`:

#### Request Schemas

1. **ForgotPassword**
   - Used by: `POST /api/user/forgot-password`
   - Properties:
     - `email` (required): Email address where OTP will be sent

2. **VerifyOTP**
   - Used by: `POST /api/user/verify-reset-otp`
   - Properties:
     - `email` (required): Email address associated with OTP
     - `otp` (required): 6-digit numeric OTP

3. **ResetPassword**
   - Used by: `POST /api/user/reset-password`
   - Properties:
     - `reset_token` (required): JWT token from OTP verification
     - `new_password` (required): New password meeting security requirements

#### Response Schemas

4. **ForgotPasswordResponse**
   - Success response for forgot password request
   - Includes email and expiration time (10 minutes)

5. **VerifyOTPResponse**
   - Success response for OTP verification
   - Includes reset token and expiration time (15 minutes)

6. **ResetPasswordResponse**
   - Success response for password reset
   - Confirms successful password change

---

### 2. API Endpoint Documentation

Added 3 new endpoint paths under `/users`:

#### 1. POST /users/forgot-password

**Description:** Sends a 6-digit OTP to the user's email address for password reset

**Features:**
- OTP valid for 10 minutes
- Maximum 5 verification attempts
- Email validation

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response Codes:**
- `200` - OTP sent successfully
- `400` - Validation error (invalid email format)
- `404` - User not found
- `500` - Email sending failed

**Examples:**
- Valid email
- Invalid email format

---

#### 2. POST /users/verify-reset-otp

**Description:** Verifies the OTP and returns a reset token

**Features:**
- Maximum 5 verification attempts
- Attempt counter with remaining attempts
- Reset token expires in 15 minutes

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otp": "123456"
}
```

**Response Codes:**
- `200` - OTP verified, reset token provided
- `400` - Invalid/expired OTP or maximum attempts exceeded
- `404` - User not found
- `500` - Internal server error

**Error Examples:**
- Invalid OTP (with remaining attempts)
- Expired OTP
- Maximum attempts exceeded
- No OTP request found

---

#### 3. POST /users/reset-password

**Description:** Resets password using verified reset token

**Features:**
- All active sessions invalidated
- Confirmation email sent
- Strong password validation

**Request Body:**
```json
{
  "reset_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "new_password": "NewSecureP@ssw0rd123"
}
```

**Response Codes:**
- `200` - Password reset successfully
- `400` - Invalid/expired token or weak password
- `404` - User not found
- `500` - Internal server error

**Error Examples:**
- Invalid reset token
- Expired reset token
- Invalid or expired reset request
- Password validation error

---

### 3. API Description Update

Updated the main API description to include:
```
**Password Reset:** Secure forgot password flow with email OTP verification. 
OTPs expire in 10 minutes with a maximum of 5 verification attempts.
```

---

## Accessing the Documentation

### Local Development

1. Start your application:
   ```bash
   npm start
   ```

2. Open Swagger UI in your browser:
   ```
   http://localhost:3000/api-docs
   ```

3. Navigate to the "Users" section to see the new endpoints:
   - POST /users/forgot-password
   - POST /users/verify-reset-otp
   - POST /users/reset-password

### Production

Access the Swagger documentation at:
```
https://api.buddydesk.in/api-docs
```

---

## Testing with Swagger UI

### Step 1: Request OTP

1. Expand `POST /users/forgot-password`
2. Click "Try it out"
3. Enter a valid email address:
   ```json
   {
     "email": "your.email@example.com"
   }
   ```
4. Click "Execute"
5. Check response and your email for the OTP

### Step 2: Verify OTP

1. Expand `POST /users/verify-reset-otp`
2. Click "Try it out"
3. Enter email and OTP from your email:
   ```json
   {
     "email": "your.email@example.com",
     "otp": "123456"
   }
   ```
4. Click "Execute"
5. Copy the `reset_token` from the response

### Step 3: Reset Password

1. Expand `POST /users/reset-password`
2. Click "Try it out"
3. Enter reset token and new password:
   ```json
   {
     "reset_token": "your_reset_token_here",
     "new_password": "NewSecureP@ssw0rd123"
   }
   ```
4. Click "Execute"
5. Verify success message

---

## Schema Validation

All endpoints include comprehensive validation:

### Email Validation
- Format: Valid email address
- Max length: 255 characters
- Example: `john.doe@example.com`

### OTP Validation
- Pattern: `^[0-9]{6}$` (exactly 6 digits)
- Length: 6 characters
- Type: Numeric string
- Example: `123456`

### Password Validation
- Min length: 8 characters
- Max length: 128 characters
- Requirements:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- Example: `NewSecureP@ssw0rd123`

### Reset Token
- Type: JWT string
- Format: Bearer token
- Expiration: 15 minutes
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Response Examples

### Success Response - Forgot Password
```json
{
  "success": true,
  "message": "OTP has been sent to your email address. Please check your inbox.",
  "data": {
    "email": "john.doe@example.com",
    "expires_in_minutes": 10
  }
}
```

### Success Response - Verify OTP
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

### Success Response - Reset Password
```json
{
  "success": true,
  "message": "Password has been reset successfully. Please login with your new password."
}
```

### Error Response - Invalid OTP
```json
{
  "success": false,
  "message": "Invalid OTP. 4 attempt(s) remaining."
}
```

### Error Response - Expired OTP
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new OTP."
}
```

### Error Response - Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "new_password",
      "message": "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    }
  ]
}
```

---

## Interactive Examples

Each endpoint includes multiple interactive examples in Swagger UI:

### Forgot Password Examples
- ✅ Valid email
- ❌ Invalid email format

### Verify OTP Examples
- ✅ Valid OTP
- ❌ Invalid OTP
- ❌ Wrong OTP format (less than 6 digits)

### Reset Password Examples
- ✅ Valid reset request
- ❌ Weak password

---

## Security Information

### OTP Security
- **Expiration:** 10 minutes from generation
- **Attempts:** Maximum 5 verification attempts
- **Storage:** Hashed using bcrypt (salt rounds: 10)
- **Single Use:** Deleted after successful password reset

### Reset Token Security
- **Type:** JWT with signature verification
- **Expiration:** 15 minutes from OTP verification
- **Validation:** Token type and OTP record verification
- **Single Use:** OTP record deleted after use

### Password Requirements
- Minimum 8 characters
- Maximum 128 characters
- Must contain:
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (@$!%*?&)

---

## API Tags

All forgot password endpoints are grouped under the **"Users"** tag in Swagger UI, making them easy to find alongside other user-related endpoints:

- User Registration
- User Login
- Refresh Token
- Logout
- Change Password
- **Forgot Password** ⬅️ NEW
- **Verify Reset OTP** ⬅️ NEW
- **Reset Password** ⬅️ NEW
- Get Profile
- Update Profile
- Delete Account
- Block/Unblock Users

---

## Files Modified

1. **config/swagger.config.js**
   - Added 8 new schema definitions (lines ~253-343)
   - Added 3 new endpoint paths (lines ~3981-4292)
   - Updated API description (line ~51)

---

## Testing the Documentation

### Visual Verification

1. Start application: `npm start`
2. Open: `http://localhost:3000/api-docs`
3. Verify new sections:
   - ✅ Schemas section includes new schemas
   - ✅ Users tag shows 3 new endpoints
   - ✅ Each endpoint has proper descriptions
   - ✅ Request/response examples are present
   - ✅ Error examples are documented

### Functional Testing

Use Swagger UI "Try it out" feature to:
1. Send forgot password request
2. Verify OTP from email
3. Reset password
4. Verify all responses match documentation

---

## Export Options

Swagger documentation can be exported in multiple formats:

### JSON Format
```
http://localhost:3000/api-docs.json
```

### YAML Format
```
http://localhost:3000/api-docs.yaml
```

These can be imported into:
- Postman
- Insomnia
- Other API clients
- API documentation tools

---

## Customization

The Swagger configuration can be further customized by editing:
```
config/swagger.config.js
```

You can:
- Add more examples
- Include more detailed descriptions
- Add custom headers
- Configure authentication
- Add server variables

---

## Related Documentation

- [Complete Email Service Documentation](./EMAIL_SERVICE_AND_FORGOT_PASSWORD.md)
- [Quick Start Guide](./FORGOT_PASSWORD_QUICK_START.md)
- [Postman Collection](./FORGOT_PASSWORD_POSTMAN_COLLECTION.json)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

---

## Benefits of Swagger Documentation

✅ **Interactive Testing** - Test APIs directly from browser
✅ **Auto-generated** - Synchronized with actual code
✅ **Examples Included** - Multiple request/response examples
✅ **Schema Validation** - Clear validation rules
✅ **Error Documentation** - All error cases documented
✅ **Export Ready** - Can be exported to multiple formats
✅ **Team Collaboration** - Share with frontend developers
✅ **API Discovery** - Easy to explore and understand

---

## Maintenance

To keep documentation up-to-date:

1. Update `config/swagger.config.js` when changing endpoints
2. Add examples for new use cases
3. Document new error responses
4. Update descriptions as features evolve
5. Keep version number current

---

## Support

For issues with Swagger documentation:
1. Check Swagger UI console for errors
2. Verify `swagger-jsdoc` and `swagger-ui-express` are installed
3. Review `config/swagger.config.js` for syntax errors
4. Check server logs for initialization errors

---

**Swagger documentation update complete!** 🎉

Access your updated API documentation at: `http://localhost:3000/api-docs`

