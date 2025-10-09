# Profile Response Update - Report Fields

## Overview
The user profile endpoints have been updated to include the new report-related fields (`is_blocked` and `report_count`) in their responses.

## Updated Endpoints

### 1. GET /api/users/profile
**Description:** Get current authenticated user's profile

**Response includes new fields:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "referral_code": "ABC123",
    "referred_user_count": 5,
    "is_blocked": false,           // NEW FIELD
    "report_count": 0,              // NEW FIELD
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "profile": {
      // Profile details
    },
    "work_profiles": [...],
    "addresses": [...],
    "temp_addresses": [...],
    "notification_settings": {...},
    "posts": [...],
    "terms_accepted": true,
    "terms_version": "1.0",
    "terms_accepted_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. GET /api/users/profile/:id
**Description:** Get user profile by ID (own profile only)

**Response:** Same structure as above with the new fields included.

## New Fields Description

### is_blocked (Boolean)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Indicates whether the user is blocked due to excessive reporting (10+ reports)
- **Values:**
  - `false` - User is active and can perform all actions
  - `true` - User is blocked and cannot create posts or make reports

### report_count (Integer)
- **Type:** Integer
- **Default:** `0`
- **Description:** Total number of reports submitted by this user
- **Range:** 0 to unlimited
- **Threshold:** Users are automatically blocked at 10 reports

## Usage Examples

### Check If You're Blocked
```javascript
// Make API call to get profile
const response = await fetch('/api/users/profile', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const data = await response.json();

if (data.data.is_blocked) {
  console.log('You are blocked from reporting and creating posts');
  console.log(`Total reports made: ${data.data.report_count}`);
} else {
  console.log(`Reports remaining before block: ${10 - data.data.report_count}`);
}
```

### Display Warning to User
```javascript
const { is_blocked, report_count } = profileData;

if (report_count >= 8 && !is_blocked) {
  // Show warning when user is close to being blocked
  showWarning(`You have made ${report_count} reports. After 10 reports, your account will be blocked.`);
}

if (is_blocked) {
  // Show blocked message
  showError('Your account has been blocked due to excessive reporting. Please contact support.');
}
```

### Conditional UI Elements
```javascript
// Show/hide report button based on block status
if (profileData.is_blocked) {
  reportButton.disabled = true;
  reportButton.title = 'You are blocked from reporting';
} else {
  reportButton.disabled = false;
  reportButton.title = 'Report this post';
}
```

## Frontend Integration

### React Example
```jsx
function UserProfile({ profileData }) {
  const { is_blocked, report_count } = profileData;
  
  return (
    <div className="profile">
      <h2>{profileData.name}</h2>
      
      {/* Show blocking status */}
      {is_blocked && (
        <div className="alert alert-danger">
          <strong>Account Blocked</strong>
          <p>You have been blocked due to excessive reporting.</p>
        </div>
      )}
      
      {/* Show warning if close to block */}
      {!is_blocked && report_count >= 8 && (
        <div className="alert alert-warning">
          <strong>Warning:</strong> You have made {report_count} reports. 
          After 10 reports, your account will be blocked.
        </div>
      )}
      
      {/* Display report count */}
      <div className="stats">
        <span>Reports made: {report_count}</span>
      </div>
    </div>
  );
}
```

### Vue Example
```vue
<template>
  <div class="profile">
    <h2>{{ profile.name }}</h2>
    
    <!-- Blocking alert -->
    <div v-if="profile.is_blocked" class="alert alert-danger">
      <strong>Account Blocked</strong>
      <p>You have been blocked due to excessive reporting.</p>
    </div>
    
    <!-- Warning alert -->
    <div v-else-if="profile.report_count >= 8" class="alert alert-warning">
      <strong>Warning:</strong> You have made {{ profile.report_count }} reports.
      After 10 reports, your account will be blocked.
    </div>
    
    <!-- Report count badge -->
    <span class="badge">
      Reports: {{ profile.report_count }}
    </span>
  </div>
</template>

<script>
export default {
  props: ['profile']
}
</script>
```

## API Response Comparison

### Before Update
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
  // ... other fields
}
```

### After Update
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "is_blocked": false,        // ← NEW
  "report_count": 0,          // ← NEW
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
  // ... other fields
}
```

## Backwards Compatibility

✅ **100% Backwards Compatible**
- Existing clients will continue to work
- New fields are added, no fields removed
- Default values ensure no null errors
- Old users automatically have `is_blocked: false` and `report_count: 0`

## Testing

### Test Profile Response
```bash
# Get your profile
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response includes:
{
  "success": true,
  "data": {
    "id": 1,
    "is_blocked": false,
    "report_count": 0,
    // ... other fields
  }
}
```

### Test After Reporting
```bash
# Make a report
curl -X POST http://localhost:3000/api/posts/123/report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test report"}'

# Check profile again - report_count should increase
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# report_count should now be 1
```

## Database Schema

The User model now includes:
```sql
CREATE TABLE user (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  -- ... other fields
  is_blocked BOOLEAN DEFAULT FALSE,
  report_count INT DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Security Considerations

1. **Privacy:** Block status and report count are only visible to the user themselves
2. **Validation:** Fields have default values to prevent null errors
3. **Read-Only:** These fields cannot be directly modified via profile update endpoints
4. **Automatic:** Values are updated automatically by the report system

## Support

For questions or issues:
- Check documentation: `docs/REPORT_FUNCTIONALITY.md`
- View implementation: `controllers/user.controller.js`
- Report bugs to the development team

---

**Last Updated:** October 9, 2025  
**Version:** 1.0.0  
**Status:** ✅ Live in Production

