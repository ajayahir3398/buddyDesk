# Report Functionality - Quick Start Guide

## 🚀 Quick Setup

### 1. Database Setup
Your database will be automatically updated when you start the application. Sequelize will create the new tables.

```bash
npm start
```

**New Tables Created:**
- `post_reports`
- `feed_post_reports`

**User Table Updated:**
- Added: `is_blocked` (BOOLEAN)
- Added: `report_count` (INTEGER)

### 2. Test the Endpoints

#### Report a Post
```bash
curl -X POST http://localhost:3000/api/posts/123/report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "This post is spam", "description": "Additional details"}'
```

#### Report a Feed Post
```bash
curl -X POST http://localhost:3000/api/feed/posts/456/report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "This post has inappropriate content"}'
```

#### Get Reported Posts
```bash
curl -X GET http://localhost:3000/api/posts/reports/my-reports \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📋 Report Reasons

The `reason` field is now a free-text field. Users can provide any text to describe why they're reporting the content. This allows for more flexibility and detailed reporting.

## 🔒 User Blocking

**Automatic Blocking Trigger:**
- User makes 10 or more reports → **Automatically blocked**

**Blocked User Restrictions:**
- ❌ Cannot create posts
- ❌ Cannot create feed posts
- ❌ Cannot make reports
- ✅ Can view content (read-only access)

**Check Your Status:**
You can check your blocking status in your profile response:
```json
{
  "is_blocked": false,
  "report_count": 0
}
```

## 🔍 Content Filtering

**Reported posts are automatically hidden from:**
1. `GET /api/posts` - All posts
2. `GET /api/posts/matching` - Matching posts
3. `GET /api/posts/temp-address` - Posts by location
4. `GET /api/feed/posts` - Feed posts
5. `GET /api/feed/trending` - Trending posts

## 🎯 Flow Diagram

```
User Reports Post
       ↓
System Checks:
  • User authenticated? ✓
  • User blocked? ✗
  • Own post? ✗
  • Already reported? ✗
       ↓
Create Report Record
       ↓
Increment user.report_count
       ↓
report_count >= 10?
  YES → Block User (is_blocked = true)
  NO → Continue
       ↓
Return Success Response
       ↓
Post Hidden from Reporter's Feed
```

## 🧪 Testing Scenarios

### Test 1: Report a Post
```javascript
// Expected: Success
POST /api/posts/1/report
Body: { "reason": "This is spam" }
Response: 201 Created
```

### Test 2: Report Same Post Again
```javascript
// Expected: Error
POST /api/posts/1/report
Body: { "reason": "Still spam" }
Response: 400 Bad Request - "Already reported"
```

### Test 3: Report Own Post
```javascript
// Expected: Error
POST /api/posts/999/report  // where 999 is your own post
Response: 400 Bad Request - "Cannot report own post"
```

### Test 4: Trigger Auto-Block
```javascript
// Report 10 different posts
for (let i = 1; i <= 10; i++) {
  POST /api/posts/${i}/report
}
// 10th report response includes warning
Response: { warning: "You have been blocked..." }
```

### Test 5: Blocked User Actions
```javascript
// Expected: All fail with 403
POST /api/posts (create post)
POST /api/feed/posts (create feed post)
POST /api/posts/1/report (report)
Response: 403 Forbidden - "Account blocked"
```

### Test 6: Verify Filtering
```javascript
// Report post ID 123
POST /api/posts/123/report

// Get posts list
GET /api/posts
// Post 123 should NOT appear in results
```

## 📊 Database Queries

### Check User's Report Count
```sql
SELECT id, name, report_count, is_blocked 
FROM user 
WHERE id = <user_id>;
```

### View All Reports by User
```sql
SELECT * FROM post_reports 
WHERE reported_by = <user_id>;
```

### Find Blocked Users
```sql
SELECT id, name, report_count 
FROM user 
WHERE is_blocked = true;
```

### Most Reported Posts
```sql
SELECT post_id, COUNT(*) as report_count 
FROM post_reports 
GROUP BY post_id 
ORDER BY report_count DESC;
```

## 🛠️ Troubleshooting

### Issue: Tables not created
**Solution:** 
```bash
# Restart application
npm start
# Check logs for migration errors
tail -f logs/combined.log
```

### Issue: "Column not found" error
**Solution:** 
```sql
-- Manually add columns
ALTER TABLE user ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE user ADD COLUMN report_count INT DEFAULT 0;
```

### Issue: Report not filtering posts
**Solution:** 
- Clear application cache
- Verify report was created: `SELECT * FROM post_reports WHERE reported_by = <user_id>`
- Check logs for any query errors

### Issue: User not getting blocked
**Solution:**
- Check report_count: `SELECT report_count FROM user WHERE id = <user_id>`
- Verify it's >= 10
- Check is_blocked field

## 📝 Important Notes

1. **Unique Constraint:** Users can only report each post once (enforced by database)
2. **Self-Reporting:** Users cannot report their own content
3. **Permanent Blocks:** Current implementation has permanent blocks (no auto-unblock)
4. **Read Access:** Blocked users can still read content, just can't create/report
5. **Report History:** Users can view their own report history anytime

## 🔐 Security Best Practices

1. Always use authentication tokens
2. Validate report reasons on client side
3. Rate limit report endpoints (recommended: 10 reports per hour)
4. Monitor for abuse patterns
5. Log all blocking actions for audit

## 📚 Additional Resources

- Full Documentation: `docs/REPORT_FUNCTIONALITY.md`
- Implementation Summary: `docs/REPORT_IMPLEMENTATION_SUMMARY.md`
- API Collection: Import into Postman for easy testing

## ✅ Pre-Deployment Checklist

- [ ] Database tables created
- [ ] Test report creation
- [ ] Test filtering works
- [ ] Test blocking after 10 reports
- [ ] Test blocked user restrictions
- [ ] Review logs for errors
- [ ] Update API documentation
- [ ] Inform team about new endpoints

## 📞 Support

Having issues? Check:
1. `logs/combined.log` - General application logs
2. `logs/error.log` - Error logs
3. Database connection and migrations
4. Authentication tokens are valid

---

**Version:** 1.0.0  
**Last Updated:** October 9, 2025  
**Status:** ✅ Ready for Testing

