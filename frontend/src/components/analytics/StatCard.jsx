/**
 * StatCard Component
 * Reusable stat display card with icon, value, and trend indicator
 *
 * @module components/analytics/StatCard
 */

import _React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * StatCard - Displays a single metric with optional trend
 *
 * @param {string} title - Card title (Norwegian)
 * @param {string|number} value - Main value to display
 * @param {string} subtitle - Optional subtitle text
 * @param {React.ElementType} icon - Lucide icon component
 * @param {string} iconColor - Icon background color class
 * @param {number} changePercent - Percentage change from previous period
 * @param {string} changeLabel - Label for the change (e.g., "vs forrige maned")
 * @param {'up'|'down'|'neutral'} trend - Direction of trend
 * @param {boolean} loading - Loading state
 * @param {string} className - Additional CSS classes
 */
export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'bg-blue-100 text-blue-600',
  changePercent,
  changeLabel = 'vs forrige maned',
  trend,
  loading = false,
  className = '',
}) => {
  // Determine trend direction if not provided
  const trendDirection =
    trend || (changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'neutral');

  // Trend color based on direction
  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  // Trend icon based on direction
  const TrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <TrendingUp size={16} className="text-green-600" />;
      case 'down':
        return <TrendingDown size={16} className="text-red-600" />;
      default:
        return <Minus size={16} className="text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>

          {/* Subtitle */}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}

          {/* Change indicator */}
          {changePercent !== undefined && (
            <div className="flex items-center gap-1.5 pt-1">
              <TrendIcon />
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {changePercent > 0 ? '+' : ''}
                {changePercent}%
              </span>
              <span className="text-xs text-gray-500">{changeLabel}</span>
            </div>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColor}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * StatCardGrid - Grid container for StatCards
 */
export const StatCardGrid = ({ children, columns = 4, className = '' }) => {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
    5: 'md:grid-cols-3 lg:grid-cols-5',
    6: 'md:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={`grid grid-cols-1 ${gridCols[columns] || gridCols[4]} gap-4 ${className}`}>
      {children}
    </div>
  );
};

/**
 * MiniStatCard - Compact version for sidebars or dense layouts
 */
export const MiniStatCard = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  changePercent,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg ${className}`}>
      {Icon && (
        <div
          className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm ${iconColor}`}
        >
          <Icon size={20} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 truncate">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-lg font-bold text-gray-900">{value}</p>
          {changePercent !== undefined && (
            <span
              className={`text-xs font-medium ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {changePercent >= 0 ? '+' : ''}
              {changePercent}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
