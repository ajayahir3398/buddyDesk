const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger.config');
const errorHandler = require('./middlewares/errorHandler');
const requestIdMiddleware = require('./middlewares/requestId');
const logger = require('./utils/logger');
const app = express();
const db = require("./models");

app.use(cookieParser());

// Body parsing middleware with larger limits for mobile uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware (must be first)
app.use(requestIdMiddleware);

app.use(cors());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Swagger UI setup
app.use('/api-docs', (req, res, next) => {
  // Disable CSP for swagger docs
  res.removeHeader('Content-Security-Policy');
  next();
}, swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'BuddyDesk API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    deepLinking: true,
    tryItOutEnabled: true,
    requestInterceptor: (request) => {
      if (!request.headers) {
        request.headers = {};
      }
      request.headers['Access-Control-Allow-Origin'] = '*';
      return request;
    }
  }
}));

// Security middleware (AFTER swagger setup)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
    },
  },
}));

// Sync DB
db.sequelize.sync()
  .then(() => {
    logger.info("Database synced successfully.");
  })
  .catch(err => {
    logger.error("DB Sync error:", err);
  });

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'BuddyDesk API Server', 
    status: 'running',
    documentation: '/api-docs',
    timestamp: new Date().toISOString()
  });
});

// Routes
const userRoutes = require('./routes/user.routes');
const skillsRoutes = require('./routes/skills.routes');
const postRoutes = require('./routes/post.routes');
const aadhaarRoutes = require('./routes/aadhaar.routes');
const healthRoutes = require('./routes/health.js');
const chatRoutes = require('./routes/chatRoutes');

app.use('/api/users', userRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/aadhaar', aadhaarRoutes);
app.use('/api/chat', chatRoutes);
app.use('/health', healthRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
