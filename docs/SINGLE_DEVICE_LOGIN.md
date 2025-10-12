# Single Device Login Implementation

## Overview
The application now enforces **single device login** policy. When a user logs in from a new device, all previous active sessions are automatically invalidated.

## How It Works

### Login Flow
1. User submits login credentials (email & password)
2. System validates credentials
3. **All existing active sessions for that user are invalidated**
4. New session is created for the current device
5. Access token and refresh token are generated
6. User successfully logs in on the new device

### Session Invalidation
When a new login occurs:
- All previous active sessions are marked as `is_active: false`
- `revoked_at` timestamp is set
- `reason` field is set to: `"New login from another device"`

## Impact on Users

### Previous Device Behavior
When a user logs in on Device B while already logged in on Device A:
- **Device A**: 
  - Existing session becomes invalid
  - Next API request will receive `401 Unauthorized` error
  - Refresh token will no longer work
  - User must login again to continue using the app
  
- **Device B**: 
  - New active session created
  - User can use the app normally

### User Experience
- Users will be automatically logged out from previous devices
- They will see an authentication error on the old device
- Must re-login on each device they want to use

## Technical Implementation

### Code Changes
**File**: `controllers/user.controller.js`

**Location**: Login function (lines 162-175)

```javascript
// Invalidate all existing active sessions for this user (single device login enforcement)
await SessionLog.update(
  {
    is_active: false,
    revoked_at: new Date(),
    reason: 'New login from another device'
  },
  {
    where: {
      user_id: user.id,
      is_active: true
    }
  }
);
```

### Database Impact
**Table**: `session_logs`

**Fields Updated on Previous Sessions**:
- `is_active`: `false`
- `revoked_at`: Current timestamp
- `reason`: `"New login from another device"`

## Security Benefits

1. **Enhanced Account Security**: Prevents unauthorized access if credentials are compromised
2. **Session Control**: Ensures only one active session per user at any time
3. **Forced Logout**: Automatically logs out users from stolen/lost devices when they login elsewhere
4. **Audit Trail**: Clear logging of session invalidation reasons

## API Behavior

### Successful Login Response
```json
{
  "success": true,
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Invalidated Session Error (Old Device)
```json
{
  "success": false,
  "message": "Invalid refresh token"
}
```

or

```json
{
  "success": false,
  "message": "Access token expired"
}
```

## Related Functions

Other functions that invalidate sessions:
1. **Logout**: Invalidates current device session only
2. **Password Reset**: Invalidates all sessions (security measure)
3. **Account Deletion**: Invalidates all sessions
4. **Change Password**: Invalidates all sessions (security measure)

## Testing

### Test Scenario
1. Login on Device A → Success
2. Make API requests on Device A → Success
3. Login on Device B with same credentials → Success
4. Make API requests on Device A → **401 Unauthorized**
5. Make API requests on Device B → Success

### Verification
Check `session_logs` table:
```sql
SELECT user_id, is_active, revoked_at, reason, user_agent, created_at 
FROM session_logs 
WHERE user_id = [USER_ID] 
ORDER BY created_at DESC;
```

## Frontend Integration

### Handling 401 Errors
Mobile apps and web frontends should:
1. Detect `401 Unauthorized` responses
2. Clear stored tokens (access token & refresh token)
3. Redirect user to login screen
4. Show appropriate message: *"You've been logged in on another device. Please login again."*

### Example Error Handling (JavaScript)
```javascript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Show message
      showMessage('You have been logged in on another device. Please login again.');
      
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Configuration

Currently, single device login is **hardcoded** and always enabled. 

### Future Enhancement (Optional)
To make it configurable:
1. Add environment variable: `SINGLE_DEVICE_LOGIN=true`
2. Add user preference in database
3. Implement per-user or per-plan configuration

## Rollback

To revert to multiple device login:
1. Remove the session invalidation code block (lines 162-175)
2. Sessions will no longer be invalidated on new logins
3. Users can maintain multiple active sessions

## Date Implemented
**Date**: October 12, 2025
**Version**: Current

## Related Documentation
- [Session Management](./SESSION_MANAGEMENT.md) (if exists)
- [Authentication Flow](./AUTHENTICATION_FLOW.md) (if exists)
- API Documentation for `/login` endpoint

