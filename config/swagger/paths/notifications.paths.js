/**
 * Notifications API Paths
 * Contains all notifications-related API endpoint definitions
 */

module.exports = {
  "/notifications": {
    get: {
      summary: "Get user notifications",
      description: "Retrieve all notifications for the authenticated user",
      tags: ["Notifications"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "type",
          in: "query",
          schema: {
            type: "string",
            enum: ["message", "like", "comment", "follow", "system"],
          },
          description: "Filter by notification type",
        },
        {
          name: "read",
          in: "query",
          schema: {
            type: "boolean",
          },
          description: "Filter by read status",
        },
        {
          name: "sortBy",
          in: "query",
          schema: {
            type: "string",
            enum: ["createdAt", "updatedAt"],
            default: "createdAt",
          },
          description: "Sort notifications by field",
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
          description: "Notifications retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Notification",
                    },
                  },
                  pagination: {
                    $ref: "#/components/schemas/PaginationResponse",
                  },
                  unreadCount: {
                    type: "integer",
                    example: 5,
                    description: "Number of unread notifications",
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
  "/notifications/{id}": {
    get: {
      summary: "Get notification by ID",
      description: "Retrieve a specific notification by its ID",
      tags: ["Notifications"],
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
          description: "Notification ID",
        },
      ],
      responses: {
        200: {
          description: "Notification retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    $ref: "#/components/schemas/Notification",
                  },
                },
              },
            },
          },
        },
        404: {
          description: "Notification not found",
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
          description: "Forbidden - Not your notification",
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
    patch: {
      summary: "Update notification",
      description: "Update notification status (mark as read/unread)",
      tags: ["Notifications"],
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
          description: "Notification ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                read: {
                  type: "boolean",
                  example: true,
                  description: "Mark notification as read or unread",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Notification updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    $ref: "#/components/schemas/Notification",
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
          description: "Notification not found",
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
          description: "Forbidden - Not your notification",
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
      summary: "Delete notification",
      description: "Delete a specific notification",
      tags: ["Notifications"],
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
          description: "Notification ID",
        },
      ],
      responses: {
        200: {
          description: "Notification deleted successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SuccessResponse",
              },
            },
          },
        },
        404: {
          description: "Notification not found",
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
          description: "Forbidden - Not your notification",
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
  "/notifications/mark-all-read": {
    patch: {
      summary: "Mark all notifications as read",
      description: "Mark all notifications for the authenticated user as read",
      tags: ["Notifications"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "All notifications marked as read",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      updatedCount: {
                        type: "integer",
                        example: 10,
                        description: "Number of notifications marked as read",
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
  "/notifications/unread-count": {
    get: {
      summary: "Get unread notifications count",
      description: "Get the count of unread notifications for the authenticated user",
      tags: ["Notifications"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Unread count retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      unreadCount: {
                        type: "integer",
                        example: 5,
                        description: "Number of unread notifications",
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
  "/notifications/preferences": {
    get: {
      summary: "Get notification preferences",
      description: "Get notification preferences for the authenticated user",
      tags: ["Notifications"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Notification preferences retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      email: {
                        type: "object",
                        properties: {
                          messages: { type: "boolean", example: true },
                          likes: { type: "boolean", example: true },
                          comments: { type: "boolean", example: true },
                          follows: { type: "boolean", example: false },
                          system: { type: "boolean", example: true },
                        },
                      },
                      push: {
                        type: "object",
                        properties: {
                          messages: { type: "boolean", example: true },
                          likes: { type: "boolean", example: false },
                          comments: { type: "boolean", example: true },
                          follows: { type: "boolean", example: false },
                          system: { type: "boolean", example: true },
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
    put: {
      summary: "Update notification preferences",
      description: "Update notification preferences for the authenticated user",
      tags: ["Notifications"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: {
                  type: "object",
                  properties: {
                    messages: { type: "boolean" },
                    likes: { type: "boolean" },
                    comments: { type: "boolean" },
                    follows: { type: "boolean" },
                    system: { type: "boolean" },
                  },
                },
                push: {
                  type: "object",
                  properties: {
                    messages: { type: "boolean" },
                    likes: { type: "boolean" },
                    comments: { type: "boolean" },
                    follows: { type: "boolean" },
                    system: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Notification preferences updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      email: {
                        type: "object",
                        properties: {
                          messages: { type: "boolean" },
                          likes: { type: "boolean" },
                          comments: { type: "boolean" },
                          follows: { type: "boolean" },
                          system: { type: "boolean" },
                        },
                      },
                      push: {
                        type: "object",
                        properties: {
                          messages: { type: "boolean" },
                          likes: { type: "boolean" },
                          comments: { type: "boolean" },
                          follows: { type: "boolean" },
                          system: { type: "boolean" },
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