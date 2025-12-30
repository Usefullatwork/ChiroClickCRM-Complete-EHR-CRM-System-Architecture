/**
 * Database Query Optimizer
 * Tools for analyzing and optimizing PostgreSQL queries
 */

import { query } from '../config/database.js';
import logger from './logger.js';

/**
 * Analyze query performance with EXPLAIN ANALYZE
 * @param {string} sqlQuery - SQL query to analyze
 * @param {array} params - Query parameters
 * @returns {Promise<object>} Query plan and performance metrics
 */
export const analyzeQuery = async (sqlQuery, params = []) => {
  try {
    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlQuery}`;
    const result = await query(explainQuery, params);

    const plan = result.rows[0]['QUERY PLAN'][0];

    return {
      executionTime: plan['Execution Time'],
      planningTime: plan['Planning Time'],
      totalCost: plan.Plan['Total Cost'],
      actualRows: plan.Plan['Actual Rows'],
      plan: plan.Plan
    };
  } catch (error) {
    logger.error('Query analysis failed', { error: error.message });
    throw error;
  }
};

/**
 * Check if query uses indexes efficiently
 * @param {string} sqlQuery - SQL query to check
 * @param {array} params - Query parameters
 * @returns {Promise<object>} Index usage report
 */
export const checkIndexUsage = async (sqlQuery, params = []) => {
  const analysis = await analyzeQuery(sqlQuery, params);

  const findSeqScans = (node) => {
    const scans = [];

    if (node['Node Type'] === 'Seq Scan') {
      scans.push({
        table: node['Relation Name'],
        rows: node['Actual Rows'],
        cost: node['Total Cost']
      });
    }

    if (node.Plans) {
      node.Plans.forEach(child => {
        scans.push(...findSeqScans(child));
      });
    }

    return scans;
  };

  const sequentialScans = findSeqScans(analysis.plan);

  return {
    hasSeqScans: sequentialScans.length > 0,
    sequentialScans,
    recommendation: sequentialScans.length > 0
      ? 'Consider adding indexes to avoid sequential scans'
      : 'Query uses indexes efficiently'
  };
};

/**
 * Suggest missing indexes based on query patterns
 * @param {string} tableName - Table to analyze
 * @returns {Promise<array>} Suggested indexes
 */
export const suggestIndexes = async (tableName) => {
  try {
    // Get table statistics
    const statsQuery = `
      SELECT
        schemaname,
        tablename,
        seq_scan,
        seq_tup_read,
        idx_scan,
        idx_tup_fetch,
        n_tup_ins + n_tup_upd + n_tup_del as writes
      FROM pg_stat_user_tables
      WHERE tablename = $1
    `;

    const stats = await query(statsQuery, [tableName]);

    if (stats.rows.length === 0) {
      return { suggestions: [], message: 'Table not found or no statistics available' };
    }

    const tableStats = stats.rows[0];
    const suggestions = [];

    // High sequential scans suggest missing indexes
    if (tableStats.seq_scan > 1000 && tableStats.idx_scan < tableStats.seq_scan * 0.1) {
      suggestions.push({
        reason: 'High sequential scan ratio',
        recommendation: 'Analyze query patterns and add indexes on frequently filtered columns'
      });
    }

    // Get columns that might need indexes
    const columnsQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = $1
        AND column_name IN ('organization_id', 'patient_id', 'created_at', 'updated_at', 'status')
    `;

    const columns = await query(columnsQuery, [tableName]);

    // Check existing indexes
    const indexQuery = `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = $1
    `;

    const indexes = await query(indexQuery, [tableName]);
    const existingIndexes = indexes.rows.map(i => i.indexdef.toLowerCase());

    columns.rows.forEach(col => {
      const hasIndex = existingIndexes.some(idx =>
        idx.includes(`(${col.column_name})`) || idx.includes(`${col.column_name},`)
      );

      if (!hasIndex) {
        suggestions.push({
          column: col.column_name,
          type: col.data_type,
          suggestion: `CREATE INDEX idx_${tableName}_${col.column_name} ON ${tableName}(${col.column_name});`,
          reason: 'Common filter column without index'
        });
      }
    });

    return {
      table: tableName,
      stats: tableStats,
      suggestions
    };
  } catch (error) {
    logger.error('Index suggestion failed', { error: error.message });
    throw error;
  }
};

/**
 * Find slow queries from pg_stat_statements
 * Requires pg_stat_statements extension
 * @param {number} limit - Number of queries to return
 * @returns {Promise<array>} Slow queries
 */
export const findSlowQueries = async (limit = 10) => {
  try {
    const slowQueriesQuery = `
      SELECT
        substring(query, 1, 100) as query_preview,
        calls,
        total_exec_time,
        mean_exec_time,
        max_exec_time,
        rows,
        100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) AS cache_hit_ratio
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_exec_time DESC
      LIMIT $1
    `;

    const result = await query(slowQueriesQuery, [limit]);

    return result.rows.map(row => ({
      query: row.query_preview,
      avgExecutionTime: Math.round(row.mean_exec_time * 100) / 100,
      maxExecutionTime: Math.round(row.max_exec_time * 100) / 100,
      totalCalls: row.calls,
      cacheHitRatio: row.cache_hit_ratio ? Math.round(row.cache_hit_ratio * 100) / 100 : null
    }));
  } catch (error) {
    if (error.message.includes('pg_stat_statements')) {
      logger.warn('pg_stat_statements extension not installed');
      return [];
    }
    throw error;
  }
};

/**
 * Get database performance statistics
 * @returns {Promise<object>} Performance metrics
 */
export const getDatabaseStats = async () => {
  try {
    // Database size
    const sizeQuery = `
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    const size = await query(sizeQuery);

    // Connection stats
    const connectionsQuery = `
      SELECT
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
      WHERE pid <> pg_backend_pid()
    `;
    const connections = await query(connectionsQuery);

    // Cache hit ratio
    const cacheQuery = `
      SELECT
        sum(heap_blks_read) as heap_read,
        sum(heap_blks_hit) as heap_hit,
        sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
      FROM pg_statio_user_tables
    `;
    const cache = await query(cacheQuery);

    // Index usage
    const indexUsageQuery = `
      SELECT
        schemaname,
        tablename,
        idx_scan,
        seq_scan,
        CASE
          WHEN seq_scan + idx_scan = 0 THEN 0
          ELSE 100 * idx_scan / (seq_scan + idx_scan)
        END as index_usage_ratio
      FROM pg_stat_user_tables
      ORDER BY seq_scan DESC
      LIMIT 5
    `;
    const indexUsage = await query(indexUsageQuery);

    return {
      databaseSize: size.rows[0].size,
      connections: connections.rows[0],
      cacheHitRatio: cache.rows[0].cache_hit_ratio
        ? Math.round(cache.rows[0].cache_hit_ratio * 100) / 100
        : null,
      topSequentialScans: indexUsage.rows
    };
  } catch (error) {
    logger.error('Failed to get database stats', { error: error.message });
    throw error;
  }
};

export default {
  analyzeQuery,
  checkIndexUsage,
  suggestIndexes,
  findSlowQueries,
  getDatabaseStats
};
