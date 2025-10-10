const swaggerJsdoc = require("swagger-jsdoc");

// Determine environment and set appropriate server URLs
const isDevelopment =
  process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
const isProduction = process.env.NODE_ENV === "production";

const getServers = () => {
  const servers = [];

  if (isDevelopment) {
    servers.push({
      url: `http://localhost:${process.env.PORT || 3000}/api`,
      description: "Development server",
    });
  }

  if (isProduction) {
    if (process.env.PRODUCTION_URL) {
      servers.push({
        url: process.env.PRODUCTION_URL,
        description: "Production server",
      });
    }
  }

  // Fallback - show both if environment is not set
  if (!isDevelopment && !isProduction) {
    servers.push(
      {
        url: `http://localhost:${process.env.PORT || 3000}/api`,
        description: "Development server",
      },
      {
        url: "https://api.buddydesk.in/api",
        description: "Production server",
      }
    );
  }

  return servers;
};

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BuddyDesk API",
      version: "1.0.0",
      description:
        "Complete API for BuddyDesk platform including user authentication, enhanced profile management with addresses, temporary addresses, and work profiles with skills integration, and skills management.",
      contact: {
        name: "API Support",
        email: "support@buddydesk.com",
      },
      license: {
        name: "ISC",
        url: "https://opensource.org/licenses/ISC",
      },
    },
    servers: getServers(),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from login endpoint",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "User ID" },
            name: {
              type: "string",
              example: "John Doe",
              description: "User full name",
            },
            email: {
              type: "string",
              example: "john.doe@example.com",
              description: "User email address",
            },
            referral_code: {
              type: "string",
              example: "ABC123",
              description: "User's unique referral code (6 characters, alphanumeric)",
            },
            referred_by: {
              type: "string",
              example: "XYZ789",
              description: "Referral code of the user who invited this user",
            },
            referred_user_count: {
              type: "integer",
              example: 5,
              description: "Number of users who have signed up using this user's referral code",
            },
            is_online: {
              type: "boolean",
              example: false,
              description: "Whether the user is currently online",
            },
            last_seen: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T12:00:00.000Z",
              description: "Last time the user was active",
            },
            socket_id: {
              type: "string",
              example: "socket_123abc",
              description: "Current socket connection ID",
            },
            is_blocked: {
              type: "boolean",
              example: false,
              description: "Whether the user is blocked due to excessive reporting (10+ reports)",
            },
            report_count: {
              type: "integer",
              example: 0,
              description: "Total number of reports made by this user",
            },
            is_verified: {
              type: "boolean",
              example: false,
              description: "Whether the user is verified (email verified, identity verified, etc.)",
            },
            subscription_tier: {
              type: "string",
              enum: ["free", "basic", "premium", "enterprise"],
              example: "free",
              description: "Current subscription tier of the user",
            },
            subscription_details: {
              type: "object",
              nullable: true,
              description: "Active subscription details (null if no active subscription)",
              properties: {
                id: { type: "string", format: "uuid", example: "123e4567-e89b-12d3-a456-426614174000" },
                platform: { type: "string", enum: ["play", "appstore"], example: "play" },
                product_id: { type: "string", example: "premium_monthly" },
                status: { 
                  type: "string", 
                  enum: ["active", "canceled", "expired", "grace_period", "on_hold", "paused", "pending", "in_retry", "revoked"],
                  example: "active" 
                },
                is_auto_renewing: { type: "boolean", example: true },
                purchase_date: { type: "string", format: "date-time", example: "2024-01-01T00:00:00.000Z" },
                expiry_date: { type: "string", format: "date-time", example: "2024-02-01T00:00:00.000Z" },
                is_trial: { type: "boolean", example: false }
              }
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
              description: "User creation timestamp",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
              description: "User last update timestamp",
            },
          },
        },
        UserRegistration: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: {
              type: "string",
              example: "John Doe",
              description:
                "User full name (2-50 characters, letters and spaces only)",
              minLength: 2,
              maxLength: 50,
            },
            email: {
              type: "string",
              example: "john.doe@example.com",
              description: "User email address (must be unique)",
              format: "email",
              maxLength: 255,
            },
            password: {
              type: "string",
              example: "TestPass123!",
              description:
                "Password (8-128 characters, must contain uppercase, lowercase, number, and special character)",
              minLength: 8,
              maxLength: 128,
            },
            referred_by: {
              type: "string",
              example: "ABC123",
              description: "Optional referral code from an existing user (6 characters, alphanumeric)",
              minLength: 6,
              maxLength: 6,
            },
          },
        },
        UserLogin: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              example: "john.doe@example.com",
              description: "User email address",
              format: "email",
              maxLength: 255,
            },
            password: {
              type: "string",
              example: "TestPass123!",
              description: "User password",
              minLength: 1,
            },
          },
        },
        ChangePassword: {
          type: "object",
          required: ["email", "new_password"],
          properties: {
            email: {
              type: "string",
              example: "john.doe@example.com",
              description: "User email address",
              format: "email",
              maxLength: 255,
            },
            new_password: {
              type: "string",
              example: "NewSecureP@ssw0rd123",
              description: "New password (8-128 characters, must contain uppercase, lowercase, number, and special character)",
              minLength: 8,
              maxLength: 128,
            },
          },
        },
        ChangePasswordResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Password changed successfully" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Login successful" },
            access_token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
              description: "Access token (15 minutes expiry)",
            },
          },
        },
        ValidationError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation failed" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string", example: "email" },
                  message: {
                    type: "string",
                    example: "Please provide a valid email address",
                  },
                  value: { type: "string", example: "invalid-email" },
                },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
              description: "Operation status flag",
            },
            error: {
              type: "string",
              description: "Error details (only in development)",
              nullable: true,
            },
            message: { type: "string", description: "Error message" },
          },
        },
        Skill: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Skill ID" },
            name: {
              type: "string",
              example: "Programming",
              description: "Skill name",
            },
            description: {
              type: "string",
              example: "Software development skills",
              description: "Skill description",
            },
            subSkills: {
              type: "array",
              items: {
                $ref: "#/components/schemas/SubSkill",
              },
              description: "List of sub-skills associated with this skill",
            },
          },
        },
        SubSkill: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Sub-skill ID" },
            name: {
              type: "string",
              example: "JavaScript",
              description: "Sub-skill name",
            },
            description: {
              type: "string",
              example: "Web development language",
              description: "Sub-skill description",
            },
            skill_id: {
              type: "integer",
              example: 1,
              description: "Parent skill ID",
            },
            skill: {
              $ref: "#/components/schemas/Skill",
              description: "Parent skill information",
            },
          },
        },
        SkillsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Skills retrieved successfully",
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Skill",
              },
            },
          },
        },
        Conversation: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
              description: "Unique identifier for the conversation",
            },
            type: {
              type: "string",
              enum: ["private", "group"],
              description: "Type of conversation",
            },
            name: {
              type: "string",
              example: "Project Team",
              description: "Name of the conversation (for group chats)",
            },
            description: {
              type: "string",
              example: "Discussion about project updates",
              description: "Description of the conversation",
            },
            avatar_url: {
              type: "string",
              example: "https://example.com/avatar.jpg",
              description: "Avatar URL for the conversation",
            },
            created_by: {
              type: "integer",
              example: 1,
              description: "ID of the user who created the conversation",
            },
            is_active: {
              type: "boolean",
              example: true,
              description: "Whether the conversation is active",
            },
            last_message_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T12:00:00.000Z",
              description: "Timestamp of the last message",
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
              description: "Creation timestamp",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
              description: "Last update timestamp",
            },
          },
        },
        Message: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
              description: "Unique identifier for the message",
            },
            conversation_id: {
              type: "integer",
              example: 1,
              description: "ID of the conversation this message belongs to",
            },
            sender_id: {
              type: "integer",
              example: 1,
              description: "ID of the user who sent the message",
            },
            content: {
              type: "string",
              example: "Hello, how are you?",
              description: "Message content (decrypted)",
            },
            message_type: {
              type: "string",
              enum: ["text", "image", "video", "audio", "file", "system"],
              description: "Type of message",
            },
            attachment_url: {
              type: "string",
              example: "https://example.com/file.pdf",
              description: "URL of attached file",
            },
            attachment_name: {
              type: "string",
              example: "document.pdf",
              description: "Name of attached file",
            },
            attachment_size: {
              type: "integer",
              example: 1024,
              description: "Size of attached file in bytes",
            },
            attachment_mime_type: {
              type: "string",
              example: "application/pdf",
              description: "MIME type of attached file",
            },
            reply_to_message_id: {
              type: "integer",
              example: 5,
              description: "ID of the message this is replying to",
            },
            forward_from_message_id: {
              type: "integer",
              example: 3,
              description: "ID of the original message if this is a forward",
            },
            is_edited: {
              type: "boolean",
              example: false,
              description: "Whether the message has been edited",
            },
            is_deleted: {
              type: "boolean",
              example: false,
              description: "Whether the message has been deleted",
            },
            deleted_at: {
              type: "string",
              format: "date-time",
              example: null,
              description: "Deletion timestamp",
            },
            metadata: {
              type: "object",
              example: {},
              description: "Additional message metadata",
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T12:00:00.000Z",
              description: "Creation timestamp",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T12:00:00.000Z",
              description: "Last update timestamp",
            },
          },
        },
        CreateConversationRequest: {
          type: "object",
          required: ["type"],
          properties: {
            type: {
              type: "string",
              enum: ["private", "group"],
              description: "Type of conversation to create",
            },
            name: {
              type: "string",
              example: "Project Team",
              description: "Name for group conversations",
            },
            description: {
              type: "string",
              example: "Discussion about project updates",
              description: "Description for group conversations",
            },
            avatar_url: {
              type: "string",
              example: "https://example.com/avatar.jpg",
              description: "Avatar URL for the conversation",
            },
            participant_ids: {
              type: "array",
              items: { type: "integer" },
              example: [2, 3],
              description: "Array of user IDs to add to the conversation",
            },
          },
        },
        SendMessageRequest: {
          type: "object",
          required: ["content"],
          properties: {
            content: {
              type: "string",
              example: "Hello, how are you?",
              description: "Message content",
            },
            message_type: {
              type: "string",
              enum: ["text", "image", "video", "audio", "file"],
              default: "text",
              description: "Type of message",
            },
            reply_to_message_id: {
              type: "integer",
              example: 5,
              description: "ID of the message to reply to",
            },
            forward_from_message_id: {
              type: "integer",
              example: 3,
              description: "ID of the message to forward",
            },
            metadata: {
              type: "object",
              example: {},
              description: "Additional message metadata",
            },
          },
        },
        ConversationResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Conversation created successfully",
            },
            data: { $ref: "#/components/schemas/Conversation" },
          },
        },
        MessageResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Message sent successfully" },
            data: { $ref: "#/components/schemas/Message" },
          },
        },
        ConversationsListResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Conversations retrieved successfully",
            },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Conversation" },
            },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 20 },
                total: { type: "integer", example: 50 },
                totalPages: { type: "integer", example: 3 },
              },
            },
          },
        },
        MessagesListResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Messages retrieved successfully",
            },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Message" },
            },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 50 },
                total: { type: "integer", example: 100 },
                totalPages: { type: "integer", example: 2 },
              },
            },
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
              description: "Unique identifier for the notification",
            },
            user_id: {
              type: "integer",
              example: 1,
              description: "ID of the user receiving the notification",
            },
            message_id: {
              type: "integer",
              example: 1,
              description: "ID of the related message",
            },
            conversation_id: {
              type: "integer",
              example: 1,
              description: "ID of the related conversation",
            },
            type: {
              type: "string",
              enum: ["message", "mention", "group_invite", "system"],
              description: "Type of notification",
            },
            title: {
              type: "string",
              example: "New Message",
              description: "Notification title",
            },
            body: {
              type: "string",
              example: "You have a new message from John",
              description: "Notification body",
            },
            data: {
              type: "object",
              example: {},
              description: "Additional notification data",
            },
            is_seen: {
              type: "boolean",
              example: false,
              description: "Whether the notification has been seen",
            },
            is_read: {
              type: "boolean",
              example: false,
              description: "Whether the notification has been read",
            },
            seen_at: {
              type: "string",
              format: "date-time",
              example: null,
              description: "Timestamp when notification was seen",
            },
            read_at: {
              type: "string",
              format: "date-time",
              example: null,
              description: "Timestamp when notification was read",
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T12:00:00.000Z",
              description: "Creation timestamp",
            },
          },
        },
        NotificationsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Notifications retrieved successfully",
            },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Notification" },
            },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 20 },
                total: { type: "integer", example: 10 },
                totalPages: { type: "integer", example: 1 },
              },
            },
          },
        },
        SubSkillsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Sub-skills retrieved successfully",
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/SubSkill",
              },
            },
          },
        },
        UserProfile: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Profile ID" },
            phone: {
              type: "string",
              example: "+1234567890",
              description: "Phone number",
            },
            dob: {
              type: "string",
              format: "date",
              example: "1990-01-01",
              description: "Date of birth",
            },
            gender: {
              type: "string",
              enum: ["Male", "Female", "Other"],
              example: "Male",
              description: "Gender",
            },
            bio: {
              type: "string",
              example:
                "Software engineer with 5+ years of experience in web development",
              description: "User biography",
              maxLength: 1000,
            },
            looking_skills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer", description: "Skill ID" },
                  name: { type: "string", description: "Skill name" },
                },
                required: ["id", "name"],
              },
              example: [
                { id: 1, name: "test" },
                { id: 3, name: "test1" },
              ],
              description:
                "Array of skill objects that the user is looking for",
            },
            image_path: {
              type: "string",
              example: "/uploads/profiles/user_123_profile.jpg",
              description: "Relative path for user profile image",
              nullable: true,
            },
            image_url: {
              type: "string",
              example:
                "http://example.com/uploads/images/21be627b-7b01-424a-a0cd-13f31d312eb5.png",
              description: "Relative image for user profile",
              nullable: true,
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        WorkProfile: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Work profile ID" },
            company_name: {
              type: "string",
              example: "Tech Corp",
              description: "Company name",
            },
            designation: {
              type: "string",
              example: "Senior Developer",
              description: "Job designation",
            },
            start_date: {
              type: "string",
              format: "date",
              example: "2022-01-01",
              description: "Employment start date",
            },
            end_date: {
              type: "string",
              format: "date",
              example: "2024-01-01",
              description: "Employment end date (null if current)",
              nullable: true,
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        UserSkill: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "User skill ID" },
            proficiency_level: {
              type: "string",
              enum: ["Beginner", "Intermediate", "Expert"],
              example: "Intermediate",
              description: "Skill proficiency level",
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
            skill: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1, description: "Skill ID" },
                name: {
                  type: "string",
                  example: "Programming",
                  description: "Skill name",
                },
                description: {
                  type: "string",
                  example: "Software development skills",
                  description: "Skill description",
                },
              },
            },
            subSkill: {
              type: "object",
              properties: {
                id: {
                  type: "integer",
                  example: 1,
                  description: "Sub-skill ID",
                },
                name: {
                  type: "string",
                  example: "JavaScript",
                  description: "Sub-skill name",
                },
                description: {
                  type: "string",
                  example: "Web development language",
                  description: "Sub-skill description",
                },
              },
              nullable: true,
            },
          },
        },
        Address: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Address ID" },
            street: {
              type: "string",
              example: "123 Main St",
              description: "Street address",
            },
            city: { type: "string", example: "New York", description: "City" },
            state: {
              type: "string",
              example: "NY",
              description: "State/Province",
            },
            zip_code: {
              type: "string",
              example: "10001",
              description: "ZIP/Postal code",
            },
            country: { type: "string", example: "USA", description: "Country" },
            type: {
              type: "string",
              enum: ["home", "office"],
              example: "home",
              description: "Address type",
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        TempAddress: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
              description: "Temporary address ID",
            },
            location_data: {
              type: "string",
              example: "GPS: 28.6139,77.2090",
              description: "Raw location data or notes",
            },
            pincode: {
              type: "string",
              example: "110001",
              description: "6-digit pincode",
            },
            selected_area: {
              type: "string",
              example: "Connaught Place",
              description: "Selected locality/area",
            },
            city: {
              type: "string",
              example: "New Delhi",
              description: "City",
              nullable: true,
            },
            state: {
              type: "string",
              example: "Delhi",
              description: "State/Province",
              nullable: true,
            },
            country: {
              type: "string",
              example: "India",
              description: "Country",
              nullable: true,
            },
            location_permission: {
              type: "boolean",
              example: true,
              description: "Whether user granted location permission",
            },
            is_active: {
              type: "boolean",
              example: true,
              description: "Whether temp address is currently active",
            },
            expires_at: {
              type: "string",
              format: "date-time",
              example: "2024-02-01T00:00:00.000Z",
              description: "Expiration timestamp",
              nullable: true,
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        NotificationSettings: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
              description: "Notification settings ID"
            },
            push_notification: {
              type: "boolean",
              example: true,
              description: "Enable/disable push notifications"
            },
            general_notification: {
              type: "boolean",
              example: true,
              description: "Enable/disable general notifications"
            },
            skill_exchange_notification: {
              type: "boolean",
              example: true,
              description: "Enable/disable skill exchange notifications"
            },
            message_notification: {
              type: "boolean",
              example: true,
              description: "Enable/disable message notifications"
            },
            marketing_notification: {
              type: "boolean",
              example: false,
              description: "Enable/disable marketing notifications"
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z"
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z"
            }
          }
        },
        Feedback: {
          type: "object",
          required: ["subject", "message"],
          properties: {
            type: {
              type: "string",
              enum: ["bug", "feature_request", "general", "complaint", "suggestion"],
              example: "bug",
              description: "Type of feedback",
              default: "general"
            },
            subject: {
              type: "string",
              example: "App crashes on login",
              description: "Feedback subject (5-255 characters)",
              minLength: 5,
              maxLength: 255
            },
            message: {
              type: "string",
              example: "The app crashes every time I try to login with my email. This happens on both Android and iOS devices.",
              description: "Detailed feedback message (10-5000 characters)",
              minLength: 10,
              maxLength: 5000
            },
            rating: {
              type: "integer",
              minimum: 1,
              maximum: 5,
              example: 2,
              description: "Optional rating from 1 to 5"
            }
          }
        },
        FeedbackResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Feedback submitted successfully" },
            data: {
              type: "object",
              properties: {
                id: { type: "integer", example: 123, description: "Feedback ID" },
                created_at: { 
                  type: "string", 
                  format: "date-time", 
                  example: "2024-01-15T10:30:00.000Z",
                  description: "Feedback creation timestamp"
                }
              }
            }
          }
        },
        PostReport: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Report ID" },
            post_id: { type: "integer", example: 123, description: "ID of the reported post" },
            reported_by: { type: "integer", example: 456, description: "ID of the user who reported" },
            reason: { 
              type: "string", 
              nullable: true,
              example: "This post contains spam content",
              description: "Free-text reason for reporting"
            },
            description: { 
              type: "string", 
              nullable: true,
              example: "Additional details about the report",
              description: "Additional details about the report"
            },
            status: {
              type: "string",
              enum: ["pending", "reviewed", "resolved", "dismissed"],
              example: "pending",
              description: "Status of the report review"
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
              description: "Report creation timestamp"
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
              description: "Report last update timestamp"
            }
          }
        },
        FeedPostReport: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Report ID" },
            feed_post_id: { type: "integer", example: 123, description: "ID of the reported feed post" },
            reported_by: { type: "integer", example: 456, description: "ID of the user who reported" },
            reason: { 
              type: "string", 
              nullable: true,
              example: "This post has inappropriate content",
              description: "Free-text reason for reporting"
            },
            description: { 
              type: "string", 
              nullable: true,
              example: "Contains offensive language",
              description: "Additional details about the report"
            },
            status: {
              type: "string",
              enum: ["pending", "reviewed", "resolved", "dismissed"],
              example: "pending",
              description: "Status of the report review"
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
              description: "Report creation timestamp"
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
              description: "Report last update timestamp"
            }
          }
        },
        UserBlock: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Block ID" },
            blocker_id: { type: "integer", example: 123, description: "ID of the user who blocked" },
            blocked_id: { type: "integer", example: 456, description: "ID of the user who is blocked" },
            reason: { 
              type: "string", 
              nullable: true,
              example: "Inappropriate behavior",
              description: "Optional reason for blocking"
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
              description: "Block creation timestamp"
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
              description: "Block last update timestamp"
            }
          }
        },
        PostAttachment: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Attachment ID" },
            file_path: {
              type: "string",
              example: "/uploads/documents/file.pdf",
              description: "File path",
            },
            file_name: {
              type: "string",
              example: "document.pdf",
              description: "Original file name",
            },
            file_category: {
              type: "string",
              enum: ["images", "audio", "documents", "posts"],
              example: "documents",
              description: "File category for organized storage",
            },
            mime_type: {
              type: "string",
              example: "application/pdf",
              description: "MIME type",
            },
            size: {
              type: "integer",
              example: 1024,
              description: "File size in bytes",
            },
            uploaded_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        Post: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Post ID" },
            title: {
              type: "string",
              example: "Need help with React project",
              description: "Post title",
            },
            description: {
              type: "string",
              example: "Looking for someone to help with a React.js project...",
              description: "Post description",
            },
            medium: {
              type: "string",
              enum: ["online", "offline"],
              example: "online",
              description: "Collaboration medium",
            },
            status: {
              type: "string",
              enum: ["active", "hold", "discussed", "completed", "deleted"],
              example: "active",
              description: "Post status",
            },
            deadline: {
              type: "string",
              format: "date",
              example: "2024-02-01",
              description: "Project deadline",
              nullable: true,
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
            requiredSkill: {
              type: "object",
              properties: {
                id: {
                  type: "integer",
                  example: 1,
                  description: "Required skill ID",
                },
                name: {
                  type: "string",
                  example: "Programming",
                  description: "Required skill name",
                },
                description: {
                  type: "string",
                  example: "Software development skills",
                  description: "Required skill description",
                },
              },
              nullable: true,
            },
            requiredSubSkill: {
              type: "object",
              properties: {
                id: {
                  type: "integer",
                  example: 1,
                  description: "Required sub-skill ID",
                },
                name: {
                  type: "string",
                  example: "React.js",
                  description: "Required sub-skill name",
                },
                description: {
                  type: "string",
                  example: "React JavaScript library",
                  description: "Required sub-skill description",
                },
              },
              nullable: true,
            },
            attachments: {
              type: "array",
              items: {
                $ref: "#/components/schemas/PostAttachment",
              },
              description: "Post attachments",
            },
          },
        },
        PostWithUserTempAddress: {
          type: "object",
          properties: {
            id: { type: "integer", example: 22, description: "Post ID" },
            user_id: {
              type: "integer",
              example: 17,
              description: "User ID who created the post",
            },
            title: {
              type: "string",
              example: "Test",
              description: "Post title",
            },
            description: {
              type: "string",
              example: "Tedting",
              description: "Post description",
            },
            required_skill_id: {
              type: "integer",
              example: 1,
              description: "Required skill ID",
            },
            required_sub_skill_id: {
              type: "integer",
              example: 2,
              description: "Required sub-skill ID",
            },
            medium: {
              type: "string",
              enum: ["online", "offline"],
              example: "online",
              description: "Collaboration medium",
            },
            status: {
              type: "string",
              enum: ["active", "hold", "discussed", "completed", "deleted"],
              example: "active",
              description: "Post status",
            },
            deadline: {
              type: "string",
              format: "date",
              example: "2025-09-02",
              description: "Project deadline",
              nullable: true,
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2025-08-29T19:51:00.310Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2025-08-29T19:51:00.315Z",
            },
            user: {
              type: "object",
              properties: {
                id: { type: "integer", example: 17, description: "User ID" },
                name: {
                  type: "string",
                  example: "Ajay B",
                  description: "User full name",
                },
                email: {
                  type: "string",
                  example: "bandhiyaajay3398@gmail.com",
                  description: "User email address",
                },
                tempAddresses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      pincode: {
                        type: "string",
                        example: "361004",
                        description: "Pincode",
                      },
                      selected_area: {
                        type: "string",
                        example: "Udyognagar",
                        description: "Selected area",
                      },
                      city: {
                        type: "string",
                        example: "Gujarat",
                        description: "City",
                      },
                      state: {
                        type: "string",
                        example: null,
                        description: "State",
                        nullable: true,
                      },
                    },
                  },
                  description: "User temporary addresses",
                },
              },
              description: "User information with temporary addresses",
            },
            requiredSkill: {
              type: "object",
              properties: {
                id: {
                  type: "integer",
                  example: 1,
                  description: "Required skill ID",
                },
                name: {
                  type: "string",
                  example: "Academic Help",
                  description: "Required skill name",
                },
              },
              description: "Required skill information",
            },
            requiredSubSkill: {
              type: "object",
              properties: {
                id: {
                  type: "integer",
                  example: 2,
                  description: "Required sub-skill ID",
                },
                name: {
                  type: "string",
                  example: "College Project Guidance",
                  description: "Required sub-skill name",
                },
              },
              description: "Required sub-skill information",
            },
            attachments: {
              type: "array",
              items: {
                $ref: "#/components/schemas/PostAttachment",
              },
              description: "Post attachments",
              example: [],
            },
            inExchangeSkillPost: {
              type: "object",
              properties: {
                id: {
                  type: "integer",
                  example: 15,
                  description: "Exchange post ID",
                },
                title: {
                  type: "string",
                  example: "Web Development Services",
                  description: "Exchange post title",
                },
                user_id: {
                  type: "integer",
                  example: 17,
                  description: "Exchange post user ID",
                },
                required_skill_id: {
                  type: "integer",
                  example: 2,
                  description: "Exchange post required skill ID",
                },
              },
              description:
                "Matching exchange skill post from the same user (if available)",
              nullable: true,
            },
          },
        },
        PostCreation: {
          type: "object",
          properties: {
            title: {
              type: "string",
              example: "Need help with React project",
              description: "Post title (optional, 1-255 characters)",
              minLength: 1,
              maxLength: 255,
            },
            description: {
              type: "string",
              example:
                "Looking for someone to help with a React.js project involving state management and API integration.",
              description: "Post description (optional, 1-5000 characters)",
              minLength: 1,
              maxLength: 5000,
            },
            required_skill_id: {
              type: "integer",
              example: 1,
              description: "Required skill ID (optional, positive integer)",
              minimum: 1,
              nullable: true,
            },
            required_sub_skill_id: {
              type: "integer",
              example: 2,
              description: "Required sub-skill ID (optional, positive integer)",
              minimum: 1,
              nullable: true,
            },
            medium: {
              type: "string",
              enum: ["online", "offline"],
              example: "online",
              description:
                "Collaboration medium (optional, defaults to online)",
            },
            deadline: {
              type: "string",
              format: "date",
              example: "2024-12-31",
              description: "Project deadline (optional, must be future date)",
              nullable: true,
            },
          },
          additionalProperties: false,
        },
        PostResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Post created successfully" },
            data: {
              $ref: "#/components/schemas/Post",
            },
          },
        },
        PostsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Posts retrieved successfully",
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Post",
              },
            },
            pagination: {
              type: "object",
              properties: {
                currentPage: { type: "integer", example: 1 },
                totalPages: { type: "integer", example: 5 },
                totalItems: { type: "integer", example: 47 },
                itemsPerPage: { type: "integer", example: 10 },
              },
            },
          },
        },
        PostUpdate: {
          type: "object",
          properties: {
            title: {
              type: "string",
              example: "Updated: Need help with React project",
              description: "Post title (optional, 1-255 characters)",
              minLength: 1,
              maxLength: 255,
            },
            description: {
              type: "string",
              example:
                "Updated description: Looking for an experienced React.js developer for a complex project.",
              description: "Post description (optional, 1-5000 characters)",
              minLength: 1,
              maxLength: 5000,
            },
            required_skill_id: {
              type: "integer",
              example: 2,
              description: "Required skill ID (optional, positive integer)",
              minimum: 1,
              nullable: true,
            },
            required_sub_skill_id: {
              type: "integer",
              example: 3,
              description: "Required sub-skill ID (optional, positive integer)",
              minimum: 1,
              nullable: true,
            },
            medium: {
              type: "string",
              enum: ["online", "offline"],
              example: "offline",
              description: "Collaboration medium (optional)",
            },
            status: {
              type: "string",
              enum: ["active", "hold", "discussed", "completed", "deleted"],
              example: "hold",
              description: "Post status (optional)",
            },
            deadline: {
              type: "string",
              format: "date",
              example: "2025-01-15",
              description:
                "Project deadline (optional, can be null to clear deadline)",
              nullable: true,
            },
          },
          additionalProperties: false,
        },
        EnhancedWorkProfile: {
          type: "object",
          allOf: [
            {
              $ref: "#/components/schemas/WorkProfile",
            },
            {
              type: "object",
              properties: {
                userSkills: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/UserSkill",
                  },
                  description: "Skills associated with this work profile",
                },
              },
            },
          ],
        },
        CompleteProfile: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "User ID" },
            name: {
              type: "string",
              example: "John Doe",
              description: "User full name",
            },
            email: {
              type: "string",
              example: "john.doe@example.com",
              description: "User email address",
            },
            referral_code: {
              type: "string",
              example: "ABC123",
              description: "User's unique referral code",
            },
            referred_user_count: {
              type: "integer",
              example: 5,
              description: "Number of users who have signed up using this user's referral code",
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
            profile: {
              $ref: "#/components/schemas/UserProfile",
              description: "User personal profile information",
            },
            work_profiles: {
              type: "array",
              items: {
                $ref: "#/components/schemas/EnhancedWorkProfile",
              },
              description: "User work experience profiles with skills",
            },
            addresses: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Address",
              },
              description: "User addresses",
            },
            temp_addresses: {
              type: "array",
              items: {
                $ref: "#/components/schemas/TempAddress",
              },
              description: "User temporary addresses",
            },
            notification_settings: {
              $ref: "#/components/schemas/NotificationSettings",
              description: "User notification preferences",
              nullable: true,
            },
            posts: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Post",
              },
              description: "User posts",
            },
            terms_accepted: {
              type: "boolean",
              example: true,
              description: "Whether the user has accepted the current version of terms and conditions",
            },
            terms_version: {
              type: "string",
              example: "1.0",
              description: "The current version of terms and conditions being checked",
            },
            terms_accepted_at: {
              type: "string",
              format: "date-time",
              example: "2025-10-07T14:30:00.000Z",
              description: "Timestamp when the user accepted the current terms version",
              nullable: true,
            },
          },
        },
        ProfileResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Profile retrieved successfully",
            },
            data: {
              $ref: "#/components/schemas/CompleteProfile",
            },
          },
        },
        UpdateProfileResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Profile updated successfully",
            },
            data: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1, description: "User ID" },
                name: {
                  type: "string",
                  example: "John Doe",
                  description: "User full name",
                },
                email: {
                  type: "string",
                  example: "john.doe@example.com",
                  description: "User email address",
                },
                created_at: {
                  type: "string",
                  format: "date-time",
                  example: "2024-01-01T00:00:00.000Z",
                },
                updated_at: {
                  type: "string",
                  format: "date-time",
                  example: "2024-01-15T10:30:00.000Z",
                },
                profile: {
                  type: "object",
                  properties: {
                    id: {
                      type: "integer",
                      example: 1,
                      description: "Profile ID",
                    },
                    phone: {
                      type: "string",
                      example: "+1234567890",
                      description: "Phone number",
                      nullable: true,
                    },
                    dob: {
                      type: "string",
                      format: "date",
                      example: "1990-01-01",
                      description: "Date of birth",
                      nullable: true,
                    },
                    gender: {
                      type: "string",
                      enum: ["Male", "Female", "Other"],
                      example: "Male",
                      description: "Gender",
                      nullable: true,
                    },
                    bio: {
                      type: "string",
                      example:
                        "Passionate software developer with 5+ years of experience in web technologies.",
                      description: "User biography",
                      maxLength: 1000,
                      nullable: true,
                    },
                    created_at: {
                      type: "string",
                      format: "date-time",
                      example: "2024-01-01T00:00:00.000Z",
                    },
                    updated_at: {
                      type: "string",
                      format: "date-time",
                      example: "2024-01-15T10:30:00.000Z",
                    },
                  },
                  nullable: true,
                },
                addresses: {
                  type: "array",
                  description: "Updated user addresses",
                  items: {
                    $ref: "#/components/schemas/Address",
                  },
                },
                temp_addresses: {
                  type: "array",
                  description: "Updated user temporary addresses",
                  items: {
                    $ref: "#/components/schemas/TempAddress",
                  },
                },
                work_profiles: {
                  type: "array",
                  description: "Updated user work profiles with skills",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "integer",
                        example: 1,
                        description: "Work profile ID",
                      },
                      company_name: {
                        type: "string",
                        example: "Tech Solutions Inc.",
                        description: "Company name",
                      },
                      designation: {
                        type: "string",
                        example: "Senior Software Engineer",
                        description: "Job designation",
                      },
                      start_date: {
                        type: "string",
                        format: "date",
                        example: "2022-01-15",
                        description: "Employment start date",
                      },
                      end_date: {
                        type: "string",
                        format: "date",
                        example: "2024-06-30",
                        description: "Employment end date",
                        nullable: true,
                      },
                      created_at: {
                        type: "string",
                        format: "date-time",
                        example: "2024-01-15T10:30:00.000Z",
                      },
                      updated_at: {
                        type: "string",
                        format: "date-time",
                        example: "2024-01-15T10:30:00.000Z",
                      },
                      userSkills: {
                        type: "array",
                        description: "Skills associated with this work profile",
                        items: {
                          type: "object",
                          properties: {
                            id: {
                              type: "integer",
                              example: 1,
                              description: "User skill ID",
                            },
                            proficiency_level: {
                              type: "string",
                              enum: ["Beginner", "Intermediate", "Expert"],
                              example: "Expert",
                              description: "Skill proficiency level",
                            },
                            created_at: {
                              type: "string",
                              format: "date-time",
                              example: "2024-01-15T10:30:00.000Z",
                            },
                            updated_at: {
                              type: "string",
                              format: "date-time",
                              example: "2024-01-15T10:30:00.000Z",
                            },
                            skill: {
                              type: "object",
                              properties: {
                                id: {
                                  type: "integer",
                                  example: 1,
                                  description: "Skill ID",
                                },
                                name: {
                                  type: "string",
                                  example: "JavaScript",
                                  description: "Skill name",
                                },
                                description: {
                                  type: "string",
                                  example:
                                    "Programming language for web development",
                                  description: "Skill description",
                                },
                              },
                            },
                            subSkill: {
                              type: "object",
                              properties: {
                                id: {
                                  type: "integer",
                                  example: 2,
                                  description: "Sub-skill ID",
                                },
                                name: {
                                  type: "string",
                                  example: "React.js",
                                  description: "Sub-skill name",
                                },
                                description: {
                                  type: "string",
                                  example:
                                    "JavaScript library for building user interfaces",
                                  description: "Sub-skill description",
                                },
                              },
                              nullable: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
                notification_settings: {
                  $ref: "#/components/schemas/NotificationSettings",
                  description: "Updated user notification preferences",
                  nullable: true,
                },
              },
            },
          },
        },
        UpdateProfileRequest: {
          type: "object",
          properties: {
            name: {
              type: "string",
              example: "John Doe",
              description:
                "User full name (2-50 characters, letters and spaces only)",
              minLength: 2,
              maxLength: 50,
            },
            email: {
              type: "string",
              example: "john.doe@example.com",
              description: "User email address (must be unique)",
              format: "email",
              maxLength: 255,
            },
            phone: {
              type: "string",
              example: "+1234567890",
              description: "Phone number (10-20 characters)",
              minLength: 10,
              maxLength: 20,
            },
            dob: {
              type: "string",
              format: "date",
              example: "1990-01-01",
              description:
                "Date of birth in YYYY-MM-DD format (must be at least 13 years old and not more than 120 years ago)",
            },
            bio: {
              type: "string",
              example:
                "Software engineer with 5 years of experience in web development.",
              description: "User biography (max 1000 characters)",
              maxLength: 1000,
            },
            looking_skills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer", description: "Skill ID" },
                  name: { type: "string", description: "Skill name" },
                },
                required: ["id", "name"],
              },
              example: [
                { id: 1, name: "test" },
                { id: 3, name: "test1" },
              ],
              description:
                "Array of skill objects that the user is looking for",
            },
            addresses: {
              type: "array",
              description:
                "Array of user addresses. If provided, completely replaces existing addresses.",
              items: {
                type: "object",
                properties: {
                  street: {
                    type: "string",
                    example: "123 Main Street",
                    description: "Street address (max 255 characters)",
                    maxLength: 255,
                  },
                  city: {
                    type: "string",
                    example: "Mumbai",
                    description: "City name (max 100 characters)",
                    maxLength: 100,
                  },
                  state: {
                    type: "string",
                    example: "Maharashtra",
                    description: "State/province (max 100 characters)",
                    maxLength: 100,
                  },
                  zip_code: {
                    type: "string",
                    example: "400001",
                    description: "Postal/ZIP code (max 20 characters)",
                    maxLength: 20,
                  },
                  country: {
                    type: "string",
                    example: "India",
                    description: "Country name (max 100 characters)",
                    maxLength: 100,
                  },
                  type: {
                    type: "string",
                    enum: ["home", "office"],
                    example: "home",
                    description: 'Address type: "home" or "office"',
                  },
                },
              },
            },
            temp_addresses: {
              type: "array",
              description:
                "Array of temporary addresses. If provided, completely replaces existing temp addresses.",
              items: {
                type: "object",
                properties: {
                  location_data: {
                    type: "string",
                    example: "Near Central Station",
                    description: "Location description (max 500 characters)",
                    maxLength: 500,
                  },
                  pincode: {
                    type: "string",
                    example: "400003",
                    description: "6-digit pincode",
                    minLength: 6,
                    maxLength: 6,
                  },
                  selected_area: {
                    type: "string",
                    example: "Downtown",
                    description: "Selected area name (max 255 characters)",
                    maxLength: 255,
                  },
                  city: {
                    type: "string",
                    example: "Mumbai",
                    description: "City name (max 100 characters)",
                    maxLength: 100,
                  },
                  state: {
                    type: "string",
                    example: "Maharashtra",
                    description: "State/province (max 100 characters)",
                    maxLength: 100,
                  },
                  country: {
                    type: "string",
                    example: "India",
                    description: "Country name (max 100 characters)",
                    maxLength: 100,
                  },
                  location_permission: {
                    type: "boolean",
                    example: true,
                    description: "Location permission flag",
                  },
                  is_active: {
                    type: "boolean",
                    example: true,
                    description: "Active status flag",
                  },
                  expires_at: {
                    type: "string",
                    format: "date",
                    example: "2025-12-31",
                    description: "Expiry date (YYYY-MM-DD format)",
                  },
                },
              },
            },
            work_profiles: {
              type: "array",
              description:
                "Array of work profiles. If provided, completely replaces existing work profiles.",
              items: {
                type: "object",
                properties: {
                  company_name: {
                    type: "string",
                    example: "Tech Solutions Inc.",
                    description:
                      "Company/organization name (max 255 characters)",
                    maxLength: 255,
                  },
                  designation: {
                    type: "string",
                    example: "Senior Software Engineer",
                    description: "Job title/role (max 255 characters)",
                    maxLength: 255,
                  },
                  start_date: {
                    type: "string",
                    format: "date",
                    example: "2022-01-15",
                    description:
                      "Employment start date (YYYY-MM-DD format, cannot be in future)",
                  },
                  end_date: {
                    type: "string",
                    format: "date",
                    example: "2024-06-30",
                    description:
                      "Employment end date (YYYY-MM-DD format, must be after start_date, null for current employment)",
                    nullable: true,
                  },
                  user_skills: {
                    type: "array",
                    description:
                      "Array of skills associated with this work profile",
                    items: {
                      type: "object",
                      properties: {
                        skill_id: {
                          type: "integer",
                          example: 1,
                          description: "Skill ID (positive integer)",
                          minimum: 1,
                        },
                        sub_skill_id: {
                          type: "integer",
                          example: 3,
                          description:
                            "Sub-skill ID (positive integer, optional)",
                          minimum: 1,
                          nullable: true,
                        },
                        proficiency_level: {
                          type: "string",
                          enum: ["Beginner", "Intermediate", "Expert"],
                          example: "Expert",
                          description: "Skill proficiency level",
                        },
                      },
                    },
                  },
                },
              },
            },
            image_path: {
              type: "string",
              example: "/uploads/profiles/user_123_profile.jpg",
              description: "Relative path for user profile image (optional)",
              nullable: true,
            },
            notification_settings: {
              type: "object",
              description: "Notification preferences object",
              properties: {
                push_notification: {
                  type: "boolean",
                  example: true,
                  description: "Enable/disable push notifications",
                },
                general_notification: {
                  type: "boolean",
                  example: true,
                  description: "Enable/disable general notifications",
                },
                skill_exchange_notification: {
                  type: "boolean",
                  example: true,
                  description: "Enable/disable skill exchange notifications",
                },
                message_notification: {
                  type: "boolean",
                  example: true,
                  description: "Enable/disable message notifications",
                },
                marketing_notification: {
                  type: "boolean",
                  example: false,
                  description: "Enable/disable marketing notifications",
                },
              },
            },
          },
          additionalProperties: false,
          description:
            "At least one field must be provided. All fields are optional but cannot be empty, null, or undefined if provided. Addresses, temp_addresses, and work_profiles completely replace existing data when provided. Notification settings can be updated individually or together.",
        },
        PublicProfile: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "User ID" },
            name: {
              type: "string",
              example: "John Doe",
              description: "User full name",
            },
            member_since: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
              description: "Member since date",
            },
            profile: {
              type: "object",
              properties: {
                gender: {
                  type: "string",
                  enum: ["Male", "Female", "Other"],
                  example: "Male",
                  description: "Gender (limited public info)",
                  nullable: true,
                },
                bio: {
                  type: "string",
                  example:
                    "Passionate software developer with 5+ years of experience in web technologies.",
                  description: "User biography",
                  maxLength: 1000,
                  nullable: true,
                },
                image_url: {
                  type: "string",
                  example: "http://example.com/uploads/images/21be627b-7b01-424a-a0cd-13f31d312eb5.png",
                  description: "Relative url for user profile",
                  nullable: true,
                },
              },
              description: "Limited public profile information",
            },
            work_experience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  company_name: {
                    type: "string",
                    example: "Tech Corp",
                    description: "Company name",
                  },
                  designation: {
                    type: "string",
                    example: "Senior Developer",
                    description: "Job designation",
                  },
                  start_date: {
                    type: "string",
                    format: "date",
                    example: "2022-01-01",
                    description: "Employment start date",
                  },
                  end_date: {
                    type: "string",
                    format: "date",
                    example: "2024-01-01",
                    description: "Employment end date",
                    nullable: true,
                  },
                  duration: {
                    type: "string",
                    example: "2 years 3 months",
                    description: "Calculated work duration",
                  },
                },
              },
              description: "Public work experience information",
            },
          },
        },
        PublicProfileResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Public profile retrieved successfully",
            },
            data: {
              $ref: "#/components/schemas/PublicProfile",
            },
          },
        },
        // Aadhaar Verification Schemas
        AadhaarZIPVerificationRequest: {
          type: "object",
          required: ["zipFile", "shareCode"],
          properties: {
            zipFile: {
              type: "string",
              format: "binary",
              description:
                "ZIP file containing Aadhaar XML and certificate files",
              example: "ZIP file upload",
            },
            shareCode: {
              type: "string",
              pattern: "^[0-9]{4}$",
              description: "4-digit share code for decryption",
              example: "1234",
            },
          },
        },
        AadhaarNumberValidationRequest: {
          type: "object",
          required: ["aadhaarNumber"],
          properties: {
            aadhaarNumber: {
              type: "string",
              pattern: "^[0-9]{4}\\s?[0-9]{4}\\s?[0-9]{4}$",
              description: "12-digit Aadhaar number (with or without spaces)",
              example: "1234 5678 9012",
            },
          },
        },
        AadhaarVerificationResult: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            requestId: {
              type: "string",
              format: "uuid",
              example: "req-12345-uuid",
            },
            verificationId: {
              type: "string",
              format: "uuid",
              example: "verification-12345-uuid",
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
              example: true,
            },
            timestampValid: {
              type: "boolean",
              example: true,
            },
            checksumValid: {
              type: "boolean",
              example: true,
            },
            verificationTime: {
              type: "string",
              format: "date-time",
              example: "2024-01-15T10:30:00.000Z",
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
                  signatureValid: { type: "boolean", nullable: true },
                  timestampValid: { type: "boolean", nullable: true },
                  checksumValid: { type: "boolean", nullable: true },
                  verificationTime: { type: "string", format: "date-time" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
            total: { type: "integer", example: 25 },
            limit: { type: "integer", example: 10 },
            offset: { type: "integer", example: 0 },
          },
        },
        AadhaarErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            requestId: {
              type: "string",
              format: "uuid",
            },
            message: {
              type: "string",
              example: "Validation failed",
            },
            error: {
              type: "string",
              example: "Invalid XML format",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string", example: "xmlData" },
                  message: { type: "string", example: "XML data is required" },
                },
              },
            },
          },
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Project ID" },
            title: { type: "string", example: "E-commerce Website", description: "Project title" },
            description: { type: "string", example: "Full-stack e-commerce platform", description: "Project description" },
            technologies: { type: "string", example: "React, Node.js, MongoDB", description: "Technologies used" },
            duration: { type: "string", example: "6 months", description: "Project duration" },
            role: { type: "string", example: "Full Stack Developer", description: "Role in project" },
            work_profile_id: { type: "integer", example: 1, description: "Associated work profile ID" },
            created_at: { type: "string", format: "date-time", description: "Creation timestamp" },
            updated_at: { type: "string", format: "date-time", description: "Last update timestamp" },
          },
        },
        SessionLog: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Session log ID" },
            user_id: { type: "integer", example: 1, description: "User ID" },
            session_id: { type: "string", example: "sess_12345", description: "Session identifier" },
            ip_address: { type: "string", example: "192.168.1.1", description: "IP address" },
            user_agent: { type: "string", example: "Mozilla/5.0...", description: "User agent string" },
            login_time: { type: "string", format: "date-time", description: "Login timestamp" },
            logout_time: { type: "string", format: "date-time", description: "Logout timestamp" },
            is_active: { type: "boolean", example: true, description: "Session active status" },
            created_at: { type: "string", format: "date-time", description: "Creation timestamp" },
            updated_at: { type: "string", format: "date-time", description: "Last update timestamp" },
          },
        },
        TokenBlacklist: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Blacklist entry ID" },
            token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", description: "Blacklisted token" },
            user_id: { type: "integer", example: 1, description: "User ID" },
            reason: { type: "string", example: "logout", description: "Blacklist reason" },
            expires_at: { type: "string", format: "date-time", description: "Token expiration time" },
            created_at: { type: "string", format: "date-time", description: "Creation timestamp" },
          },
        },
        UserSkillReview: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Review ID" },
            user_skill_id: { type: "integer", example: 1, description: "User skill ID" },
            reviewer_id: { type: "integer", example: 2, description: "Reviewer user ID" },
            rating: { type: "integer", example: 4, description: "Skill rating (1-5)" },
            comment: { type: "string", example: "Great JavaScript skills!", description: "Review comment" },
            created_at: { type: "string", format: "date-time", description: "Creation timestamp" },
            updated_at: { type: "string", format: "date-time", description: "Last update timestamp" },
          },
        },
        AadhaarVerificationLog: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Log entry ID" },
            verification_id: { type: "integer", example: 1, description: "Verification ID" },
            action: { type: "string", example: "verification_started", description: "Action performed" },
            details: { type: "string", example: "ZIP file uploaded", description: "Action details" },
            ip_address: { type: "string", example: "192.168.1.1", description: "IP address" },
            user_agent: { type: "string", example: "Mozilla/5.0...", description: "User agent" },
            created_at: { type: "string", format: "date-time", description: "Creation timestamp" },
          },
        },
        DeviceToken: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Device token ID" },
            user_id: { type: "integer", example: 1, description: "User ID" },
            token: { type: "string", example: "fcm_token_123", description: "FCM device token" },
            platform: { type: "string", enum: ["android", "ios", "web"], description: "Device platform" },
            is_active: { type: "boolean", example: true, description: "Token active status" },
            last_used: { type: "string", format: "date-time", description: "Last used timestamp" },
            created_at: { type: "string", format: "date-time", description: "Creation timestamp" },
            updated_at: { type: "string", format: "date-time", description: "Last update timestamp" },
          },
        },
        ConversationMember: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Member ID" },
            conversation_id: { type: "integer", example: 1, description: "Conversation ID" },
            user_id: { type: "integer", example: 1, description: "User ID" },
            role: { type: "string", enum: ["admin", "member"], example: "member", description: "Member role" },
            joined_at: { type: "string", format: "date-time", description: "Join timestamp" },
            left_at: { type: "string", format: "date-time", description: "Leave timestamp" },
            is_active: { type: "boolean", example: true, description: "Member active status" },
            created_at: { type: "string", format: "date-time", description: "Creation timestamp" },
            updated_at: { type: "string", format: "date-time", description: "Last update timestamp" },
          },
        },
        MessageStatus: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Status ID" },
            message_id: { type: "integer", example: 1, description: "Message ID" },
            user_id: { type: "integer", example: 1, description: "User ID" },
            status: { type: "string", enum: ["sent", "delivered", "read"], example: "read", description: "Message status" },
            timestamp: { type: "string", format: "date-time", description: "Status timestamp" },
            created_at: { type: "string", format: "date-time", description: "Creation timestamp" },
            updated_at: { type: "string", format: "date-time", description: "Last update timestamp" },
          },
        },
        TypingStatus: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Typing status ID" },
            conversation_id: { type: "integer", example: 1, description: "Conversation ID" },
            user_id: { type: "integer", example: 1, description: "User ID" },
            is_typing: { type: "boolean", example: true, description: "Typing status" },
            last_seen: { type: "string", format: "date-time", description: "Last seen timestamp" },
            created_at: { type: "string", format: "date-time", description: "Creation timestamp" },
            updated_at: { type: "string", format: "date-time", description: "Last update timestamp" },
          },
        },
        ReferralLog: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Referral log ID" },
            referrer_id: { type: "integer", example: 1, description: "Referrer user ID" },
            referee_id: { type: "integer", example: 2, description: "Referee user ID (the one who was referred)" },
            status: { type: "string", enum: ["signed_up", "verified", "completed"], example: "signed_up", description: "Referral status" },
            created_at: { type: "string", format: "date-time", description: "Creation timestamp" },
          },
        },
        // Feed Schemas
        FeedPost: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Feed post ID" },
            user_id: { type: "integer", example: 1, description: "ID of the user who created the post" },
            content: { 
              type: "string", 
              example: "Just completed an amazing React project! 🚀", 
              description: "Post content (1-5000 characters)",
              minLength: 1,
              maxLength: 5000
            },
            is_pinned: { type: "boolean", example: false, description: "Whether this post is pinned by the user" },
            is_featured: { type: "boolean", example: false, description: "Whether this post is featured by admin" },
            engagement_score: { type: "number", example: 85.5, description: "Calculated engagement score for ranking" },
            view_count: { type: "integer", example: 150, description: "Total number of views" },
            like_count: { type: "integer", example: 25, description: "Total number of likes" },
            comment_count: { type: "integer", example: 8, description: "Total number of comments" },
            share_count: { type: "integer", example: 3, description: "Total number of shares" },
            status: { 
              type: "string", 
              enum: ["active", "hidden", "deleted"],
              example: "active",
              description: "Post status"
            },
            created_at: { type: "string", format: "date-time", description: "Creation timestamp" },
            updated_at: { type: "string", format: "date-time", description: "Last update timestamp" },
            user: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                name: { type: "string", example: "John Doe" },
                email: { type: "string", example: "john@example.com" },
                profile: {
                  type: "object",
                  properties: {
                    image_path: { type: "string", example: "images/profile.jpg" },
                    image_url: { type: "string", example: "http://localhost:3000/api/files/images/profile.jpg" },
                    bio: { type: "string", example: "Software Developer" }
                  }
                }
              }
            },
            attachments: {
              type: "array",
              items: { $ref: "#/components/schemas/FeedAttachment" },
              description: "Media attachments for the post"
            }
          },
        },
        FeedAttachment: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Attachment ID" },
            feed_post_id: { type: "integer", example: 1, description: "Feed post ID" },
            file_path: { type: "string", example: "images/attachment.jpg", description: "Relative path to the file" },
            file_name: { type: "string", example: "my-photo.jpg", description: "Original filename" },
            file_type: { 
              type: "string", 
              enum: ["image", "video", "document", "audio"],
              example: "image",
              description: "Type of file"
            },
            mime_type: { type: "string", example: "image/jpeg", description: "MIME type of the file" },
            file_size: { type: "integer", example: 1024000, description: "File size in bytes" },
            thumbnail_path: { type: "string", example: "thumbnails/thumb.jpg", description: "Path to thumbnail" },
            duration: { type: "integer", example: 120, description: "Duration in seconds for videos/audio" },
            width: { type: "integer", example: 1920, description: "Width in pixels for images/videos" },
            height: { type: "integer", example: 1080, description: "Height in pixels for images/videos" },
            url: { type: "string", example: "http://localhost:3000/api/files/images/attachment.jpg", description: "Full URL to access the file" },
            thumbnail_url: { type: "string", example: "http://localhost:3000/api/files/thumbnails/thumb.jpg", description: "Full URL to access the thumbnail" },
            created_at: { type: "string", format: "date-time", description: "Upload timestamp" }
          },
        },
        FeedLike: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Like ID" },
            feed_post_id: { type: "integer", example: 1, description: "Feed post ID" },
            user_id: { type: "integer", example: 1, description: "User ID who liked the post" },
            like_type: { 
              type: "string", 
              enum: ["like", "love", "laugh", "wow", "sad", "angry"],
              example: "like",
              description: "Type of reaction"
            },
            created_at: { type: "string", format: "date-time", description: "Like timestamp" },
            user: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                name: { type: "string", example: "Jane Doe" },
                profile: {
                  type: "object",
                  properties: {
                    image_url: { type: "string", example: "http://localhost:3000/api/files/images/jane.jpg" }
                  }
                }
              }
            }
          },
        },
        FeedComment: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1, description: "Comment ID" },
            feed_post_id: { type: "integer", example: 1, description: "Feed post ID" },
            user_id: { type: "integer", example: 1, description: "User ID who commented" },
            parent_comment_id: { type: "integer", example: null, description: "Parent comment ID for replies" },
            content: { 
              type: "string", 
              example: "Great post! Really helpful information.",
              description: "Comment content (1-1000 characters)",
              minLength: 1,
              maxLength: 1000
            },
            is_edited: { type: "boolean", example: false, description: "Whether this comment has been edited" },
            like_count: { type: "integer", example: 5, description: "Number of likes on this comment" },
            reply_count: { type: "integer", example: 2, description: "Number of replies to this comment" },
            status: { 
              type: "string", 
              enum: ["active", "hidden", "deleted"],
              example: "active",
              description: "Comment status"
            },
            created_at: { type: "string", format: "date-time", description: "Comment timestamp" },
            updated_at: { type: "string", format: "date-time", description: "Last update timestamp" },
            user: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                name: { type: "string", example: "Alice Smith" },
                email: { type: "string", example: "alice@example.com" },
                profile: {
                  type: "object",
                  properties: {
                    image_path: { type: "string", example: "uploads/images/alice.jpg", description: "Relative path to the profile image" },
                    image_url: { type: "string", example: "http://localhost:3000/api/files/uploads/images/alice.jpg", description: "Full URL to access the profile image" }
                  }
                }
              }
            },
            replies: {
              type: "array",
              items: { $ref: "#/components/schemas/FeedComment" },
              description: "Replies to this comment"
            }
          },
        },
        FeedPostCreation: {
          type: "object",
          required: ["content"],
          properties: {
            content: { 
              type: "string", 
              example: "Just completed an amazing React project! 🚀",
              description: "Post content (1-5000 characters)",
              minLength: 1,
              maxLength: 5000
            }
          },
        },
        FeedResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Feed retrieved successfully" },
            data: {
              type: "object",
              properties: {
                posts: {
                  type: "array",
                  items: { $ref: "#/components/schemas/FeedPost" },
                  description: "Array of feed posts"
                },
                pagination: {
                  type: "object",
                  properties: {
                    page: { type: "integer", example: 1, description: "Current page number" },
                    limit: { type: "integer", example: 20, description: "Number of posts per page" },
                    total: { type: "integer", example: 150, description: "Total number of posts" },
                    hasMore: { type: "boolean", example: true, description: "Whether there are more posts" }
                  }
                }
              }
            }
          },
        },
        FeedPostResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Feed post created successfully" },
            data: { $ref: "#/components/schemas/FeedPost" }
          },
        },
        FeedLikeRequest: {
          type: "object",
          properties: {
            like_type: { 
              type: "string", 
              enum: ["like", "love", "laugh", "wow", "sad", "angry"],
              example: "like",
              description: "Type of reaction"
            }
          },
        },
        FeedCommentRequest: {
          type: "object",
          required: ["content"],
          properties: {
            content: { 
              type: "string", 
              example: "Great post! Really helpful information.",
              description: "Comment content (1-1000 characters)",
              minLength: 1,
              maxLength: 1000
            },
            parent_comment_id: { 
              type: "integer", 
              example: null,
              description: "Parent comment ID for replies"
            }
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: { type: "integer", example: 123, description: "Notification ID" },
            user_id: { type: "integer", example: 1, description: "User ID receiving the notification" },
            message_id: { type: "integer", example: 456, description: "Message ID (if applicable)" },
            conversation_id: { type: "integer", example: 789, description: "Conversation ID (if applicable)" },
            post_id: { type: "integer", example: 12, description: "Post ID (if applicable)" },
            type: { 
              type: "string", 
              enum: ["message", "mention", "group_invite", "system", "post"],
              example: "post",
              description: "Notification type"
            },
            title: { type: "string", example: "New Post Available!", description: "Notification title" },
            body: { type: "string", example: "A new post has been created", description: "Notification body text" },
            data: { 
              type: "object", 
              example: { post_id: 12, post_title: "Sample Post" },
              description: "Additional notification data"
            },
            is_seen: { type: "boolean", example: false, description: "Whether notification has been seen" },
            is_read: { type: "boolean", example: false, description: "Whether notification has been read" },
            seen_at: { 
              type: "string", 
              format: "date-time", 
              example: null,
              description: "When notification was seen"
            },
            read_at: { 
              type: "string", 
              format: "date-time", 
              example: null,
              description: "When notification was read"
            },
            push_sent: { type: "boolean", example: true, description: "Whether push notification was sent" },
            push_sent_at: { 
              type: "string", 
              format: "date-time", 
              example: "2024-01-01T10:30:00.000Z",
              description: "When push notification was sent"
            },
            created_at: { 
              type: "string", 
              format: "date-time", 
              example: "2024-01-01T10:00:00.000Z",
              description: "When notification was created"
            },
            updated_at: { 
              type: "string", 
              format: "date-time", 
              example: "2024-01-01T10:00:00.000Z",
              description: "When notification was last updated"
            },
            post: {
              type: "object",
              description: "Associated post details (if type is 'post')",
              properties: {
                id: { type: "integer", example: 12 },
                title: { type: "string", example: "Looking for React Developer" },
                description: { type: "string", example: "Need help with React project" },
                medium: { type: "string", enum: ["online", "offline"], example: "online" },
                status: { type: "string", example: "active" },
                user: {
                  type: "object",
                  properties: {
                    id: { type: "integer", example: 2 },
                    name: { type: "string", example: "Jane Smith" }
                  }
                },
                requiredSkill: {
                  type: "object",
                  properties: {
                    id: { type: "integer", example: 1 },
                    name: { type: "string", example: "React" }
                  }
                }
              }
            },
            message: {
              type: "object",
              description: "Associated message details (if type is 'message')",
              properties: {
                id: { type: "integer", example: 456 },
                content: { type: "string", example: "Hello there!" },
                sender: {
                  type: "object",
                  properties: {
                    id: { type: "integer", example: 3 },
                    name: { type: "string", example: "Bob Wilson" }
                  }
                }
              }
            },
            conversation: {
              type: "object",
              description: "Associated conversation details (if applicable)",
              properties: {
                id: { type: "integer", example: 789 },
                name: { type: "string", example: "Project Discussion" },
                type: { type: "string", example: "group" }
              }
            }
          },
        },
        NotificationsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Notifications retrieved successfully" },
            data: {
              type: "object",
              properties: {
                notifications: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Notification" }
                },
                pagination: {
                  type: "object",
                  properties: {
                    currentPage: { type: "integer", example: 1, description: "Current page number" },
                    totalPages: { type: "integer", example: 5, description: "Total number of pages" },
                    totalNotifications: { type: "integer", example: 85, description: "Total number of notifications" },
                    hasNextPage: { type: "boolean", example: true, description: "Whether there are more pages" },
                    hasPreviousPage: { type: "boolean", example: false, description: "Whether there are previous pages" },
                    limit: { type: "integer", example: 20, description: "Number of notifications per page" }
                  }
                },
                unreadCount: { type: "integer", example: 12, description: "Number of unread notifications" }
              }
            }
          },
        },
      },
    },
    tags: [
      {
        name: "Users",
        description:
          "User management operations including enhanced profile management with addresses and temporary addresses",
      },
      {
        name: "Skills",
        description: "Skills and sub-skills management operations",
      },
      {
        name: "Posts",
        description: "Post management operations",
      },
      {
        name: "Aadhaar Verification",
        description: "Offline Aadhaar verification APIs",
      },
      {
        name: "Feed",
        description: "Social feed operations including posts, likes, comments, shares, and trending content",
      },
      {
        name: "Feedback",
        description: "User feedback submission and management",
      },
    ],
    paths: {
      "/users/register": {
        post: {
          summary: "Register a new user",
          description: "Create a new user account with validation. Optionally accepts a referral code from an existing user. Upon successful registration, a unique referral code is automatically generated for the new user. If a user with the same email was previously soft deleted within 90 days, the account will be reactivated instead of creating a new one. If the user was deleted more than 90 days ago, the old account will be permanently deleted and a new one will be created.",
          tags: ["Users"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UserRegistration",
                },
                examples: {
                  valid: {
                    summary: "Valid registration",
                    value: {
                      name: "John Doe",
                      email: "john.doe@example.com",
                      password: "TestPass123!",
                    },
                  },
                  with_referral: {
                    summary: "Registration with referral code",
                    value: {
                      name: "Jane Smith",
                      email: "jane.smith@example.com",
                      password: "TestPass123!",
                      referred_by: "ABC123",
                    },
                  },
                  invalid_name: {
                    summary: "Invalid name (too short)",
                    value: {
                      name: "J",
                      email: "john.doe@example.com",
                      password: "TestPass123!",
                    },
                  },
                  invalid_email: {
                    summary: "Invalid email format",
                    value: {
                      name: "John Doe",
                      email: "invalid-email",
                      password: "TestPass123!",
                    },
                  },
                  invalid_password: {
                    summary: "Invalid password (missing special character)",
                    value: {
                      name: "John Doe",
                      email: "john.doe@example.com",
                      password: "TestPass123",
                    },
                  },
                  invalid_referral: {
                    summary: "Invalid referral code (wrong length)",
                    value: {
                      name: "John Doe",
                      email: "john.doe@example.com",
                      password: "TestPass123!",
                      referred_by: "ABC",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "User registered successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean",
                        example: true,
                      },
                      message: {
                        type: "string",
                        example: "User registered successfully",
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
                  examples: {
                    name_validation: {
                      summary: "Name validation error",
                      value: {
                        success: false,
                        message: "Validation failed",
                        errors: [
                          {
                            field: "name",
                            message: "Name must be between 2 and 50 characters",
                            value: "J",
                          },
                        ],
                      },
                    },
                    email_validation: {
                      summary: "Email validation error",
                      value: {
                        success: false,
                        message: "Validation failed",
                        errors: [
                          {
                            field: "email",
                            message: "Please provide a valid email address",
                            value: "invalid-email",
                          },
                        ],
                      },
                    },
                    password_validation: {
                      summary: "Password validation error",
                      value: {
                        success: false,
                        message: "Validation failed",
                        errors: [
                          {
                            field: "password",
                            message:
                              "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
                            value: "weak",
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
            409: {
              description: "User with this email already exists",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  example: {
                    success: false,
                    message: "User with this email already exists",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/users/login": {
        post: {
          summary: "Login user",
          description: "Authenticate user with email and password",
          tags: ["Users"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UserLogin",
                },
                examples: {
                  valid: {
                    summary: "Valid login",
                    value: {
                      email: "john.doe@example.com",
                      password: "TestPass123!",
                    },
                  },
                  invalid_email: {
                    summary: "Invalid email format",
                    value: {
                      email: "invalid-email",
                      password: "TestPass123!",
                    },
                  },
                  missing_password: {
                    summary: "Missing password",
                    value: {
                      email: "john.doe@example.com",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/LoginResponse",
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
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  example: {
                    success: false,
                    message: "Invalid email or password",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/users/refresh-token": {
        post: {
          summary: "Refresh access token",
          description: "Get a new access token using refresh token from cookie",
          tags: ["Users"],
          responses: {
            200: {
              description: "Token refreshed successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean",
                        example: true,
                      },
                      message: {
                        type: "string",
                        example: "Token refreshed successfully",
                      },
                      data: {
                        type: "object",
                        properties: {
                          accessToken: {
                            type: "string",
                            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                            description: "New access token (15 minutes expiry)",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Invalid or expired refresh token",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/users/logout": {
        post: {
          summary: "Logout user",
          description: "Logout user and invalidate tokens",
          tags: ["Users"],
          security: [
            {
              bearerAuth: [],
            },
          ],
          responses: {
            200: {
              description: "Logout successful",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean",
                        example: true,
                      },
                      message: {
                        type: "string",
                        example: "Logout successful",
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
            500: {
              description: "Internal server error",
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
      "/users/change-password": {
        post: {
          summary: "Change user password",
          description: "Change password for an existing user by providing email and new password",
          tags: ["Users"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ChangePassword",
                },
                examples: {
                  valid: {
                    summary: "Valid password change",
                    value: {
                      email: "john.doe@example.com",
                      new_password: "NewSecureP@ssw0rd123",
                    },
                  },
                  invalid_email: {
                    summary: "Invalid email format",
                    value: {
                      email: "invalid-email",
                      new_password: "NewSecureP@ssw0rd123",
                    },
                  },
                  weak_password: {
                    summary: "Weak password",
                    value: {
                      email: "john.doe@example.com",
                      new_password: "weak",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Password changed successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ChangePasswordResponse",
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
              description: "User not found",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  example: {
                    success: false,
                    message: "User with this email does not exist, please register yourself",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/notifications/token": {
        post: {
          summary: "Save or update device FCM token",
          description:
            "Stores the Firebase Cloud Messaging registration token for the authenticated user",
          tags: ["Notifications"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["fcmToken"],
                  properties: {
                    fcmToken: {
                      type: "string",
                      description: "FCM registration token",
                      example: "e6j...xyz",
                    },
                    platform: {
                      type: "string",
                      enum: ["ios", "android", "web", "unknown"],
                      example: "android",
                    },
                    deviceInfo: { type: "object", additionalProperties: true },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Token saved",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      id: { type: "integer", example: 123 },
                    },
                  },
                },
              },
            },
            400: { description: "Bad request" },
            401: { description: "Unauthorized" },
            500: { description: "Server error" },
          },
        },
      },
      "/notifications/test": {
        post: {
          summary: "Send a test push notification",
          description:
            "Sends a test FCM notification to the specified userId or the authenticated user",
          tags: ["Notifications"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    userId: { type: "integer", example: 1 },
                    title: { type: "string", example: "Test" },
                    body: { type: "string", example: "Test notification" },
                    data: {
                      type: "object",
                      additionalProperties: { type: "string" },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Push send result",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      successCount: { type: "integer", example: 1 },
                      failureCount: { type: "integer", example: 0 },
                    },
                  },
                },
              },
            },
            400: { description: "Bad request" },
            401: { description: "Unauthorized" },
            500: { description: "Server error" },
          },
        },
      },
      "/notifications": {
        get: {
          summary: "Get user notifications",
          description:
            "Retrieve paginated notifications for the authenticated user with optional filtering by type",
          tags: ["Notifications"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              description: "Page number for pagination",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                default: 1,
                example: 1,
              },
            },
            {
              name: "limit",
              in: "query",
              description: "Number of notifications per page (max 50)",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 50,
                default: 20,
                example: 20,
              },
            },
            {
              name: "type",
              in: "query",
              description: "Filter notifications by type",
              required: false,
              schema: {
                type: "string",
                enum: ["message", "mention", "group_invite", "system", "post"],
                example: "post",
              },
            },
          ],
          responses: {
            200: {
              description: "Notifications retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/NotificationsResponse",
                  },
                },
              },
            },
            400: { description: "Bad request" },
            401: { description: "Unauthorized" },
            500: { description: "Server error" },
          },
        },
      },
      "/notifications/{id}/read": {
        put: {
          summary: "Mark notification as read",
          description: "Mark a specific notification as read for the authenticated user",
          tags: ["Notifications"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              description: "Notification ID",
              required: true,
              schema: {
                type: "integer",
                minimum: 1,
                example: 123,
              },
            },
          ],
          responses: {
            200: {
              description: "Notification marked as read successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Notification marked as read" },
                      data: { $ref: "#/components/schemas/Notification" },
                    },
                  },
                },
              },
            },
            404: { description: "Notification not found" },
            401: { description: "Unauthorized" },
            500: { description: "Server error" },
          },
        },
      },
      "/notifications/read-all": {
        put: {
          summary: "Mark all notifications as read",
          description: "Mark all unread notifications as read for the authenticated user",
          tags: ["Notifications"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "All notifications marked as read successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "All notifications marked as read" },
                    },
                  },
                },
              },
            },
            401: { description: "Unauthorized" },
            500: { description: "Server error" },
          },
        },
      },
      "/feedback": {
        post: {
          summary: "Submit feedback",
          description: "Submit user feedback for bugs, feature requests, suggestions, or general feedback",
          tags: ["Feedback"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Feedback",
                },
                examples: {
                  bug_report: {
                    summary: "Bug report",
                    value: {
                      type: "bug",
                      subject: "App crashes on login",
                      message: "The app crashes every time I try to login with my email. This happens on both Android and iOS devices.",
                      rating: 2
                    },
                  },
                  feature_request: {
                    summary: "Feature request",
                    value: {
                      type: "feature_request",
                      subject: "Add dark mode support",
                      message: "It would be great to have a dark mode option for the app. Many users prefer dark themes, especially for night usage.",
                      rating: 5
                    },
                  },
                  general_feedback: {
                    summary: "General feedback",
                    value: {
                      type: "general",
                      subject: "Great app overall",
                      message: "I really enjoy using this app. The interface is clean and the features are useful. Keep up the good work!",
                      rating: 4
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Feedback submitted successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/FeedbackResponse",
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
            401: { description: "Unauthorized" },
            500: { description: "Server error" },
          },
        },
      },
      "/skills": {
        get: {
          summary: "Get all skills with sub-skills",
          description:
            "Retrieve all skills along with their associated sub-skills",
          tags: ["Skills"],
          security: [
            {
              bearerAuth: [],
            },
          ],
          responses: {
            200: {
              description: "Skills retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/SkillsResponse",
                  },
                  example: {
                    success: true,
                    message: "Skills retrieved successfully",
                    data: [
                      {
                        id: 1,
                        name: "Programming",
                        description: "Software development skills",
                        subSkills: [
                          {
                            id: 1,
                            name: "JavaScript",
                            description: "Web development language",
                          },
                          {
                            id: 2,
                            name: "Python",
                            description: "General-purpose programming language",
                          },
                        ],
                      },
                      {
                        id: 2,
                        name: "Design",
                        description: "Creative design skills",
                        subSkills: [
                          {
                            id: 3,
                            name: "UI/UX Design",
                            description: "User interface and experience design",
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/skills/{id}": {
        get: {
          summary: "Get skill by ID",
          description:
            "Retrieve a specific skill by ID along with its sub-skills",
          tags: ["Skills"],
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Skill ID",
              schema: {
                type: "integer",
                example: 1,
              },
            },
          ],
          responses: {
            200: {
              description: "Skill retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: {
                        type: "string",
                        example: "Skill retrieved successfully",
                      },
                      data: {
                        $ref: "#/components/schemas/Skill",
                      },
                    },
                  },
                  example: {
                    success: true,
                    message: "Skill retrieved successfully",
                    data: {
                      id: 1,
                      name: "Programming",
                      description: "Software development skills",
                      subSkills: [
                        {
                          id: 1,
                          name: "JavaScript",
                          description: "Web development language",
                        },
                        {
                          id: 2,
                          name: "Python",
                          description: "General-purpose programming language",
                        },
                      ],
                    },
                  },
                },
              },
            },
            401: {
              description: "Unauthorized - Invalid or missing access token",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  examples: {
                    missing_token: {
                      summary: "Missing access token",
                      value: {
                        success: false,
                        message: "Access token required",
                      },
                    },
                    invalid_token: {
                      summary: "Invalid access token",
                      value: {
                        success: false,
                        message: "Invalid access token",
                      },
                    },
                    expired_token: {
                      summary: "Expired access token",
                      value: {
                        success: false,
                        message: "Access token expired",
                      },
                    },
                    revoked_token: {
                      summary: "Revoked access token",
                      value: {
                        success: false,
                        message: "Token has been revoked",
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: "Skill not found",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  example: {
                    success: false,
                    message: "Skill not found",
                  },
                },
              },
            },
            401: {
              description: "Unauthorized - Invalid or missing access token",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  examples: {
                    missing_token: {
                      summary: "Missing access token",
                      value: {
                        success: false,
                        message: "Access token required",
                      },
                    },
                    invalid_token: {
                      summary: "Invalid access token",
                      value: {
                        success: false,
                        message: "Invalid access token",
                      },
                    },
                    expired_token: {
                      summary: "Expired access token",
                      value: {
                        success: false,
                        message: "Access token expired",
                      },
                    },
                    revoked_token: {
                      summary: "Revoked access token",
                      value: {
                        success: false,
                        message: "Token has been revoked",
                      },
                    },
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/skills/sub-skills/all": {
        get: {
          summary: "Get all sub-skills",
          description:
            "Retrieve all sub-skills with their parent skill information",
          tags: ["Skills"],
          security: [
            {
              bearerAuth: [],
            },
          ],
          responses: {
            200: {
              description: "Sub-skills retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/SubSkillsResponse",
                  },
                  example: {
                    success: true,
                    message: "Sub-skills retrieved successfully",
                    data: [
                      {
                        id: 1,
                        name: "JavaScript",
                        description: "Web development language",
                        skill_id: 1,
                        skill: {
                          id: 1,
                          name: "Programming",
                          description: "Software development skills",
                        },
                      },
                      {
                        id: 2,
                        name: "Python",
                        description: "General-purpose programming language",
                        skill_id: 1,
                        skill: {
                          id: 1,
                          name: "Programming",
                          description: "Software development skills",
                        },
                      },
                    ],
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/skills/sub-skills/{skillId}": {
        get: {
          summary: "Get sub-skills by skill ID",
          description: "Retrieve all sub-skills for a specific skill ID",
          tags: ["Skills"],
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: "skillId",
              in: "path",
              required: true,
              description: "Skill ID to get sub-skills for",
              schema: {
                type: "integer",
                example: 1,
              },
            },
          ],
          responses: {
            200: {
              description: "Sub-skills retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/SubSkillsResponse",
                  },
                  example: {
                    success: true,
                    message: "Sub-skills retrieved successfully",
                    data: [
                      {
                        id: 1,
                        name: "JavaScript",
                        description: "Web development language",
                        skill_id: 1,
                        skill: {
                          id: 1,
                          name: "Programming",
                          description: "Software development skills",
                        },
                      },
                      {
                        id: 2,
                        name: "Python",
                        description: "General-purpose programming language",
                        skill_id: 1,
                        skill: {
                          id: 1,
                          name: "Programming",
                          description: "Software development skills",
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: {
              description: "Unauthorized - Invalid or missing access token",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  examples: {
                    missing_token: {
                      summary: "Missing access token",
                      value: {
                        success: false,
                        message: "Access token required",
                      },
                    },
                    invalid_token: {
                      summary: "Invalid access token",
                      value: {
                        success: false,
                        message: "Invalid access token",
                      },
                    },
                    expired_token: {
                      summary: "Expired access token",
                      value: {
                        success: false,
                        message: "Access token expired",
                      },
                    },
                    revoked_token: {
                      summary: "Revoked access token",
                      value: {
                        success: false,
                        message: "Token has been revoked",
                      },
                    },
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/users/profile": {
        get: {
          summary: "Get current user profile",
          description:
            "Retrieve complete profile data including personal and work information for the authenticated user",
          tags: ["Users"],
          security: [
            {
              bearerAuth: [],
            },
          ],
          responses: {
            200: {
              description: "Profile retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ProfileResponse",
                  },
                  example: {
                    success: true,
                    message: "Profile retrieved successfully",
                    data: {
                      id: 1,
                      name: "John Doe",
                      email: "john.doe@example.com",
                      referral_code: "ABC123",
                      referred_user_count: 5,
                      created_at: "2024-01-01T00:00:00.000Z",
                      updated_at: "2024-01-01T00:00:00.000Z",
                      profile: {
                        id: 1,
                        phone: "+1234567890",
                        dob: "1990-01-01",
                        gender: "Male",
                        bio: "Software engineer with 5+ years of experience in web development",
                        image_path: "/uploads/profiles/john_doe_profile.jpg",
                        image_url:
                          "http://example.com/uploads/images/21be627b-7b01-424a-a0cd-13f31d312eb5.png",
                        looking_skills: [
                          { id: 1, name: "JavaScript" },
                          { id: 3, name: "React" },
                          { id: 5, name: "Node.js" },
                        ],
                        created_at: "2024-01-01T00:00:00.000Z",
                        updated_at: "2024-01-01T00:00:00.000Z",
                      },
                      work_profiles: [
                        {
                          id: 1,
                          company_name: "Tech Corp",
                          designation: "Senior Developer",
                          start_date: "2022-01-01",
                          end_date: null,
                          created_at: "2024-01-01T00:00:00.000Z",
                          updated_at: "2024-01-01T00:00:00.000Z",
                          userSkills: [
                            {
                              id: 1,
                              proficiency_level: "Expert",
                              created_at: "2024-01-01T00:00:00.000Z",
                              updated_at: "2024-01-01T00:00:00.000Z",
                              skill: {
                                id: 1,
                                name: "Programming",
                                description: "Software development skills",
                              },
                              subSkill: {
                                id: 1,
                                name: "JavaScript",
                                description: "Web development language",
                              },
                            },
                          ],
                        },
                      ],
                      addresses: [
                        {
                          id: 1,
                          street: "123 Main St",
                          city: "New York",
                          state: "NY",
                          zip_code: "10001",
                          country: "USA",
                          type: "home",
                          created_at: "2024-01-01T00:00:00.000Z",
                          updated_at: "2024-01-01T00:00:00.000Z",
                        },
                      ],
                      temp_addresses: [
                        {
                          id: 1,
                          location_data: "GPS: 28.6139,77.2090",
                          pincode: "110001",
                          selected_area: "Connaught Place",
                          city: "New Delhi",
                          state: "Delhi",
                          country: "India",
                          location_permission: true,
                          is_active: true,
                          expires_at: "2024-02-01T00:00:00.000Z",
                          created_at: "2024-01-01T00:00:00.000Z",
                          updated_at: "2024-01-01T00:00:00.000Z",
                        },
                      ],
                      notification_settings: {
                        id: 1,
                        push_notification: true,
                        general_notification: true,
                        skill_exchange_notification: true,
                        message_notification: true,
                        marketing_notification: false,
                        created_at: "2024-01-01T00:00:00.000Z",
                        updated_at: "2024-01-01T00:00:00.000Z",
                      },
                      posts: [
                        {
                          id: 1,
                          title: "Need help with React project",
                          description:
                            "Looking for someone to help with a React.js project...",
                          medium: "online",
                          status: "active",
                          deadline: "2024-02-01",
                          created_at: "2024-01-01T00:00:00.000Z",
                          updated_at: "2024-01-01T00:00:00.000Z",
                          requiredSkill: {
                            id: 1,
                            name: "Programming",
                            description: "Software development skills",
                          },
                          requiredSubSkill: {
                            id: 2,
                            name: "React.js",
                            description: "React JavaScript library",
                          },
                          attachments: [
                            {
                              id: 1,
                              file_path: "/uploads/documents/requirements.pdf",
                              file_name: "requirements.pdf",
                              mime_type: "application/pdf",
                              uploaded_at: "2024-01-01T00:00:00.000Z",
                            },
                          ],
                        },
                      ],
                      terms_accepted: true,
                      terms_version: "1.0",
                      terms_accepted_at: "2025-10-07T14:30:00.000Z",
                    },
                  },
                },
              },
            },
            401: {
              description: "Unauthorized - Invalid or missing access token",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
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
            500: {
              description: "Internal server error",
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
          summary: "Update user profile",
          description:
            "Update profile information including basic details, addresses, temporary addresses, work profiles with skills, and notification settings. At least one field must be provided. All fields are optional but cannot be empty, null, or undefined if provided. Addresses, temp_addresses, and work_profiles completely replace existing data when provided. Notification settings can be updated individually or all together.",
          tags: ["Users"],
          security: [
            {
              bearerAuth: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateProfileRequest",
                },
                examples: {
                  single_field_update: {
                    summary: "Update single field (name)",
                    value: {
                      name: "John Smith",
                    },
                  },
                  multiple_fields_update: {
                    summary: "Update multiple fields",
                    value: {
                      name: "John Smith",
                      email: "john.smith@example.com",
                      phone: "+1234567890",
                      dob: "1990-05-15",
                      bio: "Software engineer with expertise in full-stack development and team leadership.",
                      looking_skills: [
                        { id: 1, name: "JavaScript" },
                        { id: 3, name: "React" },
                        { id: 5, name: "Node.js" },
                        { id: 7, name: "Python" },
                      ],
                    },
                  },
                  update_notification_settings: {
                    summary: "Update notification settings only",
                    value: {
                      notification_settings: {
                        push_notification: false,
                        marketing_notification: true,
                      },
                    },
                  },
                  update_all_notifications: {
                    summary: "Update all notification settings",
                    value: {
                      notification_settings: {
                        push_notification: true,
                        general_notification: true,
                        skill_exchange_notification: false,
                        message_notification: true,
                        marketing_notification: false,
                      },
                    },
                  },
                  email_only: {
                    summary: "Update email only",
                    value: {
                      email: "newemail@example.com",
                    },
                  },
                  phone_and_dob: {
                    summary: "Update phone and date of birth",
                    value: {
                      phone: "+9876543210",
                      dob: "1985-12-25",
                    },
                  },
                  bio_only: {
                    summary: "Update bio only",
                    value: {
                      bio: "Passionate developer with 8+ years of experience in creating scalable web applications and mentoring teams.",
                    },
                  },
                  looking_skills_only: {
                    summary: "Update looking skills only",
                    value: {
                      looking_skills: [
                        { id: 2, name: "CSS" },
                        { id: 4, name: "Vue.js" },
                        { id: 6, name: "Express.js" },
                        { id: 8, name: "MongoDB" },
                      ],
                    },
                  },
                  addresses_only: {
                    summary: "Update addresses only",
                    value: {
                      addresses: [
                        {
                          street: "123 Main Street",
                          city: "Mumbai",
                          state: "Maharashtra",
                          zip_code: "400001",
                          country: "India",
                          type: "home",
                        },
                        {
                          street: "456 Business Park",
                          city: "Mumbai",
                          state: "Maharashtra",
                          zip_code: "400002",
                          country: "India",
                          type: "office",
                        },
                      ],
                    },
                  },
                  temp_addresses_only: {
                    summary: "Update temporary addresses only",
                    value: {
                      temp_addresses: [
                        {
                          location_data: "Near Central Station",
                          pincode: "400003",
                          selected_area: "Downtown",
                          city: "Mumbai",
                          state: "Maharashtra",
                          country: "India",
                          location_permission: true,
                          is_active: true,
                          expires_at: "2025-12-31",
                        },
                      ],
                    },
                  },
                  work_profiles_only: {
                    summary: "Update work profiles only",
                    value: {
                      work_profiles: [
                        {
                          company_name: "Tech Solutions Inc.",
                          designation: "Senior Software Engineer",
                          start_date: "2022-01-15",
                          end_date: "2024-06-30",
                          user_skills: [
                            {
                              skill_id: 1,
                              sub_skill_id: 3,
                              proficiency_level: "Expert",
                            },
                            {
                              skill_id: 2,
                              sub_skill_id: null,
                              proficiency_level: "Intermediate",
                            },
                          ],
                        },
                      ],
                    },
                  },
                  complete_update: {
                    summary: "Complete profile update with all fields",
                    value: {
                      name: "John Smith Updated",
                      phone: "+1234567890",
                      dob: "1990-05-15",
                      bio: "Experienced software developer with 10+ years in full-stack development. Passionate about creating innovative solutions and mentoring junior developers.",
                      addresses: [
                        {
                          street: "789 New Street",
                          city: "Delhi",
                          state: "Delhi",
                          zip_code: "110001",
                          country: "India",
                          type: "home",
                        },
                      ],
                      temp_addresses: [
                        {
                          location_data: "Near Airport",
                          pincode: "110037",
                          selected_area: "Airport Area",
                          city: "Delhi",
                          state: "Delhi",
                          country: "India",
                          location_permission: false,
                          is_active: true,
                        },
                      ],
                      work_profiles: [
                        {
                          company_name: "New Tech Corp",
                          designation: "Lead Developer",
                          start_date: "2024-07-01",
                          end_date: null,
                          user_skills: [
                            {
                              skill_id: 1,
                              sub_skill_id: 2,
                              proficiency_level: "Expert",
                            },
                          ],
                        },
                      ],
                    },
                  },
                },
              },
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    profile_image: {
                      type: "string",
                      format: "binary",
                      description:
                        "Profile image file (JPEG, PNG, GIF, WebP, max 5MB)",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Profile updated successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/UpdateProfileResponse",
                  },
                  example: {
                    success: true,
                    message: "Profile updated successfully",
                    data: {
                      id: 1,
                      name: "John Smith",
                      email: "john.smith@example.com",
                      created_at: "2024-01-01T00:00:00.000Z",
                      updated_at: "2024-01-15T10:30:00.000Z",
                      profile: {
                        id: 1,
                        phone: "+1234567890",
                        dob: "1990-05-15",
                        gender: "Male",
                        bio: "Updated bio: Experienced software engineer specializing in full-stack development",
                        image_path: "/uploads/profiles/john_doe_profile.jpg",
                        image_url:
                          "http://example.com/uploads/images/21be627b-7b01-424a-a0cd-13f31d312eb5.png",
                        created_at: "2024-01-01T00:00:00.000Z",
                        updated_at: "2024-01-15T10:30:00.000Z",
                      },
                      addresses: [
                        {
                          id: 1,
                          street: "789 New Street",
                          city: "Delhi",
                          state: "Delhi",
                          zip_code: "110001",
                          country: "India",
                          type: "home",
                          created_at: "2024-01-15T10:30:00.000Z",
                          updated_at: "2024-01-15T10:30:00.000Z",
                        },
                      ],
                      temp_addresses: [
                        {
                          id: 1,
                          location_data: "Near Airport",
                          pincode: "110037",
                          selected_area: "Airport Area",
                          city: "Delhi",
                          state: "Delhi",
                          country: "India",
                          location_permission: false,
                          is_active: true,
                          expires_at: null,
                          created_at: "2024-01-15T10:30:00.000Z",
                          updated_at: "2024-01-15T10:30:00.000Z",
                        },
                      ],
                      work_profiles: [
                        {
                          id: 1,
                          company_name: "New Tech Corp",
                          designation: "Lead Developer",
                          start_date: "2024-07-01",
                          end_date: null,
                          created_at: "2024-01-15T10:30:00.000Z",
                          updated_at: "2024-01-15T10:30:00.000Z",
                          userSkills: [
                            {
                              id: 1,
                              proficiency_level: "Expert",
                              created_at: "2024-01-15T10:30:00.000Z",
                              updated_at: "2024-01-15T10:30:00.000Z",
                              skill: {
                                id: 1,
                                name: "JavaScript",
                                description:
                                  "Programming language for web development",
                              },
                              subSkill: {
                                id: 2,
                                name: "React.js",
                                description:
                                  "JavaScript library for building user interfaces",
                              },
                            },
                          ],
                        },
                      ],
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
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: false },
                      message: { type: "string", example: "Validation failed" },
                      errors: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            field: {
                              type: "string",
                              description: "Field name that failed validation",
                            },
                            message: {
                              type: "string",
                              description: "Validation error message",
                            },
                            value: {
                              type: "string",
                              description: "Invalid value provided",
                            },
                          },
                        },
                      },
                    },
                  },
                  examples: {
                    no_fields_provided: {
                      summary: "No fields provided",
                      value: {
                        success: false,
                        message:
                          "At least one field (name, email, phone, dob, or bio) must be provided for update",
                      },
                    },
                    empty_name: {
                      summary: "Empty name field",
                      value: {
                        success: false,
                        message: "Validation failed",
                        errors: [
                          {
                            field: "name",
                            message: "Name cannot be empty, null, or undefined",
                            value: "",
                          },
                        ],
                      },
                    },
                    invalid_email: {
                      summary: "Invalid email format",
                      value: {
                        success: false,
                        message: "Validation failed",
                        errors: [
                          {
                            field: "email",
                            message: "Please provide a valid email address",
                            value: "invalid-email",
                          },
                        ],
                      },
                    },
                    invalid_date: {
                      summary: "Invalid date format",
                      value: {
                        success: false,
                        message: "Validation failed",
                        errors: [
                          {
                            field: "dob",
                            message:
                              "Date of birth must be in YYYY-MM-DD format",
                            value: "1990/01/01",
                          },
                        ],
                      },
                    },
                    invalid_bio: {
                      summary: "Bio too long",
                      value: {
                        success: false,
                        message: "Validation failed",
                        errors: [
                          {
                            field: "bio",
                            message: "Bio must not exceed 1000 characters",
                            value:
                              "This is a very long bio that exceeds the maximum allowed length...",
                          },
                        ],
                      },
                    },
                    future_date: {
                      summary: "Future date of birth",
                      value: {
                        success: false,
                        message: "Validation failed",
                        errors: [
                          {
                            field: "dob",
                            message: "Date of birth cannot be in the future",
                            value: "2025-01-01",
                          },
                        ],
                      },
                    },
                    invalid_phone: {
                      summary: "Invalid phone format",
                      value: {
                        success: false,
                        message: "Validation failed",
                        errors: [
                          {
                            field: "phone",
                            message: "Phone number format is invalid",
                            value: "abc123",
                          },
                        ],
                      },
                    },
                    invalid_work_profile_start_date: {
                      summary: "Invalid work profile start date",
                      value: {
                        success: false,
                        message: "Validation failed",
                        errors: [
                          {
                            field: "work_profiles.0.start_date",
                            message: "Start date cannot be in the future",
                            value: "2025-01-01",
                          },
                        ],
                      },
                    },
                    invalid_work_profile_end_date: {
                      summary: "Invalid work profile end date",
                      value: {
                        success: false,
                        message: "Validation failed",
                        errors: [
                          {
                            field: "work_profiles.0.end_date",
                            message: "End date must be after start date",
                            value: "2022-01-01",
                          },
                        ],
                      },
                    },
                    invalid_skill_proficiency: {
                      summary: "Invalid skill proficiency level",
                      value: {
                        success: false,
                        message: "Validation failed",
                        errors: [
                          {
                            field:
                              "work_profiles.0.user_skills.0.proficiency_level",
                            message:
                              "Proficiency level must be one of: Beginner, Intermediate, Expert",
                            value: "Advanced",
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Unauthorized - Invalid or missing access token",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            409: {
              description: "Conflict - Email already exists",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  example: {
                    success: false,
                    message:
                      "Email already exists. Please use a different email address.",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/users/profile/{id}": {
        get: {
          summary: "Get profile by user ID",
          description:
            "Retrieve profile data for a specific user (restricted to own profile)",
          tags: ["Users"],
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "User ID",
              schema: {
                type: "integer",
                example: 1,
              },
            },
          ],
          responses: {
            200: {
              description: "Profile retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ProfileResponse",
                  },
                },
              },
            },
            401: {
              description: "Unauthorized - Invalid or missing access token",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            403: {
              description: "Forbidden - Can only view own profile",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  example: {
                    success: false,
                    message:
                      "Access denied. You can only view your own profile.",
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
                  example: {
                    success: false,
                    message: "User not found",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/users/public-profile/{id}": {
        get: {
          summary: "Get public profile by user ID",
          description:
            "Retrieve limited public profile information for any user (name, work experience, basic info only)",
          tags: ["Users"],
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "User ID to view public profile",
              schema: {
                type: "integer",
                example: 1,
              },
            },
          ],
          responses: {
            200: {
              description: "Public profile retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PublicProfileResponse",
                  },
                  example: {
                    success: true,
                    message: "Public profile retrieved successfully",
                    data: {
                      id: 1,
                      name: "John Doe",
                      member_since: "2024-01-01T00:00:00.000Z",
                      profile: {
                        gender: "Male",
                        image_url: "http://example.com/uploads/images/21be627b-7b01-424a-a0cd-13f31d312eb5.png"
                      },
                      work_experience: [
                        {
                          company_name: "Tech Corp",
                          designation: "Senior Developer",
                          start_date: "2022-01-01",
                          end_date: null,
                          duration: "2 years 3 months",
                        },
                        {
                          company_name: "Previous Corp",
                          designation: "Junior Developer",
                          start_date: "2020-01-01",
                          end_date: "2021-12-31",
                          duration: "2 years",
                        },
                      ],
                    },
                  },
                },
              },
            },
            401: {
              description: "Unauthorized - Invalid or missing access token",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  examples: {
                    missing_token: {
                      summary: "Missing access token",
                      value: {
                        success: false,
                        message: "Access token required",
                      },
                    },
                    invalid_token: {
                      summary: "Invalid access token",
                      value: {
                        success: false,
                        message: "Invalid access token",
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
                  example: {
                    success: false,
                    message: "User not found",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/users/delete-account": {
        delete: {
          summary: "Soft delete user account",
          description:
            "Soft delete the authenticated user's account. This will set a deleted_at timestamp and invalidate all active sessions. The account can potentially be restored by administrators.",
          tags: ["Users"],
          security: [
            {
              bearerAuth: [],
            },
          ],
          responses: {
            200: {
              description: "User account successfully deleted",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean",
                        example: true,
                      },
                      message: {
                        type: "string",
                        example: "User account has been successfully deleted",
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Unauthorized - Invalid or missing access token",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  examples: {
                    missing_token: {
                      summary: "Missing access token",
                      value: {
                        success: false,
                        message: "Access token required",
                      },
                    },
                    invalid_token: {
                      summary: "Invalid access token",
                      value: {
                        success: false,
                        message: "Invalid access token",
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
                  example: {
                    success: false,
                    message: "User not found",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/users/block/{userId}": {
        post: {
          summary: "Block a user",
          description: "Block another user. Once blocked, their posts and feed posts will not appear in your feeds.",
          tags: ["Users"],
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: "userId",
              in: "path",
              required: true,
              description: "ID of the user to block",
              schema: {
                type: "integer",
                example: 456
              }
            }
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reason: {
                      type: "string",
                      description: "Optional reason for blocking (optional)",
                      example: "Inappropriate behavior"
                    }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: "User blocked successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "User blocked successfully" },
                      data: {
                        type: "object",
                        properties: {
                          block_id: { type: "integer", example: 123 },
                          blocked_user_id: { type: "integer", example: 456 }
                        }
                      }
                    }
                  }
                }
              }
            },
            400: { description: "Bad request - Invalid user ID, trying to block self, or user already blocked" },
            404: { description: "User not found" },
            401: { description: "Unauthorized" }
          }
        },
        delete: {
          summary: "Unblock a user",
          description: "Remove a user from your block list",
          tags: ["Users"],
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: "userId",
              in: "path",
              required: true,
              description: "ID of the user to unblock",
              schema: {
                type: "integer",
                example: 456
              }
            }
          ],
          responses: {
            200: {
              description: "User unblocked successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "User unblocked successfully" },
                      data: {
                        type: "object",
                        properties: {
                          unblocked_user_id: { type: "integer", example: 456 }
                        }
                      }
                    }
                  }
                }
              }
            },
            400: { description: "Bad request - Invalid user ID" },
            404: { description: "User is not blocked" },
            401: { description: "Unauthorized" }
          }
        }
      },
      "/users/blocked-users": {
        get: {
          summary: "Get list of blocked users",
          description: "Retrieve paginated list of users you have blocked",
          tags: ["Users"],
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: "page",
              in: "query",
              required: false,
              description: "Page number (default: 1)",
              schema: {
                type: "integer",
                example: 1
              }
            },
            {
              name: "limit",
              in: "query",
              required: false,
              description: "Number of items per page (default: 20)",
              schema: {
                type: "integer",
                example: 20
              }
            }
          ],
          responses: {
            200: {
              description: "Blocked users retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Blocked users retrieved successfully" },
                      data: {
                        type: "object",
                        properties: {
                          blocked_users: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                block_id: { type: "integer", example: 123 },
                                blocked_at: { type: "string", format: "date-time", example: "2024-01-01T00:00:00.000Z" },
                                reason: { type: "string", nullable: true, example: "Inappropriate behavior" },
                                user: {
                                  type: "object",
                                  properties: {
                                    id: { type: "integer", example: 456 },
                                    name: { type: "string", example: "Jane Smith" },
                                    email: { type: "string", example: "jane@example.com" },
                                    profile: {
                                      type: "object",
                                      properties: {
                                        image_url: { type: "string", example: "http://localhost:3000/api/files/images/profile.jpg" },
                                        bio: { type: "string", example: "Software Developer" },
                                        city: { type: "string", example: "New York" },
                                        state: { type: "string", example: "NY" }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          },
                          pagination: {
                            type: "object",
                            properties: {
                              total: { type: "integer", example: 5 },
                              page: { type: "integer", example: 1 },
                              limit: { type: "integer", example: 20 },
                              total_pages: { type: "integer", example: 1 }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: "Unauthorized" },
            500: { description: "Internal server error" }
          }
        }
      },
      "/posts": {
        post: {
          summary: "Create a new post",
          description:
            "Create a new post with optional skill requirements, deadline, and file attachments",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "Post title (optional, 1-255 characters)",
                    },
                    description: {
                      type: "string",
                      description:
                        "Post description (optional, 1-5000 characters)",
                    },
                    required_skill_id: {
                      type: "integer",
                      description:
                        "Required skill ID (optional, positive integer)",
                    },
                    required_sub_skill_id: {
                      type: "integer",
                      description:
                        "Required sub-skill ID (optional, positive integer)",
                    },
                    medium: {
                      type: "string",
                      enum: ["online", "offline"],
                      description:
                        "Collaboration medium (optional, defaults to online)",
                    },
                    deadline: {
                      type: "string",
                      format: "date",
                      description:
                        "Project deadline (optional, must be future date)",
                    },
                    attachments: {
                      type: "array",
                      items: {
                        type: "string",
                        format: "binary",
                      },
                      description:
                        "File attachments (optional, max 5 files, 5MB each). Allowed types: JPEG, PNG, GIF, PDF",
                      maxItems: 5,
                    },
                  },
                },
              },
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PostCreation",
                },
                examples: {
                  complete_post: {
                    summary: "Complete post with all fields",
                    value: {
                      title: "Need help with React project",
                      description:
                        "Looking for someone to help with a React.js project involving state management and API integration.",
                      required_skill_id: 1,
                      required_sub_skill_id: 2,
                      medium: "online",
                      deadline: "2024-12-31",
                    },
                  },
                  minimal_post: {
                    summary: "Minimal post with only description",
                    value: {
                      description: "Need help with a programming task",
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
                    $ref: "#/components/schemas/PostResponse",
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
              description: "Unauthorized - Invalid or missing token",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
        get: {
          summary: "Get all posts",
          description:
            "Retrieve all posts with optional filtering and pagination",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              description: "Page number for pagination",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                default: 1,
                example: 1,
              },
            },
            {
              name: "limit",
              in: "query",
              description: "Number of items per page",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 10,
                example: 10,
              },
            },
            {
              name: "status",
              in: "query",
              description: "Filter by post status",
              required: false,
              schema: {
                type: "string",
                enum: ["active", "hold", "discussed", "completed", "deleted"],
                example: "active",
              },
            },
            {
              name: "medium",
              in: "query",
              description: "Filter by collaboration medium",
              required: false,
              schema: {
                type: "string",
                enum: ["online", "offline"],
                example: "online",
              },
            },
            {
              name: "skill_id",
              in: "query",
              description: "Filter by required skill ID",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                example: 1,
              },
            },
          ],
          responses: {
            200: {
              description: "Posts retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PostsResponse",
                  },
                },
              },
            },
            401: {
              description: "Unauthorized - Invalid or missing token",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
          description:
            "Retrieve a specific post by its ID with all associated data",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              description: "Post ID",
              required: true,
              schema: {
                type: "integer",
                minimum: 1,
                example: 1,
              },
            },
          ],
          responses: {
            200: {
              description: "Post retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PostResponse",
                  },
                },
              },
            },
            401: {
              description: "Unauthorized - Invalid or missing token",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
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
                  example: {
                    success: false,
                    message: "Post not found",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
        put: {
          summary: "Update existing post",
          description: "Update an existing post (only post owner can update)",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              description: "Post ID",
              required: true,
              schema: {
                type: "integer",
                minimum: 1,
                example: 1,
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PostUpdate",
                },
                examples: {
                  update_title_description: {
                    summary: "Update title and description",
                    value: {
                      title: "Updated: Need React.js Expert",
                      description:
                        "Updated description: Looking for an experienced React.js developer for a complex enterprise project.",
                    },
                  },
                  update_status: {
                    summary: "Update post status",
                    value: {
                      status: "hold",
                    },
                  },
                  update_skills: {
                    summary: "Update required skills",
                    value: {
                      required_skill_id: 2,
                      required_sub_skill_id: 5,
                    },
                  },
                  clear_deadline: {
                    summary: "Clear deadline",
                    value: {
                      deadline: null,
                    },
                  },
                  complete_update: {
                    summary: "Update multiple fields",
                    value: {
                      title: "Updated: Full-stack Developer Needed",
                      description:
                        "Updated project requirements for full-stack development.",
                      medium: "offline",
                      status: "active",
                      deadline: "2025-02-01",
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
                    $ref: "#/components/schemas/PostResponse",
                  },
                },
              },
            },
            400: {
              description: "Validation error or invalid skill ID",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationError",
                  },
                  examples: {
                    invalid_status: {
                      summary: "Invalid status value",
                      value: {
                        success: false,
                        message: "Validation failed",
                        errors: [
                          {
                            field: "status",
                            message:
                              "Status must be one of: active, hold, discussed, completed, deleted",
                            value: "invalid_status",
                          },
                        ],
                      },
                    },
                    invalid_skill: {
                      summary: "Invalid skill ID",
                      value: {
                        success: false,
                        message: "Invalid skill ID provided",
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Unauthorized - Invalid or missing token",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            404: {
              description: "Post not found or access denied",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  example: {
                    success: false,
                    message:
                      "Post not found or you don't have permission to update it",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/posts/matching": {
        get: {
          summary: "Get matching posts for logged-in user",
          description:
            "Retrieve posts that match the logged-in user's skills, sub-skills, and location with configurable filtering and scoring",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              description: "Page number for pagination",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                default: 1,
                example: 1,
              },
            },
            {
              name: "limit",
              in: "query",
              description: "Number of items per page",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 10,
                example: 10,
              },
            },
            {
              name: "status",
              in: "query",
              description: "Filter by post status (default: active)",
              required: false,
              schema: {
                type: "string",
                enum: ["active", "hold", "discussed", "completed", "deleted"],
                default: "active",
                example: "active",
              },
            },
            {
              name: "medium",
              in: "query",
              description: "Filter by collaboration medium",
              required: false,
              schema: {
                type: "string",
                enum: ["online", "offline"],
                example: "online",
              },
            },
            {
              name: "min_match_score",
              in: "query",
              description: "Minimum match percentage (0-100)",
              required: false,
              schema: {
                type: "integer",
                minimum: 0,
                maximum: 100,
                example: 50,
              },
            },
            {
              name: "match_skills",
              in: "query",
              description: "Enable skill-based matching (default: true)",
              required: false,
              schema: {
                type: "boolean",
                default: true,
                example: true,
              },
            },
            {
              name: "match_sub_skills",
              in: "query",
              description: "Enable sub-skill-based matching (default: true)",
              required: false,
              schema: {
                type: "boolean",
                default: true,
                example: true,
              },
            },
            {
              name: "match_location",
              in: "query",
              description:
                "Enable location/pincode-based matching (default: true)",
              required: false,
              schema: {
                type: "boolean",
                default: true,
                example: true,
              },
            },
          ],
          responses: {
            200: {
              description: "Matching posts retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: {
                        type: "string",
                        example: "Matching posts retrieved successfully",
                      },
                      data: {
                        type: "array",
                        items: {
                          allOf: [
                            { $ref: "#/components/schemas/Post" },
                            {
                              type: "object",
                              properties: {
                                matchScore: {
                                  type: "object",
                                  properties: {
                                    score: {
                                      type: "integer",
                                      example: 5,
                                      description: "Raw match score",
                                    },
                                    maxScore: {
                                      type: "integer",
                                      example: 6,
                                      description: "Maximum possible score",
                                    },
                                    percentage: {
                                      type: "integer",
                                      example: 83,
                                      description: "Match percentage (0-100)",
                                    },
                                    reasons: {
                                      type: "object",
                                      properties: {
                                        skillMatch: {
                                          type: "boolean",
                                          example: true,
                                        },
                                        subSkillMatch: {
                                          type: "boolean",
                                          example: true,
                                        },
                                        locationMatch: {
                                          type: "boolean",
                                          example: true,
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          ],
                        },
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          currentPage: { type: "integer", example: 1 },
                          totalPages: { type: "integer", example: 3 },
                          totalItems: { type: "integer", example: 25 },
                          itemsPerPage: { type: "integer", example: 10 },
                        },
                      },
                      matchingCriteria: {
                        type: "object",
                        properties: {
                          enabled: {
                            type: "object",
                            properties: {
                              skills: {
                                type: "boolean",
                                example: true,
                                description:
                                  "Whether skill matching is enabled",
                              },
                              subSkills: {
                                type: "boolean",
                                example: true,
                                description:
                                  "Whether sub-skill matching is enabled",
                              },
                              location: {
                                type: "boolean",
                                example: true,
                                description:
                                  "Whether location matching is enabled",
                              },
                            },
                          },
                          userDataCounts: {
                            type: "object",
                            properties: {
                              skills: {
                                type: "integer",
                                example: 5,
                                nullable: true,
                                description:
                                  "Number of user skills (null if disabled)",
                              },
                              subSkills: {
                                type: "integer",
                                example: 8,
                                nullable: true,
                                description:
                                  "Number of user sub-skills (null if disabled)",
                              },
                              locations: {
                                type: "integer",
                                example: 2,
                                nullable: true,
                                description:
                                  "Number of user locations (null if disabled)",
                              },
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
              description: "Unauthorized - Invalid or missing token",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/posts/temp-address": {
        get: {
          summary: "Get posts by user's temporary address pincode",
          description:
            "Retrieve active posts from other users whose temporary address pincode matches the requesting user's temporary address pincode. Optionally filter by skills when isFilterBySkills=true. Excludes the logged-in user's own posts.",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              description: "Page number for pagination",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                default: 1,
                example: 1,
              },
            },
            {
              name: "limit",
              in: "query",
              description: "Number of items per page",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 10,
                example: 10,
              },
            },
            {
              name: "isFilterBySkills",
              in: "query",
              description: "Filter posts by user's looking_skills. If true, only posts with required_skill_id matching user's looking_skills are returned.",
              required: false,
              schema: {
                type: "string",
                enum: ["true", "false"],
                default: "false",
                example: "true",
              },
            },
          ],
          responses: {
            200: {
              description:
                "Active posts retrieved successfully filtered by temporary address pincode and optionally by user's looking skills",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: {
                        type: "string",
                        example:
                          "Posts retrieved successfully for pincode 361004",
                      },
                      data: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/PostWithUserTempAddress",
                        },
                      },
                      tempAddress: {
                        type: "object",
                        properties: {
                          pincode: { type: "string", example: "361004" },
                          selected_area: {
                            type: "string",
                            example: "Udyognagar",
                          },
                          city: { type: "string", example: "Gujarat" },
                          state: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                        },
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          currentPage: { type: "integer", example: 1 },
                          totalPages: { type: "integer", example: 1 },
                          totalItems: { type: "integer", example: 4 },
                          itemsPerPage: { type: "integer", example: 10 },
                        },
                      },
                    },
                  },
                  example: {
                    success: true,
                    message: "Posts retrieved successfully for pincode 361004",
                    data: [
                      {
                        id: 22,
                        user_id: 17,
                        title: "Need React Development Help",
                        description:
                          "Looking for React developer for project collaboration",
                        required_skill_id: 1,
                        required_sub_skill_id: 2,
                        medium: "online",
                        status: "active",
                        deadline: "2025-09-02",
                        created_at: "2025-08-29T19:51:00.310Z",
                        updated_at: "2025-08-29T19:51:00.315Z",
                        user: {
                          id: 17,
                          name: "John Doe",
                          email: "john.doe@example.com",
                          tempAddresses: [
                            {
                              pincode: "361004",
                              selected_area: "Udyognagar",
                              city: "Gujarat",
                              state: null,
                            },
                          ],
                        },
                        requiredSkill: {
                          id: 1,
                          name: "Academic Help",
                        },
                        requiredSubSkill: {
                          id: 2,
                          name: "College Project Guidance",
                        },
                        attachments: [
                          {
                            id: 1,
                            file_name: "project_details.pdf",
                            file_path: "/uploads/documents/project_details.pdf",
                            file_category: "document",
                            mime_type: "application/pdf",
                            size: 256789,
                            uploaded_at: "2025-08-29T19:51:00.310Z",
                            url: "http://localhost:3000/uploads/documents/project_details.pdf"
                          }
                        ]
                      },
                      {
                        id: 23,
                        user_id: 18,
                        title: "Web Design Collaboration",
                        description: "Looking for UI/UX designer for website project",
                        required_skill_id: 3,
                        required_sub_skill_id: 5,
                        medium: "offline",
                        status: "active",
                        deadline: "2025-09-15",
                        created_at: "2025-08-30T10:30:00.000Z",
                        updated_at: "2025-08-30T10:30:00.000Z",
                        user: {
                          id: 18,
                          name: "Jane Smith",
                          email: "jane.smith@example.com",
                          tempAddresses: [
                            {
                              pincode: "361004",
                              selected_area: "Udyognagar",
                              city: "Gujarat",
                              state: null,
                            },
                          ],
                        },
                        requiredSkill: {
                          id: 3,
                          name: "Design",
                        },
                        requiredSubSkill: {
                          id: 5,
                          name: "UI/UX Design",
                        },
                        attachments: []
                      }
                    ],
                    tempAddress: {
                      pincode: "361004",
                      selected_area: "Udyognagar",
                      city: "Gujarat",
                      state: null,
                    },
                    pagination: {
                      currentPage: 1,
                      totalPages: 1,
                      totalItems: 2,
                      itemsPerPage: 10,
                    },
                  },
                },
              },
            },
            200: {
              description: "Empty result - User has no looking skills configured",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "No looking skills found for skill matching" },
                      data: { type: "array", example: [] },
                      tempAddress: {
                        type: "object",
                        properties: {
                          pincode: { type: "string", example: "361004" },
                          selected_area: { type: "string", example: "Udyognagar" },
                          city: { type: "string", example: "Gujarat" },
                          state: { type: "string", nullable: true, example: null }
                        }
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          currentPage: { type: "integer", example: 1 },
                          totalPages: { type: "integer", example: 0 },
                          totalItems: { type: "integer", example: 0 },
                          itemsPerPage: { type: "integer", example: 10 }
                        }
                      }
                    }
                  }
                }
              }
            },
            404: {
              description: "Not found - User has no active temporary address",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            401: {
              description: "Unauthorized - Invalid or missing token",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/posts/{id}/attachments": {
        post: {
          summary: "Add attachments to existing post",
          description: "Upload file attachments to an existing post",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              description: "Post ID",
              required: true,
              schema: {
                type: "integer",
                minimum: 1,
                example: 1,
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    attachments: {
                      type: "array",
                      items: {
                        type: "string",
                        format: "binary",
                      },
                      description:
                        "File attachments (max 5 files, 5MB each). Allowed types: JPEG, PNG, GIF, PDF",
                      maxItems: 5,
                    },
                  },
                  required: ["attachments"],
                },
              },
            },
          },
          responses: {
            201: {
              description: "Attachments uploaded successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: {
                        type: "string",
                        example: "Attachments uploaded successfully",
                      },
                      data: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/PostAttachment",
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description:
                "Bad request - No files uploaded or invalid file type",
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
            404: {
              description: "Post not found or access denied",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/posts/attachments/{attachmentId}/download": {
        get: {
          summary: "Download attachment",
          description: "Download a specific attachment by its ID",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "attachmentId",
              in: "path",
              description: "Attachment ID",
              required: true,
              schema: {
                type: "integer",
                minimum: 1,
                example: 1,
              },
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
            404: {
              description: "Attachment not found or file missing",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/posts/attachments/{attachmentId}": {
        delete: {
          summary: "Delete attachment",
          description:
            "Delete a specific attachment by its ID (only post owner can delete)",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "attachmentId",
              in: "path",
              description: "Attachment ID",
              required: true,
              schema: {
                type: "integer",
                minimum: 1,
                example: 1,
              },
            },
          ],
          responses: {
            200: {
              description: "Attachment deleted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: {
                        type: "string",
                        example: "Attachment deleted successfully",
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
            403: {
              description: "Forbidden - Not the post owner",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            404: {
              description: "Attachment not found",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      // Aadhaar Verification APIs
      "/aadhaar/verify-zip": {
        post: {
          summary: "Verify Aadhaar ZIP file (offline eKYC)",
          description:
            "Verifies offline eKYC ZIP files containing XML and certificate files with share code decryption",
          tags: ["Aadhaar Verification"],
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
              description: "Verification completed successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AadhaarVerificationResult",
                  },
                },
              },
            },
            400: {
              description: "Invalid request data",
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
            500: {
              description: "Internal server error",
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
      "/aadhaar/verify-qr": {
        post: {
          summary: "Verify Aadhaar QR code",
          description: "Verifies Aadhaar QR codes from image files",
          tags: ["Aadhaar Verification"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["qrImage"],
                  properties: {
                    qrImage: {
                      type: "string",
                      format: "binary",
                      description:
                        "QR code image file (JPEG, PNG, BMP, GIF, WebP - Max 5MB)",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "QR verification completed successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AadhaarVerificationResult",
                  },
                },
              },
            },
            400: {
              description: "Invalid request data or file",
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
            500: {
              description: "Internal server error",
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
          description: "Validates Aadhaar number format and Verhoeff checksum",
          tags: ["Aadhaar Verification"],
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
              description: "Number validation completed",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AadhaarVerificationResult",
                  },
                },
              },
            },
            400: {
              description: "Invalid request data",
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
            500: {
              description: "Internal server error",
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
          summary: "Get verification history",
          description:
            "Retrieves verification history for the authenticated user",
          tags: ["Aadhaar Verification"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "limit",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 10,
              },
              description: "Number of records to return",
            },
            {
              name: "offset",
              in: "query",
              schema: {
                type: "integer",
                minimum: 0,
                default: 0,
              },
              description: "Number of records to skip",
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
            500: {
              description: "Internal server error",
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
          summary: "Get verification details",
          description:
            "Retrieves detailed information about a specific verification",
          tags: ["Aadhaar Verification"],
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
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      requestId: { type: "string", format: "uuid" },
                      data: {
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
                          verificationData: { type: "object" },
                          signatureValid: { type: "boolean", nullable: true },
                          timestampValid: { type: "boolean", nullable: true },
                          checksumValid: { type: "boolean", nullable: true },
                          verificationTime: {
                            type: "string",
                            format: "date-time",
                          },
                          logs: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                action: { type: "string" },
                                status: {
                                  type: "string",
                                  enum: ["SUCCESS", "FAILED", "WARNING"],
                                },
                                message: { type: "string" },
                                timestamp: {
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
            404: {
              description: "Verification not found",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
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
      "/chat/conversations": {
        post: {
          summary: "Create a new conversation",
          tags: ["Chat"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["type", "memberIds"],
                  properties: {
                    type: {
                      type: "string",
                      enum: ["private", "group"],
                    },
                    name: {
                      type: "string",
                      description: "Required for group conversations",
                    },
                    description: {
                      type: "string",
                    },
                    memberIds: {
                      type: "array",
                      items: {
                        type: "integer",
                      },
                      description: "Array of user IDs to add to conversation",
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
                      success: { type: "boolean" },
                      message: { type: "string" },
                      data: {
                        $ref: "#/components/schemas/Conversation",
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Bad request",
            },
            429: {
              description: "Rate limit exceeded",
            },
          },
        },
        get: {
          summary: "Get user's conversations",
          tags: ["Chat"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Conversations retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      data: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/Conversation",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/chat/conversations/{id}": {
        get: {
          summary: "Get conversation by ID",
          tags: ["Chat"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: {
                type: "integer",
              },
              description: "Conversation ID",
            },
          ],
          responses: {
            200: {
              description: "Conversation retrieved successfully",
            },
            403: {
              description: "Access denied",
            },
            404: {
              description: "Conversation not found",
            },
          },
        },
      },
      "/chat/conversations/{id}/messages": {
        get: {
          summary: "Get conversation messages",
          tags: ["Chat"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: {
                type: "integer",
              },
              description: "Conversation ID",
            },
            {
              in: "query",
              name: "page",
              schema: {
                type: "integer",
                minimum: 1,
                default: 1,
              },
              description: "Page number",
            },
            {
              in: "query",
              name: "limit",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 50,
              },
              description: "Number of messages per page",
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
                      success: { type: "boolean" },
                      message: { type: "string" },
                      data: {
                        type: "object",
                        properties: {
                          messages: {
                            type: "array",
                            items: {
                              $ref: "#/components/schemas/Message",
                            },
                          },
                          pagination: {
                            type: "object",
                            properties: {
                              currentPage: { type: "integer" },
                              totalPages: { type: "integer" },
                              totalMessages: { type: "integer" },
                              hasNextPage: { type: "boolean" },
                              hasPreviousPage: { type: "boolean" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Send a message to a conversation",
          tags: ["Chat"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: {
                type: "integer",
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
                    content: {
                      type: "string",
                      description:
                        "Message content (required if no attachment)",
                    },
                    messageType: {
                      type: "string",
                      enum: ["text", "image", "video", "audio", "file"],
                      default: "text",
                    },
                    replyToMessageId: {
                      type: "integer",
                      description: "ID of message being replied to",
                    },
                    attachmentUrl: {
                      type: "string",
                      description: "URL of attached file",
                    },
                    attachmentName: {
                      type: "string",
                      description: "Name of attached file",
                    },
                    attachmentSize: {
                      type: "integer",
                      description: "Size of attached file in bytes",
                    },
                    attachmentMimeType: {
                      type: "string",
                      description: "MIME type of attached file",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Message sent successfully",
            },
            400: {
              description: "Bad request",
            },
            429: {
              description: "Rate limit exceeded",
            },
          },
        },
      },
      "/chat/conversations/{id}/stats": {
        get: {
          summary: "Get conversation statistics",
          tags: ["Chat"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: {
                type: "integer",
              },
              description: "Conversation ID",
            },
          ],
          responses: {
            200: {
              description: "Statistics retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      data: {
                        type: "object",
                        properties: {
                          messageCount: { type: "integer" },
                          memberCount: { type: "integer" },
                          unreadCount: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/chat/conversations/{id}/typing": {
        get: {
          summary: "Get typing status for a conversation",
          tags: ["Chat"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: {
                type: "integer",
              },
              description: "Conversation ID",
            },
          ],
          responses: {
            200: {
              description: "Typing status retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            userId: { type: "integer" },
                            userName: { type: "string" },
                            startedTypingAt: {
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
            },
          },
        },
      },
      "/chat/messages/{id}/read": {
        put: {
          summary: "Mark a message as read",
          tags: ["Chat"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: {
                type: "integer",
              },
              description: "Message ID",
            },
          ],
          responses: {
            200: {
              description: "Message marked as read",
            },
            400: {
              description: "Failed to mark message as read",
            },
          },
        },
      },
      "/chat/search": {
        get: {
          summary: "Search messages",
          tags: ["Chat"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "query",
              name: "q",
              required: true,
              schema: {
                type: "string",
                minLength: 2,
                maxLength: 100,
              },
              description: "Search query",
            },
            {
              in: "query",
              name: "conversation_id",
              schema: {
                type: "integer",
              },
              description: "Limit search to specific conversation",
            },
          ],
          responses: {
            200: {
              description: "Search completed successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      data: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/Message",
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Invalid search query",
            },
            429: {
              description: "Rate limit exceeded",
            },
          },
        },
      },
      "/chat/users/{id}/status": {
        get: {
          summary: "Get user's online status",
          tags: ["Chat"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: {
                type: "integer",
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
                      success: { type: "boolean" },
                      message: { type: "string" },
                      data: {
                        type: "object",
                        properties: {
                          id: { type: "integer" },
                          name: { type: "string" },
                          is_online: { type: "boolean" },
                          last_seen: {
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
              description: "User not found",
            },
          },
        },
      },
      "/chat/notifications": {
        get: {
          summary: "Get user's notifications",
          tags: ["Chat"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "query",
              name: "page",
              schema: {
                type: "integer",
                minimum: 1,
                default: 1,
              },
              description: "Page number",
            },
            {
              in: "query",
              name: "limit",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 50,
                default: 20,
              },
              description: "Number of notifications per page",
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
                      success: { type: "boolean" },
                      message: { type: "string" },
                      data: {
                        type: "object",
                        properties: {
                          notifications: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id: { type: "integer" },
                                type: { type: "string" },
                                title: { type: "string" },
                                body: { type: "string" },
                                is_seen: { type: "boolean" },
                                is_read: { type: "boolean" },
                                created_at: {
                                  type: "string",
                                  format: "date-time",
                                },
                              },
                            },
                          },
                          pagination: {
                            type: "object",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/files/{category}/{filename}": {
        get: {
          summary: "Serve file by category and filename",
          description:
            "Serve uploaded files based on their category (images, audio, documents, posts) and filename. Includes streaming support for audio files and proper security validation. Works for all file types including post attachments and profile images.",
          tags: ["Files"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "category",
              required: true,
              schema: {
                type: "string",
                enum: ["images", "audio", "documents", "posts"],
              },
              description: "File category (images, audio, documents, posts)",
            },
            {
              in: "path",
              name: "filename",
              required: true,
              schema: {
                type: "string",
              },
              description: "Filename (UUID-based for security)",
            },
          ],
          responses: {
            200: {
              description: "File served successfully",
              content: {
                "application/octet-stream": {
                  schema: {
                    type: "string",
                    format: "binary",
                  },
                },
                "image/*": {
                  schema: {
                    type: "string",
                    format: "binary",
                  },
                },
                "audio/*": {
                  schema: {
                    type: "string",
                    format: "binary",
                  },
                },
              },
              headers: {
                "Content-Disposition": {
                  description: "File download disposition",
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
              },
            },
            206: {
              description: "Partial content (for audio streaming)",
              content: {
                "audio/*": {
                  schema: {
                    type: "string",
                    format: "binary",
                  },
                },
              },
            },
            400: {
              description: "Invalid category or filename",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            401: {
              description: "Unauthorized - Invalid or missing access token",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            403: {
              description: "Forbidden - User does not have access to this file",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
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
          },
        },
      },
      "/chat/notifications/{id}/read": {
        put: {
          summary: "Mark a notification as read",
          tags: ["Chat"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: {
                type: "integer",
              },
              description: "Notification ID",
            },
          ],
          responses: {
            200: {
              description: "Notification marked as read",
            },
            404: {
              description: "Notification not found",
            },
          },
        },
      },
      // Feed API Endpoints
      "/feed/posts": {
        post: {
          summary: "Create a new feed post",
          description: "Create a new feed post with optional file attachments. Supports text posts, images, videos, and other media types.",
          tags: ["Feed"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    content: { 
                      type: "string", 
                      example: "Just completed an amazing React project! 🚀",
                      description: "Post content (1-5000 characters)"
                    },
                    attachments: {
                      type: "array",
                      items: {
                        type: "string",
                        format: "binary"
                      },
                      description: "Media files to attach to the post"
                    }
                  },
                  required: ["content"]
                }
              },
              "application/json": {
                schema: { $ref: "#/components/schemas/FeedPostCreation" }
              }
            }
          },
          responses: {
            201: {
              description: "Feed post created successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FeedPostResponse" },
                  examples: {
                    text_post: {
                      summary: "Text post creation",
                      value: {
                        success: true,
                        message: "Feed post created successfully",
                        data: {
                          id: 1,
                          user_id: 1,
                          content: "Just completed an amazing React project! 🚀",
                          like_count: 0,
                          comment_count: 0,
                          share_count: 0,
                          view_count: 0,
                          created_at: "2024-01-01T12:00:00.000Z",
                          user: {
                            id: 1,
                            name: "John Doe",
                            email: "john@example.com",
                            profile: {
                              image_url: "http://localhost:3000/api/files/images/profile.jpg"
                            }
                          },
                          attachments: []
                        }
                      }
                    }
                  }
                }
              }
            },
            400: { description: "Invalid request data" },
            401: { description: "Unauthorized" },
            413: { description: "File too large" },
            415: { description: "Unsupported media type" }
          }
        },
        get: {
          summary: "Get personalized feed",
          description: "Retrieve a personalized feed based on trending and featured posts.",
          tags: ["Feed"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "query",
              name: "page",
              schema: { type: "integer", minimum: 1, default: 1 },
              description: "Page number for pagination"
            },
            {
              in: "query",
              name: "limit",
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
              description: "Number of posts per page"
            }
          ],
          responses: {
            200: {
              description: "Feed retrieved successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FeedResponse" },
                  examples: {
                    personalized_feed: {
                      summary: "Personalized feed response",
                      value: {
                        success: true,
                        message: "Feed retrieved successfully",
                        data: {
                          posts: [
                            {
                              id: 1,
                              content: "Just completed an amazing React project! 🚀",
                              like_count: 25,
                              comment_count: 8,
                              share_count: 3,
                              view_count: 150,
                              created_at: "2024-01-01T12:00:00.000Z",
                              user: {
                                id: 2,
                                name: "Alice Developer",
                                profile: {
                                  image_url: "http://localhost:3000/api/files/images/alice.jpg"
                                }
                              },
                              attachments: []
                            }
                          ],
                          pagination: {
                            page: 1,
                            limit: 20,
                            total: 150,
                            hasMore: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: "Unauthorized" }
          }
        }
      },
      "/feed/posts/{id}": {
        get: {
          summary: "Get specific feed post",
          description: "Retrieve a specific feed post by ID with all its details, attachments, and engagement metrics.",
          tags: ["Feed"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
              description: "Feed post ID"
            }
          ],
          responses: {
            200: {
              description: "Feed post retrieved successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FeedPostResponse" }
                }
              }
            },
            404: { description: "Feed post not found" },
            401: { description: "Unauthorized" }
          }
        },
        delete: {
          summary: "Delete feed post",
          description: "Delete a feed post. Only the post creator can delete their own posts.",
          tags: ["Feed"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
              description: "Feed post ID"
            }
          ],
          responses: {
            200: {
              description: "Feed post deleted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Feed post deleted successfully" }
                    }
                  }
                }
              }
            },
            404: { description: "Feed post not found or access denied" },
            401: { description: "Unauthorized" }
          }
        }
      },
      "/feed/posts/{id}/like": {
        post: {
          summary: "Like or unlike a feed post",
          description: "Toggle like status for a feed post. Supports different reaction types.",
          tags: ["Feed"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
              description: "Feed post ID"
            }
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FeedLikeRequest" }
              }
            }
          },
          responses: {
            200: {
              description: "Like status updated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Post liked successfully" },
                      data: {
                        type: "object",
                        properties: {
                          liked: { type: "boolean", example: true },
                          like_type: { type: "string", example: "like" }
                        }
                      }
                    }
                  }
                }
              }
            },
            404: { description: "Feed post not found" },
            401: { description: "Unauthorized" }
          }
        }
      },
      "/feed/posts/{id}/comment": {
        post: {
          summary: "Add a comment to a feed post",
          description: "Add a comment or reply to a feed post.",
          tags: ["Feed"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
              description: "Feed post ID"
            }
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FeedCommentRequest" }
              }
            }
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
                      message: { type: "string", example: "Comment added successfully" },
                      data: { $ref: "#/components/schemas/FeedComment" }
                    }
                  }
                }
              }
            },
            400: { description: "Invalid comment data" },
            404: { description: "Feed post not found" },
            401: { description: "Unauthorized" }
          }
        }
      },
      "/feed/posts/{id}/comments": {
        get: {
          summary: "Get comments for a feed post",
          description: "Retrieve comments for a specific feed post with pagination.",
          tags: ["Feed"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
              description: "Feed post ID"
            },
            {
              in: "query",
              name: "page",
              schema: { type: "integer", minimum: 1, default: 1 },
              description: "Page number for pagination"
            },
            {
              in: "query",
              name: "limit",
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
              description: "Number of comments per page"
            }
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
                      message: { type: "string", example: "Comments retrieved successfully" },
                      data: {
                        type: "object",
                        properties: {
                          comments: {
                            type: "array",
                            items: { $ref: "#/components/schemas/FeedComment" }
                          },
                          pagination: {
                            type: "object",
                            properties: {
                              page: { type: "integer", example: 1 },
                              limit: { type: "integer", example: 20 },
                              total: { type: "integer", example: 50 },
                              hasMore: { type: "boolean", example: true }
                            }
                          }
                        }
                      }
                    }
                  },
                  examples: {
                    comments_with_images: {
                      summary: "Comments with profile images",
                      value: {
                        success: true,
                        message: "Comments retrieved successfully",
                        data: {
                          comments: [
                            {
                              id: 1,
                              feed_post_id: 123,
                              user_id: 456,
                              parent_comment_id: null,
                              content: "Great post! Really helpful information.",
                              is_edited: false,
                              like_count: 5,
                              reply_count: 2,
                              status: "active",
                              created_at: "2024-01-01T00:00:00.000Z",
                              updated_at: "2024-01-01T00:00:00.000Z",
                              user: {
                                id: 456,
                                name: "Alice Smith",
                                email: "alice@example.com",
                                profile: {
                                  image_path: "uploads/images/alice.jpg",
                                  image_url: "http://localhost:3000/api/files/uploads/images/alice.jpg"
                                }
                              },
                              replies: [
                                {
                                  id: 2,
                                  feed_post_id: 123,
                                  user_id: 789,
                                  parent_comment_id: 1,
                                  content: "I totally agree!",
                                  is_edited: false,
                                  like_count: 2,
                                  reply_count: 0,
                                  status: "active",
                                  created_at: "2024-01-01T01:00:00.000Z",
                                  updated_at: "2024-01-01T01:00:00.000Z",
                                  user: {
                                    id: 789,
                                    name: "Bob Johnson",
                                    email: "bob@example.com",
                                    profile: {
                                      image_path: "uploads/images/bob.jpg",
                                      image_url: "http://localhost:3000/api/files/uploads/images/bob.jpg"
                                    }
                                  }
                                }
                              ]
                            }
                          ],
                          pagination: {
                            page: 1,
                            limit: 20,
                            total: 50,
                            hasMore: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            404: { description: "Feed post not found" },
            401: { description: "Unauthorized" }
          }
        }
      },
      "/feed/posts/{id}/share": {
        post: {
          summary: "Share a feed post",
          description: "Share a feed post with optional quote text.",
          tags: ["Feed"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
              description: "Feed post ID"
            }
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    share_type: { 
                      type: "string", 
                      enum: ["repost", "quote", "bookmark"],
                      example: "repost"
                    },
                    quote_text: { 
                      type: "string", 
                      example: "This is exactly what I needed!",
                      maxLength: 1000
                    }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: "Post shared successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Post shared successfully" },
                      data: {
                        type: "object",
                        properties: {
                          share_type: { type: "string", example: "repost" }
                        }
                      }
                    }
                  }
                }
              }
            },
            404: { description: "Feed post not found" },
            401: { description: "Unauthorized" }
          }
        }
      },
      "/feed/posts/my-posts": {
        get: {
          summary: "Get logged-in user's feed posts",
          description: "Retrieve all feed posts created by the authenticated user with pagination support.",
          tags: ["Feed"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "query",
              name: "page",
              schema: { type: "integer", minimum: 1, default: 1 },
              description: "Page number for pagination"
            },
            {
              in: "query",
              name: "limit",
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
              description: "Number of posts per page"
            }
          ],
          responses: {
            200: {
              description: "User feed posts retrieved successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FeedResponse" },
                  examples: {
                    user_posts: {
                      summary: "User's own posts",
                      value: {
                        success: true,
                        message: "User feed posts retrieved successfully",
                        data: {
                          posts: [
                            {
                              id: 1,
                              user_id: 123,
                              content: "My latest project update! 🚀",
                              like_count: 5,
                              comment_count: 2,
                              share_count: 1,
                              view_count: 10,
                              is_featured: false,
                              status: "active",
                              created_at: "2024-01-01T00:00:00.000Z",
                              updated_at: "2024-01-01T00:00:00.000Z",
                              user: {
                                id: 123,
                                name: "John Doe",
                                email: "john@example.com",
                                profile: {
                                  image_path: "uploads/images/profile.jpg",
                                  image_url: "http://localhost:3000/api/files/uploads/images/profile.jpg",
                                  bio: "Software Developer"
                                }
                              },
                              attachments: [
                                {
                                  id: 1,
                                  file_path: "uploads/images/project.jpg",
                                  url: "http://localhost:3000/api/files/uploads/images/project.jpg",
                                  file_name: "project.jpg",
                                  file_type: "image",
                                  mime_type: "image/jpeg",
                                  file_size: 1024000
                                }
                              ],
                              likes: [
                                {
                                  id: 1,
                                  like_type: "like"
                                }
                              ]
                            }
                          ],
                          pagination: {
                            page: 1,
                            limit: 20,
                            total: 15,
                            hasMore: false
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: "Unauthorized" }
          }
        }
      },
      "/feed/trending": {
        get: {
          summary: "Get trending feed posts",
          description: "Retrieve trending and featured feed posts based on engagement metrics.",
          tags: ["Feed"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "query",
              name: "page",
              schema: { type: "integer", minimum: 1, default: 1 },
              description: "Page number for pagination"
            },
            {
              in: "query",
              name: "limit",
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
              description: "Number of posts per page"
            }
          ],
          responses: {
            200: {
              description: "Trending posts retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Trending posts retrieved successfully" },
                      data: {
                        type: "object",
                        properties: {
                          posts: {
                            type: "array",
                            items: { $ref: "#/components/schemas/FeedPost" }
                          },
                          pagination: {
                            type: "object",
                            properties: {
                              page: { type: "integer", example: 1 },
                              limit: { type: "integer", example: 20 },
                              hasMore: { type: "boolean", example: true }
                            }
                          }
                        }
                      }
                    }
                  },
                  examples: {
                    trending_posts_with_likes: {
                      summary: "Trending posts with user like status",
                      value: {
                        success: true,
                        message: "Trending posts retrieved successfully",
                        data: {
                          posts: [
                            {
                              id: 1,
                              user_id: 123,
                              content: "This is a trending post! 🔥",
                              like_count: 25,
                              comment_count: 8,
                              share_count: 5,
                              view_count: 150,
                              is_featured: true,
                              status: "active",
                              created_at: "2024-01-01T00:00:00.000Z",
                              updated_at: "2024-01-01T00:00:00.000Z",
                              user: {
                                id: 123,
                                name: "John Doe",
                                email: "john@example.com",
                                profile: {
                                  image_path: "uploads/images/profile.jpg",
                                  image_url: "http://localhost:3000/api/files/uploads/images/profile.jpg",
                                  bio: "Software Developer"
                                }
                              },
                              attachments: [
                                {
                                  id: 1,
                                  file_path: "uploads/images/trending.jpg",
                                  url: "http://localhost:3000/api/files/uploads/images/trending.jpg",
                                  file_name: "trending.jpg",
                                  file_type: "image",
                                  mime_type: "image/jpeg",
                                  file_size: 1024000
                                }
                              ],
                              likes: [
                                {
                                  id: 1,
                                  like_type: "like"
                                }
                              ]
                            },
                            {
                              id: 2,
                              user_id: 456,
                              content: "Another trending post!",
                              like_count: 15,
                              comment_count: 3,
                              share_count: 2,
                              view_count: 80,
                              is_featured: false,
                              status: "active",
                              created_at: "2024-01-01T01:00:00.000Z",
                              updated_at: "2024-01-01T01:00:00.000Z",
                              user: {
                                id: 456,
                                name: "Jane Smith",
                                email: "jane@example.com",
                                profile: {
                                  image_path: "uploads/images/jane.jpg",
                                  image_url: "http://localhost:3000/api/files/uploads/images/jane.jpg",
                                  bio: "Designer"
                                }
                              },
                              attachments: [],
                              likes: []
                            }
                          ],
                          pagination: {
                            page: 1,
                            limit: 20,
                            hasMore: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: "Unauthorized" }
          }
        }
      },
      "/posts/{id}/report": {
        post: {
          summary: "Report a post",
          description: "Report a post that violates community guidelines. Users cannot report their own posts or report the same post twice. Blocked users cannot submit reports. After 10 reports, users are automatically blocked.",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Post ID to report"
            }
          ],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reason: {
                      type: "string",
                      description: "Free-text reason for reporting (optional)",
                      example: "This post contains spam content"
                    },
                    description: {
                      type: "string",
                      description: "Additional details about the report (optional)",
                      example: "Multiple promotional links detected"
                    }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: "Post reported successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Post reported successfully" },
                      report_id: { type: "integer", example: 123 }
                    }
                  }
                }
              }
            },
            400: { description: "Bad request - Already reported or cannot report own post" },
            403: { description: "Forbidden - User is blocked" },
            404: { description: "Post not found" },
            401: { description: "Unauthorized" }
          }
        }
      },
      "/posts/reports/my-reports": {
        get: {
          summary: "Get user's reported posts",
          description: "Retrieve a list of posts that the current user has reported",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
              description: "Page number for pagination"
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 10 },
              description: "Number of items per page"
            }
          ],
          responses: {
            200: {
              description: "Reported posts retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Reported posts retrieved successfully" },
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "integer", example: 1 },
                            post_id: { type: "integer", example: 123 },
                            reported_by: { type: "integer", example: 456 },
                            reason: { type: "string", example: "This post contains spam content" },
                            description: { type: "string", example: "Additional details" },
                            status: { type: "string", example: "pending", enum: ["pending", "reviewed", "resolved", "dismissed"] },
                            created_at: { type: "string", format: "date-time" },
                            post: {
                              type: "object",
                              properties: {
                                id: { type: "integer" },
                                title: { type: "string" },
                                user: {
                                  type: "object",
                                  properties: {
                                    id: { type: "integer" },
                                    name: { type: "string" },
                                    email: { type: "string" }
                                  }
                                }
                              }
                            }
                          }
                        }
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          currentPage: { type: "integer", example: 1 },
                          totalPages: { type: "integer", example: 5 },
                          totalItems: { type: "integer", example: 45 },
                          itemsPerPage: { type: "integer", example: 10 }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: "Unauthorized" }
          }
        }
      },
      "/posts/{id}/swipe": {
        post: {
          summary: "Swipe a post (hide/dismiss)",
          description: "Swipe left to hide a post for 120 days, or swipe right to hide it permanently. This allows users to manage which posts they see in their feed. Users cannot swipe their own posts.",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Post ID to swipe"
            }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["swipeType"],
                  properties: {
                    swipeType: {
                      type: "string",
                      enum: ["left", "right"],
                      description: "Swipe direction: 'left' = hide for 120 days, 'right' = hide permanently"
                    }
                  }
                },
                examples: {
                  leftSwipe: {
                    summary: "Left swipe (temporary hide)",
                    value: {
                      swipeType: "left"
                    }
                  },
                  rightSwipe: {
                    summary: "Right swipe (permanent hide)",
                    value: {
                      swipeType: "right"
                    }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: "Post swiped successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Post hidden for 120 days" },
                      data: {
                        type: "object",
                        properties: {
                          swipe_id: { type: "integer", example: 1 },
                          post_id: { type: "integer", example: 123 },
                          swipe_type: { type: "string", example: "left" },
                          expires_at: { type: "string", format: "date-time", example: "2025-02-07T10:00:00.000Z" }
                        }
                      }
                    }
                  }
                }
              }
            },
            200: {
              description: "Post swipe updated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Post swipe updated to right" },
                      data: {
                        type: "object",
                        properties: {
                          post_id: { type: "integer", example: 123 },
                          swipe_type: { type: "string", example: "right" },
                          expires_at: { type: "string", nullable: true, example: null }
                        }
                      }
                    }
                  }
                }
              }
            },
            400: {
              description: "Bad request - Invalid swipe type or trying to swipe own post",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: false },
                      message: { type: "string", example: "Invalid swipe type. Must be 'left' or 'right'" }
                    }
                  }
                }
              }
            },
            404: { description: "Post not found" },
            401: { description: "Unauthorized" }
          }
        }
      },
      "/posts/swipes/my-swipes": {
        get: {
          summary: "Get user's swiped posts",
          description: "Retrieve a list of posts that the current user has swiped (hidden). Can be filtered by swipe type.",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
              description: "Page number for pagination"
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 10 },
              description: "Number of items per page"
            },
            {
              name: "swipeType",
              in: "query",
              schema: { type: "string", enum: ["left", "right"] },
              description: "Filter by swipe type (optional)"
            }
          ],
          responses: {
            200: {
              description: "Swiped posts retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Swiped posts retrieved successfully" },
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "integer", example: 1 },
                            user_id: { type: "integer", example: 10 },
                            post_id: { type: "integer", example: 123 },
                            swipe_type: { type: "string", example: "left" },
                            created_at: { type: "string", format: "date-time" },
                            expires_at: { type: "string", format: "date-time", nullable: true },
                            post: {
                              type: "object",
                              description: "Post details including user and required skill"
                            }
                          }
                        }
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          currentPage: { type: "integer", example: 1 },
                          totalPages: { type: "integer", example: 5 },
                          totalItems: { type: "integer", example: 50 },
                          itemsPerPage: { type: "integer", example: 10 }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: "Unauthorized" }
          }
        }
      },
      "/feed/posts/{id}/report": {
        post: {
          summary: "Report a feed post",
          description: "Report a feed post that violates community guidelines. Users cannot report their own posts or report the same post twice. Blocked users cannot submit reports. After 10 reports, users are automatically blocked.",
          tags: ["Feed"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Feed post ID to report"
            }
          ],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reason: {
                      type: "string",
                      description: "Free-text reason for reporting (optional)",
                      example: "This post has inappropriate content"
                    },
                    description: {
                      type: "string",
                      description: "Additional details about the report (optional)",
                      example: "Contains offensive language"
                    }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: "Feed post reported successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Feed post reported successfully" },
                      report_id: { type: "integer", example: 123 }
                    }
                  }
                }
              }
            },
            400: { description: "Bad request - Already reported or cannot report own post" },
            403: { description: "Forbidden - User is blocked" },
            404: { description: "Feed post not found" },
            401: { description: "Unauthorized" }
          }
        }
      },
      "/feed/reports/my-reports": {
        get: {
          summary: "Get user's reported feed posts",
          description: "Retrieve a list of feed posts that the current user has reported",
          tags: ["Feed"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
              description: "Page number for pagination"
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
              description: "Number of items per page"
            }
          ],
          responses: {
            200: {
              description: "Reported feed posts retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Reported feed posts retrieved successfully" },
                      data: {
                        type: "object",
                        properties: {
                          reports: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id: { type: "integer", example: 1 },
                                feed_post_id: { type: "integer", example: 123 },
                                reported_by: { type: "integer", example: 456 },
                                reason: { type: "string", example: "Inappropriate content" },
                                description: { type: "string", example: "Additional details" },
                                status: { type: "string", example: "pending", enum: ["pending", "reviewed", "resolved", "dismissed"] },
                                created_at: { type: "string", format: "date-time" },
                                feedPost: {
                                  type: "object",
                                  properties: {
                                    id: { type: "integer" },
                                    content: { type: "string" },
                                    user: {
                                      type: "object",
                                      properties: {
                                        id: { type: "integer" },
                                        name: { type: "string" },
                                        email: { type: "string" }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          },
                          pagination: {
                            type: "object",
                            properties: {
                              page: { type: "integer", example: 1 },
                              limit: { type: "integer", example: 20 },
                              total: { type: "integer", example: 50 },
                              hasMore: { type: "boolean", example: true }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: "Unauthorized" }
          }
        }
      },
    },
  },
  apis: ["./routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
