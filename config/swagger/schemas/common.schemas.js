/**
 * Common Swagger Schemas
 * Contains shared schemas used across multiple API endpoints
 */

module.exports = {
  ValidationError: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: false,
        description: "Request success status",
      },
      message: {
        type: "string",
        example: "Validation failed",
        description: "Error message",
      },
      errors: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: {
              type: "string",
              example: "email",
              description: "Field that failed validation",
            },
            message: {
              type: "string",
              example: "Email is required",
              description: "Validation error message",
            },
            code: {
              type: "string",
              example: "REQUIRED",
              description: "Error code",
            },
          },
        },
        description: "Array of validation errors",
      },
      requestId: {
        type: "string",
        format: "uuid",
        description: "Unique request identifier",
      },
      timestamp: {
        type: "string",
        format: "date-time",
        description: "Error timestamp",
      },
    },
  },
  Error: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: false,
        description: "Request success status",
      },
      message: {
        type: "string",
        example: "An error occurred",
        description: "Error message",
      },
      code: {
        type: "string",
        example: "INTERNAL_ERROR",
        description: "Error code",
      },
      details: {
        type: "object",
        description: "Additional error details",
      },
      requestId: {
        type: "string",
        format: "uuid",
        description: "Unique request identifier",
      },
      timestamp: {
        type: "string",
        format: "date-time",
        description: "Error timestamp",
      },
    },
  },
  Address: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        description: "Unique address identifier",
      },
      userId: {
        type: "string",
        format: "uuid",
        description: "User identifier",
      },
      type: {
        type: "string",
        enum: ["home", "work", "other"],
        example: "home",
        description: "Address type",
      },
      street: {
        type: "string",
        example: "123 Main Street",
        description: "Street address",
      },
      apartment: {
        type: "string",
        example: "Apt 4B",
        description: "Apartment/unit number",
      },
      city: {
        type: "string",
        example: "New York",
        description: "City",
      },
      state: {
        type: "string",
        example: "NY",
        description: "State/province",
      },
      postalCode: {
        type: "string",
        example: "10001",
        description: "Postal/ZIP code",
      },
      country: {
        type: "string",
        example: "United States",
        description: "Country",
      },
      isDefault: {
        type: "boolean",
        example: true,
        description: "Whether this is the default address",
      },
      coordinates: {
        type: "object",
        properties: {
          latitude: {
            type: "number",
            format: "double",
            example: 40.7128,
            description: "Latitude coordinate",
          },
          longitude: {
            type: "number",
            format: "double",
            example: -74.0060,
            description: "Longitude coordinate",
          },
        },
        description: "GPS coordinates",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Address creation timestamp",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Address update timestamp",
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
      user_id: {
        type: "integer",
        example: 1,
        description: "User ID who owns this temporary address",
      },
      location_data: {
        type: "string",
        example: "Near Central Park, New York",
        description: "Location description or coordinates",
      },
      pincode: {
        type: "string",
        example: "10001",
        description: "6-digit postal code",
        pattern: "^[0-9]{6}$",
      },
      selected_area: {
        type: "string",
        example: "Manhattan",
        description: "Selected area or neighborhood",
      },
      location_permission: {
        type: "boolean",
        example: true,
        description: "Whether location permission is granted",
      },
      city: {
        type: "string",
        example: "New York",
        description: "City name",
      },
      state: {
        type: "string",
        example: "NY",
        description: "State or province",
      },
      country: {
        type: "string",
        example: "India",
        description: "Country name",
        default: "India",
      },
      is_active: {
        type: "boolean",
        example: true,
        description: "Whether this temporary address is currently active",
      },
      expires_at: {
        type: "string",
        format: "date-time",
        example: "2024-12-31T23:59:59.000Z",
        description: "Expiration date for this temporary address",
      },
      created_at: {
        type: "string",
        format: "date-time",
        example: "2024-01-01T00:00:00.000Z",
        description: "Temporary address creation timestamp",
      },
      updated_at: {
        type: "string",
        format: "date-time",
        example: "2024-01-01T00:00:00.000Z",
        description: "Temporary address update timestamp",
      },
    },
  },
  WorkProfile: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        description: "Unique work profile identifier",
      },
      userId: {
        type: "string",
        format: "uuid",
        description: "User identifier",
      },
      jobTitle: {
        type: "string",
        example: "Software Engineer",
        description: "Current job title",
      },
      company: {
        type: "string",
        example: "Tech Corp",
        description: "Current company",
      },
      industry: {
        type: "string",
        example: "Technology",
        description: "Industry sector",
      },
      experience: {
        type: "integer",
        example: 5,
        description: "Years of experience",
      },
      skills: {
        type: "array",
        items: {
          $ref: "#/components/schemas/Skill",
        },
        description: "Professional skills",
      },
      portfolio: {
        type: "string",
        example: "https://portfolio.example.com",
        description: "Portfolio website URL",
      },
      linkedin: {
        type: "string",
        example: "https://linkedin.com/in/johndoe",
        description: "LinkedIn profile URL",
      },
      github: {
        type: "string",
        example: "https://github.com/johndoe",
        description: "GitHub profile URL",
      },
      resume: {
        type: "string",
        example: "/uploads/resumes/johndoe_resume.pdf",
        description: "Resume file URL",
      },
      hourlyRate: {
        type: "number",
        format: "double",
        example: 75.00,
        description: "Hourly rate for freelance work",
      },
      availability: {
        type: "string",
        enum: ["available", "busy", "unavailable"],
        example: "available",
        description: "Current availability status",
      },
      workPreference: {
        type: "string",
        enum: ["remote", "onsite", "hybrid"],
        example: "remote",
        description: "Work location preference",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Work profile creation timestamp",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Work profile update timestamp",
      },
    },
  },
  PaginationResponse: {
    type: "object",
    properties: {
      page: {
        type: "integer",
        example: 1,
        description: "Current page number",
      },
      limit: {
        type: "integer",
        example: 20,
        description: "Number of items per page",
      },
      total: {
        type: "integer",
        example: 100,
        description: "Total number of items",
      },
      totalPages: {
        type: "integer",
        example: 5,
        description: "Total number of pages",
      },
      hasNext: {
        type: "boolean",
        example: true,
        description: "Whether there are more pages",
      },
      hasPrev: {
        type: "boolean",
        example: false,
        description: "Whether there are previous pages",
      },
    },
  },
  SuccessResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: true,
        description: "Request success status",
      },
      message: {
        type: "string",
        example: "Operation completed successfully",
        description: "Success message",
      },
      requestId: {
        type: "string",
        format: "uuid",
        description: "Unique request identifier",
      },
      timestamp: {
        type: "string",
        format: "date-time",
        description: "Response timestamp",
      },
    },
  },
};