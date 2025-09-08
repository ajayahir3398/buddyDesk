/**
 * Files API Paths
 * Contains all file-related API endpoint definitions
 */

module.exports = {
  "/files/upload": {
    post: {
      summary: "Upload file",
      description: "Upload a file to the server",
      tags: ["Files"],
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
                  description: "File to upload",
                },
                category: {
                  type: "string",
                  enum: ["avatar", "document", "image", "video", "other"],
                  default: "other",
                  description: "File category",
                },
                description: {
                  type: "string",
                  description: "File description",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "File uploaded successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        format: "uuid",
                        example: "123e4567-e89b-12d3-a456-426614174000",
                      },
                      filename: {
                        type: "string",
                        example: "document.pdf",
                      },
                      originalName: {
                        type: "string",
                        example: "my-document.pdf",
                      },
                      mimeType: {
                        type: "string",
                        example: "application/pdf",
                      },
                      size: {
                        type: "integer",
                        example: 1024000,
                        description: "File size in bytes",
                      },
                      url: {
                        type: "string",
                        example: "https://example.com/files/document.pdf",
                      },
                      category: {
                        type: "string",
                        example: "document",
                      },
                      uploadedAt: {
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
          description: "Validation error or file too large",
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
      },
    },
  },
  "/files/{id}": {
    get: {
      summary: "Get file by ID",
      description: "Retrieve file information by its ID",
      tags: ["Files"],
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
          description: "File ID",
        },
      ],
      responses: {
        200: {
          description: "File information retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        format: "uuid",
                      },
                      filename: {
                        type: "string",
                      },
                      originalName: {
                        type: "string",
                      },
                      mimeType: {
                        type: "string",
                      },
                      size: {
                        type: "integer",
                      },
                      url: {
                        type: "string",
                      },
                      category: {
                        type: "string",
                      },
                      description: {
                        type: "string",
                      },
                      uploadedBy: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          name: { type: "string" },
                        },
                      },
                      uploadedAt: {
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
        404: {
          description: "File not found",
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
          description: "Forbidden - No access to this file",
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
    delete: {
      summary: "Delete file",
      description: "Delete a file (owner only)",
      tags: ["Files"],
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
          description: "File ID",
        },
      ],
      responses: {
        200: {
          description: "File deleted successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SuccessResponse",
              },
            },
          },
        },
        404: {
          description: "File not found",
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
          description: "Forbidden - Not the file owner",
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
  "/files/{id}/download": {
    get: {
      summary: "Download file",
      description: "Download a file by its ID",
      tags: ["Files"],
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
          description: "File ID",
        },
        {
          name: "inline",
          in: "query",
          schema: {
            type: "boolean",
            default: false,
          },
          description: "Whether to display file inline or force download",
        },
      ],
      responses: {
        200: {
          description: "File downloaded successfully",
          content: {
            "application/octet-stream": {
              schema: {
                type: "string",
                format: "binary",
              },
            },
          },
          headers: {
            "Content-Disposition": {
              description: "Attachment filename",
              schema: {
                type: "string",
              },
            },
            "Content-Type": {
              description: "File MIME type",
              schema: {
                type: "string",
              },
            },
            "Content-Length": {
              description: "File size in bytes",
              schema: {
                type: "integer",
              },
            },
          },
        },
        404: {
          description: "File not found",
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
          description: "Forbidden - No access to this file",
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
  "/files/my-files": {
    get: {
      summary: "Get user's files",
      description: "Retrieve all files uploaded by the authenticated user",
      tags: ["Files"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "category",
          in: "query",
          schema: {
            type: "string",
            enum: ["avatar", "document", "image", "video", "other"],
          },
          description: "Filter by file category",
        },
        {
          name: "search",
          in: "query",
          schema: {
            type: "string",
          },
          description: "Search files by name",
        },
        {
          name: "sortBy",
          in: "query",
          schema: {
            type: "string",
            enum: ["uploadedAt", "filename", "size"],
            default: "uploadedAt",
          },
          description: "Sort files by field",
        },
        {
          name: "sortOrder",
          in: "query",
          schema: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
          },
          description: "Sort order",
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
          description: "Files retrieved successfully",
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
                        id: {
                          type: "string",
                          format: "uuid",
                        },
                        filename: {
                          type: "string",
                        },
                        originalName: {
                          type: "string",
                        },
                        mimeType: {
                          type: "string",
                        },
                        size: {
                          type: "integer",
                        },
                        url: {
                          type: "string",
                        },
                        category: {
                          type: "string",
                        },
                        description: {
                          type: "string",
                        },
                        uploadedAt: {
                          type: "string",
                          format: "date-time",
                        },
                      },
                    },
                  },
                  pagination: {
                    $ref: "#/components/schemas/PaginationResponse",
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
  "/files/bulk-upload": {
    post: {
      summary: "Bulk upload files",
      description: "Upload multiple files at once",
      tags: ["Files"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["files"],
              properties: {
                files: {
                  type: "array",
                  items: {
                    type: "string",
                    format: "binary",
                  },
                  description: "Files to upload (max 10 files)",
                },
                category: {
                  type: "string",
                  enum: ["avatar", "document", "image", "video", "other"],
                  default: "other",
                  description: "Category for all files",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Files uploaded successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      uploaded: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string", format: "uuid" },
                            filename: { type: "string" },
                            originalName: { type: "string" },
                            url: { type: "string" },
                            size: { type: "integer" },
                          },
                        },
                      },
                      failed: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            filename: { type: "string" },
                            error: { type: "string" },
                          },
                        },
                      },
                      summary: {
                        type: "object",
                        properties: {
                          total: { type: "integer" },
                          uploaded: { type: "integer" },
                          failed: { type: "integer" },
                        },
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
      },
    },
  },
};