# Profile Update with Work Profiles

## Overview

The profile update functionality has been enhanced to support updating user work profiles in parallel with basic profile information, addresses, and temporary addresses. All updates are performed within a database transaction to ensure data consistency.

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
        },
        {
          "skill_id": 2,
          "sub_skill_id": null,
          "proficiency_level": "Intermediate"
        }
      ]
    },
    {
      "company_name": "StartupXYZ",
      "designation": "Full Stack Developer",
      "start_date": "2020-03-01",
      "end_date": "2021-12-31",
      "user_skills": [
        {
          "skill_id": 3,
          "sub_skill_id": 5,
          "proficiency_level": "Beginner"
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
  "work_profiles": [
    {
      "company_name": "New Tech Corp",
      "designation": "Lead Developer",
      "start_date": "2024-07-01",
      "end_date": null,
      "user_skills": [
        {
          "skill_id": 1,
          "sub_skill_id": 2,
          "proficiency_level": "Expert"
        }
      ]
    }
  ],
  "addresses": [
    {
      "street": "456 New Street",
      "city": "Pune",
      "state": "Maharashtra",
      "zip_code": "411001",
      "country": "India",
      "type": "home"
    }
  ]
}
```

## Field Descriptions

### Work Profile Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `company_name` | string | No | Company/organization name | Max 255 characters |
| `designation` | string | No | Job title/role | Max 255 characters |
| `start_date` | date | No | Employment start date | YYYY-MM-DD format, not in future |
| `end_date` | date | No | Employment end date | YYYY-MM-DD format, must be after start_date |
| `user_skills` | array | No | Array of skills associated with this work profile | Optional array |

### User Skills Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `skill_id` | integer | No | ID of the skill | Positive integer |
| `sub_skill_id` | integer | No | ID of the sub-skill | Positive integer (optional) |
| `proficiency_level` | enum | No | Skill proficiency level | Beginner, Intermediate, or Expert |

## Response Structure

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
    "updated_at": "2024-01-15T10:30:00.000Z",
    "profile": {
      "id": 1,
      "phone": "+91-9876543210",
      "dob": "1990-05-15",
      "gender": null,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    "work_profiles": [
      {
        "id": 1,
        "company_name": "New Tech Corp",
        "designation": "Lead Developer",
        "start_date": "2024-07-01",
        "end_date": null,
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z",
        "userSkills": [
          {
            "id": 1,
            "proficiency_level": "Expert",
            "created_at": "2024-01-15T10:30:00.000Z",
            "updated_at": "2024-01-15T10:30:00.000Z",
            "skill": {
              "id": 1,
              "name": "JavaScript",
              "description": "Programming language for web development"
            },
            "subSkill": {
              "id": 2,
              "name": "React.js",
              "description": "JavaScript library for building user interfaces"
            }
          }
        ]
      }
    ],
    "addresses": [
      {
        "id": 1,
        "street": "456 New Street",
        "city": "Pune",
        "state": "Maharashtra",
        "zip_code": "411001",
        "country": "India",
        "type": "home",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "temp_addresses": []
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
      "field": "work_profiles.0.start_date",
      "message": "Start date cannot be in the future",
      "value": "2025-01-01"
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

#### Unauthorized (401)
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

## Important Notes

### Data Consistency
- All updates are performed within a database transaction
- If any part of the update fails, all changes are rolled back
- Existing work profiles and related skills are completely replaced when `work_profiles` is provided

### Work Profile Updates
- When `work_profiles` is provided, all existing work profiles for the user are deleted and replaced
- If `work_profiles` is an empty array, all work profiles are removed
- If `work_profiles` is not provided, existing work profiles remain unchanged

### Skills Management
- Skills are associated with specific work profiles
- Each skill can have a proficiency level (Beginner, Intermediate, Expert)
- Sub-skills are optional and provide more granular skill categorization

### Date Validation
- Start dates cannot be in the future
- End dates must be after start dates
- Dates should be in YYYY-MM-DD format
- End date can be null for current employment

## Example Usage Scenarios

### Scenario 1: Update Only Work Profiles
```json
{
  "work_profiles": [
    {
      "company_name": "Current Company",
      "designation": "Senior Developer",
      "start_date": "2023-01-01",
      "end_date": null
    }
  ]
}
```

### Scenario 2: Update Profile and Work Profiles
```json
{
  "name": "Updated Name",
  "work_profiles": [
    {
      "company_name": "New Company",
      "designation": "Tech Lead",
      "start_date": "2024-01-01",
      "end_date": null,
      "user_skills": [
        {
          "skill_id": 1,
          "proficiency_level": "Expert"
        }
      ]
    }
  ]
}
```

### Scenario 3: Remove All Work Profiles
```json
{
  "work_profiles": []
}
```

### Scenario 4: Update Everything
```json
{
  "name": "New Name",
  "email": "newemail@example.com",
  "phone": "+91-9876543210",
  "work_profiles": [
    {
      "company_name": "Company A",
      "designation": "Developer",
      "start_date": "2020-01-01",
      "end_date": "2023-12-31"
    },
    {
      "company_name": "Company B",
      "designation": "Senior Developer",
      "start_date": "2024-01-01",
      "end_date": null
    }
  ],
  "addresses": [
    {
      "street": "New Street",
      "city": "New City",
      "state": "New State",
      "zip_code": "123456",
      "country": "India",
      "type": "home"
    }
  ]
}
```

## Database Schema

The work profile update functionality works with the following database tables:

- `users` - Basic user information
- `user_profile` - Extended user profile information
- `work_profile` - Work experience records
- `user_skills` - Skills associated with work profiles
- `skills` - Available skills
- `sub_skills` - Sub-categories of skills
- `addresses` - User addresses
- `temp_addresses` - Temporary location information

## Security Considerations

- All endpoints require valid JWT authentication
- Users can only update their own profiles
- Input validation prevents malicious data injection
- Database transactions ensure data integrity
- Foreign key constraints maintain referential integrity
