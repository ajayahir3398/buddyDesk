/**
 * Environment variable validation
 * Ensures all required environment variables are present before starting the application
 */

const requiredEnvVars = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'DB_PORT'
];

const validateEnvironment = () => {
  const missingVars = [];

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  });

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  // Validate JWT_SECRET length for security
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long for security reasons.'
    );
  }

  // Validate database port is a number
  const dbPort = parseInt(process.env.DB_PORT);
  if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
    throw new Error('DB_PORT must be a valid port number (1-65535)');
  }

  console.log('✅ Environment variables validated successfully');
};

module.exports = validateEnvironment; 