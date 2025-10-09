# Swagger Report Endpoints Documentation

## Overview
The report functionality endpoints have been added to the Swagger UI documentation for easy testing and reference.

## Added Endpoints

### 1. Report a Post
**Endpoint:** `POST /api/posts/{id}/report`

**Tags:** Posts  
**Security:** Bearer Token Required

**Parameters:**
- `id` (path, integer, required) - Post ID to report

**Request Body:**
```json
{
  "reason": "This post contains spam content",
  "description": "Multiple promotional links detected"
}
```

**Responses:**
- `201` - Post reported successfully
- `400` - Bad request (Already reported or cannot report own post)
- `403` - Forbidden (User is blocked)
- `404` - Post not found
- `401` - Unauthorized

---

### 2. Get User's Reported Posts
**Endpoint:** `GET /api/posts/reports/my-reports`

**Tags:** Posts  
**Security:** Bearer Token Required

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 10) - Items per page

**Response:**
```json
{
  "success": true,
  "message": "Reported posts retrieved successfully",
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 45,
    "itemsPerPage": 10
  }
}
```

---

### 3. Report a Feed Post
**Endpoint:** `POST /api/feed/posts/{id}/report`

**Tags:** Feed  
**Security:** Bearer Token Required

**Parameters:**
- `id` (path, integer, required) - Feed post ID to report

**Request Body:**
```json
{
  "reason": "This post has inappropriate content",
  "description": "Contains offensive language"
}
```

**Responses:**
- `201` - Feed post reported successfully
- `400` - Bad request (Already reported or cannot report own post)
- `403` - Forbidden (User is blocked)
- `404` - Feed post not found
- `401` - Unauthorized

---

### 4. Get User's Reported Feed Posts
**Endpoint:** `GET /api/feed/reports/my-reports`

**Tags:** Feed  
**Security:** Bearer Token Required

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20) - Items per page

**Response:**
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

---

## How to Access Swagger UI

1. **Start your application:**
   ```bash
   npm start
   ```

2. **Open Swagger UI in your browser:**
   - Development: `http://localhost:3000/api-docs`
   - Production: `https://api.buddydesk.in/api-docs`

3. **Authenticate:**
   - Click the "Authorize" button (lock icon) at the top right
   - Enter your bearer token: `Bearer YOUR_JWT_TOKEN`
   - Click "Authorize" then "Close"

4. **Test the endpoints:**
   - Navigate to the "Posts" or "Feed" section
   - Find the report endpoints
   - Click "Try it out"
   - Fill in the parameters
   - Click "Execute"
   - View the response

## Swagger UI Features

### Testing Report Endpoints

#### Test Reporting a Post:
1. Expand `POST /api/posts/{id}/report`
2. Click "Try it out"
3. Enter a post ID in the `id` field
4. (Optional) Enter request body:
   ```json
   {
     "reason": "This is a test report",
     "description": "Testing from Swagger UI"
   }
   ```
5. Click "Execute"
6. Check the response

#### Test Getting Reported Posts:
1. Expand `GET /api/posts/reports/my-reports`
2. Click "Try it out"
3. Set pagination parameters if needed
4. Click "Execute"
5. View your report history

## Important Notes

### Report Fields:
- Both `reason` and `description` are **optional**
- `reason` is a free-text field (no restrictions)
- Provide detailed information to help with moderation

### User Blocking:
- After **10 reports**, users are automatically blocked
- Blocked users will see a warning in the response
- Blocked users cannot create posts or make reports

### Filtering:
- Reported posts are automatically hidden from your feed
- This applies to all post listing endpoints

## Schema Information

### Report Status Enum:
- `pending` - Report submitted, awaiting review
- `reviewed` - Report has been reviewed
- `resolved` - Issue resolved
- `dismissed` - Report dismissed as invalid

### Response Fields:
- `report_id` - Unique identifier for the report
- `warning` - Warning message if user is blocked (nullable)
- `success` - Boolean indicating success/failure
- `message` - Human-readable message
- `data` - Response data object

## Tips for Testing

1. **Use Multiple Accounts**: Test reporting with different user accounts to see the filtering in action

2. **Test Edge Cases**:
   - Try reporting your own post (should fail)
   - Try reporting the same post twice (should fail)
   - Try reporting as a blocked user (should fail)

3. **Test Blocking**:
   - Make 10 reports to trigger auto-block
   - Verify the warning message appears
   - Test that blocked user cannot create posts

4. **Verify Filtering**:
   - Report a post
   - Get posts list - reported post should not appear
   - Check with different filtering parameters

## Troubleshooting

### Common Issues:

**401 Unauthorized:**
- Make sure you've authenticated using the Authorize button
- Check that your JWT token is valid
- Token format should be: `Bearer YOUR_TOKEN`

**403 Forbidden:**
- Your account may be blocked
- Check your report count
- Contact support if you believe this is an error

**400 Bad Request:**
- Check if you're trying to report your own post
- Check if you've already reported this post
- Verify the post ID exists

**404 Not Found:**
- Verify the post/feed post ID is correct
- The post may have been deleted
- Use correct endpoint for the post type

## API Documentation Links

- Full API Documentation: `docs/REPORT_FUNCTIONALITY.md`
- Quick Start Guide: `docs/REPORT_QUICK_START.md`
- Implementation Summary: `docs/REPORT_IMPLEMENTATION_SUMMARY.md`

## Swagger Schemas Added

The following schemas have been added to Swagger for complete documentation:

### User Schema Updates
- ✅ `is_blocked` (boolean) - Whether user is blocked due to excessive reporting
- ✅ `report_count` (integer) - Total number of reports made by user

### New Report Schemas
- ✅ `PostReport` - Schema for post report objects
  - id, post_id, reported_by, reason, description, status, timestamps
- ✅ `FeedPostReport` - Schema for feed post report objects
  - id, feed_post_id, reported_by, reason, description, status, timestamps

## Support

For issues with Swagger UI:
1. Check browser console for errors
2. Verify the application is running
3. Clear browser cache and cookies
4. Check logs: `logs/combined.log`

---

**Last Updated:** October 9, 2025  
**Swagger Version:** OpenAPI 3.0.0  
**Status:** ✅ Live and Ready for Testing

