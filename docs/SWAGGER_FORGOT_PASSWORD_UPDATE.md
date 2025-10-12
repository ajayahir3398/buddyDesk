# Swagger Documentation Update - Forgot Password

## Overview
Updated Swagger/OpenAPI documentation to include the new forgot password and reset password endpoints.

## Changes Made

### 1. Added Schema Definitions

#### ForgotPassword Schema (Line ~253-265)
```yaml
ForgotPassword:
  type: object
  required: [email]
  properties:
    email:
      type: string
      format: email
      example: "john.doe@example.com"
      description: "Email address for password reset"
      maxLength: 255
```

#### ForgotPasswordResponse Schema (Line ~266-275)
```yaml
ForgotPasswordResponse:
  type: object
  properties:
    success:
      type: boolean
      example: true
    message:
      type: string
      example: "If an account with that email exists, a password reset link has been sent."
```

#### ResetPassword Schema (Line ~276-295)
```yaml
ResetPassword:
  type: object
  required: [token, new_password]
  properties:
    token:
      type: string
      example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0"
      description: "Password reset token received via email (64 character hex string)"
      minLength: 1
      maxLength: 500
    new_password:
      type: string
      example: "NewSecureP@ssw0rd123"
      description: "New password (8-128 characters, must contain uppercase, lowercase, number, and special character)"
      minLength: 8
      maxLength: 128
```

#### ResetPasswordResponse Schema (Line ~296-305)
```yaml
ResetPasswordResponse:
  type: object
  properties:
    success:
      type: boolean
      example: true
    message:
      type: string
      example: "Password has been reset successfully. You can now log in with your new password."
```

### 2. Added Endpoint Documentation

#### POST /users/forgot-password (Line ~3943-4024)

**Summary**: Request password reset

**Description**: Send a password reset email with a secure token. Always returns success message for security (prevents email enumeration). Token expires in 1 hour.

**Request Body**:
```json
{
  "email": "john.doe@example.com"
}
```

**Responses**:
- **200 OK**: Password reset email sent (or would be sent if email exists)
  ```json
  {
    "success": true,
    "message": "If an account with that email exists, a password reset link has been sent."
  }
  ```

- **400 Bad Request**: Validation error (invalid email format)
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": [
      {
        "field": "email",
        "message": "Please provide a valid email address",
        "value": "invalid-email"
      }
    ]
  }
  ```

- **500 Internal Server Error**: Failed to send email
  ```json
  {
    "success": false,
    "message": "Failed to send password reset email. Please try again later."
  }
  ```

**Examples Provided**:
1. Valid email
2. Invalid email format

#### POST /users/reset-password (Line ~4025-4126)

**Summary**: Reset password with token

**Description**: Reset user password using the token received via email. Token must be valid and not expired (1 hour expiry). All active sessions will be invalidated after password reset.

**Request Body**:
```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0",
  "new_password": "NewSecureP@ssw0rd123"
}
```

**Responses**:
- **200 OK**: Password reset successfully
  ```json
  {
    "success": true,
    "message": "Password has been reset successfully. You can now log in with your new password."
  }
  ```

- **400 Bad Request**: Invalid/expired token or validation error
  - Token expired:
    ```json
    {
      "success": false,
      "message": "Invalid or expired reset token. Please request a new password reset."
    }
    ```
  - Validation error:
    ```json
    {
      "success": false,
      "message": "Validation failed",
      "errors": [
        {
          "field": "new_password",
          "message": "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
          "value": "weak"
        }
      ]
    }
    ```

- **500 Internal Server Error**: Internal server error

**Examples Provided**:
1. Valid reset request
2. Weak password
3. Invalid or expired token

## Features Documented

### Security Features
- ✅ Email enumeration protection (always returns success)
- ✅ Token expiry (1 hour)
- ✅ Secure token generation
- ✅ Session invalidation on password reset
- ✅ Strong password validation

### Validation Rules
- ✅ Email format validation
- ✅ Password strength requirements (8-128 chars, uppercase, lowercase, number, special char)
- ✅ Token format validation

### Error Handling
- ✅ Comprehensive error responses
- ✅ Multiple example scenarios
- ✅ Clear error messages

## Accessing the Documentation

Once your server is running, you can access the updated Swagger documentation at:

- **Local Development**: `http://localhost:3000/api-docs`
- **Production**: `https://api.buddydesk.in/api-docs`

## Testing in Swagger UI

### Test Forgot Password
1. Navigate to `/api-docs`
2. Find "Users" section
3. Click on `POST /users/forgot-password`
4. Click "Try it out"
5. Enter an email address
6. Click "Execute"
7. Check the response

### Test Reset Password
1. Navigate to `/api-docs`
2. Find "Users" section
3. Click on `POST /users/reset-password`
4. Click "Try it out"
5. Enter the token from email and new password
6. Click "Execute"
7. Check the response

## Integration with Frontend

The Swagger documentation provides:
- Complete API specifications
- Request/response examples
- Data type definitions
- Validation requirements
- Error scenarios

Frontend developers can use this to:
1. Understand the API contract
2. Generate API client code
3. Test API endpoints
4. Handle errors properly

## File Modified

- `config/swagger.config.js`
  - Added 4 new schemas (ForgotPassword, ForgotPasswordResponse, ResetPassword, ResetPasswordResponse)
  - Added 2 new endpoint definitions (/users/forgot-password, /users/reset-password)
  - Included comprehensive examples and error scenarios

## Validation

✅ No linter errors  
✅ Follows existing Swagger documentation patterns  
✅ Includes comprehensive examples  
✅ Documents all response codes  
✅ Includes security considerations  

## Related Documentation

- **Implementation Guide**: `docs/FORGOT_PASSWORD_IMPLEMENTATION.md`
- **Quick Start**: `docs/FORGOT_PASSWORD_QUICK_START.md`
- **Summary**: `docs/FORGOT_PASSWORD_SUMMARY.md`

## Notes

- The endpoints are public (no authentication required)
- Both endpoints are tagged under "Users" category
- Examples include both valid and invalid scenarios for testing
- Documentation emphasizes security features (email enumeration protection, token expiry)

---

**Updated**: January 2025  
**Status**: ✅ Complete  
**Version**: OpenAPI 3.0.0

