/**
 * Monitoring and Observability Configuration
 * Sentry, metrics, health checks
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import logger from '../utils/logger.js';

/**
 * Initialize Sentry error monitoring
 */
export const initSentry = (app) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [
        // Performance monitoring
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        new ProfilingIntegration(),
      ],
      // Performance sampling
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),

      // Filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive headers
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers['x-organization-id'];
          }
        }

        // Scrub patient data from error messages
        if (event.message) {
          event.message = event.message.replace(/\b\d{11}\b/g, '[FODSELSNUMMER_REDACTED]');
        }

        return event;
      },

      ignoreErrors: [
        // Ignore common browser errors
        'Non-Error promise rejection captured',
        'ResizeObserver loop limit exceeded',
      ],
    });

    logger.info('✓ Sentry monitoring initialized');
  }
};

/**
 * Sentry request handler (must be first middleware)
 */
export const sentryRequestHandler = () => Sentry.Handlers.requestHandler();

/**
 * Sentry tracing handler
 */
export const sentryTracingHandler = () => Sentry.Handlers.tracingHandler();

/**
 * Sentry error handler (must be before other error handlers)
 */
export const sentryErrorHandler = () => Sentry.Handlers.errorHandler();

/**
 * Enhanced health check with detailed status
 */
export const healthCheckDetailed = async (req, res) => {
  const { healthCheck: dbHealthCheck } = await import('../config/database.js');

  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    uptime: process.uptime(),
    version: process.env.npm_package_version || '2.0.0',
    environment: process.env.NODE_ENV,
    services: {
      database: {
        status: 'unknown',
        responseTime: null
      },
      redis: {
        status: 'not_configured',
        responseTime: null
      },
      sentry: {
        status: process.env.SENTRY_DSN ? 'configured' : 'not_configured'
      }
    },
    system: {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      cpu: {
        loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0]
      }
    }
  };

  // Check database
  try {
    const dbStart = Date.now();
    const dbHealthy = await dbHealthCheck();
    checks.services.database.responseTime = Date.now() - dbStart;
    checks.services.database.status = dbHealthy ? 'healthy' : 'unhealthy';
    if (!dbHealthy) {
      checks.status = 'degraded';
    }
  } catch (error) {
    checks.services.database.status = 'error';
    checks.services.database.error = error.message;
    checks.status = 'degraded';
  }

  // Check Redis (if configured)
  if (process.env.REDIS_URL) {
    try {
      // TODO: Implement Redis health check when Redis is added
      checks.services.redis.status = 'not_implemented';
    } catch (error) {
      checks.services.redis.status = 'error';
      checks.services.redis.error = error.message;
    }
  }

  const httpStatus = checks.status === 'healthy' ? 200 : 503;
  res.status(httpStatus).json(checks);
};

/**
 * Simple liveness probe
 */
export const livenessProbe = (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
};

/**
 * Readiness probe
 */
export const readinessProbe = async (req, res) => {
  const { healthCheck: dbHealthCheck } = await import('../config/database.js');

  try {
    const isReady = await dbHealthCheck();
    if (isReady) {
      res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ status: 'not_ready', reason: 'database_unavailable' });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      reason: 'database_error',
      error: error.message
    });
  }
};

/**
 * Metrics endpoint (Prometheus-compatible)
 */
export const metricsEndpoint = (req, res) => {
  // Basic metrics in Prometheus format
  const metrics = [];

  // Process metrics
  metrics.push(`# HELP nodejs_heap_size_total_bytes Total heap size in bytes`);
  metrics.push(`# TYPE nodejs_heap_size_total_bytes gauge`);
  metrics.push(`nodejs_heap_size_total_bytes ${process.memoryUsage().heapTotal}`);

  metrics.push(`# HELP nodejs_heap_size_used_bytes Used heap size in bytes`);
  metrics.push(`# TYPE nodejs_heap_size_used_bytes gauge`);
  metrics.push(`nodejs_heap_size_used_bytes ${process.memoryUsage().heapUsed}`);

  metrics.push(`# HELP nodejs_process_uptime_seconds Process uptime in seconds`);
  metrics.push(`# TYPE nodejs_process_uptime_seconds gauge`);
  metrics.push(`nodejs_process_uptime_seconds ${Math.floor(process.uptime())}`);

  res.setHeader('Content-Type', 'text/plain');
  res.send(metrics.join('\n'));
};

/**
 * Custom metric tracking
 */
export class MetricsCollector {
  constructor() {
    this.metrics = {
      httpRequests: 0,
      errors: 0,
      dbQueries: 0,
      slowQueries: 0
    };
  }

  incrementHttpRequest(method, path, statusCode) {
    this.metrics.httpRequests++;
    if (statusCode >= 500) {
      this.metrics.errors++;
    }
  }

  incrementDbQuery(duration) {
    this.metrics.dbQueries++;
    if (duration > 1000) {
      this.metrics.slowQueries++;
    }
  }

  getMetrics() {
    return this.metrics;
  }

  reset() {
    this.metrics = {
      httpRequests: 0,
      errors: 0,
      dbQueries: 0,
      slowQueries: 0
    };
  }
}

export const metricsCollector = new MetricsCollector();

export default {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  healthCheckDetailed,
  livenessProbe,
  readinessProbe,
  metricsEndpoint,
  metricsCollector
};
