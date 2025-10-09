# User Block Functionality

## Overview
The User Block functionality allows users to block other users on the BuddyDesk platform. When a user is blocked, their posts and feed posts will no longer appear in the blocker's feeds and post lists.

## Features
- **Block Users**: Block any user by their user ID
- **Unblock Users**: Remove users from your block list
- **View Blocked Users**: Get a paginated list of all users you've blocked
- **Automatic Content Filtering**: Posts and feed posts from blocked users are automatically hidden from all your feeds

## API Endpoints

### 1. Block a User
**Endpoint:** `POST /api/users/block/:userId`

**Authentication:** Required (Bearer Token)

**Request:**
```http
POST /api/users/block/456
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "reason": "Inappropriate behavior"
}
```

**Parameters:**
- `userId` (path parameter, required) - ID of the user to block
- `reason` (body, optional) - Optional reason for blocking

**Success Response (201):**
```json
{
  "success": true,
  "message": "User blocked successfully",
  "data": {
    "block_id": 123,
    "blocked_user_id": 456
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid user ID, trying to block self, or user already blocked
- `404 Not Found` - User not found
- `401 Unauthorized` - Missing or invalid authentication token

---

### 2. Unblock a User
**Endpoint:** `DELETE /api/users/block/:userId`

**Authentication:** Required (Bearer Token)

**Request:**
```http
DELETE /api/users/block/456
Authorization: Bearer <your_jwt_token>
```

**Parameters:**
- `userId` (path parameter, required) - ID of the user to unblock

**Success Response (200):**
```json
{
  "success": true,
  "message": "User unblocked successfully",
  "data": {
    "unblocked_user_id": 456
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid user ID
- `404 Not Found` - User is not blocked
- `401 Unauthorized` - Missing or invalid authentication token

---

### 3. Get Blocked Users
**Endpoint:** `GET /api/users/blocked-users`

**Authentication:** Required (Bearer Token)

**Request:**
```http
GET /api/users/blocked-users?page=1&limit=20
Authorization: Bearer <your_jwt_token>
```

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 20) - Number of items per page

**Success Response (200):**
```json
{
  "success": true,
  "message": "Blocked users retrieved successfully",
  "data": {
    "blocked_users": [
      {
        "block_id": 123,
        "blocked_at": "2024-01-01T00:00:00.000Z",
        "reason": "Inappropriate behavior",
        "user": {
          "id": 456,
          "name": "Jane Smith",
          "email": "jane@example.com",
          "profile": {
            "image_url": "http://localhost:3000/api/files/images/profile.jpg",
            "bio": "Software Developer",
            "city": "New York",
            "state": "NY"
          }
        }
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 20,
      "total_pages": 1
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `500 Internal Server Error` - Server error

---

## Database Schema

### user_blocks Table
```sql
CREATE TABLE user_blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blocker_id INT NOT NULL,
  blocked_id INT NOT NULL,
  reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_block (blocker_id, blocked_id),
  FOREIGN KEY (blocker_id) REFERENCES user(id),
  FOREIGN KEY (blocked_id) REFERENCES user(id),
  INDEX idx_blocker (blocker_id),
  INDEX idx_blocked (blocked_id)
);
```

**Table Description:**
- `id`: Unique identifier for the block record
- `blocker_id`: ID of the user who is blocking
- `blocked_id`: ID of the user who is being blocked
- `reason`: Optional text field for the reason of blocking
- `created_at`: Timestamp when the block was created
- `updated_at`: Timestamp when the block was last updated
- Unique constraint ensures a user can only block another user once

---

## Content Filtering

When a user blocks another user, the following content from the blocked user will be automatically filtered out:

### Posts
- `GET /api/posts` - All posts endpoint
- `GET /api/posts/matching` - Matching posts endpoint
- `GET /api/posts/temp-address` - Posts by temporary address

### Feed Posts
- `GET /api/feed` - Main feed endpoint
- `GET /api/feed/trending` - Trending posts endpoint

### Implementation Details
The filtering is implemented at the database query level using Sequelize's `Op.notIn` operator to exclude posts where the `user_id` matches any blocked user IDs.

---

## Business Rules

1. **Self-Blocking Prevention**: Users cannot block themselves
2. **Duplicate Block Prevention**: Users cannot block the same user twice
3. **Automatic Content Hiding**: Once blocked, content is immediately hidden from all feeds
4. **Reversible Action**: Blocks can be removed by unblocking the user
5. **No Notification**: Blocked users are not notified when they are blocked
6. **Bidirectional Independence**: If User A blocks User B, User B can still see User A's content (unless User B also blocks User A)

---

## Testing Examples

### Using cURL

**Block a user:**
```bash
curl -X POST http://localhost:3000/api/users/block/456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Spam content"}'
```

**Unblock a user:**
```bash
curl -X DELETE http://localhost:3000/api/users/block/456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get blocked users:**
```bash
curl -X GET "http://localhost:3000/api/users/blocked-users?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (only in development mode)"
}
```

Common error scenarios:
- **Invalid User ID**: Non-numeric or missing user ID
- **User Not Found**: Attempting to block a non-existent user
- **Already Blocked**: Attempting to block a user who is already blocked
- **Not Blocked**: Attempting to unblock a user who is not blocked
- **Self-Block Attempt**: Attempting to block your own account

---

## Model Associations

The `UserBlock` model has the following associations:

```javascript
// UserBlock associations
UserBlock.belongsTo(User, { foreignKey: 'blocker_id', as: 'blocker' });
UserBlock.belongsTo(User, { foreignKey: 'blocked_id', as: 'blocked' });

// User associations
User.hasMany(UserBlock, { foreignKey: 'blocker_id', as: 'blockedUsers' });
User.hasMany(UserBlock, { foreignKey: 'blocked_id', as: 'blockedBy' });
```

---

## Frontend Integration Guide

### Example: Block User Button
```javascript
async function blockUser(userId, reason = null) {
  try {
    const response = await fetch(`/api/users/block/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('User blocked successfully');
      // Refresh the feed to remove blocked user's content
      refreshFeed();
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error blocking user:', error);
  }
}
```

### Example: Display Blocked Users List
```javascript
async function fetchBlockedUsers(page = 1) {
  try {
    const response = await fetch(`/api/users/blocked-users?page=${page}&limit=20`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      displayBlockedUsers(data.data.blocked_users);
      setupPagination(data.data.pagination);
    }
  } catch (error) {
    console.error('Error fetching blocked users:', error);
  }
}
```

---

## Performance Considerations

1. **Indexed Queries**: The `user_blocks` table has indexes on both `blocker_id` and `blocked_id` for fast lookups
2. **Query Optimization**: Blocked user IDs are fetched once per request and cached in memory for the duration of the request
3. **Pagination**: The blocked users list endpoint supports pagination to handle large block lists
4. **Minimal Overhead**: Content filtering adds minimal overhead as it's a simple `NOT IN` clause in the WHERE condition

---

## Security Considerations

1. **Authentication Required**: All block-related endpoints require valid JWT authentication
2. **User Isolation**: Users can only block/unblock for their own account
3. **Input Validation**: User IDs are validated to be numeric values
4. **SQL Injection Prevention**: All queries use Sequelize's parameterized queries

---

## Migration

If you're adding this feature to an existing database, run the following SQL:

```sql
CREATE TABLE IF NOT EXISTS user_blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blocker_id INT NOT NULL,
  blocked_id INT NOT NULL,
  reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_block (blocker_id, blocked_id),
  FOREIGN KEY (blocker_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES user(id) ON DELETE CASCADE,
  INDEX idx_blocker (blocker_id),
  INDEX idx_blocked (blocked_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Future Enhancements

Potential features for future versions:
- Block statistics and analytics
- Temporary blocks with expiration
- Block reasons categorization
- Admin tools to review blocks
- Block reporting for abuse prevention
- Mutual block detection

---

## Support

For issues or questions regarding the User Block functionality, please contact the development team or refer to the main API documentation.

