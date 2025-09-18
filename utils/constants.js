/**
 * Application constants
 * Centralizes magic numbers and strings used throughout the application
 */

module.exports = {
  // Token types
  TOKEN_TYPES: {
    ACCESS: 'access',
    REFRESH: 'refresh'
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
    DEFAULT_PAGE: 1
  },

  // User validation
  USER: {
    MIN_AGE: 13,
    MAX_AGE: 120,
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 50,
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 128,
    MIN_PHONE_LENGTH: 10,
    MAX_PHONE_LENGTH: 20
  },

  // Email validation
  EMAIL: {
    MAX_LENGTH: 255
  },

  // HTTP status codes
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
  },

  // Database
  DB: {
    POOL_MAX: 5,
    POOL_MIN: 0,
    POOL_ACQUIRE: 60000,
    POOL_IDLE: 10000,
    RETRY_MAX: 3
  },

  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // File upload
  FILE_UPLOAD: {
    MAX_SIZE: 25 * 1024 * 1024, // 25MB (increased from 5MB as per docs)
    ALLOWED_TYPES: [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/jpg',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream'
    ],
    // File type categories for organization
    CATEGORIES: {
      IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'],
      AUDIO: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
      DOCUMENT: ['application/pdf'],
      ARCHIVE: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
    }
  },

  // Date formats
  DATE_FORMATS: {
    ISO: 'YYYY-MM-DD',
    DISPLAY: 'MM/DD/YYYY',
    DATETIME: 'YYYY-MM-DD HH:mm:ss'
  },

  // Gender options
  GENDER_OPTIONS: ['Male', 'Female', 'Other'],

  // Response messages
  MESSAGES: {
    SUCCESS: {
      USER_REGISTERED: 'User registered successfully',
      LOGIN_SUCCESS: 'Login successful',
      LOGOUT_SUCCESS: 'Logout successful',
      PROFILE_UPDATED: 'Profile updated successfully',
      PROFILE_RETRIEVED: 'Profile retrieved successfully',
      SKILLS_RETRIEVED: 'Skills retrieved successfully',
      SUB_SKILLS_RETRIEVED: 'Sub-skills retrieved successfully'
    },
    ERROR: {
      MISSING_TOKEN: 'Access token required',
      INVALID_TOKEN: 'Invalid access token',
      EXPIRED_TOKEN: 'Access token expired',
      REVOKED_TOKEN: 'Token has been revoked',
      INVALID_CREDENTIALS: 'Invalid email or password',
      EMAIL_EXISTS: 'Email already exists. Please use a different email address.',
      USER_NOT_FOUND: 'User not found',
      UNAUTHORIZED_ACCESS: 'You are not authorized to access this resource',
      VALIDATION_FAILED: 'Validation failed',
      INTERNAL_ERROR: 'Internal server error'
    }
  }
}; 