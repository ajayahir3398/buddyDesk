/**
 * Chat API Paths
 * Contains all chat and messaging-related API endpoint definitions
 */

module.exports = {
  "/chat/conversations": {
    get: {
      summary: "Get user conversations",
      description: "Retrieve all conversations for the authenticated user",
      tags: ["Chat"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          $ref: "#/components/parameters/pageParam",
        },
        {
          $ref: "#/components/parameters/limitParam",
        },
      ],
      responses: {
        200: {
          description: "Conversations retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Conversation",
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
      summary: "Create new conversation",
      description: "Start a new conversation with another user",
      tags: ["Chat"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["participantId"],
              properties: {
                participantId: {
                  type: "string",
                  format: "uuid",
                  description: "ID of the user to start conversation with",
                },
                initialMessage: {
                  type: "string",
                  description: "Optional initial message",
                  example: "Hello! I'd like to connect with you.",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Conversation created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    $ref: "#/components/schemas/Conversation",
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Invalid request",
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
  "/chat/conversations/{id}": {
    get: {
      summary: "Get conversation details",
      description: "Retrieve details of a specific conversation",
      tags: ["Chat"],
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
          description: "Conversation ID",
        },
      ],
      responses: {
        200: {
          description: "Conversation details retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    $ref: "#/components/schemas/Conversation",
                  },
                },
              },
            },
          },
        },
        404: {
          description: "Conversation not found",
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
  "/chat/conversations/{id}/messages": {
    get: {
      summary: "Get conversation messages",
      description: "Retrieve messages from a specific conversation",
      tags: ["Chat"],
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
          description: "Conversation ID",
        },
        {
          $ref: "#/components/parameters/pageParam",
        },
        {
          $ref: "#/components/parameters/limitParam",
        },
        {
          name: "before",
          in: "query",
          schema: {
            type: "string",
            format: "date-time",
          },
          description: "Get messages before this timestamp",
        },
      ],
      responses: {
        200: {
          description: "Messages retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Message",
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
          description: "Conversation not found",
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
      summary: "Send message",
      description: "Send a new message in a conversation",
      tags: ["Chat"],
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
          description: "Conversation ID",
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
                  description: "Message content",
                  example: "Hello, how are you?",
                },
                messageType: {
                  type: "string",
                  enum: ["text", "image", "file", "audio", "video"],
                  default: "text",
                  description: "Type of message",
                },
              },
            },
          },
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                content: {
                  type: "string",
                  description: "Message content",
                },
                messageType: {
                  type: "string",
                  enum: ["text", "image", "file", "audio", "video"],
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
          description: "Message sent successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    $ref: "#/components/schemas/Message",
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Invalid message data",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ValidationError",
              },
            },
          },
        },
        404: {
          description: "Conversation not found",
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
  "/chat/conversations/{id}/stats": {
    get: {
      summary: "Get conversation statistics",
      description: "Get statistics for a specific conversation",
      tags: ["Chat"],
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
          description: "Conversation ID",
        },
      ],
      responses: {
        200: {
          description: "Conversation statistics retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      totalMessages: { type: "integer", example: 150 },
                      unreadMessages: { type: "integer", example: 5 },
                      lastActivity: {
                        type: "string",
                        format: "date-time",
                      },
                      messageTypes: {
                        type: "object",
                        properties: {
                          text: { type: "integer", example: 120 },
                          image: { type: "integer", example: 20 },
                          file: { type: "integer", example: 10 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        404: {
          description: "Conversation not found",
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
  "/chat/conversations/{id}/typing": {
    post: {
      summary: "Send typing indicator",
      description: "Send typing indicator to other participants",
      tags: ["Chat"],
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
          description: "Conversation ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                isTyping: {
                  type: "boolean",
                  example: true,
                  description: "Whether user is currently typing",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Typing indicator sent successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SuccessResponse",
              },
            },
          },
        },
        404: {
          description: "Conversation not found",
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
  "/chat/messages/{id}/read": {
    post: {
      summary: "Mark message as read",
      description: "Mark a specific message as read",
      tags: ["Chat"],
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
          description: "Message ID",
        },
      ],
      responses: {
        200: {
          description: "Message marked as read successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SuccessResponse",
              },
            },
          },
        },
        404: {
          description: "Message not found",
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
  "/chat/search": {
    get: {
      summary: "Search messages",
      description: "Search for messages across all conversations",
      tags: ["Chat"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "q",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          description: "Search query",
        },
        {
          name: "conversationId",
          in: "query",
          schema: {
            type: "string",
            format: "uuid",
          },
          description: "Limit search to specific conversation",
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
          description: "Search results retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Message",
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
        400: {
          description: "Invalid search query",
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
  "/chat/users/{id}/status": {
    get: {
      summary: "Get user online status",
      description: "Get online status of a specific user",
      tags: ["Chat"],
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
          description: "User ID",
        },
      ],
      responses: {
        200: {
          description: "User status retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      userId: { type: "string", format: "uuid" },
                      isOnline: { type: "boolean", example: true },
                      lastSeen: {
                        type: "string",
                        format: "date-time",
                        description: "Last seen timestamp",
                      },
                      status: {
                        type: "string",
                        enum: ["online", "away", "busy", "offline"],
                        example: "online",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        404: {
          description: "User not found",
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
  "/chat/notifications": {
    get: {
      summary: "Get chat notifications",
      description: "Retrieve chat-related notifications for the user",
      tags: ["Chat"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          $ref: "#/components/parameters/pageParam",
        },
        {
          $ref: "#/components/parameters/limitParam",
        },
        {
          name: "unreadOnly",
          in: "query",
          schema: {
            type: "boolean",
            default: false,
          },
          description: "Return only unread notifications",
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
  "/chat/notifications/{id}/read": {
    post: {
      summary: "Mark notification as read",
      description: "Mark a specific chat notification as read",
      tags: ["Chat"],
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
          description: "Notification marked as read successfully",
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
      },
    },
  },
};