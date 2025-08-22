require('dotenv').config();

// Validate environment variables before starting the application
const validateEnvironment = require('./utils/validateEnv');

try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

const app = require("./app");
const http = require('http');
const { initializeSocket } = require('./config/socket.config');
const logger = require('./utils/logger');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Make io instance available to the app
app.set('io', io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔌 Socket.io server initialized`);
  }
  logger.info(`Server started on port ${PORT} with Socket.io support`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});
