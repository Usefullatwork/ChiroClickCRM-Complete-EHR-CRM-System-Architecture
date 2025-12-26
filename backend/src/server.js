/**
 * ChiroClickCRM Backend Server
 * Main application entry point
 */

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { healthCheck } from './config/database.js';
import logger from './utils/logger.js';
import { csrfProtection } from './middleware/csrf.js';
import cookieParser from 'cookie-parser';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser (required for CSRF)
app.use(cookieParser());

// CSRF Protection (Double Submit Cookie pattern)
if (process.env.NODE_ENV === 'production' || process.env.CSRF_ENABLED === 'true') {
  app.use(csrfProtection());
  logger.info('✓ CSRF protection enabled');
}

// Compression
app.use(compression());

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(`/api/${API_VERSION}`, limiter);

// ============================================================================
// ROUTES
// ============================================================================

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealthy = await healthCheck();

  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: API_VERSION,
    database: dbHealthy ? 'connected' : 'disconnected'
  });
});

// API root
app.get(`/api/${API_VERSION}`, (req, res) => {
  res.json({
    message: 'ChiroClickCRM API',
    version: API_VERSION,
    documentation: '/api/docs',
    endpoints: {
      health: '/health',
      dashboard: `/api/${API_VERSION}/dashboard`,
      import: `/api/${API_VERSION}/import`,
      organizations: `/api/${API_VERSION}/organizations`,
      users: `/api/${API_VERSION}/users`,
      patients: `/api/${API_VERSION}/patients`,
      encounters: `/api/${API_VERSION}/encounters`,
      appointments: `/api/${API_VERSION}/appointments`,
      communications: `/api/${API_VERSION}/communications`,
      followups: `/api/${API_VERSION}/followups`,
      financial: `/api/${API_VERSION}/financial`,
      templates: `/api/${API_VERSION}/templates`,
      diagnosis: `/api/${API_VERSION}/diagnosis`,
      treatments: `/api/${API_VERSION}/treatments`,
      kpi: `/api/${API_VERSION}/kpi`,
      outcomes: `/api/${API_VERSION}/outcomes`,
      gdpr: `/api/${API_VERSION}/gdpr`,
      pdf: `/api/${API_VERSION}/pdf`,
      ai: `/api/${API_VERSION}/ai`
    }
  });
});

// Import and mount API routes
import dashboardRoutes from './routes/dashboard.js';
import importRoutes from './routes/import.js';
import patientRoutes from './routes/patients.js';
import encounterRoutes from './routes/encounters.js';
import diagnosisRoutes from './routes/diagnosis.js';
import treatmentRoutes from './routes/treatments.js';
import appointmentRoutes from './routes/appointments.js';
import communicationRoutes from './routes/communications.js';
import kpiRoutes from './routes/kpi.js';
import followUpRoutes from './routes/followups.js';
import financialRoutes from './routes/financial.js';
import outcomeRoutes from './routes/outcomes.js';
import gdprRoutes from './routes/gdpr.js';
import pdfRoutes from './routes/pdf.js';
import organizationRoutes from './routes/organizations.js';
import userRoutes from './routes/users.js';
import aiRoutes from './routes/ai.js';
import trainingRoutes from './routes/training.js';
import templateRoutes from './routes/templates.js';

// Mount routes
app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);
app.use(`/api/${API_VERSION}/import`, importRoutes);
app.use(`/api/${API_VERSION}/patients`, patientRoutes);
app.use(`/api/${API_VERSION}/encounters`, encounterRoutes);
app.use(`/api/${API_VERSION}/diagnosis`, diagnosisRoutes);
app.use(`/api/${API_VERSION}/treatments`, treatmentRoutes);
app.use(`/api/${API_VERSION}/appointments`, appointmentRoutes);
app.use(`/api/${API_VERSION}/communications`, communicationRoutes);
app.use(`/api/${API_VERSION}/kpi`, kpiRoutes);
app.use(`/api/${API_VERSION}/followups`, followUpRoutes);
app.use(`/api/${API_VERSION}/financial`, financialRoutes);
app.use(`/api/${API_VERSION}/outcomes`, outcomeRoutes);
app.use(`/api/${API_VERSION}/gdpr`, gdprRoutes);
app.use(`/api/${API_VERSION}/pdf`, pdfRoutes);
app.use(`/api/${API_VERSION}/organizations`, organizationRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/ai`, aiRoutes);
app.use(`/api/${API_VERSION}/training`, trainingRoutes);
app.use(`/api/${API_VERSION}/templates`, templateRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(err.status || 500).json({
    error: err.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
  logger.info(`🚀 ChiroClickCRM API Server started`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`📍 Port: ${PORT}`);
  logger.info(`📍 API Version: ${API_VERSION}`);
  logger.info(`📍 Health: http://localhost:${PORT}/health`);
  logger.info(`📍 API Root: http://localhost:${PORT}/api/${API_VERSION}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received, shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      const { closePool } = await import('./config/database.js');
      await closePool();
      logger.info('Database connections closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;
