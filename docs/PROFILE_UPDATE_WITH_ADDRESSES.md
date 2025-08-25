# Profile Update with Addresses and Temp Addresses

## Overview

The profile update functionality has been enhanced to support updating user addresses and temporary addresses in parallel with basic profile information. All updates are performed within a database transaction to ensure data consistency.

## Features

- ✅ **Parallel Updates**: Update profile, addresses, temp addresses, and work profiles simultaneously
- ✅ **Transaction Safety**: All operations wrapped in database transactions
- ✅ **Flexible Updates**: Update any combination of fields
- ✅ **Data Validation**: Comprehensive validation for all fields including work profiles
- ✅ **Atomic Operations**: Either all updates succeed or none do
- ✅ **Skills Integration**: Work profiles can include associated skills with proficiency levels

## API Endpoint

```
PUT /api/users/profile
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## Request Body Structure

### Basic Profile Fields
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+91-9876543210",
  "dob": "1990-05-15"
}
```

### Work Profile Fields
```json
{
  "work_profiles": [
    {
      "company_name": "Tech Solutions Inc.",
      "designation": "Senior Software Engineer",
      "start_date": "2022-01-15",
      "end_date": "2024-06-30",
      "user_skills": [
        {
          "skill_id": 1,
          "sub_skill_id": 3,
          "proficiency_level": "Expert"
        }
      ]
    }
  ]
}
```

### Address Fields
```json
{
  "addresses": [
    {
      "street": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zip_code": "400001",
      "country": "India",
      "type": "home"
    },
    {
      "street": "456 Business Park",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zip_code": "400002",
      "country": "India",
      "type": "office"
    }
  ]
}
```

### Temp Address Fields
```json
{
  "temp_addresses": [
    {
      "location_data": "Near Central Station",
      "pincode": "400003",
      "selected_area": "Downtown",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "location_permission": true,
      "is_active": true,
      "expires_at": "2025-12-31"
    }
  ]
}
```

### Complete Example
```json
{
  "name": "John Doe Updated",
  "phone": "+91-9876543210",
  "dob": "1990-05-15",
  "addresses": [
    {
      "street": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zip_code": "400001",
      "country": "India",
      "type": "home"
    }
  ],
  "temp_addresses": [
    {
      "location_data": "Near Central Station",
      "pincode": "400003",
      "selected_area": "Downtown",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "location_permission": true,
      "is_active": true,
      "expires_at": "2025-12-31"
    }
  ]
}
```

## Field Descriptions

### Basic Profile Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | User's full name (2-50 characters) |
| `email` | string | No | User's email address |
| `phone` | string | No | User's phone number (10-20 characters) |
| `dob` | string | No | Date of birth (YYYY-MM-DD format) |

### Address Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `street` | string | No | Street address (max 255 characters) |
| `city` | string | No | City name (max 100 characters) |
| `state` | string | No | State/province (max 100 characters) |
| `zip_code` | string | No | Postal/ZIP code (max 20 characters) |
| `country` | string | No | Country name (max 100 characters) |
| `type` | enum | No | Address type: "home" or "office" |

### Temp Address Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `location_data` | string | No | Location description (max 500 characters) |
| `pincode` | string | No | 6-digit pincode |
| `selected_area` | string | No | Selected area name (max 255 characters) |
| `city` | string | No | City name (max 100 characters) |
| `state` | string | No | State/province (max 100 characters) |
| `country` | string | No | Country name (max 100 characters) |
| `location_permission` | boolean | No | Location permission flag |
| `is_active` | boolean | No | Active status flag |
| `expires_at` | string | No | Expiry date (YYYY-MM-DD format) |

## Update Behavior

### Address Updates
- **Complete Replacement**: When `addresses` field is provided, all existing addresses are deleted and replaced with new ones
- **Empty Array**: If `addresses: []` is provided, all addresses are removed
- **Not Provided**: If `addresses` field is not included, existing addresses remain unchanged

### Temp Address Updates
- **Complete Replacement**: When `temp_addresses` field is provided, all existing temp addresses are deleted and replaced with new ones
- **Empty Array**: If `temp_addresses: []` is provided, all temp addresses are removed
- **Not Provided**: If `temp_addresses` field is not included, existing temp addresses remain unchanged

### Partial Updates
- Only fields that are provided will be updated
- Fields not included in the request remain unchanged
- At least one field must be provided (validation requirement)

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "name": "John Doe Updated",
    "email": "john.doe@example.com",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z",
    "profile": {
      "id": 1,
      "phone": "+91-9876543210",
      "dob": "1990-05-15",
      "gender": null,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T12:00:00.000Z"
    },
    "addresses": [
      {
        "id": 1,
        "street": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "zip_code": "400001",
        "country": "India",
        "type": "home",
        "created_at": "2024-01-01T12:00:00.000Z",
        "updated_at": "2024-01-01T12:00:00.000Z"
      }
    ],
    "temp_addresses": [
      {
        "id": 1,
        "location_data": "Near Central Station",
        "pincode": "400003",
        "selected_area": "Downtown",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "location_permission": true,
        "is_active": true,
        "expires_at": "2025-12-31T00:00:00.000Z",
        "created_at": "2024-01-01T12:00:00.000Z",
        "updated_at": "2024-01-01T12:00:00.000Z"
      }
    ]
  }
}
```

### Error Responses

#### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "addresses.0.pincode",
      "message": "Pincode must be exactly 6 characters",
      "value": "123"
    }
  ]
}
```

#### Email Conflict (409)
```json
{
  "success": false,
  "message": "Email already exists. Please use a different email address."
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

## Usage Examples

### Update Only Basic Profile
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Updated",
    "phone": "+91-9876543210"
  }'
```

### Update Only Addresses
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": [
      {
        "street": "789 New Street",
        "city": "Delhi",
        "state": "Delhi",
        "zip_code": "110001",
        "country": "India",
        "type": "home"
      }
    ]
  }'
```

### Update Only Temp Addresses
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "temp_addresses": [
      {
        "location_data": "Near Airport",
        "pincode": "110037",
        "selected_area": "Airport Area",
        "city": "Delhi",
        "state": "Delhi",
        "country": "India",
        "location_permission": false,
        "is_active": true
      }
    ]
  }'
```

### Update Everything
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Full",
    "email": "john.doe.full@example.com",
    "phone": "+91-9876543212",
    "dob": "1985-10-20",
    "addresses": [
      {
        "street": "321 Full Street",
        "city": "Bangalore",
        "state": "Karnataka",
        "zip_code": "560001",
        "country": "India",
        "type": "home"
      }
    ],
    "temp_addresses": [
      {
        "location_data": "Near Tech Park",
        "pincode": "560048",
        "selected_area": "Electronic City",
        "city": "Bangalore",
        "state": "Karnataka",
        "country": "India",
        "location_permission": true,
        "is_active": true,
        "expires_at": "2026-06-30"
      }
    ]
  }'
```

## Testing

Use the provided test script to test different scenarios:

```bash
# Install dependencies
npm install

# Run the test script (after updating JWT token)
node scripts/testProfileUpdate.js
```

## Important Notes

1. **JWT Token Required**: All requests must include a valid JWT token in the Authorization header
2. **Transaction Safety**: All updates are wrapped in database transactions for consistency
3. **Validation**: All fields are validated according to the defined rules
4. **Partial Updates**: Only provided fields are updated; others remain unchanged
5. **Address Replacement**: Address and temp address updates completely replace existing data
6. **Work Profile Replacement**: Work profile updates completely replace existing work profiles when provided
7. **Skills Integration**: Work profiles can include associated skills with proficiency levels
8. **Required Fields**: At least one field must be provided in the request

## Database Schema

The functionality works with the following database tables:
- `user` - Basic user information
- `user_profile` - Extended profile information
- `work_profile` - Work experience records
- `user_skills` - Skills associated with work profiles
- `skills` - Available skills
- `sub_skills` - Sub-categories of skills
- `address` - User addresses
- `temp_address` - Temporary user addresses

## Error Handling

The system handles various error scenarios:
- **Validation Errors**: Field-level validation with detailed error messages
- **Email Conflicts**: Duplicate email detection
- **Database Errors**: Transaction rollback on database failures
- **Authentication Errors**: JWT token validation

## Security Considerations

- All updates require valid JWT authentication
- Input validation prevents malicious data injection
- Database transactions ensure data integrity
- Field-level validation prevents invalid data storage

## Additional Information

For comprehensive documentation on work profile updates with skills integration, see [PROFILE_UPDATE_WITH_WORK_PROFILES.md](./PROFILE_UPDATE_WITH_WORK_PROFILES.md).
