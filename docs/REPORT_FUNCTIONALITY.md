# Report Functionality Documentation

## Overview
This document describes the report functionality implemented for posts and feed posts in the BuddyDesk application. The system allows users to report inappropriate content and automatically blocks users who abuse the reporting system.

## Features

### 1. Report Posts and Feed Posts
- Users can report posts and feed posts that violate community guidelines
- Users cannot report their own posts
- Users can only report a post once (enforced by unique constraint)
- Blocked users cannot report posts

### 2. Filter Reported Content
- Users will not see posts they have reported in their feed
- Filtering applies to all post listing endpoints:
  - `GET /api/posts` - All posts
  - `GET /api/posts/matching` - Matching posts
  - `GET /api/posts/temp-address` - Posts by temp address
  - `GET /api/feed/posts` - Feed posts
  - `GET /api/feed/trending` - Trending posts

### 3. Automatic User Blocking
- System tracks the total number of reports made by each user
- Users are automatically blocked after making 10 or more reports
- Blocked users cannot:
  - Create new posts
  - Create new feed posts
  - Report additional posts
- Blocked users can still view content

## Database Schema

### New Tables

#### post_reports
```sql
- id (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- post_id (INTEGER, FOREIGN KEY -> posts.id)
- reported_by (INTEGER, FOREIGN KEY -> user.id)
- reason (TEXT, OPTIONAL)
- description (TEXT, OPTIONAL)
- status (ENUM: pending, reviewed, resolved, dismissed)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

UNIQUE INDEX: (post_id, reported_by)
INDEX: (reported_by)
INDEX: (status)
```

#### feed_post_reports
```sql
- id (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- feed_post_id (INTEGER, FOREIGN KEY -> feed_posts.id)
- reported_by (INTEGER, FOREIGN KEY -> user.id)
- reason (TEXT, OPTIONAL)
- description (TEXT, OPTIONAL)
- status (ENUM: pending, reviewed, resolved, dismissed)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

UNIQUE INDEX: (feed_post_id, reported_by)
INDEX: (reported_by)
INDEX: (status)
```

### Modified Tables

#### user
Added fields:
- `is_blocked` (BOOLEAN, DEFAULT false) - Whether user is blocked due to excessive reporting
- `report_count` (INTEGER, DEFAULT 0) - Total number of reports made by this user

## API Endpoints

### Report a Post
**POST** `/api/posts/:id/report`

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reason": "This post contains spam content",
  "description": "Additional details about the report"
}
```

**Note:** `reason` is now a free-text field. You can provide any text to describe why you're reporting the post.

**Success Response (201):**
```json
{
  "success": true,
  "message": "Post reported successfully",
  "data": {
    "report_id": 123,
    "warning": null
  }
}
```

**Success Response with Warning (201):**
```json
{
  "success": true,
  "message": "Post reported successfully",
  "data": {
    "report_id": 123,
    "warning": "You have been blocked due to excessive reporting"
  }
}
```

**Error Responses:**
- `400` - Already reported this post
- `400` - Cannot report own post
- `403` - User is blocked
- `404` - Post not found

### Report a Feed Post
**POST** `/api/feed/posts/:id/report`

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reason": "This post is inappropriate and contains harassment",
  "description": "Additional details if needed"
}
```

**Response:** Same format as post report endpoint

### Get User's Reported Posts
**GET** `/api/posts/reports/my-reports`

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Reported posts retrieved successfully",
  "data": [
    {
      "id": 1,
      "post_id": 123,
      "reported_by": 456,
      "reason": "This post contains spam content",
      "description": "Additional details about the spam",
      "status": "pending",
      "created_at": "2025-10-09T12:00:00Z",
      "post": {
        "id": 123,
        "title": "Post Title",
        "user": {
          "id": 789,
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 45,
    "itemsPerPage": 10
  }
}
```

### Get User's Reported Feed Posts
**GET** `/api/feed/reports/my-reports`

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Reported feed posts retrieved successfully",
  "data": {
    "reports": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "hasMore": true
    }
  }
}
```

## Implementation Details

### Models
- `models/postReport.model.js` - Post report model
- `models/feedPostReport.model.js` - Feed post report model
- Updated `models/user.model.js` - Added is_blocked and report_count fields
- Updated `models/index.js` - Register new models

### Controllers
Updated `controllers/post.controller.js`:
- Added `reportPost()` - Report a post
- Added `getUserReportedPosts()` - Get user's reported posts
- Modified `getPosts()` - Filter out reported posts
- Modified `getMatchingPosts()` - Filter out reported posts
- Modified `getPostsByTempAddressPincode()` - Filter out reported posts

Updated `controllers/feedController.js`:
- Added `reportFeedPost()` - Report a feed post
- Added `getUserReportedFeedPosts()` - Get user's reported feed posts
- Modified `getFeed()` - Filter out reported feed posts
- Modified `getTrendingPosts()` - Filter out reported feed posts

### Middleware
New `middlewares/blockCheck.js`:
- `checkUserBlocked()` - Checks if user is blocked before allowing actions
- Applied to post and feed post creation endpoints

### Routes
Updated `routes/post.routes.js`:
- `POST /api/posts/:id/report` - Report a post
- `GET /api/posts/reports/my-reports` - Get user's reported posts

Updated `routes/feed.routes.js`:
- `POST /api/feed/posts/:id/report` - Report a feed post
- `GET /api/feed/reports/my-reports` - Get user's reported feed posts

## Automatic Blocking Logic

When a user reports a post or feed post:
1. System increments the user's `report_count` in the database
2. If `report_count` >= 10 and user is not already blocked:
   - Set `is_blocked = true`
   - Log warning message
   - Return warning in API response
3. Future requests from blocked users will be rejected with 403 status

## Testing the Feature

### Test Report Functionality
```bash
# Report a post
curl -X POST http://localhost:3000/api/posts/1/report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "This post contains spam content",
    "description": "Additional details about why this is spam"
  }'

# Report a feed post
curl -X POST http://localhost:3000/api/feed/posts/1/report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "This post has inappropriate content",
    "description": "Detailed explanation if needed"
  }'
```

### Test Filtering
```bash
# Get posts (should not include reported posts)
curl -X GET http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get feed (should not include reported feed posts)
curl -X GET http://localhost:3000/api/feed/posts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test User Blocking
1. Report 10 different posts using the same user account
2. On the 10th report, the response should include a warning
3. Try to create a new post - should get 403 blocked error
4. Try to report another post - should get 403 blocked error

### View Reported Content
```bash
# Get user's reported posts
curl -X GET http://localhost:3000/api/posts/reports/my-reports \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get user's reported feed posts
curl -X GET http://localhost:3000/api/feed/reports/my-reports \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Database Migration

To apply these changes to your database, run:

```bash
# Start your application - Sequelize will create the new tables automatically
npm start
```

Or manually create the tables using SQL:

```sql
-- Create post_reports table
CREATE TABLE post_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  reported_by INT NOT NULL,
  reason TEXT,
  description TEXT,
  status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_post_report (post_id, reported_by),
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (reported_by) REFERENCES user(id)
);

-- Create feed_post_reports table
CREATE TABLE feed_post_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  feed_post_id INT NOT NULL,
  reported_by INT NOT NULL,
  reason TEXT,
  description TEXT,
  status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_feed_post_report (feed_post_id, reported_by),
  FOREIGN KEY (feed_post_id) REFERENCES feed_posts(id),
  FOREIGN KEY (reported_by) REFERENCES user(id)
);

-- Add columns to user table
ALTER TABLE user ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE COMMENT 'Whether the user is blocked due to excessive reporting';
ALTER TABLE user ADD COLUMN report_count INT DEFAULT 0 COMMENT 'Total number of reports made by this user';
```

## Security Considerations

1. **Rate Limiting:** Consider implementing rate limiting on report endpoints to prevent abuse
2. **Unique Constraints:** Database enforces that users can only report a post once
3. **Self-Reporting Prevention:** Users cannot report their own content
4. **Blocked User Restrictions:** Blocked users cannot create content or make reports
5. **Logging:** All reports and blocking actions are logged for audit purposes

## Future Enhancements

Potential improvements for the report system:
1. Admin dashboard to review reports
2. Appeal system for blocked users
3. Different block durations (temporary vs permanent)
4. Email notifications when reports are reviewed
5. More granular permissions (e.g., block from reporting but allow viewing)
6. Report analytics and trends
7. Machine learning to detect false reports
8. Community moderation features

## Support

For issues or questions about the report functionality:
1. Check logs in `logs/combined.log` and `logs/error.log`
2. Review security logs in `logs/security/`
3. Contact the development team

## Version History

- **v1.0.0** (2025-10-09) - Initial implementation
  - Report posts and feed posts
  - Filter reported content from listings
  - Automatic user blocking after 10 reports

