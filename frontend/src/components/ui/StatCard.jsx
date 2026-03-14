import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function StatCard({
  label,
  value,
  icon: Icon,
  bgClass = 'bg-teal-50',
  iconClass = 'text-teal-600',
  trend,
  trendLabel,
  sparkline,
  onClick,
  className = '',
  urgent = false,
}) {
  const TrendIcon = trend > 0 ? ArrowUp : trend < 0 ? ArrowDown : Minus;
  const trendColor =
    trend > 0
      ? 'text-green-600 dark:text-green-400'
      : trend < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-400 dark:text-gray-300';

  const Wrapper = onClick ? 'button' : 'div';
  const isUrgent = urgent && Number(value) > 0;

  return (
    <Wrapper
      data-testid="dashboard-stat-card"
      onClick={onClick}
      className={`rounded-xl p-5 transition-all relative ${
        isUrgent
          ? 'bg-gradient-to-br from-red-50/40 to-white dark:from-red-900/10 dark:to-gray-800 border-2 border-red-300 dark:border-red-700 shadow-soft-sm'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-soft-sm'
      } ${onClick ? 'hover:shadow-soft cursor-pointer' : ''} ${className}`}
    >
      {isUrgent && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
      )}

      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
          <p
            className={`text-2xl font-semibold mt-1 ${isUrgent ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}
          >
            {value}
          </p>

          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
              <span className={`text-xs font-medium ${trendColor}`}>{Math.abs(trend)}%</span>
              {trendLabel && (
                <span className="text-xs text-gray-400 dark:text-gray-300">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={`w-12 h-12 rounded-lg ${isUrgent ? 'bg-red-100 dark:bg-red-900/30' : bgClass} flex items-center justify-center flex-shrink-0 ml-4`}
          >
            <Icon
              className={`w-6 h-6 ${isUrgent ? 'text-red-600 dark:text-red-400' : iconClass}`}
            />
          </div>
        )}
      </div>

      {sparkline && <div className="mt-3">{sparkline}</div>}
    </Wrapper>
  );
}
