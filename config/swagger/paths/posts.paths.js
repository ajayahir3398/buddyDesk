/**
 * Posts API Paths
 * Contains all posts-related API endpoint definitions
 */

module.exports = {
  "/posts": {
    get: {
      summary: "Get all posts",
      description: "Retrieve all posts with optional filtering and pagination",
      tags: ["Posts"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "category",
          in: "query",
          schema: {
            type: "string",
          },
          description: "Filter by post category",
        },
        {
          name: "authorId",
          in: "query",
          schema: {
            type: "string",
            format: "uuid",
          },
          description: "Filter by author ID",
        },
        {
          name: "search",
          in: "query",
          schema: {
            type: "string",
          },
          description: "Search posts by title or content",
        },
        {
          name: "sortBy",
          in: "query",
          schema: {
            type: "string",
            enum: ["createdAt", "updatedAt", "likes", "views"],
            default: "createdAt",
          },
          description: "Sort posts by field",
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
          description: "Posts retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Post",
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
    post: {
      summary: "Create new post",
      description: "Create a new post",
      tags: ["Posts"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["title", "content"],
              properties: {
                title: {
                  type: "string",
                  example: "My First Post",
                  description: "Post title",
                },
                content: {
                  type: "string",
                  example: "This is the content of my first post.",
                  description: "Post content",
                },
                category: {
                  type: "string",
                  example: "Technology",
                  description: "Post category",
                },
                tags: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: ["tech", "programming"],
                  description: "Post tags",
                },
                attachments: {
                  type: "array",
                  items: {
                    type: "string",
                    format: "binary",
                  },
                  description: "File attachments",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Post created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    $ref: "#/components/schemas/Post",
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
  "/posts/{id}": {
    get: {
      summary: "Get post by ID",
      description: "Retrieve a specific post by its ID",
      tags: ["Posts"],
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
          description: "Post ID",
        },
      ],
      responses: {
        200: {
          description: "Post retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    $ref: "#/components/schemas/Post",
                  },
                },
              },
            },
          },
        },
        404: {
          description: "Post not found",
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
      },
    },
    put: {
      summary: "Update post",
      description: "Update an existing post (author only)",
      tags: ["Posts"],
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
          description: "Post ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Post title",
                },
                content: {
                  type: "string",
                  description: "Post content",
                },
                category: {
                  type: "string",
                  description: "Post category",
                },
                tags: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description: "Post tags",
                },
                attachments: {
                  type: "array",
                  items: {
                    type: "string",
                    format: "binary",
                  },
                  description: "File attachments",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Post updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    $ref: "#/components/schemas/Post",
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
        404: {
          description: "Post not found",
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
          description: "Forbidden - Not the post author",
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
      summary: "Delete post",
      description: "Delete an existing post (author only)",
      tags: ["Posts"],
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
          description: "Post ID",
        },
      ],
      responses: {
        200: {
          description: "Post deleted successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SuccessResponse",
              },
            },
          },
        },
        404: {
          description: "Post not found",
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
          description: "Forbidden - Not the post author",
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
  "/posts/{id}/like": {
    post: {
      summary: "Like a post",
      description: "Like or unlike a post",
      tags: ["Posts"],
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
          description: "Post ID",
        },
      ],
      responses: {
        200: {
          description: "Post like status updated",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      liked: { type: "boolean", example: true },
                      likesCount: { type: "integer", example: 15 },
                    },
                  },
                },
              },
            },
          },
        },
        404: {
          description: "Post not found",
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
      },
    },
  },
  "/posts/{id}/comments": {
    get: {
      summary: "Get post comments",
      description: "Retrieve all comments for a specific post",
      tags: ["Posts"],
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
          description: "Post ID",
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
          description: "Comments retrieved successfully",
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
                        content: { type: "string" },
                        author: {
                          type: "object",
                          properties: {
                            id: { type: "string", format: "uuid" },
                            name: { type: "string" },
                            avatar: { type: "string" },
                          },
                        },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
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
        404: {
          description: "Post not found",
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
      },
    },
    post: {
      summary: "Add comment to post",
      description: "Add a new comment to a post",
      tags: ["Posts"],
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
          description: "Post ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["content"],
              properties: {
                content: {
                  type: "string",
                  example: "Great post! Thanks for sharing.",
                  description: "Comment content",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Comment added successfully",
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
                      content: { type: "string" },
                      author: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          name: { type: "string" },
                          avatar: { type: "string" },
                        },
                      },
                      createdAt: { type: "string", format: "date-time" },
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
        404: {
          description: "Post not found",
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
      },
    },
  },
};