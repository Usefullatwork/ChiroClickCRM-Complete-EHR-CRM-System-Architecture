import { useState } from 'react';

/**
 * VASPainScale - Visual Analog Scale for pain assessment
 * Inspired by ChiroTouch's outcome assessments
 *
 * Features:
 * - Interactive slider with visual feedback
 * - Color-coded pain levels
 * - Emoji/face indicators
 * - Numerical display
 */
export default function VASPainScale({
  value,
  onChange,
  label = 'Pain Level',
  showFaces = true,
  showDescription = true,
  disabled = false,
  className = '',
}) {
  const [hoveredValue, setHoveredValue] = useState(null);

  const displayValue = hoveredValue !== null ? hoveredValue : value;

  const getPainColor = (val) => {
    if (val === null || val === undefined) {
      return 'bg-gray-200';
    }
    if (val <= 2) {
      return 'bg-green-500';
    }
    if (val <= 4) {
      return 'bg-yellow-400';
    }
    if (val <= 6) {
      return 'bg-orange-400';
    }
    if (val <= 8) {
      return 'bg-orange-600';
    }
    return 'bg-red-600';
  };

  const getPainDescription = (val) => {
    if (val === null || val === undefined) {
      return 'Not assessed';
    }
    if (val === 0) {
      return 'No pain';
    }
    if (val <= 2) {
      return 'Mild pain';
    }
    if (val <= 4) {
      return 'Moderate pain';
    }
    if (val <= 6) {
      return 'Moderately severe';
    }
    if (val <= 8) {
      return 'Severe pain';
    }
    return 'Worst possible pain';
  };

  const getPainFace = (val) => {
    if (val === null || val === undefined) {
      return '😐';
    }
    if (val === 0) {
      return '😊';
    }
    if (val <= 2) {
      return '🙂';
    }
    if (val <= 4) {
      return '😐';
    }
    if (val <= 6) {
      return '😕';
    }
    if (val <= 8) {
      return '😣';
    }
    return '😫';
  };

  const handleClick = (val) => {
    if (!disabled) {
      onChange(val);
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {value !== null && value !== undefined && (
          <span className={`px-2 py-1 text-sm font-bold rounded ${getPainColor(value)} text-white`}>
            {value}/10
          </span>
        )}
      </div>

      {/* Pain Scale Bar */}
      <div className="relative mb-3">
        {/* Background track */}
        <div className="h-10 bg-gradient-to-r from-green-500 via-yellow-400 via-orange-500 to-red-600 rounded-lg relative overflow-hidden">
          {/* Clickable segments */}
          <div className="absolute inset-0 flex">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
              <button
                key={val}
                type="button"
                disabled={disabled}
                onClick={() => handleClick(val)}
                onMouseEnter={() => setHoveredValue(val)}
                onMouseLeave={() => setHoveredValue(null)}
                className={`flex-1 h-full border-r border-white/20 last:border-r-0 transition-all ${
                  !disabled && 'hover:bg-white/20 cursor-pointer'
                } ${value === val ? 'ring-2 ring-white ring-inset' : ''}`}
                aria-label={`Pain level ${val}`}
              />
            ))}
          </div>

          {/* Selection indicator */}
          {value !== null && value !== undefined && (
            <div
              className="absolute top-0 h-full bg-white/40 transition-all"
              style={{ width: `${(value / 10) * 100}%` }}
            />
          )}
        </div>

        {/* Number labels */}
        <div className="flex justify-between mt-1 px-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
            <span
              key={val}
              className={`text-xs ${value === val ? 'font-bold text-blue-600' : 'text-gray-500'}`}
            >
              {val}
            </span>
          ))}
        </div>
      </div>

      {/* Face and description */}
      <div className="flex items-center justify-between">
        {showFaces && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getPainFace(displayValue)}</span>
          </div>
        )}
        {showDescription && (
          <span
            className={`text-sm font-medium ${
              displayValue !== null && displayValue !== undefined
                ? 'text-gray-900'
                : 'text-gray-400'
            }`}
          >
            {getPainDescription(displayValue)}
          </span>
        )}
      </div>

      {/* Quick select buttons */}
      <div className="mt-3 flex gap-1">
        {[0, 2, 4, 6, 8, 10].map((val) => (
          <button
            key={val}
            type="button"
            disabled={disabled}
            onClick={() => handleClick(val)}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${
              value === val
                ? `${getPainColor(val)} text-white`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * VASComparisonDisplay - Shows before/after pain comparison
 */
export function VASComparisonDisplay({ startValue, endValue, className = '' }) {
  const getChangeIndicator = () => {
    if (startValue === null || endValue === null) {
      return null;
    }
    const diff = startValue - endValue;
    if (diff > 0) {
      return { text: `↓ ${diff} points improved`, color: 'text-green-600 bg-green-50' };
    }
    if (diff < 0) {
      return { text: `↑ ${Math.abs(diff)} points worse`, color: 'text-red-600 bg-red-50' };
    }
    return { text: 'No change', color: 'text-gray-600 bg-gray-50' };
  };

  const change = getChangeIndicator();

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 mb-3">Pain Assessment</h4>

      <div className="grid grid-cols-2 gap-4 mb-3">
        {/* Start */}
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Before Treatment</div>
          <div
            className={`text-2xl font-bold ${
              startValue !== null ? 'text-gray-900' : 'text-gray-300'
            }`}
          >
            {startValue !== null ? `${startValue}/10` : '-'}
          </div>
        </div>

        {/* End */}
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">After Treatment</div>
          <div
            className={`text-2xl font-bold ${
              endValue !== null ? 'text-gray-900' : 'text-gray-300'
            }`}
          >
            {endValue !== null ? `${endValue}/10` : '-'}
          </div>
        </div>
      </div>

      {/* Change indicator */}
      {change && (
        <div className={`text-center py-2 rounded-lg font-medium text-sm ${change.color}`}>
          {change.text}
        </div>
      )}
    </div>
  );
}
