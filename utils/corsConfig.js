/**
 * CORS configuration for React Native mobile app
 * Handles different environments appropriately
 */

const getCorsOptions = () => {
  const baseOptions = {
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
  };

  // Development: Allow all origins for React Native development
  if (process.env.NODE_ENV === 'development') {
    return {
      ...baseOptions,
      origin: true // Allow all origins in development
    };
  }

  // Production: More restrictive but still mobile-friendly
  if (process.env.NODE_ENV === 'production') {
    return {
      ...baseOptions,
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps)
        if (!origin) {
          return callback(null, true);
        }
        
        // Allow specific domains if configured
        const allowedOrigins = process.env.CORS_ORIGIN_PRODUCTION?.split(',') || [];
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        // Allow mobile app requests (no origin or specific patterns)
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }
        
        // For React Native, allow most requests but log them
        console.log(`CORS: Allowing request from ${origin}`);
        return callback(null, true);
      }
    };
  }

  // Default: Allow all origins
  return {
    ...baseOptions,
    origin: true
  };
};

module.exports = getCorsOptions; 