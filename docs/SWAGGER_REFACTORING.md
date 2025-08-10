# Swagger Documentation Refactoring

## Overview

The Swagger documentation for the Aadhaar Verification APIs has been moved from inline comments in controller and route files to the centralized `config/swagger.config.js` file. This improves maintainability and keeps the codebase clean.

## Changes Made

### 1. Moved Swagger Documentation to Config

**File: `config/swagger.config.js`**

Added the following to the centralized Swagger configuration:

#### New Schemas:
- `AadhaarXMLVerificationRequest` - Schema for XML verification requests
- `AadhaarNumberValidationRequest` - Schema for number validation requests  
- `AadhaarVerificationResult` - Schema for verification responses
- `AadhaarVerificationHistory` - Schema for verification history responses
- `AadhaarErrorResponse` - Schema for error responses

#### New Tag:
- `Aadhaar Verification` - Tag for all Aadhaar verification endpoints

#### New API Paths:
- `/aadhaar/verify-xml` - POST endpoint for XML verification
- `/aadhaar/verify-qr` - POST endpoint for QR code verification  
- `/aadhaar/validate-number` - POST endpoint for number validation
- `/aadhaar/verification-history` - GET endpoint for verification history
- `/aadhaar/verification/{verificationId}` - GET endpoint for verification details

### 2. Cleaned Up Controller File

**File: `controllers/aadhaar.controller.js`**

- Removed all `@swagger` documentation blocks
- Replaced with simple comments referencing the centralized documentation
- Maintained readable method descriptions

#### Before:
```javascript
/**
 * @swagger
 * /api/aadhaar/verify-xml:
 *   post:
 *     summary: Verify Aadhaar XML file (offline eKYC)
 *     tags: [Aadhaar Verification]
 *     // ... extensive swagger documentation
 */
async verifyXML(req, res) {
```

#### After:
```javascript
/**
 * Verify Aadhaar XML file (offline eKYC)
 * All Swagger documentation is defined in config/swagger.config.js
 */
async verifyXML(req, res) {
```

### 3. Cleaned Up Routes File

**File: `routes/aadhaar.routes.js`**

- Removed inline Swagger schema definitions
- Removed component definitions
- Added reference comment to centralized documentation

#### Before:
```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     VerificationResult:
 *       type: object
 *       // ... extensive schema definitions
 */
```

#### After:
```javascript
// All Swagger documentation for Aadhaar verification APIs is defined in config/swagger.config.js
```

## Benefits

### 1. **Centralized Management**
- All API documentation is now in one place
- Easier to maintain and update
- Consistent documentation format across all APIs

### 2. **Cleaner Codebase**
- Controller and route files are more readable
- Reduced file sizes
- Separation of concerns (logic vs documentation)

### 3. **Better Organization**
- Schemas are reusable across multiple endpoints
- Consistent error response structures
- Organized by functional areas

### 4. **Improved Maintainability**
- Single source of truth for API documentation
- Easier to spot inconsistencies
- Simpler updates when API changes

## Documentation Structure

The Swagger configuration now follows this structure:

```javascript
{
  definition: {
    openapi: '3.0.0',
    info: { ... },
    components: {
      securitySchemes: { ... },
      schemas: {
        // Existing schemas
        User: { ... },
        Error: { ... },
        
        // New Aadhaar schemas
        AadhaarXMLVerificationRequest: { ... },
        AadhaarVerificationResult: { ... },
        // ... other Aadhaar schemas
      }
    },
    tags: [
      { name: 'Users', ... },
      { name: 'Skills', ... },
      { name: 'Posts', ... },
      { name: 'Aadhaar Verification', ... }  // New tag
    ],
    paths: {
      // Existing paths
      '/users/register': { ... },
      
      // New Aadhaar paths
      '/aadhaar/verify-xml': { ... },
      '/aadhaar/verify-qr': { ... },
      // ... other Aadhaar paths
    }
  }
}
```

## API Documentation Access

The complete API documentation is available at:
- Development: `http://localhost:3000/api-docs`
- Production: `https://your-domain.com/api-docs`

## File Changes Summary

| File | Type of Change | Description |
|------|----------------|-------------|
| `config/swagger.config.js` | ✅ Enhanced | Added complete Aadhaar API documentation |
| `controllers/aadhaar.controller.js` | 🧹 Cleaned | Removed inline Swagger docs, added references |
| `routes/aadhaar.routes.js` | 🧹 Cleaned | Removed inline schemas and components |

## Future Recommendations

1. **Consistency**: Follow this pattern for any new API modules
2. **Validation**: Consider using the same schemas for request validation
3. **Examples**: Add more request/response examples in the centralized config
4. **Testing**: Use the Swagger schemas for API testing automation

## Verification

To verify the changes:

1. Start the application: `npm start`
2. Visit: `http://localhost:3000/api-docs`
3. Check that the "Aadhaar Verification" section appears
4. Test each endpoint using the Swagger UI
5. Verify all schemas and examples are properly displayed

The refactoring maintains full functionality while significantly improving code organization and documentation maintainability.