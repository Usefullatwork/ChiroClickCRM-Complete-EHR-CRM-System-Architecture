import { useMemo } from 'react';

/**
 * KPIChart Component
 *
 * Simple chart component for visualizing KPI data
 * Supports line and bar charts
 * Pure CSS implementation (no chart library dependencies)
 */
export const KPIChart = ({ data = [], type = 'line', color = '#14b8a6', label = 'Value' }) => {
  // Normalize data for charting
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));
    const range = maxValue - minValue || 1;

    return data.map((item) => ({
      ...item,
      percentage: ((item.value - minValue) / range) * 100,
    }));
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p>Ingen data tilgjengelig</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));

  if (type === 'bar') {
    return (
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-2 h-64">
          {chartData.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full flex items-end justify-center relative"
                style={{ height: '200px' }}
              >
                <div
                  className="w-full rounded-t-lg transition-all duration-300 hover:opacity-80 relative group"
                  style={{
                    backgroundColor: color,
                    height: `${item.percentage}%`,
                    minHeight: '4px',
                  }}
                >
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {item.value}
                  </div>
                </div>
              </div>
              <span className="text-xs text-slate-600 font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
            <span className="text-sm text-slate-600">{label}</span>
          </div>
          <span className="text-sm font-semibold text-slate-700">Max: {maxValue}</span>
        </div>
      </div>
    );
  }

  // Line chart
  const svgWidth = 100;
  const svgHeight = 100;
  const points = chartData
    .map((item, index) => {
      const x = (index / (chartData.length - 1)) * svgWidth;
      const y = svgHeight - item.percentage;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="space-y-4">
      <div className="h-64 relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={y} x1="0" y1={y} x2={svgWidth} y2={y} stroke="#e2e8f0" strokeWidth="0.5" />
          ))}

          {/* Area under line */}
          <polygon
            points={`0,${svgHeight} ${points} ${svgWidth},${svgHeight}`}
            fill={color}
            fillOpacity="0.1"
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {chartData.map((item, index) => {
            const x = (index / (chartData.length - 1)) * svgWidth;
            const y = svgHeight - item.percentage;
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill="white"
                  stroke={color}
                  strokeWidth="2"
                  className="cursor-pointer hover:r-4 transition-all"
                >
                  <title>{`${item.label}: ${item.value}`}</title>
                </circle>
              </g>
            );
          })}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2">
          {chartData.map((item, index) => (
            <span
              key={index}
              className="text-xs text-slate-600 font-medium"
              style={{ width: `${100 / chartData.length}%`, textAlign: 'center' }}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
          <span className="text-sm text-slate-600">{label}</span>
        </div>
        <span className="text-sm font-semibold text-slate-700">Max: {maxValue}</span>
      </div>
    </div>
  );
};
