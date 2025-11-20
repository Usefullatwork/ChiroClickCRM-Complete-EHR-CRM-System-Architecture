import { healthCheckDetailed, livenessProbe, readinessProbe, metricsEndpoint, MetricsCollector } from '../../../src/config/monitoring.js';
import * as db from '../../../src/config/database.js';

jest.mock('../../../src/config/database.js');

describe('Monitoring Configuration', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn()
    };

    process.env.SENTRY_DSN = 'https://test@sentry.io/123';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('healthCheckDetailed', () => {
    it('should return healthy status when all services are up', async () => {
      db.healthCheck = jest.fn().mockResolvedValue(true);

      await healthCheckDetailed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          services: expect.objectContaining({
            database: expect.objectContaining({
              status: 'healthy'
            })
          })
        })
      );
    });

    it('should return degraded status when database is down', async () => {
      db.healthCheck = jest.fn().mockResolvedValue(false);

      await healthCheckDetailed(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'degraded',
          services: expect.objectContaining({
            database: expect.objectContaining({
              status: 'unhealthy'
            })
          })
        })
      );
    });

    it('should include system metrics', async () => {
      db.healthCheck = jest.fn().mockResolvedValue(true);

      await healthCheckDetailed(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.objectContaining({
            memory: expect.objectContaining({
              used: expect.any(Number),
              total: expect.any(Number),
              unit: 'MB'
            })
          })
        })
      );
    });

    it('should include uptime', async () => {
      db.healthCheck = jest.fn().mockResolvedValue(true);

      await healthCheckDetailed(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          uptime: expect.any(Number)
        })
      );
    });

    it('should handle database health check errors', async () => {
      db.healthCheck = jest.fn().mockRejectedValue(new Error('Connection timeout'));

      await healthCheckDetailed(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'degraded',
          services: expect.objectContaining({
            database: expect.objectContaining({
              status: 'error',
              error: 'Connection timeout'
            })
          })
        })
      );
    });
  });

  describe('livenessProbe', () => {
    it('should return alive status', () => {
      livenessProbe(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'alive',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('readinessProbe', () => {
    it('should return ready when database is healthy', async () => {
      db.healthCheck = jest.fn().mockResolvedValue(true);

      await readinessProbe(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ready'
        })
      );
    });

    it('should return not ready when database is down', async () => {
      db.healthCheck = jest.fn().mockResolvedValue(false);

      await readinessProbe(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'not_ready',
          reason: 'database_unavailable'
        })
      );
    });

    it('should handle database check errors', async () => {
      db.healthCheck = jest.fn().mockRejectedValue(new Error('Database error'));

      await readinessProbe(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'not_ready',
          reason: 'database_error',
          error: 'Database error'
        })
      );
    });
  });

  describe('metricsEndpoint', () => {
    it('should return Prometheus-compatible metrics', () => {
      metricsEndpoint(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(res.send).toHaveBeenCalledWith(
        expect.stringContaining('# HELP')
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.stringContaining('nodejs_heap_size_total_bytes')
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.stringContaining('nodejs_process_uptime_seconds')
      );
    });

    it('should include memory metrics', () => {
      metricsEndpoint(req, res);

      const metricsOutput = res.send.mock.calls[0][0];
      expect(metricsOutput).toContain('nodejs_heap_size_used_bytes');
      expect(metricsOutput).toMatch(/nodejs_heap_size_used_bytes \d+/);
    });

    it('should include uptime metric', () => {
      metricsEndpoint(req, res);

      const metricsOutput = res.send.mock.calls[0][0];
      expect(metricsOutput).toContain('nodejs_process_uptime_seconds');
      expect(metricsOutput).toMatch(/nodejs_process_uptime_seconds \d+/);
    });
  });

  describe('MetricsCollector', () => {
    let collector;

    beforeEach(() => {
      collector = new MetricsCollector();
    });

    it('should track HTTP requests', () => {
      collector.incrementHttpRequest('GET', '/api/patients', 200);
      collector.incrementHttpRequest('POST', '/api/patients', 201);

      const metrics = collector.getMetrics();
      expect(metrics.httpRequests).toBe(2);
    });

    it('should track errors', () => {
      collector.incrementHttpRequest('GET', '/api/patients', 500);
      collector.incrementHttpRequest('POST', '/api/patients', 503);

      const metrics = collector.getMetrics();
      expect(metrics.errors).toBe(2);
    });

    it('should track database queries', () => {
      collector.incrementDbQuery(50);
      collector.incrementDbQuery(100);
      collector.incrementDbQuery(200);

      const metrics = collector.getMetrics();
      expect(metrics.dbQueries).toBe(3);
    });

    it('should track slow queries', () => {
      collector.incrementDbQuery(500);
      collector.incrementDbQuery(1500); // Slow
      collector.incrementDbQuery(2000); // Slow

      const metrics = collector.getMetrics();
      expect(metrics.slowQueries).toBe(2);
    });

    it('should reset metrics', () => {
      collector.incrementHttpRequest('GET', '/api/patients', 200);
      collector.incrementDbQuery(100);

      collector.reset();

      const metrics = collector.getMetrics();
      expect(metrics.httpRequests).toBe(0);
      expect(metrics.dbQueries).toBe(0);
    });
  });
});
