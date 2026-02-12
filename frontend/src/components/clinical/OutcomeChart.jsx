/**
 * OutcomeChart - Trend visualization for outcome measures
 * Uses recharts LineChart with color-coded severity zones
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Legend,
} from 'recharts';
import { TrendingUp, Filter } from 'lucide-react';
import { outcomesAPI } from '../../services/api';

const TYPE_COLORS = {
  ODI: '#0d9488',
  NDI: '#2563eb',
  VAS: '#dc2626',
  DASH: '#9333ea',
  NPRS: '#ea580c',
};

const TYPE_LABELS = {
  ODI: 'Oswestry (Low Back)',
  NDI: 'Neck Disability',
  VAS: 'Visual Analog',
  DASH: 'Arm/Shoulder/Hand',
  NPRS: 'Numeric Pain',
};

// Severity zones (percentage-based) for reference areas
const SEVERITY_ZONES = [
  { y1: 0, y2: 20, fill: '#dcfce7', label: 'Minimal' },
  { y1: 20, y2: 40, fill: '#fef9c3', label: 'Moderate' },
  { y1: 40, y2: 60, fill: '#fed7aa', label: 'Severe' },
  { y1: 60, y2: 100, fill: '#fecaca', label: 'Very Severe' },
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('nb-NO', { day: '2-digit', month: 'short' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
}

export default function OutcomeChart({ patientId, typeFilter }) {
  const [trendData, setTrendData] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    outcomesAPI
      .getPatientTrend(patientId, { type: typeFilter })
      .then((res) => {
        if (cancelled) return;
        setTrendData(res.data);
        // Auto-select all types present
        setSelectedTypes(Object.keys(res.data));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.error || err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patientId, typeFilter]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-800">Outcome Trends</h3>
        </div>
        <div className="flex items-center justify-center py-12 text-gray-400">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-600 border-t-transparent" />
          <span className="ml-2">Loading trend data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-800">Outcome Trends</h3>
        </div>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!trendData || Object.keys(trendData).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-800">Outcome Trends</h3>
        </div>
        <p className="text-sm text-gray-500">
          No outcome data recorded yet. Submit questionnaires above to track progress.
        </p>
      </div>
    );
  }

  // Build a unified dataset: merge all types into date-based rows
  const dateMap = {};
  for (const type of selectedTypes) {
    const points = trendData[type] || [];
    for (const pt of points) {
      const dateKey = formatDate(pt.date);
      if (!dateMap[dateKey]) dateMap[dateKey] = { date: dateKey, _ts: new Date(pt.date).getTime() };
      dateMap[dateKey][type] = pt.percentage;
    }
  }

  const chartData = Object.values(dateMap).sort((a, b) => a._ts - b._ts);
  const availableTypes = Object.keys(trendData);

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-800">Outcome Trends</h3>
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-gray-400" />
          {availableTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                selectedTypes.includes(type)
                  ? 'border-transparent text-white'
                  : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50'
              }`}
              style={selectedTypes.includes(type) ? { backgroundColor: TYPE_COLORS[type] } : {}}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            {/* Severity zones as background */}
            {SEVERITY_ZONES.map((zone, idx) => (
              <ReferenceArea
                key={idx}
                y1={zone.y1}
                y2={zone.y2}
                fill={zone.fill}
                fillOpacity={0.4}
              />
            ))}

            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{ value: '%', position: 'insideTopLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(value) => TYPE_LABELS[value] || value} iconType="circle" />

            {selectedTypes.map((type) => (
              <Line
                key={type}
                type="monotone"
                dataKey={type}
                name={type}
                stroke={TYPE_COLORS[type]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-gray-500 text-center py-8">
          Select at least one measure type to view trends.
        </p>
      )}

      {/* Severity legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 justify-center">
        {SEVERITY_ZONES.map((zone, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-sm inline-block"
              style={{ backgroundColor: zone.fill }}
            />
            {zone.label}
          </div>
        ))}
      </div>
    </div>
  );
}
