/**
 * Content-related Swagger Schemas
 * Contains schemas for posts, conversations, messages, and other content types
 */

module.exports = {
  Skill: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        description: "Unique skill identifier",
      },
      name: {
        type: "string",
        example: "JavaScript",
        description: "Skill name",
      },
      category: {
        type: "string",
        example: "Programming",
        description: "Skill category",
      },
      level: {
        type: "string",
        enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
        example: "Intermediate",
        description: "Skill proficiency level",
      },
      verified: {
        type: "boolean",
        example: false,
        description: "Whether the skill is verified",
      },
    },
  },
  SubSkill: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        description: "Unique sub-skill identifier",
      },
      skillId: {
        type: "string",
        format: "uuid",
        description: "Parent skill identifier",
      },
      name: {
        type: "string",
        example: "React.js",
        description: "Sub-skill name",
      },
      level: {
        type: "string",
        enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
        example: "Advanced",
        description: "Sub-skill proficiency level",
      },
    },
  },
  Conversation: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        description: "Unique conversation identifier",
      },
      participants: {
        type: "array",
        items: {
          type: "string",
          format: "uuid",
        },
        description: "Array of participant user IDs",
      },
      lastMessage: {
        $ref: "#/components/schemas/Message",
        description: "Last message in the conversation",
      },
      unreadCount: {
        type: "integer",
        example: 3,
        description: "Number of unread messages for the current user",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Conversation creation timestamp",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Last update timestamp",
      },
    },
  },
  Message: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        description: "Unique message identifier",
      },
      conversationId: {
        type: "string",
        format: "uuid",
        description: "Conversation identifier",
      },
      senderId: {
        type: "string",
        format: "uuid",
        description: "Sender user identifier",
      },
      content: {
        type: "string",
        example: "Hello, how are you?",
        description: "Message content",
      },
      messageType: {
        type: "string",
        enum: ["text", "image", "file", "audio", "video"],
        example: "text",
        description: "Type of message",
      },
      attachments: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            filename: { type: "string", example: "document.pdf" },
            fileUrl: { type: "string", example: "/uploads/files/document.pdf" },
            fileSize: { type: "integer", example: 1024 },
            mimeType: { type: "string", example: "application/pdf" },
          },
        },
        description: "Message attachments",
      },
      readBy: {
        type: "array",
        items: {
          type: "object",
          properties: {
            userId: { type: "string", format: "uuid" },
            readAt: { type: "string", format: "date-time" },
          },
        },
        description: "Read receipts",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Message creation timestamp",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Message update timestamp",
      },
    },
  },
  Notification: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        description: "Unique notification identifier",
      },
      userId: {
        type: "string",
        format: "uuid",
        description: "Target user identifier",
      },
      type: {
        type: "string",
        enum: [
          "message",
          "friend_request",
          "post_like",
          "post_comment",
          "skill_verification",
          "system",
        ],
        example: "message",
        description: "Notification type",
      },
      title: {
        type: "string",
        example: "New Message",
        description: "Notification title",
      },
      content: {
        type: "string",
        example: "You have received a new message from John",
        description: "Notification content",
      },
      data: {
        type: "object",
        description: "Additional notification data",
      },
      read: {
        type: "boolean",
        example: false,
        description: "Whether the notification has been read",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Notification creation timestamp",
      },
    },
  },
  Post: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        description: "Unique post identifier",
      },
      authorId: {
        type: "string",
        format: "uuid",
        description: "Post author user identifier",
      },
      content: {
        type: "string",
        example: "This is my first post!",
        description: "Post content",
      },
      attachments: {
        type: "array",
        items: {
          $ref: "#/components/schemas/PostAttachment",
        },
        description: "Post attachments",
      },
      likes: {
        type: "integer",
        example: 15,
        description: "Number of likes",
      },
      comments: {
        type: "integer",
        example: 3,
        description: "Number of comments",
      },
      shares: {
        type: "integer",
        example: 2,
        description: "Number of shares",
      },
      visibility: {
        type: "string",
        enum: ["public", "friends", "private"],
        example: "public",
        description: "Post visibility",
      },
      tags: {
        type: "array",
        items: {
          type: "string",
        },
        example: ["technology", "programming"],
        description: "Post tags",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Post creation timestamp",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Post update timestamp",
      },
    },
  },
  PostAttachment: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        description: "Unique attachment identifier",
      },
      postId: {
        type: "string",
        format: "uuid",
        description: "Post identifier",
      },
      filename: {
        type: "string",
        example: "image.jpg",
        description: "Original filename",
      },
      fileUrl: {
        type: "string",
        example: "/uploads/posts/image.jpg",
        description: "File URL",
      },
      thumbnailUrl: {
        type: "string",
        example: "/uploads/posts/thumbnails/image_thumb.jpg",
        description: "Thumbnail URL for images/videos",
      },
      fileSize: {
        type: "integer",
        example: 2048576,
        description: "File size in bytes",
      },
      mimeType: {
        type: "string",
        example: "image/jpeg",
        description: "MIME type",
      },
      attachmentType: {
        type: "string",
        enum: ["image", "video", "audio", "document"],
        example: "image",
        description: "Attachment type",
      },
      order: {
        type: "integer",
        example: 1,
        description: "Display order",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Attachment creation timestamp",
      },
    },
  },
};