# Feed API Testing Guide

This guide explains how to test the Feed API functionality in the BuddyDesk application.

## 📋 Prerequisites

1. **Server Running**: Make sure your BuddyDesk server is running on `http://localhost:3000`
2. **Database Setup**: Ensure all feed-related tables are created in your database
3. **Dependencies**: For the full test suite, install axios: `npm install axios`

## 🚀 Quick Start

### Simple Test (No Dependencies)
```bash
# Run the simple test suite (uses only Node.js built-in modules)
npm run test:feed

# Or run directly
node test-feed-simple.js
```

### Full Test Suite (With Dependencies)
```bash
# Install axios if not already installed
npm install axios

# Run the full test suite
npm run test:feed:full

# Or run directly
node test-feed-apis.js
```

## 📊 Test Coverage

### Core Feed Functionality
- ✅ **User Registration & Login** - Test authentication flow
- ✅ **Create Feed Post** - Test text and image post creation
- ✅ **Get Feed** - Test personalized feed retrieval
- ✅ **Get Specific Post** - Test individual post retrieval
- ✅ **Like/Unlike Posts** - Test engagement features
- ✅ **Add Comments** - Test commenting system
- ✅ **Get Comments** - Test comment retrieval
- ✅ **Share Posts** - Test sharing functionality
- ✅ **Follow Users** - Test social features
- ✅ **Get Trending Posts** - Test discovery features
- ✅ **Delete Posts** - Test post deletion
- ✅ **Error Scenarios** - Test validation and error handling

### Advanced Features (Full Test Suite Only)
- ✅ **Performance Testing** - Test concurrent requests
- ✅ **File Upload Testing** - Test image upload functionality
- ✅ **Multiple User Testing** - Test social interactions

## 🧪 Test Scenarios

### 1. Authentication Flow
```javascript
// Tests user registration and login
POST /api/users/register
POST /api/users/login
```

### 2. Feed Post Creation
```javascript
// Test text post creation
POST /api/feed/posts
{
  "content": "This is a test feed post! 🚀",
  "post_type": "text",
  "visibility": "public",
  "skill_tags": [1, 2, 3]
}

// Test image post creation (full test suite only)
POST /api/feed/posts (multipart/form-data)
```

### 3. Feed Retrieval
```javascript
// Get personalized feed
GET /api/feed/posts?page=1&limit=10

// Get specific post
GET /api/feed/posts/:id

// Get trending posts
GET /api/feed/trending?page=1&limit=5
```

### 4. Engagement Features
```javascript
// Like a post
POST /api/feed/posts/:id/like
{
  "like_type": "like"
}

// Add comment
POST /api/feed/posts/:id/comment
{
  "content": "Great post! 👍",
  "parent_comment_id": null
}

// Share post
POST /api/feed/posts/:id/share
{
  "share_type": "repost",
  "quote_text": "Amazing content!"
}
```

### 5. Social Features
```javascript
// Follow a user
POST /api/feed/follow/:userId

// Get comments
GET /api/feed/posts/:id/comments?page=1&limit=10
```

## 📈 Expected Results

### Successful Test Run
```
🚀 Starting Feed API Tests (Simple Version)...
===============================================

🔐 Testing User Registration...
✅ User registration successful

🔑 Testing User Login...
✅ User login successful

📝 Testing Create Feed Post...
✅ Feed post created successfully
   Post ID: 123

📰 Testing Get Feed...
✅ Feed retrieved successfully
   Posts count: 1
   Pagination: Page 1

... (more tests)

===============================================
📊 Test Results Summary:
✅ Passed: 13
❌ Failed: 0
📈 Success Rate: 100.0%

🎉 All tests passed! Feed API is working correctly.
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Server Not Running
```
❌ Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution**: Start your server with `npm start` or `npm run dev`

#### 2. Database Tables Missing
```
❌ Error: relation "feed_posts" does not exist
```
**Solution**: Run database migrations or create tables manually

#### 3. Authentication Issues
```
❌ Error: Access token required
```
**Solution**: Check if the login endpoint is working correctly

#### 4. File Upload Issues (Full Test Suite)
```
❌ Error: ENOENT: no such file or directory
```
**Solution**: The test creates temporary files, ensure write permissions

### Debug Mode

To run tests with more detailed output, modify the test files:

```javascript
// Add this at the top of test functions
console.log('Request:', method, endpoint, data);
console.log('Response:', response.status, response.data);
```

## 📝 Customizing Tests

### Adding New Test Cases

1. **Create a new test function**:
```javascript
const testNewFeature = async () => {
  console.log('\n🆕 Testing New Feature...');
  try {
    const response = await makeRequest('POST', '/feed/new-endpoint', {
      // test data
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ New feature test passed');
      return true;
    } else {
      console.log('❌ New feature test failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ New feature test error:', error.message);
    return false;
  }
};
```

2. **Add to the tests array**:
```javascript
const tests = [
  // ... existing tests
  { name: 'New Feature', fn: testNewFeature }
];
```

### Modifying Test Data

Update the configuration variables at the top of the test files:

```javascript
const BASE_URL = 'http://localhost:3000/api';  // Change server URL
const TEST_EMAIL = 'test@example.com';         // Change test email
const TEST_PASSWORD = 'testpassword123';       // Change test password
```

## 🎯 Performance Testing

The full test suite includes performance testing:

- **Concurrent Requests**: Tests multiple simultaneous API calls
- **Response Time**: Measures average response time per request
- **Load Testing**: Creates multiple posts to test system performance

## 📊 Test Reports

### Simple Test Output
- ✅/❌ Pass/Fail indicators
- Test execution summary
- Success rate percentage
- Error messages for failed tests

### Full Test Output
- Detailed request/response logging
- Performance metrics
- File upload testing results
- Multi-user interaction testing

## 🔄 Continuous Integration

To integrate with CI/CD pipelines:

```bash
# Run tests and capture exit code
npm run test:feed
echo $?  # Should be 0 for success
```

## 📚 API Documentation

For complete API documentation, visit:
- Swagger UI: `http://localhost:3000/api-docs`
- API endpoints: See `routes/feed.routes.js`
- Controllers: See `controllers/feedController.js`

## 🆘 Support

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify database connectivity and table structure
3. Ensure all required environment variables are set
4. Check network connectivity and firewall settings

For additional help, refer to the main project documentation or create an issue in the project repository.
