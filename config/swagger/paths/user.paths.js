/**
 * User API Paths
 * Contains all user-related API endpoint definitions
 */

module.exports = {
  "/users/register": {
    post: {
      summary: "Register a new user",
      description: "Create a new user account with validation",
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
            },
          },
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "User full name (2-50 characters, letters and spaces only)",
                },
                email: {
                  type: "string",
                  description: "User email address (must be unique)",
                },
                phone: {
                  type: "string",
                  description: "Phone number (10-20 characters)",
                },
                dob: {
                  type: "string",
                  format: "date",
                  description: "Date of birth in YYYY-MM-DD format",
                },
                bio: {
                  type: "string",
                  description: "User biography (max 1000 characters)",
                },
                profile_image: {
                  type: "string",
                  format: "binary",
                  description: "Profile image file (JPEG, PNG, GIF, WebP, max 5MB)",
                },
                addresses: {
                  type: "string",
                  description: "JSON string of addresses array",
                },
                temp_addresses: {
                  type: "string",
                  description: "JSON string of temporary addresses array",
                },
                work_profiles: {
                  type: "string",
                  description: "JSON string of work profiles array",
                },
                looking_skills: {
                  type: "string",
                  description: "JSON string of looking skills array",
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
      description: "Generate new access token using refresh token",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Token refreshed successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  accessToken: { type: "string" },
                  expiresIn: { type: "integer", example: 3600 },
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
      },
    },
  },
  "/users/logout": {
    post: {
      summary: "Logout user",
      description: "Invalidate user session and tokens",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Logout successful",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SuccessResponse",
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
  "/users/profile": {
    get: {
      summary: "Get user profile",
      description: "Retrieve current user's profile information",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
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
      summary: "Update user profile",
      description: "Update current user's profile information",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/UpdateProfileRequest",
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
  "/users/profile/{id}": {
    get: {
      summary: "Get user profile by ID",
      description: "Retrieve another user's profile information",
      tags: ["Users"],
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
          description: "Profile retrieved successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ProfileResponse",
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
      },
    },
  },
  "/users/public-profile/{id}": {
    get: {
      summary: "Get public user profile",
      description: "Retrieve public profile information of a user",
      tags: ["Users"],
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
          description: "Public profile retrieved successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PublicProfileResponse",
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
      },
    },
  },
};