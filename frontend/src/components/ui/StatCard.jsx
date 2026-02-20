import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

/**
 * StatCard — Standardized metric display card.
 *
 * @param {object}  props
 * @param {string}  props.label       — Metric name ("Today's Appointments")
 * @param {string|number} props.value — Display value ("142", "45k kr")
 * @param {React.ElementType} [props.icon] — Lucide icon component
 * @param {string}  [props.bgClass]   — Background class for icon container (e.g. "bg-blue-50")
 * @param {string}  [props.iconClass] — Text class for icon (e.g. "text-blue-600")
 * @param {number}  [props.trend]     — Percentage change vs previous period
 * @param {string}  [props.trendLabel] — Label for the trend ("vs last month")
 * @param {React.ReactNode} [props.sparkline] — Optional sparkline slot
 * @param {function} [props.onClick]  — Click handler
 * @param {string}  [props.className] — Additional classes
 */
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
}) {
  const TrendIcon = trend > 0 ? ArrowUp : trend < 0 ? ArrowDown : Minus;
  const trendColor =
    trend > 0
      ? 'text-green-600 dark:text-green-400'
      : trend < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-400';

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      data-testid="dashboard-stat-card"
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-soft-sm transition-all ${
        onClick ? 'hover:shadow-soft cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{value}</p>

          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
              <span className={`text-xs font-medium ${trendColor}`}>{Math.abs(trend)}%</span>
              {trendLabel && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={`w-12 h-12 rounded-lg ${bgClass} flex items-center justify-center flex-shrink-0 ml-4`}
          >
            <Icon className={`w-6 h-6 ${iconClass}`} />
          </div>
        )}
      </div>

      {sparkline && <div className="mt-3">{sparkline}</div>}
    </Wrapper>
  );
}
