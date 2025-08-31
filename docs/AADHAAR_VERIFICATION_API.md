# Aadhaar Verification API Documentation

## Overview

The BuddyDesk application now includes comprehensive offline Aadhaar verification capabilities. This system allows users to verify Aadhaar documents through three different methods:

1. **XML Verification** - Offline eKYC XML file verification
2. **QR Code Verification** - Aadhaar QR code verification
3. **Number Validation** - Aadhaar number format and checksum validation

## Features

- ✅ XML file decryption and data extraction
- ✅ Digital signature verification (placeholder for production)
- ✅ Timestamp validation
- ✅ QR code parsing and checksum verification
- ✅ Verhoeff checksum algorithm for number validation
- ✅ Comprehensive audit logging
- ✅ Data masking for security
- ✅ Rate limiting and security validations
- ✅ File upload security checks

## API Endpoints

### Authentication

All Aadhaar verification endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### 1. XML Verification

**Endpoint:** `POST /api/aadhaar/verify-xml`

**Description:** Verifies offline eKYC XML files with share code decryption.

**Request Body:**
```json
{
  "xmlData": "base64_encoded_xml_data_here",
  "shareCode": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "req-uuid",
  "verificationId": "verification-uuid",
  "data": {
    "name": "John Doe",
    "dateOfBirth": "01-01-1990",
    "gender": "M",
    "phone": "9876543210",
    "email": "john@example.com",
    "address": {
      "careOf": "S/O ABC",
      "house": "123",
      "street": "Main Street",
      "locality": "Downtown",
      "district": "Example District",
      "state": "Example State",
      "pincode": "123456"
    },
    "maskedAadhaarNumber": "XXXX XXXX 1234"
  },
  "signatureValid": true,
  "timestampValid": true,
  "verificationTime": "2024-01-15T10:30:00.000Z"
}
```

### 2. QR Code Verification

**Endpoint:** `POST /api/aadhaar/verify-qr`

**Description:** Verifies Aadhaar QR codes from image files.

**Request:** Multipart form data
- Field name: `qrImage`
- File types: JPEG, PNG, BMP, GIF, WebP
- Max size: 5MB

**Response:**
```json
{
  "success": true,
  "requestId": "req-uuid",
  "verificationId": "verification-uuid",
  "data": {
    "referenceId": "12345678901234567890",
    "name": "John Doe",
    "dateOfBirth": "01-01-1990",
    "gender": "M",
    "district": "Example District",
    "state": "Example State",
    "pincode": "123456",
    "maskedAadhaarNumber": "XXXX XXXX 1234"
  },
  "checksumValid": true,
  "verificationTime": "2024-01-15T10:30:00.000Z"
}
```

### 3. Number Validation

**Endpoint:** `POST /api/aadhaar/validate-number`

**Description:** Validates Aadhaar number format and Verhoeff checksum.

**Request Body:**
```json
{
  "aadhaarNumber": "1234 5678 9012"
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "req-uuid",
  "verificationId": "verification-uuid",
  "data": {
    "maskedAadhaarNumber": "XXXX XXXX 9012",
    "formatValid": true
  },
  "verificationTime": "2024-01-15T10:30:00.000Z"
}
```

### 4. Verification History

**Endpoint:** `GET /api/aadhaar/verification-history`

**Description:** Retrieves verification history for the authenticated user.

**Query Parameters:**
- `limit` (optional): Number of records (1-100, default: 10)
- `offset` (optional): Number of records to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "requestId": "req-uuid",
  "data": [
    {
      "id": "verification-uuid",
      "verificationId": "verification-uuid",
      "verificationType": "ZIP",
      "verificationStatus": "SUCCESS",
      "maskedAadhaarNumber": "XXXX XXXX 1234",
      "signatureValid": true,
      "timestampValid": true,
      "verificationTime": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0
}
```

### 5. Verification Details

**Endpoint:** `GET /api/aadhaar/verification/:verificationId`

**Description:** Retrieves detailed information about a specific verification.

**Response:**
```json
{
  "success": true,
  "requestId": "req-uuid",
  "data": {
    "id": "verification-uuid",
    "verificationId": "verification-uuid",
    "verificationType": "XML",
    "verificationStatus": "SUCCESS",
    "maskedAadhaarNumber": "XXXX XXXX 1234",
    "verificationData": {
      "name": "John Doe",
      "dateOfBirth": "01-01-1990"
    },
    "signatureValid": true,
    "timestampValid": true,
    "verificationTime": "2024-01-15T10:30:00.000Z",
    "logs": [
      {
        "action": "VERIFICATION_INITIATED",
        "status": "SUCCESS",
        "message": "ZIP verification started",
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "requestId": "req-uuid",
  "message": "Error description",
  "error": "Detailed error message",
  "errors": [
    {
      "field": "zipFile",
      "message": "ZIP file is required"
    }
  ]
}
```

## Usage Examples

### JavaScript/Node.js Example

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:3000/api/aadhaar';
const AUTH_TOKEN = 'your-jwt-token-here';

// XML Verification
async function verifyXML() {
  try {
    const response = await axios.post(`${API_BASE_URL}/verify-xml`, {
      xmlData: 'base64_encoded_xml_data',
      shareCode: '1234'
    }, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('XML Verification Result:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// QR Code Verification
async function verifyQR() {
  try {
    const formData = new FormData();
    formData.append('qrImage', fs.createReadStream('path/to/qr-image.jpg'));
    
    const response = await axios.post(`${API_BASE_URL}/verify-qr`, formData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('QR Verification Result:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Number Validation
async function validateNumber() {
  try {
    const response = await axios.post(`${API_BASE_URL}/validate-number`, {
      aadhaarNumber: '1234 5678 9012'
    }, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Number Validation Result:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}
```

### cURL Examples

```bash
# ZIP Verification
curl -X POST http://localhost:3000/api/aadhaar/verify-zip \
  -H "Authorization: Bearer your-jwt-token" \
  -F "zipFile=@/path/to/aadhaar-file.zip" \
  -F "shareCode=1234"

# QR Code Verification
curl -X POST http://localhost:3000/api/aadhaar/verify-qr \
  -H "Authorization: Bearer your-jwt-token" \
  -F "qrImage=@/path/to/qr-image.jpg"

# Number Validation
curl -X POST http://localhost:3000/api/aadhaar/validate-number \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "aadhaarNumber": "1234 5678 9012"
  }'

# Get Verification History
curl -X GET "http://localhost:3000/api/aadhaar/verification-history?limit=10&offset=0" \
  -H "Authorization: Bearer your-jwt-token"
```

## Security Features

### Data Protection
- **Sensitive Data Masking**: Aadhaar numbers are masked in responses and logs
- **Encrypted Storage**: Sensitive data is stored encrypted in the database
- **Data Sanitization**: Requests are sanitized to remove sensitive information from logs

### File Upload Security
- **File Type Validation**: Only image files are allowed for QR verification
- **File Size Limits**: Maximum 5MB file size
- **File Header Validation**: Validates actual file format against headers
- **Content Security**: Scans for malicious content in XML files

### Rate Limiting
- **Request Rate Limiting**: Prevents abuse through rate limiting
- **User-based Limits**: Separate limits per authenticated user

### Audit Logging
- **Comprehensive Logging**: All verification attempts are logged
- **Action Tracking**: Detailed step-by-step logging of verification process
- **Security Events**: Failed attempts and security violations are logged

## Database Schema

### aadhaar_verifications
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key to users table)
- `verificationId` (UUID, Unique identifier for public reference)
- `verificationType` (ENUM: 'XML', 'QR', 'NUMBER')
- `verificationStatus` (ENUM: 'SUCCESS', 'FAILED', 'PENDING')
- `aadhaarNumber` (String, Encrypted)
- `maskedAadhaarNumber` (String)
- `verificationData` (JSONB, Extracted demographic data)
- `signatureValid` (Boolean)
- `timestampValid` (Boolean)
- `checksumValid` (Boolean)
- `errorMessage` (Text)
- `ipAddress` (INET)
- `userAgent` (Text)
- `verificationTime` (DateTime)
- `expiresAt` (DateTime)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- `deletedAt` (DateTime, Soft delete)

### aadhaar_verification_logs
- `id` (UUID, Primary Key)
- `verificationId` (UUID, Foreign Key to aadhaar_verifications)
- `action` (ENUM: Various verification steps)
- `status` (ENUM: 'SUCCESS', 'FAILED', 'WARNING')
- `message` (Text)
- `metadata` (JSONB)
- `processingTime` (Integer, milliseconds)
- `timestamp` (DateTime)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## Production Considerations

### UIDAI Certificate Integration
For production use, you must:
1. Obtain the official UIDAI public certificate
2. Implement proper digital signature verification
3. Update the certificate path in the service configuration

### Environment Variables
```bash
# Add to your .env file
UIDAI_CERTIFICATE_PATH=/path/to/uidai/certificate.pem
AADHAAR_ENCRYPTION_KEY=your-encryption-key-here
AADHAAR_RATE_LIMIT_PER_HOUR=10
```

### Compliance Requirements
- Ensure compliance with UIDAI guidelines
- Implement proper data retention policies
- Set up audit logging for compliance
- Follow data protection regulations

## Troubleshooting

### Common Issues

1. **Invalid XML Structure**
   - Ensure XML is properly base64 encoded
   - Verify XML follows UIDAI format

2. **QR Code Reading Failures**
   - Ensure image quality is sufficient
   - Check file format is supported
   - Verify QR code is not damaged

3. **Authentication Errors**
   - Verify JWT token is valid and not expired
   - Check token is included in Authorization header

4. **File Upload Issues**
   - Check file size is under 5MB
   - Verify file type is supported
   - Ensure field name is 'qrImage'

### Monitoring and Logging

The system provides comprehensive logging at different levels:
- **INFO**: Successful operations and normal flow
- **WARN**: Non-critical issues (e.g., signature verification warnings)
- **ERROR**: Failed operations and critical errors

Monitor the following metrics:
- Verification success rates
- Processing times
- Error frequencies
- Rate limit violations

## API Testing

You can test the APIs using the Swagger documentation available at:
```
http://localhost:3000/api-docs
```

The Swagger UI provides an interactive interface to test all endpoints with proper authentication.