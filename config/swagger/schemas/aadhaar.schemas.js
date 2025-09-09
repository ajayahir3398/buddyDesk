/**
 * Aadhaar Verification Swagger Schemas
 * Contains all schemas related to Aadhaar verification and validation
 */

module.exports = {
  AadhaarZIPVerificationRequest: {
    type: "object",
    required: ["zipFile"],
    properties: {
      zipFile: {
        type: "string",
        format: "binary",
        description: "ZIP file containing Aadhaar XML and certificate files",
      },
      shareCode: {
        type: "string",
        example: "1234",
        description: "4-digit share code for ZIP file",
      },
    },
  },
  AadhaarNumberValidationRequest: {
    type: "object",
    required: ["aadhaarNumber"],
    properties: {
      aadhaarNumber: {
        type: "string",
        example: "1234 5678 9012",
        description: "12-digit Aadhaar number (with or without spaces)",
      },
    },
  },
  AadhaarVerificationResult: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: true,
        description: "Verification success status",
      },
      requestId: {
        type: "string",
        format: "uuid",
        description: "Unique request identifier",
      },
      verificationId: {
        type: "string",
        format: "uuid",
        description: "Unique verification identifier",
      },
      data: {
        type: "object",
        properties: {
          name: { type: "string", example: "John Doe" },
          dateOfBirth: { type: "string", example: "01-01-1990" },
          gender: { type: "string", example: "M" },
          phone: { type: "string", example: "9876543210" },
          email: { type: "string", example: "john@example.com" },
          maskedAadhaarNumber: {
            type: "string",
            example: "XXXX XXXX 1234",
            description: "Masked Aadhaar number for privacy",
          },
          address: {
            type: "object",
            properties: {
              careOf: { type: "string", example: "S/O ABC" },
              house: { type: "string", example: "123" },
              street: { type: "string", example: "Main Street" },
              locality: { type: "string", example: "Downtown" },
              district: { type: "string", example: "Example District" },
              state: { type: "string", example: "Example State" },
              pincode: { type: "string", example: "123456" },
            },
          },
        },
      },
      signatureValid: {
        type: "boolean",
        nullable: true,
        description: "Digital signature validation result",
      },
      timestampValid: {
        type: "boolean",
        nullable: true,
        description: "Timestamp validation result",
      },
      checksumValid: {
        type: "boolean",
        nullable: true,
        description: "Checksum validation result",
      },
      verificationTime: {
        type: "string",
        format: "date-time",
        description: "Verification timestamp",
      },
    },
  },
  AadhaarVerificationHistory: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      requestId: { type: "string", format: "uuid" },
      data: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            verificationId: { type: "string", format: "uuid" },
            verificationType: {
              type: "string",
              enum: ["XML", "QR", "NUMBER"],
            },
            verificationStatus: {
              type: "string",
              enum: ["SUCCESS", "FAILED", "PENDING"],
            },
            maskedAadhaarNumber: {
              type: "string",
              example: "XXXX XXXX 1234",
            },
            verificationTime: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },
      pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          total: { type: "integer", example: 5 },
          totalPages: { type: "integer", example: 1 },
        },
      },
    },
  },
  AadhaarErrorResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      requestId: { type: "string", format: "uuid" },
      error: {
        type: "object",
        properties: {
          code: {
            type: "string",
            enum: [
              "INVALID_ZIP_FILE",
              "INVALID_XML_FORMAT",
              "SIGNATURE_VERIFICATION_FAILED",
              "TIMESTAMP_VALIDATION_FAILED",
              "CHECKSUM_VALIDATION_FAILED",
              "INVALID_AADHAAR_NUMBER",
              "QR_CODE_INVALID",
              "FILE_TOO_LARGE",
              "UNSUPPORTED_FILE_TYPE",
              "RATE_LIMIT_EXCEEDED",
              "INTERNAL_SERVER_ERROR",
            ],
            example: "INVALID_ZIP_FILE",
          },
          message: {
            type: "string",
            example: "The provided ZIP file is invalid or corrupted",
          },
          details: {
            type: "object",
            description: "Additional error details",
          },
        },
      },
      timestamp: {
        type: "string",
        format: "date-time",
        description: "Error timestamp",
      },
    },
  },
};