# Database Schema Fixes for Aadhaar Verification

## Problem Identified

The application was failing to start with the error:
```
DB Sync error: relation "Users" does not exist
```

This error occurred because the Aadhaar verification models were not following the existing database conventions used by other models in the project.

## Root Cause Analysis

### Issues Found:

1. **Incorrect Table Reference**: The `AadhaarVerification` model was referencing `'Users'` table, but the actual table name is `'users'` (lowercase, following Sequelize conventions).

2. **Wrong Data Type**: The foreign key `userId` was defined as `UUID`, but the `User` model uses `INTEGER` for its primary key.

3. **Inconsistent Field Names**: All other models use `user_id` as the foreign key field name, but Aadhaar models used `userId`.

4. **Missing Associations**: The `User` model didn't have the reverse association to `AadhaarVerification`.

## Fixes Applied

### 1. Fixed AadhaarVerification Model (`models/aadhaarVerification.model.js`)

#### Before:
```javascript
userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
        model: 'User',
        key: 'id'
    }
},
```

#### After:
```javascript
user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: 'users',
        key: 'id'
    }
},
```

#### Other Changes:
- Updated index from `['userId']` to `['user_id']`
- Updated association from `foreignKey: 'userId'` to `foreignKey: 'user_id'`

### 2. Updated User Model Associations (`models/user.model.js`)

#### Added:
```javascript
User.hasMany(models.AadhaarVerification, { 
    foreignKey: 'user_id', 
    as: 'aadhaarVerifications' 
});
```

### 3. Fixed Service Layer (`services/aadhaarVerificationService.js`)

#### Updated all database operations:
```javascript
// Before
await db.AadhaarVerification.create({
    userId,
    // ...
});

// After  
await db.AadhaarVerification.create({
    user_id: userId,
    // ...
});
```

#### Updated queries:
```javascript
// Before
where: { userId }

// After
where: { user_id: userId }
```

### 4. Fixed Controller Layer (`controllers/aadhaar.controller.js`)

#### Added db import:
```javascript
const db = require('../models');
```

#### Updated query:
```javascript
// Before
const verification = await this.verificationService.db.AadhaarVerification.findOne({
    where: { 
        verificationId,
        userId 
    },
    // ...
});

// After
const verification = await db.AadhaarVerification.findOne({
    where: { 
        verificationId,
        user_id: userId 
    },
    // ...
});
```

## Database Schema Consistency

### User Model Schema:
```javascript
User {
    id: INTEGER (Primary Key, Auto Increment)
    name: STRING
    email: STRING (Unique)
    // ... other fields
}
Table: 'users'
```

### AadhaarVerification Model Schema:
```javascript
AadhaarVerification {
    id: UUID (Primary Key)
    user_id: INTEGER (Foreign Key -> users.id)
    verificationId: UUID (Unique)
    verificationType: ENUM('XML', 'QR', 'NUMBER')
    verificationStatus: ENUM('SUCCESS', 'FAILED', 'PENDING')
    // ... other fields
}
Table: 'aadhaar_verifications'
```

### Foreign Key Relationship:
```sql
REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE CASCADE
```

## Verification

After these fixes:

1. ✅ **Foreign Key Reference**: Now correctly references `users.id`
2. ✅ **Data Type Consistency**: Uses `INTEGER` to match User model
3. ✅ **Field Naming Convention**: Uses `user_id` like other models
4. ✅ **Table Name**: References correct table name `'users'`
5. ✅ **Associations**: Both directions properly configured
6. ✅ **Service Layer**: All operations use correct field names
7. ✅ **Controller Layer**: Queries use correct field names

## Database Migration Impact

These changes will:

- Create the `aadhaar_verifications` table successfully
- Create the `aadhaar_verification_logs` table successfully  
- Establish proper foreign key constraints
- Allow proper joins and associations between User and AadhaarVerification models

## Testing Recommendations

1. **Start Application**: Verify database sync completes without errors
2. **Create User**: Ensure user creation still works
3. **Aadhaar Verification**: Test all three verification types (XML, QR, Number)
4. **Associations**: Test querying user with their verification history
5. **Foreign Key Constraints**: Verify data integrity is maintained

## Consistency Patterns Followed

This fix ensures the Aadhaar verification models follow the same patterns as existing models:

| Model | Foreign Key Field | Data Type | Table Reference |
|-------|------------------|-----------|-----------------|
| UserProfile | `user_id` | INTEGER | `'users'` |
| WorkProfile | `user_id` | INTEGER | `'users'` |
| Address | `user_id` | INTEGER | `'users'` |
| SessionLog | `user_id` | INTEGER | `'users'` |
| Post | `user_id` | INTEGER | `'users'` |
| **AadhaarVerification** | `user_id` | INTEGER | `'users'` |

The application should now start successfully and all Aadhaar verification functionality should work correctly with proper database relationships.