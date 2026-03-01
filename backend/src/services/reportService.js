/**
 * Report Service
 * Generates weekly AI analytics digest emails
 * Queries ai_suggestions, ai_performance_metrics, and ai_api_usage tables
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import { sendEmail } from './emailService.js';

/**
 * Generate and send the weekly AI analytics digest
 * Aggregates last 7 days of AI usage data into an HTML report
 *
 * @returns {Promise<Object>} Report result with stats and HTML
 */
export const generateWeeklyAIDigest = async () => {
  logger.info('Generating weekly AI analytics digest...');

  const stats = {
    totalSuggestions: 0,
    approved: 0,
    modified: 0,
    rejected: 0,
    pending: 0,
    acceptanceRate: 0,
    avgLatencyMs: 0,
    avgConfidence: 0,
    redFlagsDetected: 0,
    topTaskTypes: [],
    costSummary: { totalUsd: 0, byProvider: [] },
  };

  // Query ai_suggestions for last 7 days
  try {
    const suggestionsResult = await query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN feedback_status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN feedback_status = 'MODIFIED' THEN 1 ELSE 0 END) as modified,
        SUM(CASE WHEN feedback_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN feedback_status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        ROUND(AVG(confidence_score)::numeric, 3) as avg_confidence,
        ROUND(AVG(request_duration_ms)::numeric, 0) as avg_latency_ms,
        SUM(CASE WHEN has_red_flags = true THEN 1 ELSE 0 END) as red_flags
      FROM ai_suggestions
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);

    const row = suggestionsResult.rows[0];
    if (row) {
      stats.totalSuggestions = parseInt(row.total) || 0;
      stats.approved = parseInt(row.approved) || 0;
      stats.modified = parseInt(row.modified) || 0;
      stats.rejected = parseInt(row.rejected) || 0;
      stats.pending = parseInt(row.pending) || 0;
      stats.avgConfidence = parseFloat(row.avg_confidence) || 0;
      stats.avgLatencyMs = parseInt(row.avg_latency_ms) || 0;
      stats.redFlagsDetected = parseInt(row.red_flags) || 0;

      const reviewed = stats.approved + stats.modified + stats.rejected;
      stats.acceptanceRate =
        reviewed > 0 ? Math.round(((stats.approved + stats.modified) / reviewed) * 100) : 0;
    }
  } catch (error) {
    logger.warn('Could not query ai_suggestions (table may not exist):', error.message);
  }

  // Query top task types
  try {
    const taskResult = await query(`
      SELECT
        suggestion_type,
        COUNT(*) as count,
        SUM(CASE WHEN feedback_status = 'APPROVED' THEN 1 ELSE 0 END) as approved
      FROM ai_suggestions
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY suggestion_type
      ORDER BY count DESC
      LIMIT 5
    `);
    stats.topTaskTypes = taskResult.rows.map((r) => ({
      type: r.suggestion_type,
      count: parseInt(r.count),
      approved: parseInt(r.approved),
    }));
  } catch (error) {
    logger.warn('Could not query task types:', error.message);
  }

  // Query ai_api_usage for cost summary
  try {
    const costResult = await query(`
      SELECT
        provider,
        COUNT(*) as requests,
        ROUND(SUM(cost_usd)::numeric, 4) as total_cost,
        SUM(input_tokens) as input_tokens,
        SUM(output_tokens) as output_tokens,
        ROUND(AVG(duration_ms)::numeric, 0) as avg_duration_ms
      FROM ai_api_usage
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY provider
      ORDER BY total_cost DESC
    `);

    stats.costSummary.byProvider = costResult.rows.map((r) => ({
      provider: r.provider,
      requests: parseInt(r.requests),
      totalCost: parseFloat(r.total_cost) || 0,
      inputTokens: parseInt(r.input_tokens) || 0,
      outputTokens: parseInt(r.output_tokens) || 0,
      avgDurationMs: parseInt(r.avg_duration_ms) || 0,
    }));
    stats.costSummary.totalUsd = stats.costSummary.byProvider.reduce(
      (sum, p) => sum + p.totalCost,
      0
    );
  } catch (error) {
    logger.warn('Could not query ai_api_usage (table may not exist):', error.message);
  }

  // Build HTML report
  const html = buildDigestHtml(stats);

  // Try to send email, fall back to logging
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM_EMAIL;

  if (adminEmail) {
    try {
      const result = await sendEmail({
        to: adminEmail,
        subject: `ChiroClickCRM — Ukentlig AI-rapport (${formatDateNO(sevenDaysAgo())} – ${formatDateNO(new Date())})`,
        html,
      });

      logger.info('Weekly AI digest sent', { to: adminEmail, success: result.success });
    } catch (emailError) {
      logger.warn('Could not send digest email (SMTP not configured), logging report instead');
      logger.info('Weekly AI Digest Report:', { stats });
    }
  } else {
    logger.info('No ADMIN_EMAIL configured. Weekly AI Digest logged:', { stats });
  }

  return { stats, html };
};

/**
 * Get a date 7 days ago
 */
const sevenDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
};

/**
 * Format a date in Norwegian locale
 */
const formatDateNO = (date) =>
  date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Build the HTML email template for the weekly digest
 */
const buildDigestHtml = (stats) => {
  const taskTypeRows = stats.topTaskTypes
    .map(
      (t) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${t.type}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${t.count}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${t.approved}</td>
        </tr>`
    )
    .join('');

  const costRows = stats.costSummary.byProvider
    .map(
      (p) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${p.provider}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${p.requests}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$${p.totalCost.toFixed(4)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${p.avgDurationMs}ms</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="nb">
<head><meta charset="utf-8"><title>Ukentlig AI-rapport</title></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:#0d9488;color:#fff;padding:24px 32px;">
      <h1 style="margin:0;font-size:22px;">Ukentlig AI-analyserapport</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:14px;">${formatDateNO(sevenDaysAgo())} – ${formatDateNO(new Date())}</p>
    </div>

    <!-- Summary Cards -->
    <div style="padding:24px 32px;">
      <h2 style="font-size:16px;color:#333;margin:0 0 16px;">Sammendrag</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:12px;background:#f0fdfa;border-radius:8px;text-align:center;width:33%;">
            <div style="font-size:28px;font-weight:bold;color:#0d9488;">${stats.totalSuggestions}</div>
            <div style="font-size:12px;color:#666;margin-top:4px;">Totalt forslag</div>
          </td>
          <td style="width:8px;"></td>
          <td style="padding:12px;background:#f0fdfa;border-radius:8px;text-align:center;width:33%;">
            <div style="font-size:28px;font-weight:bold;color:#0d9488;">${stats.acceptanceRate}%</div>
            <div style="font-size:12px;color:#666;margin-top:4px;">Godkjenningsrate</div>
          </td>
          <td style="width:8px;"></td>
          <td style="padding:12px;background:#f0fdfa;border-radius:8px;text-align:center;width:33%;">
            <div style="font-size:28px;font-weight:bold;color:#0d9488;">${stats.avgLatencyMs}</div>
            <div style="font-size:12px;color:#666;margin-top:4px;">Snitt latens (ms)</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Feedback Breakdown -->
    <div style="padding:0 32px 24px;">
      <h2 style="font-size:16px;color:#333;margin:0 0 12px;">Tilbakemeldinger</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:6px 0;color:#666;">Godkjent</td>
          <td style="padding:6px 0;text-align:right;font-weight:bold;color:#16a34a;">${stats.approved}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#666;">Modifisert</td>
          <td style="padding:6px 0;text-align:right;font-weight:bold;color:#ca8a04;">${stats.modified}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#666;">Avvist</td>
          <td style="padding:6px 0;text-align:right;font-weight:bold;color:#dc2626;">${stats.rejected}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#666;">Venter</td>
          <td style="padding:6px 0;text-align:right;font-weight:bold;color:#6b7280;">${stats.pending}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#666;">Snitt konfidens</td>
          <td style="padding:6px 0;text-align:right;font-weight:bold;">${stats.avgConfidence}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#666;">Rode flagg oppdaget</td>
          <td style="padding:6px 0;text-align:right;font-weight:bold;color:#dc2626;">${stats.redFlagsDetected}</td>
        </tr>
      </table>
    </div>

    <!-- Top Task Types -->
    ${
      stats.topTaskTypes.length > 0
        ? `
    <div style="padding:0 32px 24px;">
      <h2 style="font-size:16px;color:#333;margin:0 0 12px;">Topp oppgavetyper</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;font-weight:600;color:#666;">Type</th>
            <th style="padding:8px 12px;text-align:center;font-weight:600;color:#666;">Antall</th>
            <th style="padding:8px 12px;text-align:center;font-weight:600;color:#666;">Godkjent</th>
          </tr>
        </thead>
        <tbody>${taskTypeRows}</tbody>
      </table>
    </div>`
        : ''
    }

    <!-- Cost Summary -->
    ${
      stats.costSummary.byProvider.length > 0
        ? `
    <div style="padding:0 32px 24px;">
      <h2 style="font-size:16px;color:#333;margin:0 0 12px;">Kostnader</h2>
      <div style="background:#fef3c7;border-radius:8px;padding:12px 16px;margin-bottom:12px;">
        <span style="font-size:14px;color:#92400e;">Total kostnad denne uken: </span>
        <span style="font-size:18px;font-weight:bold;color:#92400e;">$${stats.costSummary.totalUsd.toFixed(4)}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;font-weight:600;color:#666;">Leverandor</th>
            <th style="padding:8px 12px;text-align:center;font-weight:600;color:#666;">Kall</th>
            <th style="padding:8px 12px;text-align:right;font-weight:600;color:#666;">Kostnad</th>
            <th style="padding:8px 12px;text-align:center;font-weight:600;color:#666;">Snitt tid</th>
          </tr>
        </thead>
        <tbody>${costRows}</tbody>
      </table>
    </div>`
        : ''
    }

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;font-size:12px;color:#9ca3af;">
      <p style="margin:0;">Generert automatisk av ChiroClickCRM</p>
      <p style="margin:4px 0 0;">${new Date().toLocaleString('nb-NO', { timeZone: 'Europe/Oslo' })}</p>
    </div>

  </div>
</body>
</html>`;
};

export default {
  generateWeeklyAIDigest,
};
