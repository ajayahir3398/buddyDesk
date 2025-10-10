# Post Swipe Feature - Quick Start Guide

## 🚀 Quick Setup

### 1. Run Database Migration
```bash
psql -U your_username -d your_database -f migrations/create_post_swipe_table.sql
```

### 2. Deploy Code
```bash
./deploy-production.sh
```

### 3. Test the Feature
```bash
# Swipe a post
curl -X POST https://api.buddydesk.in/api/posts/123/swipe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"swipeType": "left"}'

# Verify it's excluded from feed
curl https://api.buddydesk.in/api/posts/temp-address?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📱 Frontend Implementation (3 Steps)

### Step 1: Create Swipe Handler
```javascript
const swipePost = async (postId, swipeType) => {
  const response = await fetch(`${API_URL}/posts/${postId}/swipe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ swipeType })
  });
  return response.json();
};
```

### Step 2: Add Swipe Actions to UI
```jsx
// React Native with gesture library
<GestureHandler
  onSwipeLeft={() => swipePost(post.id, 'left')}
  onSwipeRight={() => swipePost(post.id, 'right')}
>
  <PostCard post={post} />
</GestureHandler>
```

### Step 3: Remove from UI After Swipe
```javascript
const handleSwipe = async (postId, direction) => {
  await swipePost(postId, direction);
  setPosts(posts.filter(p => p.id !== postId)); // Remove from local state
};
```

## 🔑 Key Points

| Swipe Direction | Duration | API Value | Behavior |
|----------------|----------|-----------|----------|
| **Left** | 120 days | `"left"` | Temporary hide |
| **Right** | Permanent | `"right"` | Never show again |

⚠️ **Important:** Swipe filtering only applies when `isFilterBySkills=true` in the `/posts/temp-address` endpoint.

| isFilterBySkills | Swipe Filtering | Skill Filtering |
|------------------|-----------------|-----------------|
| `true` | ✅ Active | ✅ Active |
| `false` | ❌ Disabled | ❌ Disabled |

## 🎯 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/posts/:id/swipe` | POST | Swipe a post |
| `/posts/swipes/my-swipes` | GET | View swiped posts |
| `/posts/temp-address` | GET | Auto-excludes swiped posts |

## ✅ What's Included

- ✅ **Model**: `PostSwipe` model created and registered
- ✅ **Controllers**: `swipePost()` and `getUserSwipedPosts()` methods
- ✅ **Routes**: POST `/posts/:id/swipe` and GET `/posts/swipes/my-swipes`
- ✅ **Filtering**: Auto-exclusion in `/posts/temp-address` endpoint
- ✅ **Swagger Docs**: Full API documentation
- ✅ **Migration**: SQL script ready to run
- ✅ **Validation**: Input validation and security checks

## 🧪 Testing Commands

```bash
# 1. Left swipe (hide for 120 days)
POST /posts/123/swipe
Body: {"swipeType": "left"}

# 2. Right swipe (hide permanently)
POST /posts/123/swipe
Body: {"swipeType": "right"}

# 3. View my swiped posts
GET /posts/swipes/my-swipes

# 4. Filter by swipe type
GET /posts/swipes/my-swipes?swipeType=left

# 5. Verify exclusion
GET /posts/temp-address?page=1&limit=10
```

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Database table `post_swipe` exists
- [ ] POST `/posts/:id/swipe` returns 201 on success
- [ ] Swiped posts don't appear in `/posts/temp-address` results
- [ ] GET `/posts/swipes/my-swipes` returns user's swipes
- [ ] Swagger docs show new endpoints
- [ ] No errors in server logs

## 💡 User Experience Flow

```
User views post → Swipes left/right → API call → Post removed from feed
                                                   ↓
                                            Stored in database
                                                   ↓
                                    Auto-filtered from future results
```

## 📚 Full Documentation

See [POST_SWIPE_FUNCTIONALITY.md](./POST_SWIPE_FUNCTIONALITY.md) for complete details.

