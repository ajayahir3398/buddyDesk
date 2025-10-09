# User Block Functionality - Quick Start Guide

## Quick Reference

### API Endpoints
```
POST   /api/users/block/:userId         - Block a user
DELETE /api/users/block/:userId         - Unblock a user
GET    /api/users/blocked-users         - Get list of blocked users
```

All endpoints require authentication with Bearer token.

---

## Quick Examples

### 1. Block a User
```bash
curl -X POST http://localhost:3000/api/users/block/456 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Spam"}'
```

**Response:**
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

---

### 2. Unblock a User
```bash
curl -X DELETE http://localhost:3000/api/users/block/456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "User unblocked successfully",
  "data": {
    "unblocked_user_id": 456
  }
}
```

---

### 3. Get Blocked Users List
```bash
curl -X GET "http://localhost:3000/api/users/blocked-users?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Blocked users retrieved successfully",
  "data": {
    "blocked_users": [
      {
        "block_id": 123,
        "blocked_at": "2024-01-01T00:00:00.000Z",
        "reason": "Spam",
        "user": {
          "id": 456,
          "name": "Jane Doe",
          "email": "jane@example.com",
          "profile": {
            "image_url": "http://localhost:3000/api/files/images/profile.jpg",
            "bio": "Developer",
            "city": "New York",
            "state": "NY"
          }
        }
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "total_pages": 1
    }
  }
}
```

---

## What Gets Filtered?

Once you block a user, their content is automatically hidden from:

✅ **Posts Feed** (`GET /api/posts`)  
✅ **Matching Posts** (`GET /api/posts/matching`)  
✅ **Temp Address Posts** (`GET /api/posts/temp-address`)  
✅ **Main Feed** (`GET /api/feed`)  
✅ **Trending Posts** (`GET /api/feed/trending`)  

---

## Key Rules

❌ **Cannot block yourself**  
❌ **Cannot block the same user twice**  
✅ **Blocks are reversible** (can unblock anytime)  
✅ **No notifications sent** to blocked user  
✅ **One-way blocking** (they can still see your content unless they also block you)  

---

## Common Error Codes

| Status | Meaning |
|--------|---------|
| 201 | User blocked successfully |
| 200 | User unblocked successfully / List retrieved |
| 400 | Invalid request (self-block, already blocked, etc.) |
| 401 | Missing or invalid authentication token |
| 404 | User not found / User is not blocked |
| 500 | Server error |

---

## Testing in Swagger UI

1. Go to `http://localhost:3000/api-docs`
2. Click "Authorize" and enter your JWT token
3. Navigate to the **Users** section
4. Try the block/unblock endpoints

---

## JavaScript Frontend Example

```javascript
// Block a user
async function blockUser(userId) {
  const response = await fetch(`/api/users/block/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason: 'Spam content' })
  });
  
  const data = await response.json();
  console.log(data);
}

// Unblock a user
async function unblockUser(userId) {
  const response = await fetch(`/api/users/block/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log(data);
}

// Get blocked users
async function getBlockedUsers() {
  const response = await fetch('/api/users/blocked-users?page=1&limit=20', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log(data.data.blocked_users);
}
```

---

## React Example

```jsx
import { useState, useEffect } from 'react';

function BlockedUsersList() {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const response = await fetch('/api/users/blocked-users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBlockedUsers(data.data.blocked_users);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      const response = await fetch(`/api/users/block/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Remove from list
        setBlockedUsers(prev => prev.filter(u => u.user.id !== userId));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Blocked Users</h2>
      {blockedUsers.length === 0 ? (
        <p>No blocked users</p>
      ) : (
        <ul>
          {blockedUsers.map(block => (
            <li key={block.block_id}>
              <span>{block.user.name}</span>
              <button onClick={() => handleUnblock(block.user.id)}>
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## Database Setup

If this is a new installation, the table will be created automatically when the server starts.

For existing databases, the table will be created on next server restart with `sync: true` in Sequelize config.

---

## Need More Info?

📖 **Full Documentation:** `docs/USER_BLOCK_FUNCTIONALITY.md`  
📊 **Swagger UI:** `http://localhost:3000/api-docs`  
🔍 **Implementation Summary:** `docs/USER_BLOCK_IMPLEMENTATION.md`  

---

## Troubleshooting

**Problem:** "User is already blocked" error  
**Solution:** Check if you've already blocked this user using GET `/api/users/blocked-users`

**Problem:** "User is not blocked" when trying to unblock  
**Solution:** Verify the user ID is correct and that you actually blocked them

**Problem:** Content still showing after block  
**Solution:** Refresh the feed/posts list - blocking filters content on next request

**Problem:** 401 Unauthorized error  
**Solution:** Ensure you're sending a valid Bearer token in the Authorization header

