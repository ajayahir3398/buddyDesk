/**
 * Health check routes
 * Provides endpoints for monitoring application and database status
 */

const express = require('express');
const router = express.Router();
const db = require('../models');
const logger = require('../utils/logger');

// Basic health check
router.get('/', async (req, res) => {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: 'connected'
    };

    logger.info('Health check passed', { requestId: req.requestId });
    
    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      data: healthData
    });
  } catch (error) {
    logger.error('Health check failed', { 
      requestId: req.requestId, 
      error: error.message 
    });
    
    res.status(503).json({
      success: false,
      message: 'Service is unhealthy',
      data: {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: 'disconnected',
        error: error.message
      }
    });
  }
});

// Detailed health check with more information
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test database connection
    await db.sequelize.authenticate();
    const dbResponseTime = Date.now() - startTime;
    
    const detailedHealthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: 'connected',
        responseTime: `${dbResponseTime}ms`
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    logger.info('Detailed health check passed', { 
      requestId: req.requestId,
      dbResponseTime 
    });
    
    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      data: detailedHealthData
    });
  } catch (error) {
    logger.error('Detailed health check failed', { 
      requestId: req.requestId, 
      error: error.message 
    });
    
    res.status(503).json({
      success: false,
      message: 'Service is unhealthy',
      data: {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: 'disconnected',
          error: error.message
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        },
        process: {
          pid: process.pid,
          nodeVersion: process.version,
          platform: process.platform
        }
      }
    });
  }
});

module.exports = router; 