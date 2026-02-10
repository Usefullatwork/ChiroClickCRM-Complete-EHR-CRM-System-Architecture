/**
 * ChiroClickCRM Backend Server
 * Main application entry point
 */

import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { healthCheck } from './config/database.js';
import logger from './utils/logger.js';
import { scheduleKeyRotation, createKeyRotationTable } from './utils/keyRotation.js';
import { initializeScheduler, shutdownScheduler } from './jobs/scheduler.js';
import { initializeWebSocket, getIO } from './services/websocket.js';

// Load environment variables
const result = dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet());

// CORS configuration - supports multiple origins
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id', 'X-Dev-Bypass'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing (for session auth)
app.use(cookieParser());

// Compression
app.use(compression());

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
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
// SWAGGER API DOCS
// ============================================================================

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ChiroClickCRM API',
      version: '1.0.0',
      description: 'Norwegian EHR/CRM/PMS API for chiropractic practices',
    },
    servers: [{ url: `/api/${API_VERSION}` }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'session',
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
    database: dbHealthy ? 'connected' : 'disconnected',
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
      auth: `/api/${API_VERSION}/auth`,
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
      billing: `/api/${API_VERSION}/billing`,
      templates: `/api/${API_VERSION}/templates`,
      diagnosis: `/api/${API_VERSION}/diagnosis`,
      treatments: `/api/${API_VERSION}/treatments`,
      kpi: `/api/${API_VERSION}/kpi`,
      outcomes: `/api/${API_VERSION}/outcomes`,
      gdpr: `/api/${API_VERSION}/gdpr`,
      pdf: `/api/${API_VERSION}/pdf`,
      ai: `/api/${API_VERSION}/ai`,
      neuroexam: `/api/${API_VERSION}/neuroexam`,
      search: `/api/${API_VERSION}/search`,
      kiosk: `/api/${API_VERSION}/kiosk`,
      crm: `/api/${API_VERSION}/crm`,
      exercises: `/api/${API_VERSION}/exercises`,
      portal: `/api/${API_VERSION}/portal`,
      patientPortal: `/api/${API_VERSION}/patient-portal`,
      autoAccept: `/api/${API_VERSION}/auto-accept`,
      scheduler: `/api/${API_VERSION}/scheduler`,
      notifications: `/api/${API_VERSION}/notifications`,
      spineTemplates: `/api/${API_VERSION}/spine-templates`,
      clinicalSettings: `/api/${API_VERSION}/clinical-settings`,
      training: `/api/${API_VERSION}/training`,
      treatmentPlans: `/api/${API_VERSION}/treatment-plans`,
      macros: `/api/${API_VERSION}/macros`,
    },
  });
});

// Import and mount API routes
import authRoutes from './routes/auth.js';
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
import billingRoutes from './routes/billing.js';
import outcomeRoutes from './routes/outcomes.js';
import gdprRoutes from './routes/gdpr.js';
import pdfRoutes from './routes/pdf.js';
import organizationRoutes from './routes/organizations.js';
import userRoutes from './routes/users.js';
import aiRoutes from './routes/ai.js';
import trainingRoutes from './routes/training.js';
import templateRoutes from './routes/templates.js';
import neuroexamRoutes from './routes/neuroexam.js';
import docsRoutes from './routes/docs.js';
import searchRoutes from './routes/search.js';
import kioskRoutes from './routes/kiosk.js';
import crmRoutes from './routes/crm.js';
import bulkCommunicationRoutes from './routes/bulkCommunication.js';
import automationsRoutes from './routes/automations.js';
import exerciseRoutes from './routes/exercises.js';
import portalRoutes from './routes/portal.js';
import patientPortalRoutes from './routes/patientPortal.js';
import autoAcceptRoutes from './routes/autoAccept.js';
import schedulerRoutes from './routes/scheduler.js';
import progressRoutes from './routes/progress.js';
import notificationRoutes from './routes/notifications.js';
import spineTemplatesRoutes from './routes/spineTemplates.js';
import clinicalSettingsRoutes from './routes/clinicalSettings.js';
import treatmentPlanRoutes from './routes/treatmentPlans.js';
import macroRoutes from './routes/macros.js';

// Mount routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
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
app.use(`/api/${API_VERSION}/billing`, billingRoutes);
app.use(`/api/${API_VERSION}/outcomes`, outcomeRoutes);
app.use(`/api/${API_VERSION}/gdpr`, gdprRoutes);
app.use(`/api/${API_VERSION}/pdf`, pdfRoutes);
app.use(`/api/${API_VERSION}/organizations`, organizationRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/ai`, aiRoutes);
app.use(`/api/${API_VERSION}/training`, trainingRoutes);
app.use(`/api/${API_VERSION}/templates`, templateRoutes);
app.use(`/api/${API_VERSION}/neuroexam`, neuroexamRoutes);
app.use(`/api/${API_VERSION}/search`, searchRoutes);
app.use(`/api/${API_VERSION}/kiosk`, kioskRoutes);
app.use(`/api/${API_VERSION}/crm`, crmRoutes);
app.use(`/api/${API_VERSION}/bulk-communications`, bulkCommunicationRoutes);
app.use(`/api/${API_VERSION}/automations`, automationsRoutes);
app.use(`/api/${API_VERSION}/exercises`, exerciseRoutes);
app.use(`/api/${API_VERSION}/auto-accept`, autoAcceptRoutes);
app.use(`/api/${API_VERSION}/scheduler`, schedulerRoutes);
app.use(`/api/${API_VERSION}/progress`, progressRoutes);
app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);
app.use(`/api/${API_VERSION}/spine-templates`, spineTemplatesRoutes);
app.use(`/api/${API_VERSION}/clinical-settings`, clinicalSettingsRoutes);
app.use(`/api/${API_VERSION}/treatment-plans`, treatmentPlanRoutes);
app.use(`/api/${API_VERSION}/macros`, macroRoutes);

// Portal routes (public - no auth required for patient access)
app.use(`/api/${API_VERSION}/portal`, portalRoutes);
app.use(`/api/${API_VERSION}/patient-portal`, patientPortalRoutes);

// API Documentation (no auth required)
app.use('/api/docs', docsRoutes);

// ============================================================================
// DESKTOP MODE: Static file serving
// ============================================================================

if (process.env.DESKTOP_MODE === 'true') {
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.default.dirname(__filename);
  const frontendDist = path.default.resolve(__dirname, '../../frontend/dist');

  try {
    const fs = await import('fs');
    if (fs.default.existsSync(frontendDist)) {
      app.use(express.static(frontendDist));
      // SPA fallback - serve index.html for all non-API routes
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/') || req.path === '/health') {
          return next();
        }
        res.sendFile(path.default.join(frontendDist, 'index.html'));
      });
      logger.info(`Desktop mode: Serving frontend from ${frontendDist}`);
    }
  } catch (e) {
    logger.warn('Desktop mode: Frontend dist not found, API-only mode');
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
      path: req.path,
    });
  }
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  res.status(err.status || 500).json({
    error: err.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

let server;

if (process.env.NODE_ENV !== 'test') {
  try {
    server = httpServer.listen(PORT, async () => {
      logger.info(`🚀 ChiroClickCRM API Server started`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`📍 Port: ${PORT}`);
      logger.info(`📍 API Version: ${API_VERSION}`);
      logger.info(`📍 Health: http://localhost:${PORT}/health`);
      logger.info(`📍 API Root: http://localhost:${PORT}/api/${API_VERSION}`);

      // Initialize encryption key rotation
      try {
        await createKeyRotationTable();
        scheduleKeyRotation();
        logger.info('🔐 Encryption key rotation scheduler initialized');
      } catch (error) {
        logger.warn(
          '⚠️  Key rotation initialization skipped (table may not exist yet):',
          error.message
        );
      }

      // Initialize job scheduler for automated communications and workflows
      try {
        const schedulerResult = await initializeScheduler();
        logger.info(
          `📅 Job scheduler initialized (${schedulerResult.jobCount} jobs, timezone: ${schedulerResult.timezone})`
        );
      } catch (error) {
        logger.warn('⚠️  Job scheduler initialization skipped:', error.message);
      }

      // Initialize WebSocket server
      try {
        initializeWebSocket(httpServer);
        logger.info('WebSocket server initialized on same port');
      } catch (error) {
        logger.warn('WebSocket initialization skipped:', error.message);
      }
    });
    server.on('error', (e) => {
      logger.error('Server error:', e);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received, shutting down gracefully...`);

  // Stop scheduled jobs first
  try {
    shutdownScheduler();
    logger.info('Job scheduler stopped');
  } catch (error) {
    logger.warn('Error stopping scheduler:', error.message);
  }

  // Close WebSocket connections
  try {
    const wsIO = getIO();
    if (wsIO) {
      wsIO.close();
      logger.info('WebSocket server closed');
    }
  } catch (error) {
    logger.warn('Error closing WebSocket:', error.message);
  }

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      const { closePool } = await import('./config/database.js');
      const { closeRedis } = await import('./config/redis.js');
      await closePool();
      logger.info('Database connections closed');
      await closeRedis();
      logger.info('Redis connections closed');
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
