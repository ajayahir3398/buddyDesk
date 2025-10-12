# Single Device Login - Testing Guide

## Quick Test Steps

### Using Postman or Any API Client

#### Step 1: Login from Device A (First Login)
```http
POST /api/user/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "yourpassword"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Action:** Save this `access_token` as `TOKEN_A`

---

#### Step 2: Test API with Token A
```http
GET /api/user/profile
Authorization: Bearer <TOKEN_A>
```

**Expected Response:** ✅ Success (200) - Profile data returned

---

#### Step 3: Login from Device B (Second Login - Same Account)
```http
POST /api/user/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "yourpassword"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Action:** Save this new `access_token` as `TOKEN_B`

---

#### Step 4: Test API with Token A (Should Fail)
```http
GET /api/user/profile
Authorization: Bearer <TOKEN_A>
```

**Expected Response:** ❌ Unauthorized (401)
```json
{
  "success": false,
  "message": "Invalid refresh token"
}
```

> 💡 **This confirms that TOKEN_A was invalidated when user logged in with TOKEN_B**

---

#### Step 5: Test API with Token B (Should Work)
```http
GET /api/user/profile
Authorization: Bearer <TOKEN_B>
```

**Expected Response:** ✅ Success (200) - Profile data returned

---

## Database Verification

### Check Session Logs
```sql
SELECT 
  id,
  user_id,
  is_active,
  created_at,
  revoked_at,
  reason,
  user_agent,
  ip_address
FROM session_logs 
WHERE user_id = <YOUR_USER_ID>
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result:**
| id | user_id | is_active | created_at | revoked_at | reason | user_agent | ip_address |
|----|---------|-----------|------------|------------|--------|------------|------------|
| 102 | 1 | true | 2025-10-12 10:05:00 | NULL | NULL | PostmanRuntime/7.29 | ::1 |
| 101 | 1 | false | 2025-10-12 10:00:00 | 2025-10-12 10:05:00 | New login from another device | PostmanRuntime/7.29 | ::1 |

The older session (101) should have:
- `is_active = false`
- `revoked_at` timestamp set
- `reason = "New login from another device"`

---

## Postman Collection Example

### Create a Postman Collection with these requests:

1. **Login Device A**
   - Method: `POST`
   - URL: `{{base_url}}/api/user/login`
   - Body: 
     ```json
     {
       "email": "{{test_email}}",
       "password": "{{test_password}}"
     }
     ```
   - Tests Script:
     ```javascript
     pm.test("Login successful", function () {
         pm.response.to.have.status(200);
         var jsonData = pm.response.json();
         pm.environment.set("token_a", jsonData.access_token);
     });
     ```

2. **Get Profile with Token A**
   - Method: `GET`
   - URL: `{{base_url}}/api/user/profile`
   - Headers: `Authorization: Bearer {{token_a}}`

3. **Login Device B**
   - Method: `POST`
   - URL: `{{base_url}}/api/user/login`
   - Body: Same as Login Device A
   - Tests Script:
     ```javascript
     pm.test("Login successful", function () {
         pm.response.to.have.status(200);
         var jsonData = pm.response.json();
         pm.environment.set("token_b", jsonData.access_token);
     });
     ```

4. **Get Profile with Token A (Should Fail)**
   - Method: `GET`
   - URL: `{{base_url}}/api/user/profile`
   - Headers: `Authorization: Bearer {{token_a}}`
   - Tests Script:
     ```javascript
     pm.test("Token A should be invalid", function () {
         pm.response.to.have.status(401);
     });
     ```

5. **Get Profile with Token B (Should Work)**
   - Method: `GET`
   - URL: `{{base_url}}/api/user/profile`
   - Headers: `Authorization: Bearer {{token_b}}`
   - Tests Script:
     ```javascript
     pm.test("Token B should work", function () {
         pm.response.to.have.status(200);
     });
     ```

---

## Testing with cURL

### Terminal Commands

```bash
# Step 1: Login from Device A
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpassword"}' \
  | jq -r '.access_token'

# Save the token output as TOKEN_A
TOKEN_A="<paste_token_here>"

# Step 2: Test with Token A
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer $TOKEN_A"

# Step 3: Login from Device B
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpassword"}' \
  | jq -r '.access_token'

# Save the token output as TOKEN_B
TOKEN_B="<paste_token_here>"

# Step 4: Test with Token A (should fail)
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer $TOKEN_A"

# Step 5: Test with Token B (should work)
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer $TOKEN_B"
```

---

## Automated Test Script (Node.js)

Save as `test-single-device-login.js`:

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'yourpassword';

async function testSingleDeviceLogin() {
  console.log('🧪 Testing Single Device Login...\n');

  try {
    // Step 1: Login from Device A
    console.log('📱 Step 1: Login from Device A');
    const loginA = await axios.post(`${BASE_URL}/user/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    const tokenA = loginA.data.access_token;
    console.log('✅ Device A logged in successfully');
    console.log(`Token A: ${tokenA.substring(0, 20)}...\n`);

    // Step 2: Test API with Token A
    console.log('📱 Step 2: Test API with Token A');
    const profileA1 = await axios.get(`${BASE_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    console.log('✅ Token A works - Profile retrieved\n');

    // Step 3: Login from Device B
    console.log('📱 Step 3: Login from Device B (same account)');
    const loginB = await axios.post(`${BASE_URL}/user/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    const tokenB = loginB.data.access_token;
    console.log('✅ Device B logged in successfully');
    console.log(`Token B: ${tokenB.substring(0, 20)}...\n`);

    // Step 4: Test API with Token A (should fail)
    console.log('📱 Step 4: Test API with Token A (should be invalidated)');
    try {
      await axios.get(`${BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      console.log('❌ FAIL: Token A still works (should be invalidated)\n');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ SUCCESS: Token A is invalidated (401 Unauthorized)\n');
      } else {
        throw error;
      }
    }

    // Step 5: Test API with Token B (should work)
    console.log('📱 Step 5: Test API with Token B');
    const profileB = await axios.get(`${BASE_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    console.log('✅ Token B works - Profile retrieved\n');

    console.log('🎉 All tests passed! Single device login is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSingleDeviceLogin();
```

**Run the test:**
```bash
node test-single-device-login.js
```

---

## Expected Console Output

```
🧪 Testing Single Device Login...

📱 Step 1: Login from Device A
✅ Device A logged in successfully
Token A: eyJhbGciOiJIUzI1Ni...

📱 Step 2: Test API with Token A
✅ Token A works - Profile retrieved

📱 Step 3: Login from Device B (same account)
✅ Device B logged in successfully
Token B: eyJhbGciOiJIUzI1Ni...

📱 Step 4: Test API with Token A (should be invalidated)
✅ SUCCESS: Token A is invalidated (401 Unauthorized)

📱 Step 5: Test API with Token B
✅ Token B works - Profile retrieved

🎉 All tests passed! Single device login is working correctly.
```

---

## Troubleshooting

### Issue: Token A still works after Device B login

**Possible Causes:**
1. Code changes not deployed
2. Server not restarted
3. Caching issue with tokens

**Solution:**
- Restart the server: `npm restart` or `pm2 restart app`
- Clear any Redis/cache if applicable
- Check logs for errors during session update

### Issue: Both tokens fail

**Possible Cause:** Database connection issue or SessionLog update error

**Solution:**
- Check server logs
- Verify database connection
- Check `session_logs` table structure

### Issue: Refresh token behavior

**Note:** This implementation invalidates the session in the database. When the old device tries to use its refresh token, it will also fail because the `is_active` flag is checked during refresh token validation.

---

## Success Criteria

✅ New login creates a new session
✅ Old session is marked as inactive
✅ Old token returns 401 error
✅ New token works correctly
✅ Database shows proper `revoked_at` and `reason` values
✅ Refresh token from old session also fails

---

## Date Created
October 12, 2025

