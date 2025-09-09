/**
 * Aadhaar API Paths
 * Contains all Aadhaar verification-related API endpoint definitions
 */

module.exports = {
  "/aadhaar/verify-zip": {
    post: {
      summary: "Verify Aadhaar ZIP file",
      description: "Verify Aadhaar XML data from ZIP file with digital signature validation",
      tags: ["Aadhaar"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              $ref: "#/components/schemas/AadhaarZIPVerificationRequest",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Aadhaar verification successful",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AadhaarVerificationResult",
              },
            },
          },
        },
        400: {
          description: "Invalid request or file format",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AadhaarErrorResponse",
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        413: {
          description: "File too large",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AadhaarErrorResponse",
              },
            },
          },
        },
        500: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AadhaarErrorResponse",
              },
            },
          },
        },
      },
    },
  },
  "/aadhaar/verify-qr": {
    post: {
      summary: "Verify Aadhaar QR code",
      description: "Verify Aadhaar data from QR code",
      tags: ["Aadhaar"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["qrData"],
              properties: {
                qrData: {
                  type: "string",
                  description: "QR code data string",
                  example: "2979998765432101234567890123456789012345678901234567890",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "QR verification successful",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AadhaarVerificationResult",
              },
            },
          },
        },
        400: {
          description: "Invalid QR code data",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AadhaarErrorResponse",
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
  "/aadhaar/validate-number": {
    post: {
      summary: "Validate Aadhaar number format",
      description: "Validate Aadhaar number format and checksum",
      tags: ["Aadhaar"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/AadhaarNumberValidationRequest",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Validation result",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  valid: { type: "boolean", example: true },
                  message: { type: "string", example: "Valid Aadhaar number" },
                  maskedNumber: { type: "string", example: "XXXX XXXX 1234" },
                },
              },
            },
          },
        },
        400: {
          description: "Invalid Aadhaar number",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AadhaarErrorResponse",
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
  "/aadhaar/verification-history": {
    get: {
      summary: "Get Aadhaar verification history",
      description: "Retrieve user's Aadhaar verification history with pagination",
      tags: ["Aadhaar"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          $ref: "#/components/parameters/pageParam",
        },
        {
          $ref: "#/components/parameters/limitParam",
        },
        {
          name: "verificationType",
          in: "query",
          schema: {
            type: "string",
            enum: ["XML", "QR", "NUMBER"],
          },
          description: "Filter by verification type",
        },
        {
          name: "status",
          in: "query",
          schema: {
            type: "string",
            enum: ["SUCCESS", "FAILED", "PENDING"],
          },
          description: "Filter by verification status",
        },
      ],
      responses: {
        200: {
          description: "Verification history retrieved successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AadhaarVerificationHistory",
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
  "/aadhaar/verification/{verificationId}": {
    get: {
      summary: "Get specific verification details",
      description: "Retrieve details of a specific Aadhaar verification",
      tags: ["Aadhaar"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "verificationId",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
          description: "Verification ID",
        },
      ],
      responses: {
        200: {
          description: "Verification details retrieved successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AadhaarVerificationResult",
              },
            },
          },
        },
        404: {
          description: "Verification not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AadhaarErrorResponse",
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
  "/aadhaar/verification-status": {
    get: {
      summary: "Get verification status summary",
      description: "Get summary of user's Aadhaar verification status and statistics",
      tags: ["Aadhaar"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Verification status retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      isVerified: { type: "boolean", example: true },
                      lastVerification: {
                        type: "string",
                        format: "date-time",
                        description: "Last successful verification timestamp",
                      },
                      totalVerifications: { type: "integer", example: 5 },
                      successfulVerifications: { type: "integer", example: 4 },
                      failedVerifications: { type: "integer", example: 1 },
                      verificationMethods: {
                        type: "object",
                        properties: {
                          XML: { type: "integer", example: 3 },
                          QR: { type: "integer", example: 1 },
                          NUMBER: { type: "integer", example: 1 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
  "/aadhaar/verify-xml": {
    post: {
      summary: "Verify Aadhaar XML directly",
      description: "Verify Aadhaar XML data directly without ZIP file",
      tags: ["Aadhaar"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/xml": {
            schema: {
              type: "string",
              description: "Aadhaar XML data",
            },
          },
          "text/xml": {
            schema: {
              type: "string",
              description: "Aadhaar XML data",
            },
          },
        },
      },
      responses: {
        200: {
          description: "XML verification successful",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AadhaarVerificationResult",
              },
            },
          },
        },
        400: {
          description: "Invalid XML format",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AadhaarErrorResponse",
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
};