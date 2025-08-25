# Swagger Configuration Update - Enhanced Profile Management

## Overview

The Swagger configuration has been updated to include comprehensive documentation for the enhanced profile update functionality that supports updating user addresses and temporary addresses in parallel with basic profile information.

## Changes Made

### 1. **API Description Update**
- Updated the main API description to reflect enhanced profile management capabilities
- Added mention of addresses and temporary addresses functionality

### 2. **Schema Updates**

#### **UpdateProfileRequest Schema**
- Added `addresses` array field with comprehensive validation
- Added `temp_addresses` array field with comprehensive validation
- Updated description to explain the replacement behavior

#### **UpdateProfileResponse Schema**
- Added `addresses` array to response data
- Added `temp_addresses` array to response data
- References existing `Address` and `TempAddress` schemas

### 3. **Endpoint Documentation Updates**

#### **PUT /api/users/profile**
- Updated endpoint description to include addresses and temp_addresses
- Added comprehensive examples for different update scenarios:
  - Single field updates
  - Multiple field updates
  - Addresses-only updates
  - Temp addresses-only updates
  - Complete profile updates with all fields

### 4. **Enhanced Examples**

#### **Addresses Only Update**
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

#### **Temp Addresses Only Update**
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

#### **Complete Profile Update**
```json
{
  "name": "John Smith Updated",
  "phone": "+1234567890",
  "dob": "1990-05-15",
  "addresses": [
    {
      "street": "789 New Street",
      "city": "Delhi",
      "state": "Delhi",
      "zip_code": "110001",
      "country": "India",
      "type": "home"
    }
  ],
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
}
```

### 5. **Response Examples Update**
- Updated the 200 response example to include addresses and temp_addresses
- Shows complete response structure with all updated fields

### 6. **Tag Description Update**
- Updated the "Users" tag description to reflect enhanced profile management capabilities

## Field Validation Rules

### **Address Fields**
- `street`: Max 255 characters
- `city`: Max 100 characters
- `state`: Max 100 characters
- `zip_code`: Max 20 characters
- `country`: Max 100 characters
- `type`: Enum values: "home" or "office"

### **Temp Address Fields**
- `location_data`: Max 500 characters
- `pincode`: Exactly 6 characters
- `selected_area`: Max 255 characters
- `city`: Max 100 characters
- `state`: Max 100 characters
- `country`: Max 100 characters
- `location_permission`: Boolean
- `is_active`: Boolean
- `expires_at`: Date format (YYYY-MM-DD)

## Behavior Documentation

### **Update Behavior**
- **Complete Replacement**: When `addresses` or `temp_addresses` fields are provided, all existing data is deleted and replaced with new data
- **Empty Arrays**: If empty arrays are provided, all existing addresses/temp_addresses are removed
- **Not Provided**: If fields are not included, existing data remains unchanged
- **Partial Updates**: Only provided fields are updated; others remain unchanged

### **Validation Requirements**
- At least one field must be provided
- All fields are optional but cannot be empty, null, or undefined if provided
- Addresses and temp_addresses completely replace existing data when provided

## API Documentation Benefits

### **For Developers**
- Clear understanding of all available fields
- Comprehensive examples for different use cases
- Detailed validation rules and constraints
- Understanding of update behavior and data replacement

### **For Testing**
- Multiple example scenarios for testing different update combinations
- Clear response structure expectations
- Validation error examples for testing edge cases

### **For Integration**
- Complete field specifications for frontend development
- Understanding of data replacement behavior
- Clear response format expectations

## Usage in Swagger UI

### **Interactive Testing**
- Developers can use the examples directly in Swagger UI
- Test different update scenarios with provided examples
- Validate request/response formats

### **Documentation Reference**
- Complete API reference for profile update functionality
- Field-level documentation with examples
- Response format specifications

## Future Enhancements

### **Potential Additions**
- Field-level validation error examples
- More complex update scenarios
- Batch update operations
- Conditional update logic

### **Schema Extensions**
- Additional address types
- Enhanced validation rules
- Custom field validators
- Conditional field requirements

## Conclusion

The updated Swagger configuration provides comprehensive documentation for the enhanced profile update functionality, making it easier for developers to understand and integrate with the API. The addition of addresses and temp_addresses support, along with detailed examples and validation rules, ensures a smooth development experience.
