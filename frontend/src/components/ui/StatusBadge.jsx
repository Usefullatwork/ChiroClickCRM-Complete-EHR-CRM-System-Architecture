import { CheckCircle2, Clock, XCircle, AlertTriangle, Pause, HelpCircle } from 'lucide-react';

/**
 * StatusBadge — Accessible status indicator with icon + color.
 *
 * Instead of color-only badges (which fail for colorblind users),
 * every status gets a unique icon alongside its color.
 */

const STATUS_CONFIG = {
  // Appointment statuses
  CONFIRMED: {
    icon: CheckCircle2,
    bg: 'bg-green-50',
    text: 'text-green-700',
    darkBg: 'dark:bg-green-900/30',
    darkText: 'dark:text-green-300',
  },
  PENDING: {
    icon: Clock,
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    darkBg: 'dark:bg-yellow-900/30',
    darkText: 'dark:text-yellow-300',
  },
  CANCELLED: {
    icon: XCircle,
    bg: 'bg-red-50',
    text: 'text-red-700',
    darkBg: 'dark:bg-red-900/30',
    darkText: 'dark:text-red-300',
  },
  COMPLETED: {
    icon: CheckCircle2,
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    darkBg: 'dark:bg-blue-900/30',
    darkText: 'dark:text-blue-300',
  },
  NO_SHOW: {
    icon: XCircle,
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    darkBg: 'dark:bg-gray-800',
    darkText: 'dark:text-gray-300',
  },
  IN_PROGRESS: {
    icon: Clock,
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    darkBg: 'dark:bg-teal-900/30',
    darkText: 'dark:text-teal-300',
  },
  // Patient lifecycle
  active: {
    icon: CheckCircle2,
    bg: 'bg-green-50',
    text: 'text-green-700',
    darkBg: 'dark:bg-green-900/30',
    darkText: 'dark:text-green-300',
  },
  overdue: {
    icon: AlertTriangle,
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    darkBg: 'dark:bg-orange-900/30',
    darkText: 'dark:text-orange-300',
  },
  at_risk: {
    icon: AlertTriangle,
    bg: 'bg-red-50',
    text: 'text-red-700',
    darkBg: 'dark:bg-red-900/30',
    darkText: 'dark:text-red-300',
  },
  inactive: {
    icon: Pause,
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    darkBg: 'dark:bg-gray-800',
    darkText: 'dark:text-gray-400',
  },
  new: {
    icon: HelpCircle,
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    darkBg: 'dark:bg-blue-900/30',
    darkText: 'dark:text-blue-300',
  },
};

const FALLBACK = {
  icon: HelpCircle,
  bg: 'bg-gray-50',
  text: 'text-gray-700',
  darkBg: 'dark:bg-gray-800',
  darkText: 'dark:text-gray-300',
};

export default function StatusBadge({
  status,
  label,
  size = 'sm',
  showIcon = true,
  className = '',
}) {
  const config = STATUS_CONFIG[status] || FALLBACK;
  const Icon = config.icon;
  const displayLabel = label || status;

  const sizeClasses = size === 'xs' ? 'text-xs px-1.5 py-0.5 gap-1' : 'text-xs px-2 py-1 gap-1.5';

  const iconSize = size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      role="status"
      aria-label={displayLabel}
      className={`inline-flex items-center font-medium rounded-full ${config.bg} ${config.text} ${config.darkBg} ${config.darkText} ${sizeClasses} ${className}`}
    >
      {showIcon && <Icon className={iconSize} aria-hidden="true" />}
      {displayLabel}
    </span>
  );
}

export { STATUS_CONFIG };
