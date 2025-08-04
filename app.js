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

// Request ID middleware (must be first)
app.use(requestIdMiddleware);

// Security middleware
app.use(helmet());

// CORS configuration for React Native mobile app
const getCorsOptions = require('./utils/corsConfig');
const corsOptions = getCorsOptions();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Lively API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    deepLinking: true
  }
}));

// Sync DB
db.sequelize.sync()
  .then(() => {
    logger.info("Database synced successfully.");
  })
  .catch(err => {
    logger.error("DB Sync error:", err);
  });

// Routes
const userRoutes = require('./routes/user.routes');
const skillsRoutes = require('./routes/skills.routes');
const postRoutes = require('./routes/post.routes');
const healthRoutes = require('./routes/health.js');

app.use('/api/users', userRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/posts', postRoutes);
app.use('/health', healthRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
