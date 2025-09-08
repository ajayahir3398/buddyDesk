/**
 * Swagger Components Configuration
 * Contains reusable components like security schemes and parameters
 */

module.exports = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "JWT token obtained from login endpoint",
    },
  },
  parameters: {
    // Common parameters can be added here
    pageParam: {
      name: "page",
      in: "query",
      schema: {
        type: "integer",
        minimum: 1,
        default: 1,
      },
      description: "Page number for pagination",
    },
    limitParam: {
      name: "limit",
      in: "query",
      schema: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        default: 20,
      },
      description: "Number of items per page",
    },
  },
};