# Post Swipe Functionality Documentation

## Overview

The post swipe feature allows users to hide posts they don't want to see:
- **Left Swipe**: Temporarily hide a post for 120 days
- **Right Swipe**: Permanently hide a post

Swiped posts are automatically excluded from the `/api/posts/temp-address` endpoint results.

## Database Schema

### Table: `post_swipe`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `user_id` | INTEGER | User who performed the swipe (FK to user table) |
| `post_id` | INTEGER | Post that was swiped (FK to post table) |
| `swipe_type` | ENUM('left', 'right') | Type of swipe |
| `created_at` | TIMESTAMP | When the swipe was created |
| `expires_at` | TIMESTAMP | NULL for right swipe, or created_at + 120 days for left swipe |
| `updated_at` | TIMESTAMP | Last update time |

**Constraints:**
- Unique constraint on `(user_id, post_id)` - users can only swipe each post once
- Check constraint ensures right swipes have NULL expires_at, left swipes have a date

**Indexes:**
- `idx_post_swipe_user_id` - Fast lookups by user
- `idx_post_swipe_user_swipe_type` - Fast filtering by user and swipe type
- `idx_post_swipe_expires_at` - Efficient expiration checks
- `idx_post_swipe_active` - Optimized query for active (non-expired) swipes

## API Endpoints

### 1. Swipe a Post

**Endpoint:** `POST /api/posts/:id/swipe`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "swipeType": "left"  // or "right"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Post hidden for 120 days",
  "data": {
    "swipe_id": 1,
    "post_id": 123,
    "swipe_type": "left",
    "expires_at": "2025-02-07T10:00:00.000Z"
  }
}
```

**Update Response (200):** If user swipes the same post again
```json
{
  "success": true,
  "message": "Post swipe updated to right",
  "data": {
    "post_id": 123,
    "swipe_type": "right",
    "expires_at": null
  }
}
```

**Error Responses:**
- `400` - Invalid swipe type or trying to swipe own post
- `404` - Post not found
- `401` - Unauthorized

### 2. Get User's Swiped Posts

**Endpoint:** `GET /api/posts/swipes/my-swipes`

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Items per page
- `swipeType` (optional) - Filter by 'left' or 'right'

**Success Response (200):**
```json
{
  "success": true,
  "message": "Swiped posts retrieved successfully",
  "data": [
    {
      "id": 1,
      "user_id": 10,
      "post_id": 123,
      "swipe_type": "left",
      "created_at": "2024-10-10T10:00:00.000Z",
      "expires_at": "2025-02-07T10:00:00.000Z",
      "post": {
        "id": 123,
        "title": "Need help with React",
        "user": {
          "id": 20,
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

### 3. Get Posts by Temp Address (Updated)

**Endpoint:** `GET /api/posts/temp-address`

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `isFilterBySkills` (optional, default: false)

**Behavior:**

**Always excluded (regardless of isFilterBySkills):**
1. Posts the user has reported
2. Posts from blocked users
3. User's own posts

**Excluded ONLY when `isFilterBySkills=true`:**
- **Posts the user has swiped** (both left and right swipes)
  - Right swipes: excluded permanently
  - Left swipes: excluded until expires_at date passes
- Posts filtered by user's looking_skills

**When `isFilterBySkills=false`:**
- Shows all active posts in the user's temp address pincode
- Does NOT filter by swipes (users can see previously swiped posts again)
- Does NOT filter by skills

## Frontend Integration Guide

### Example: Swipe Handler

```javascript
// When user swipes a post
const handlePostSwipe = async (postId, direction) => {
  try {
    const response = await fetch(`https://api.buddydesk.in/api/posts/${postId}/swipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        swipeType: direction // 'left' or 'right'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // Remove post from current view
      removePostFromUI(postId);
      
      // Show user feedback
      showToast(
        direction === 'left' 
          ? 'Post hidden for 120 days' 
          : 'Post hidden permanently'
      );
    }
  } catch (error) {
    console.error('Swipe failed:', error);
    showError('Failed to hide post');
  }
};

// Usage in swipe component
<SwipeablePost
  onSwipeLeft={() => handlePostSwipe(post.id, 'left')}
  onSwipeRight={() => handlePostSwipe(post.id, 'right')}
>
  <PostCard post={post} />
</SwipeablePost>
```

### React Native Example with react-native-deck-swiper

```jsx
import Swiper from 'react-native-deck-swiper';

const PostSwiper = ({ posts }) => {
  const handleSwipe = async (cardIndex, direction) => {
    const post = posts[cardIndex];
    const swipeType = direction === 'left' ? 'left' : 'right';
    
    try {
      await swipePost(post.id, swipeType);
    } catch (error) {
      console.error('Swipe error:', error);
    }
  };

  return (
    <Swiper
      cards={posts}
      onSwipedLeft={(cardIndex) => handleSwipe(cardIndex, 'left')}
      onSwipedRight={(cardIndex) => handleSwipe(cardIndex, 'right')}
      cardIndex={0}
      backgroundColor={'transparent'}
      stackSize={3}
    >
      {/* Post card rendering */}
    </Swiper>
  );
};
```

## Database Migration

Run the migration script to create the table:

```bash
psql -U your_username -d your_database -f migrations/create_post_swipe_table.sql
```

Or if using a migration tool:

```bash
# Using Sequelize CLI (if configured)
npx sequelize-cli db:migrate

# Manual sync (development only - not recommended for production)
# The PostSwipe model will auto-sync if sync: true in Sequelize config
```

## Testing

### Test Scenarios

1. **Left Swipe (Temporary Hide)**
   ```bash
   curl -X POST https://api.buddydesk.in/api/posts/123/swipe \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"swipeType": "left"}'
   
   # Verify post is excluded from feed
   curl https://api.buddydesk.in/api/posts/temp-address?page=1&limit=10 \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Right Swipe (Permanent Hide)**
   ```bash
   curl -X POST https://api.buddydesk.in/api/posts/456/swipe \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"swipeType": "right"}'
   ```

3. **View Swiped Posts**
   ```bash
   # All swiped posts
   curl https://api.buddydesk.in/api/posts/swipes/my-swipes \
     -H "Authorization: Bearer YOUR_TOKEN"
   
   # Only left swipes (temporary)
   curl "https://api.buddydesk.in/api/posts/swipes/my-swipes?swipeType=left" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. **Update Swipe** (e.g., change left to right)
   ```bash
   curl -X POST https://api.buddydesk.in/api/posts/123/swipe \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"swipeType": "right"}'
   ```

## Performance Considerations

1. **Indexes**: The table includes optimized indexes for common query patterns
2. **Expiration**: Left swipes automatically expire after 120 days (checked via `expires_at`)
3. **Caching**: Consider caching user's swiped post IDs for frequently accessed feeds
4. **Bulk Operations**: For performance, swiped post IDs are fetched once per request

## Maintenance

### Cleanup Expired Swipes (Optional)

You can create a scheduled job to delete expired left swipes:

```sql
-- Delete expired left swipes (optional cleanup)
DELETE FROM post_swipe 
WHERE swipe_type = 'left' 
  AND expires_at < CURRENT_TIMESTAMP;
```

However, the query logic already handles expired swipes automatically, so physical deletion is optional.

## Security & Validation

- ✅ Users cannot swipe their own posts
- ✅ Authentication required for all swipe operations
- ✅ Unique constraint prevents duplicate swipes
- ✅ Input validation on swipeType ('left' or 'right' only)
- ✅ Cascade deletion when post or user is deleted

## Summary

The swipe functionality provides users with granular control over their feed:
- **Left swipe** = "Not interested right now" (120 days)
- **Right swipe** = "Never show me this" (permanent)

The feature is fully integrated with the existing post filtering system and requires no changes to client-side data structures - swiped posts simply don't appear in results.

