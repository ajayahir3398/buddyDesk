const swaggerJsdoc = require("swagger-jsdoc");

// Import modular Swagger components
const components = require('./swagger/components');
const schemas = require('./swagger/schemas');
const paths = require('./swagger/paths');

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
        url: "http://103.168.18.34:3000/api",
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
      ...components,
      schemas: schemas,
    },
    paths: paths,
  },
  apis: ["./routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
