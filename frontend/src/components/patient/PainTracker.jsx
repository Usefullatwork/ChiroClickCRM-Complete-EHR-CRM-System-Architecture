/**
 * Pain Tracker Component
 * Chart showing pain level over time with emoji faces
 *
 * Smertesporing komponent
 * Diagram som viser smerteniva over tid med emoji-ansikter
 */

import { useState, useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

// Pain level emoji faces (1-10 scale)
const painEmojis = {
  0: { emoji: '\u{1F60A}', label: 'Ingen smerte', color: '#22c55e' },
  1: { emoji: '\u{1F642}', label: 'Minimal', color: '#22c55e' },
  2: { emoji: '\u{1F642}', label: 'Liten', color: '#84cc16' },
  3: { emoji: '\u{1F610}', label: 'Mild', color: '#84cc16' },
  4: { emoji: '\u{1F610}', label: 'Moderat', color: '#eab308' },
  5: { emoji: '\u{1F615}', label: 'Middels', color: '#eab308' },
  6: { emoji: '\u{1F61F}', label: 'Merkbar', color: '#f97316' },
  7: { emoji: '\u{1F623}', label: 'Sterk', color: '#f97316' },
  8: { emoji: '\u{1F62B}', label: 'Intens', color: '#ef4444' },
  9: { emoji: '\u{1F62D}', label: 'Alvorlig', color: '#ef4444' },
  10: { emoji: '\u{1F631}', label: 'Verst mulig', color: '#dc2626' },
};

/**
 * Get pain info for a given level
 */
const getPainInfo = (level) => {
  const roundedLevel = Math.round(level);
  return painEmojis[Math.min(10, Math.max(0, roundedLevel))];
};

/**
 * PainTracker Component
 * Displays pain level tracking over time with visual indicators
 *
 * @param {Object} props - Component props
 * @param {Array} props.data - Pain history data array
 * @param {string} props.trend - Trend direction ('improving', 'worsening', 'stable')
 * @param {number} props.currentAvg - Current average pain level
 * @param {Function} props.onLogPain - Callback to log new pain entry
 * @returns {JSX.Element} Pain tracker component
 */
export default function PainTracker({ data = [], trend = 'stable', currentAvg = null, onLogPain }) {
  const [selectedPainLevel, setSelectedPainLevel] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [notes, setNotes] = useState('');

  /**
   * Process data for chart
   */
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('no-NO', {
        day: 'numeric',
        month: 'short',
      }),
      avgPain: parseFloat(item.avgPain),
    }));
  }, [data]);

  /**
   * Calculate statistics
   */
  const statistics = useMemo(() => {
    if (data.length === 0) {
      return {
        average: null,
        min: null,
        max: null,
        entries: 0,
      };
    }

    const values = data.map((d) => parseFloat(d.avgPain));
    return {
      average: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
      min: Math.min(...values).toFixed(1),
      max: Math.max(...values).toFixed(1),
      entries: data.reduce((sum, d) => sum + (d.entryCount || 1), 0),
    };
  }, [data]);

  /**
   * Get trend indicator
   */
  const getTrendIndicator = () => {
    switch (trend) {
      case 'improving':
        return {
          icon: <TrendingDown className="w-5 h-5 text-green-500" />,
          label: 'Forbedring',
          color: 'text-green-600 bg-green-50',
        };
      case 'worsening':
        return {
          icon: <TrendingUp className="w-5 h-5 text-red-500" />,
          label: 'Okning',
          color: 'text-red-600 bg-red-50',
        };
      default:
        return {
          icon: <Minus className="w-5 h-5 text-gray-500" />,
          label: 'Stabilt',
          color: 'text-gray-600 bg-gray-50',
        };
    }
  };

  /**
   * Custom tooltip for chart
   */
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const painLevel = payload[0].value;
      const painInfo = getPainInfo(painLevel);

      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{painInfo.emoji}</span>
            <div>
              <p className="font-semibold" style={{ color: painInfo.color }}>
                {painLevel.toFixed(1)} / 10
              </p>
              <p className="text-xs text-gray-500">{painInfo.label}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  /**
   * Handle pain level selection for logging
   */
  const handlePainSelect = (level) => {
    setSelectedPainLevel(level);
    setShowLogModal(true);
  };

  /**
   * Handle pain entry submission
   */
  const handleSubmitPain = () => {
    if (onLogPain && selectedPainLevel !== null) {
      onLogPain(selectedPainLevel, notes);
      setShowLogModal(false);
      setSelectedPainLevel(null);
      setNotes('');
    }
  };

  const trendInfo = getTrendIndicator();
  const currentPainInfo = currentAvg ? getPainInfo(parseFloat(currentAvg)) : null;

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="flex items-center justify-between">
        {currentPainInfo && (
          <div className="flex items-center gap-3">
            <span className="text-4xl">{currentPainInfo.emoji}</span>
            <div>
              <p className="text-2xl font-bold" style={{ color: currentPainInfo.color }}>
                {currentAvg} / 10
              </p>
              <p className="text-sm text-gray-500">{currentPainInfo.label}</p>
            </div>
          </div>
        )}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${trendInfo.color}`}>
          {trendInfo.icon}
          <span className="text-sm font-medium">{trendInfo.label}</span>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="painGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={3} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine y={7} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Area
                type="monotone"
                dataKey="avgPain"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#painGradient)"
                dot={{ fill: '#f97316', strokeWidth: 0, r: 4 }}
                activeDot={{ fill: '#f97316', strokeWidth: 2, stroke: '#fff', r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Ingen smertedata tilgjengelig</p>
            <p className="text-xs text-gray-400 mt-1">Registrer smerteniva for a se fremgang</p>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-lg font-semibold text-gray-900">{statistics.average || '-'}</p>
          <p className="text-xs text-gray-500">Gjennomsnitt</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-lg font-semibold text-green-600">{statistics.min || '-'}</p>
          <p className="text-xs text-gray-500">Laveste</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-lg font-semibold text-red-600">{statistics.max || '-'}</p>
          <p className="text-xs text-gray-500">Hoyeste</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-lg font-semibold text-gray-900">{statistics.entries}</p>
          <p className="text-xs text-gray-500">Registreringer</p>
        </div>
      </div>

      {/* Pain Level Selector */}
      {onLogPain && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Registrer smerteniva na</p>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
              const info = getPainInfo(level);
              return (
                <button
                  key={level}
                  onClick={() => handlePainSelect(level)}
                  className={`
                    flex flex-col items-center p-2 rounded-lg border-2 transition-all
                    hover:scale-105 hover:shadow-md
                    ${
                      selectedPainLevel === level
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  title={info.label}
                >
                  <span className="text-2xl">{info.emoji}</span>
                  <span className="text-xs font-medium mt-1" style={{ color: info.color }}>
                    {level}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pain Scale Legend */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
        <div className="flex items-center gap-1">
          <span className="text-lg">{painEmojis[0].emoji}</span>
          <span>Ingen smerte</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-lg">{painEmojis[5].emoji}</span>
          <span>Middels</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-lg">{painEmojis[10].emoji}</span>
          <span>Verst mulig</span>
        </div>
      </div>

      {/* Log Pain Modal */}
      {showLogModal && selectedPainLevel !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrer smerteniva</h3>

            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-6xl">{getPainInfo(selectedPainLevel).emoji}</span>
              <div className="text-center">
                <p
                  className="text-4xl font-bold"
                  style={{ color: getPainInfo(selectedPainLevel).color }}
                >
                  {selectedPainLevel}
                </p>
                <p className="text-sm text-gray-500">{getPainInfo(selectedPainLevel).label}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notater (valgfritt)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Beskriv smerten eller omstendigheter..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={handleSubmitPain}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Registrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
