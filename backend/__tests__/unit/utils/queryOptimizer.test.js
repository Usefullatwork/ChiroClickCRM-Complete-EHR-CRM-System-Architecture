import { analyzeQuery, checkIndexUsage, suggestIndexes, findSlowQueries, getDatabaseStats } from '../../../src/utils/queryOptimizer.js';
import * as db from '../../../src/config/database.js';

jest.mock('../../../src/config/database.js');

describe('Query Optimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeQuery', () => {
    it('should analyze query performance', async () => {
      const mockQueryPlan = {
        'QUERY PLAN': [{
          'Execution Time': 45.123,
          'Planning Time': 2.456,
          'Plan': {
            'Total Cost': 1250.50,
            'Actual Rows': 150,
            'Node Type': 'Seq Scan'
          }
        }]
      };

      db.query.mockResolvedValue({ rows: [mockQueryPlan] });

      const result = await analyzeQuery('SELECT * FROM patients WHERE organization_id = $1', ['org-123']);

      expect(result).toEqual({
        executionTime: 45.123,
        planningTime: 2.456,
        totalCost: 1250.50,
        actualRows: 150,
        plan: mockQueryPlan['QUERY PLAN'][0]['Plan']
      });
    });

    it('should handle query analysis errors', async () => {
      db.query.mockRejectedValue(new Error('Invalid query'));

      await expect(
        analyzeQuery('INVALID SQL', [])
      ).rejects.toThrow('Invalid query');
    });
  });

  describe('checkIndexUsage', () => {
    it('should detect sequential scans', async () => {
      const mockQueryPlan = {
        'QUERY PLAN': [{
          'Execution Time': 100,
          'Planning Time': 5,
          'Plan': {
            'Total Cost': 5000,
            'Actual Rows': 10000,
            'Node Type': 'Seq Scan',
            'Relation Name': 'patients'
          }
        }]
      };

      db.query.mockResolvedValue({ rows: [mockQueryPlan] });

      const result = await checkIndexUsage('SELECT * FROM patients', []);

      expect(result.hasSeqScans).toBe(true);
      expect(result.sequentialScans).toHaveLength(1);
      expect(result.sequentialScans[0].table).toBe('patients');
      expect(result.recommendation).toContain('Consider adding indexes');
    });

    it('should confirm efficient index usage', async () => {
      const mockQueryPlan = {
        'QUERY PLAN': [{
          'Execution Time': 10,
          'Planning Time': 1,
          'Plan': {
            'Total Cost': 100,
            'Actual Rows': 50,
            'Node Type': 'Index Scan',
            'Index Name': 'idx_patients_org_id'
          }
        }]
      };

      db.query.mockResolvedValue({ rows: [mockQueryPlan] });

      const result = await checkIndexUsage('SELECT * FROM patients WHERE organization_id = $1', ['org-123']);

      expect(result.hasSeqScans).toBe(false);
      expect(result.recommendation).toContain('uses indexes efficiently');
    });

    it('should detect nested sequential scans', async () => {
      const mockQueryPlan = {
        'QUERY PLAN': [{
          'Execution Time': 200,
          'Planning Time': 10,
          'Plan': {
            'Total Cost': 10000,
            'Actual Rows': 5000,
            'Node Type': 'Hash Join',
            'Plans': [
              {
                'Node Type': 'Seq Scan',
                'Relation Name': 'patients',
                'Actual Rows': 1000,
                'Total Cost': 5000
              },
              {
                'Node Type': 'Seq Scan',
                'Relation Name': 'encounters',
                'Actual Rows': 4000,
                'Total Cost': 5000
              }
            ]
          }
        }]
      };

      db.query.mockResolvedValue({ rows: [mockQueryPlan] });

      const result = await checkIndexUsage('SELECT * FROM patients JOIN encounters ON ...', []);

      expect(result.sequentialScans).toHaveLength(2);
      expect(result.sequentialScans[0].table).toBe('patients');
      expect(result.sequentialScans[1].table).toBe('encounters');
    });
  });

  describe('suggestIndexes', () => {
    it('should suggest indexes for high sequential scan tables', async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [{
            tablename: 'patients',
            seq_scan: 10000,
            seq_tup_read: 1000000,
            idx_scan: 100,
            idx_tup_fetch: 5000,
            writes: 500
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            { column_name: 'organization_id', data_type: 'uuid' },
            { column_name: 'created_at', data_type: 'timestamp' }
          ]
        })
        .mockResolvedValueOnce({
          rows: [
            { indexname: 'patients_pkey', indexdef: 'CREATE UNIQUE INDEX patients_pkey ON patients(id)' }
          ]
        });

      const result = await suggestIndexes('patients');

      expect(result.table).toBe('patients');
      expect(result.suggestions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            column: 'organization_id',
            suggestion: expect.stringContaining('CREATE INDEX')
          })
        ])
      );
    });

    it('should not suggest indexes for columns already indexed', async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [{
            tablename: 'patients',
            seq_scan: 5000,
            idx_scan: 1000
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            { column_name: 'organization_id', data_type: 'uuid' }
          ]
        })
        .mockResolvedValueOnce({
          rows: [
            {
              indexname: 'idx_patients_org',
              indexdef: 'CREATE INDEX idx_patients_org ON patients(organization_id)'
            }
          ]
        });

      const result = await suggestIndexes('patients');

      const orgIdSuggestions = result.suggestions.filter(s => s.column === 'organization_id');
      expect(orgIdSuggestions).toHaveLength(0);
    });

    it('should handle non-existent tables', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await suggestIndexes('non_existent_table');

      expect(result.message).toContain('Table not found');
    });
  });

  describe('findSlowQueries', () => {
    it('should return top slow queries', async () => {
      db.query.mockResolvedValue({
        rows: [
          {
            query_preview: 'SELECT * FROM patients WHERE organization_id = $1',
            calls: 1500,
            total_exec_time: 75000,
            mean_exec_time: 50,
            max_exec_time: 200,
            rows: 150000,
            cache_hit_ratio: 85.5
          },
          {
            query_preview: 'SELECT * FROM clinical_encounters JOIN patients...',
            calls: 500,
            total_exec_time: 25000,
            mean_exec_time: 50,
            max_exec_time: 150,
            rows: 50000,
            cache_hit_ratio: 90.2
          }
        ]
      });

      const result = await findSlowQueries(10);

      expect(result).toHaveLength(2);
      expect(result[0].query).toContain('patients');
      expect(result[0].avgExecutionTime).toBe(50);
      expect(result[0].cacheHitRatio).toBe(85.5);
    });

    it('should handle missing pg_stat_statements extension', async () => {
      db.query.mockRejectedValue(new Error('relation "pg_stat_statements" does not exist'));

      const result = await findSlowQueries(10);

      expect(result).toEqual([]);
    });

    it('should limit results', async () => {
      db.query.mockResolvedValue({
        rows: Array(20).fill({
          query_preview: 'SELECT...',
          calls: 100,
          mean_exec_time: 25,
          max_exec_time: 100,
          cache_hit_ratio: 80
        })
      });

      const result = await findSlowQueries(5);

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        [5]
      );
    });
  });

  describe('getDatabaseStats', () => {
    it('should return comprehensive database statistics', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ size: '1024 MB' }] })
        .mockResolvedValueOnce({
          rows: [{
            total_connections: 15,
            active_connections: 5,
            idle_connections: 10
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            heap_read: 1000,
            heap_hit: 9000,
            cache_hit_ratio: 90
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            {
              schemaname: 'public',
              tablename: 'patients',
              idx_scan: 5000,
              seq_scan: 500,
              index_usage_ratio: 90.91
            }
          ]
        });

      const result = await getDatabaseStats();

      expect(result.databaseSize).toBe('1024 MB');
      expect(result.connections.total_connections).toBe(15);
      expect(result.cacheHitRatio).toBe(90);
      expect(result.topSequentialScans).toHaveLength(1);
    });

    it('should handle database stats errors', async () => {
      db.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(getDatabaseStats()).rejects.toThrow('Database connection failed');
    });

    it('should handle null cache hit ratio', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ size: '512 MB' }] })
        .mockResolvedValueOnce({ rows: [{ total_connections: 10 }] })
        .mockResolvedValueOnce({
          rows: [{
            heap_read: null,
            heap_hit: null,
            cache_hit_ratio: null
          }]
        })
        .mockResolvedValueOnce({ rows: [] });

      const result = await getDatabaseStats();

      expect(result.cacheHitRatio).toBeNull();
    });
  });
});
