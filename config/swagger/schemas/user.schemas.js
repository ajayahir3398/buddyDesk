/**
 * User-related Swagger Schemas
 * Contains all schemas related to user authentication, profiles, and management
 */

module.exports = {
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
      created_at: {
        type: "string",
        format: "date-time",
        example: "2024-01-01T00:00:00.000Z",
        description: "User creation timestamp",
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
        enum: ["male", "female", "other"],
        example: "male",
        description: "Gender",
      },
      bio: {
        type: "string",
        example: "Software developer with 5 years of experience",
        description: "User biography",
      },
      skills: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Skill ID" },
            name: { type: "string", description: "Skill name" },
          },
        },
        description: "User skills",
      },
    },
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
      profile: {
        $ref: "#/components/schemas/UserProfile",
      },
      addresses: {
        type: "array",
        items: {
          $ref: "#/components/schemas/Address",
        },
      },
      tempAddresses: {
        type: "array",
        items: {
          $ref: "#/components/schemas/TempAddress",
        },
      },
      workProfiles: {
        type: "array",
        items: {
          $ref: "#/components/schemas/WorkProfile",
        },
      },
      posts: {
        type: "array",
        items: {
          $ref: "#/components/schemas/Post",
        },
      },
    },
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
      profile: {
        type: "object",
        properties: {
          gender: {
            type: "string",
            enum: ["male", "female", "other"],
            example: "male",
          },
          bio: {
            type: "string",
            example: "Software developer with 5 years of experience",
          },
        },
      },
      workProfiles: {
        type: "array",
        items: {
          type: "object",
          properties: {
            company: { type: "string", example: "Tech Corp" },
            designation: { type: "string", example: "Senior Developer" },
            duration: {
              type: "string",
              example: "2 years",
              description: "Work duration",
            },
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
        description: "User full name",
        minLength: 2,
        maxLength: 50,
      },
      email: {
        type: "string",
        example: "john.doe@example.com",
        format: "email",
      },
      phone: {
        type: "string",
        example: "+1234567890",
        description: "Phone number",
      },
      dob: {
        type: "string",
        format: "date",
        example: "1990-01-01",
      },
      bio: {
        type: "string",
        example: "Updated bio",
        maxLength: 500,
      },
      skills: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Skill ID" },
            name: { type: "string", description: "Skill name" },
          },
        },
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
        $ref: "#/components/schemas/CompleteProfile",
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
};