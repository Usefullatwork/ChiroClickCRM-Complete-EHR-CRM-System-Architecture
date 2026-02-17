/**
 * Monitoring and Observability Configuration
 * Desktop standalone mode: local metrics and health checks only
 */

import logger from '../utils/logger.js';

/**
 * Initialize monitoring (no-op in desktop mode)
 */
export const initSentry = (_app) => {
  // Sentry removed for standalone desktop mode
  logger.info('Monitoring: desktop mode (local metrics only)');
};

/**
 * Request handler (pass-through)
 */
export const sentryRequestHandler = () => (req, res, next) => next();

/**
 * Tracing handler (pass-through)
 */
export const sentryTracingHandler = () => (req, res, next) => next();

/**
 * Error handler (pass-through)
 */
export const sentryErrorHandler = () => (err, req, res, next) => next(err);

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
        responseTime: null,
      },
    },
    system: {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    },
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
      error: error.message,
    });
  }
};

/**
 * Metrics endpoint (Prometheus-compatible)
 */
export const metricsEndpoint = (req, res) => {
  const metrics = [];

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
      slowQueries: 0,
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
      slowQueries: 0,
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
  metricsCollector,
};
