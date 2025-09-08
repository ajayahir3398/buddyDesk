/**
 * Security API Paths
 * Contains all security-related API endpoint definitions
 */

module.exports = {
  "/api/security/validate-file": {
    post: {
      summary: "Validate file security",
      description: "Perform security validation on an uploaded file",
      tags: ["Security"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["file"],
              properties: {
                file: {
                  type: "string",
                  format: "binary",
                  description: "File to validate",
                },
                checkTypes: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["malware", "nsfw", "keywords", "video", "all"],
                  },
                  default: ["all"],
                  description: "Types of security checks to perform",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "File security validation completed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    $ref: "#/components/schemas/FileSecurityValidationResult",
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Validation error or unsupported file type",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ValidationError",
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
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        415: {
          description: "Unsupported media type",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        500: {
          description: "Security validation service error",
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
  "/api/security/validate-url": {
    post: {
      summary: "Validate URL security",
      description: "Perform security validation on a URL",
      tags: ["Security"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["url"],
              properties: {
                url: {
                  type: "string",
                  format: "uri",
                  example: "https://example.com/image.jpg",
                  description: "URL to validate",
                },
                checkTypes: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["malware", "nsfw", "phishing", "all"],
                  },
                  default: ["all"],
                  description: "Types of security checks to perform",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "URL security validation completed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      url: { type: "string", format: "uri" },
                      safe: { type: "boolean" },
                      riskLevel: {
                        type: "string",
                        enum: ["low", "medium", "high"],
                      },
                      threats: {
                        type: "array",
                        items: {
                          type: "string",
                          enum: ["malware", "phishing", "nsfw", "suspicious"],
                        },
                      },
                      details: {
                        type: "object",
                        properties: {
                          domain: { type: "string" },
                          reputation: { type: "string" },
                          category: { type: "string" },
                        },
                      },
                      checkedAt: {
                        type: "string",
                        format: "date-time",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Validation error or invalid URL",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ValidationError",
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
        500: {
          description: "Security validation service error",
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
  "/api/security/validate-text": {
    post: {
      summary: "Validate text content",
      description: "Perform security validation on text content",
      tags: ["Security"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["text"],
              properties: {
                text: {
                  type: "string",
                  example: "This is some text content to validate",
                  description: "Text content to validate",
                },
                checkTypes: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["profanity", "spam", "hate_speech", "personal_info", "all"],
                  },
                  default: ["all"],
                  description: "Types of security checks to perform",
                },
                context: {
                  type: "string",
                  enum: ["comment", "post", "message", "profile", "other"],
                  default: "other",
                  description: "Context where the text will be used",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Text security validation completed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      safe: { type: "boolean" },
                      riskLevel: {
                        type: "string",
                        enum: ["low", "medium", "high"],
                      },
                      issues: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            type: {
                              type: "string",
                              enum: ["profanity", "spam", "hate_speech", "personal_info"],
                            },
                            severity: {
                              type: "string",
                              enum: ["low", "medium", "high"],
                            },
                            position: {
                              type: "object",
                              properties: {
                                start: { type: "integer" },
                                end: { type: "integer" },
                              },
                            },
                            suggestion: { type: "string" },
                          },
                        },
                      },
                      filteredText: {
                        type: "string",
                        description: "Text with inappropriate content filtered",
                      },
                      checkedAt: {
                        type: "string",
                        format: "date-time",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ValidationError",
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
        500: {
          description: "Security validation service error",
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
  "/api/security/scan-history": {
    get: {
      summary: "Get security scan history",
      description: "Retrieve security scan history for the authenticated user",
      tags: ["Security"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "type",
          in: "query",
          schema: {
            type: "string",
            enum: ["file", "url", "text"],
          },
          description: "Filter by scan type",
        },
        {
          name: "riskLevel",
          in: "query",
          schema: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          description: "Filter by risk level",
        },
        {
          name: "safe",
          in: "query",
          schema: {
            type: "boolean",
          },
          description: "Filter by safety status",
        },
        {
          name: "dateFrom",
          in: "query",
          schema: {
            type: "string",
            format: "date",
          },
          description: "Filter scans from this date",
        },
        {
          name: "dateTo",
          in: "query",
          schema: {
            type: "string",
            format: "date",
          },
          description: "Filter scans to this date",
        },
        {
          $ref: "#/components/parameters/pageParam",
        },
        {
          $ref: "#/components/parameters/limitParam",
        },
      ],
      responses: {
        200: {
          description: "Security scan history retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        type: {
                          type: "string",
                          enum: ["file", "url", "text"],
                        },
                        target: {
                          type: "string",
                          description: "File name, URL, or text snippet",
                        },
                        safe: { type: "boolean" },
                        riskLevel: {
                          type: "string",
                          enum: ["low", "medium", "high"],
                        },
                        threats: {
                          type: "array",
                          items: { type: "string" },
                        },
                        scannedAt: {
                          type: "string",
                          format: "date-time",
                        },
                      },
                    },
                  },
                  pagination: {
                    $ref: "#/components/schemas/PaginationResponse",
                  },
                  summary: {
                    type: "object",
                    properties: {
                      total: { type: "integer" },
                      safe: { type: "integer" },
                      unsafe: { type: "integer" },
                      byRiskLevel: {
                        type: "object",
                        properties: {
                          low: { type: "integer" },
                          medium: { type: "integer" },
                          high: { type: "integer" },
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
  "/api/security/scan/{id}": {
    get: {
      summary: "Get security scan details",
      description: "Retrieve detailed information about a specific security scan",
      tags: ["Security"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
          description: "Security scan ID",
        },
      ],
      responses: {
        200: {
          description: "Security scan details retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      type: {
                        type: "string",
                        enum: ["file", "url", "text"],
                      },
                      target: { type: "string" },
                      safe: { type: "boolean" },
                      riskLevel: {
                        type: "string",
                        enum: ["low", "medium", "high"],
                      },
                      checkTypes: {
                        type: "array",
                        items: { type: "string" },
                      },
                      results: {
                        type: "object",
                        description: "Detailed scan results based on type",
                      },
                      scannedBy: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          name: { type: "string" },
                        },
                      },
                      scannedAt: {
                        type: "string",
                        format: "date-time",
                      },
                      processingTime: {
                        type: "integer",
                        description: "Processing time in milliseconds",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        404: {
          description: "Security scan not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
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
        403: {
          description: "Forbidden - Not your scan",
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