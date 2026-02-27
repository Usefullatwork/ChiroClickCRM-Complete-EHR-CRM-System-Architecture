/**
 * AI Cost Dashboard
 * Admin dashboard showing Claude API spend vs budget, task breakdown,
 * cache hit rate, and provider comparison.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n';

const API_BASE = '/api/v1/ai-cost';

async function fetchJSON(path) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
  const data = await res.json();
  return data.success ? data.data : null;
}

function ProgressBar({ value, max, color = '#0d9488' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ background: '#e2e8f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
      <div
        style={{
          width: `${pct}%`,
          background: pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : color,
          height: '100%',
          borderRadius: 4,
          transition: 'width 0.3s',
        }}
      />
    </div>
  );
}

function StatCard({ label, value, subtitle, color }) {
  return (
    <div
      style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}
    >
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || '#1e293b' }}>{value}</div>
      {subtitle && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

export default function AICostDashboard() {
  const [budget, setBudget] = useState(null);
  const [costByTask, setCostByTask] = useState([]);
  const [cacheMetrics, setCacheMetrics] = useState([]);
  const [_trend, setTrend] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language } = useTranslation();

  const l = {
    no: {
      title: 'AI Kostnadsoversikt',
      budget: 'Budsjett',
      daily: 'Daglig',
      monthly: 'Månedlig',
      spent: 'Brukt',
      remaining: 'Gjenstående',
      taskBreakdown: 'Kostnader per oppgave',
      task: 'Oppgave',
      requests: 'Forespørsler',
      cost: 'Kostnad',
      avgCost: 'Gj.snitt',
      cacheEfficiency: 'Cache-effektivitet',
      model: 'Modell',
      hitRate: 'Treffrate',
      providerComparison: 'Leverandørsammenligning',
      provider: 'Leverandør',
      latency: 'Latens',
      tokens: 'Tokens',
      noData: 'Ingen data tilgjengelig',
      refresh: 'Oppdater',
    },
    en: {
      title: 'AI Cost Overview',
      budget: 'Budget',
      daily: 'Daily',
      monthly: 'Monthly',
      spent: 'Spent',
      remaining: 'Remaining',
      taskBreakdown: 'Cost by Task',
      task: 'Task',
      requests: 'Requests',
      cost: 'Cost',
      avgCost: 'Avg Cost',
      cacheEfficiency: 'Cache Efficiency',
      model: 'Model',
      hitRate: 'Hit Rate',
      providerComparison: 'Provider Comparison',
      provider: 'Provider',
      latency: 'Latency',
      tokens: 'Tokens',
      noData: 'No data available',
      refresh: 'Refresh',
    },
  }[language] || {
    no: {},
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [b, c, ca, t, p] = await Promise.all([
        fetchJSON('/budget'),
        fetchJSON('/by-task'),
        fetchJSON('/cache'),
        fetchJSON('/trend?days=30'),
        fetchJSON('/providers'),
      ]);
      if (b) {
        setBudget(b);
      }
      if (c) {
        setCostByTask(c);
      }
      if (ca) {
        setCacheMetrics(ca);
      }
      if (t) {
        setTrend(t);
      }
      if (p) {
        setProviders(p);
      }
    } catch (err) {
      // Silent fail — dashboard shows "no data"
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{l.title}</h2>
        <button
          onClick={loadData}
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          {l.refresh}
        </button>
      </div>

      {/* Budget Cards */}
      {budget && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              padding: 16,
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              background: '#fff',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              {l.daily} {l.budget}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: '#64748b',
                marginBottom: 4,
              }}
            >
              <span>
                {l.spent}: ${budget.daily.spent.toFixed(2)}
              </span>
              <span>
                {l.remaining}: ${budget.daily.remaining.toFixed(2)}
              </span>
            </div>
            <ProgressBar value={budget.daily.spent} max={budget.daily.budget} />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              {budget.daily.percentUsed}% of ${budget.daily.budget}
            </div>
          </div>
          <div
            style={{
              padding: 16,
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              background: '#fff',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              {l.monthly} {l.budget}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: '#64748b',
                marginBottom: 4,
              }}
            >
              <span>
                {l.spent}: ${budget.monthly.spent.toFixed(2)}
              </span>
              <span>
                {l.remaining}: ${budget.monthly.remaining.toFixed(2)}
              </span>
            </div>
            <ProgressBar value={budget.monthly.spent} max={budget.monthly.budget} />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              {budget.monthly.percentUsed}% of ${budget.monthly.budget}
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard
          label={l.requests}
          value={costByTask.reduce((s, r) => s + parseInt(r.request_count || 0), 0)}
        />
        <StatCard
          label={`${l.cost} (USD)`}
          value={`$${costByTask.reduce((s, r) => s + parseFloat(r.total_cost_usd || 0), 0).toFixed(2)}`}
          color="#0d9488"
        />
        <StatCard
          label={l.tokens}
          value={costByTask
            .reduce(
              (s, r) =>
                s + parseInt(r.total_input_tokens || 0) + parseInt(r.total_output_tokens || 0),
              0
            )
            .toLocaleString()}
        />
        <StatCard
          label={l.hitRate}
          value={cacheMetrics.length > 0 ? `${cacheMetrics[0].cache_hit_rate_pct || 0}%` : 'N/A'}
        />
      </div>

      {/* Task Breakdown Table */}
      <div
        style={{
          marginBottom: 24,
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {l.taskBreakdown}
        </div>
        {costByTask.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>{l.noData}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '8px 16px', textAlign: 'left' }}>{l.task}</th>
                <th style={{ padding: '8px 16px', textAlign: 'left' }}>{l.provider}</th>
                <th style={{ padding: '8px 16px', textAlign: 'right' }}>{l.requests}</th>
                <th style={{ padding: '8px 16px', textAlign: 'right' }}>{l.cost}</th>
                <th style={{ padding: '8px 16px', textAlign: 'right' }}>{l.avgCost}</th>
              </tr>
            </thead>
            <tbody>
              {costByTask.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 16px' }}>{row.task_type || '-'}</td>
                  <td style={{ padding: '8px 16px' }}>{row.provider}</td>
                  <td style={{ padding: '8px 16px', textAlign: 'right' }}>{row.request_count}</td>
                  <td style={{ padding: '8px 16px', textAlign: 'right' }}>
                    ${parseFloat(row.total_cost_usd).toFixed(4)}
                  </td>
                  <td style={{ padding: '8px 16px', textAlign: 'right' }}>
                    ${parseFloat(row.avg_cost_per_request).toFixed(6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Provider Comparison */}
      {providers.length > 0 && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
          <div
            style={{
              padding: '12px 16px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {l.providerComparison}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '8px 16px', textAlign: 'left' }}>{l.provider}</th>
                <th style={{ padding: '8px 16px', textAlign: 'right' }}>{l.requests}</th>
                <th style={{ padding: '8px 16px', textAlign: 'right' }}>{l.tokens}</th>
                <th style={{ padding: '8px 16px', textAlign: 'right' }}>{l.latency}</th>
                <th style={{ padding: '8px 16px', textAlign: 'right' }}>{l.cost}</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 16px', fontWeight: 500 }}>{row.provider}</td>
                  <td style={{ padding: '8px 16px', textAlign: 'right' }}>
                    {parseInt(row.total_requests).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 16px', textAlign: 'right' }}>
                    {parseInt(row.total_tokens).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 16px', textAlign: 'right' }}>
                    {row.avg_latency_ms}ms
                  </td>
                  <td style={{ padding: '8px 16px', textAlign: 'right' }}>
                    ${parseFloat(row.total_cost_usd).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
