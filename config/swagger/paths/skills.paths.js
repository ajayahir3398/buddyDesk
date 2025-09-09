/**
 * Skills API Paths
 * Contains all skills-related API endpoint definitions
 */

module.exports = {
  "/skills": {
    get: {
      summary: "Get all skills",
      description: "Retrieve all available skills with optional filtering",
      tags: ["Skills"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "category",
          in: "query",
          schema: {
            type: "string",
          },
          description: "Filter by skill category",
        },
        {
          name: "search",
          in: "query",
          schema: {
            type: "string",
          },
          description: "Search skills by name",
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
          description: "Skills retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Skill",
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
      summary: "Create new skill",
      description: "Create a new skill (admin only)",
      tags: ["Skills"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "category"],
              properties: {
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
                description: {
                  type: "string",
                  description: "Skill description",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Skill created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    $ref: "#/components/schemas/Skill",
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
        403: {
          description: "Forbidden - Admin access required",
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
      description: "Retrieve a specific skill by its ID",
      tags: ["Skills"],
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
          description: "Skill ID",
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
                  data: {
                    $ref: "#/components/schemas/Skill",
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
      summary: "Update skill",
      description: "Update an existing skill (admin only)",
      tags: ["Skills"],
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
          description: "Skill ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Skill name",
                },
                category: {
                  type: "string",
                  description: "Skill category",
                },
                description: {
                  type: "string",
                  description: "Skill description",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Skill updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    $ref: "#/components/schemas/Skill",
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
          description: "Skill not found",
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
          description: "Forbidden - Admin access required",
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
      summary: "Delete skill",
      description: "Delete an existing skill (admin only)",
      tags: ["Skills"],
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
          description: "Skill ID",
        },
      ],
      responses: {
        200: {
          description: "Skill deleted successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SuccessResponse",
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
          description: "Forbidden - Admin access required",
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
      description: "Retrieve all sub-skills across all skills",
      tags: ["Skills"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "skillId",
          in: "query",
          schema: {
            type: "string",
            format: "uuid",
          },
          description: "Filter by parent skill ID",
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
          description: "Sub-skills retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/SubSkill",
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
  "/skills/sub-skills/{skillId}": {
    get: {
      summary: "Get sub-skills for a skill",
      description: "Retrieve all sub-skills for a specific skill",
      tags: ["Skills"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "skillId",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
          description: "Parent skill ID",
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
          description: "Sub-skills retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/SubSkill",
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
          description: "Skill not found",
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
      summary: "Create sub-skill",
      description: "Create a new sub-skill for a specific skill",
      tags: ["Skills"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "skillId",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
          description: "Parent skill ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name"],
              properties: {
                name: {
                  type: "string",
                  example: "React.js",
                  description: "Sub-skill name",
                },
                description: {
                  type: "string",
                  description: "Sub-skill description",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Sub-skill created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    $ref: "#/components/schemas/SubSkill",
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
          description: "Parent skill not found",
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