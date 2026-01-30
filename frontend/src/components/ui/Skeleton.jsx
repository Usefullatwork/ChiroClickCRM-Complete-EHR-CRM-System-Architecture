/**
 * Skeleton Loading Components
 * Provides loading placeholders for various UI elements
 */

/**
 * Base skeleton element with shimmer animation
 */
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      {...props}
    />
  );
}

/**
 * Card skeleton for dashboard stats
 */
export function CardSkeleton({ className = '' }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="w-12 h-12 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Multiple card skeletons for stats grid
 */
export function StatsGridSkeleton({ count = 4, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Table row skeleton
 */
export function TableRowSkeleton({ columns = 6, className = '' }) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4 whitespace-nowrap">
          <Skeleton className="h-4 w-full" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

/**
 * Full table skeleton
 */
export function TableSkeleton({ rows = 5, columns = 6, showHeader = true, className = '' }) {
  return (
    <div className={`bg-white shadow-md rounded-lg overflow-hidden ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        {showHeader && (
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3 text-left">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * List item skeleton
 */
export function ListItemSkeleton({ showAvatar = true, className = '' }) {
  return (
    <div className={`flex items-center gap-4 p-4 ${className}`}>
      {showAvatar && <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

/**
 * List skeleton
 */
export function ListSkeleton({ items = 5, showAvatar = true, className = '' }) {
  return (
    <div className={`divide-y divide-gray-100 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <ListItemSkeleton key={i} showAvatar={showAvatar} />
      ))}
    </div>
  );
}

/**
 * Appointment/schedule item skeleton
 */
export function AppointmentItemSkeleton({ className = '' }) {
  return (
    <div className={`px-5 py-4 flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <Skeleton className="h-5 w-12 mb-1" />
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="h-10 w-px bg-gray-200" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Appointments list skeleton
 */
export function AppointmentsListSkeleton({ items = 5, className = '' }) {
  return (
    <div className={`divide-y divide-gray-100 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <AppointmentItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Patient row skeleton with avatar
 */
export function PatientRowSkeleton({ className = '' }) {
  return (
    <tr className={`hover:bg-gray-50 ${className}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="ml-4 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Skeleton className="h-4 w-8" />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Skeleton className="h-4 w-40 mb-1" />
        <Skeleton className="h-3 w-24" />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Skeleton className="h-4 w-8" />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Skeleton className="h-6 w-16 rounded-full" />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
      </td>
    </tr>
  );
}

/**
 * Patients table skeleton
 */
export function PatientsTableSkeleton({ rows = 10, className = '' }) {
  return (
    <div className={`bg-white shadow-md rounded-lg overflow-hidden ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
            <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-8" /></th>
            <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
            <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
            <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
            <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-12" /></th>
            <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <PatientRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Quick action button skeleton
 */
export function QuickActionSkeleton({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 ${className}`}>
      <Skeleton className="w-10 h-10 rounded-lg" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

/**
 * Quick actions grid skeleton
 */
export function QuickActionsGridSkeleton({ items = 4, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <QuickActionSkeleton key={i} />
      ))}
    </div>
  );
}

export default {
  Skeleton,
  CardSkeleton,
  StatsGridSkeleton,
  TableSkeleton,
  TableRowSkeleton,
  ListSkeleton,
  ListItemSkeleton,
  AppointmentItemSkeleton,
  AppointmentsListSkeleton,
  PatientRowSkeleton,
  PatientsTableSkeleton,
  QuickActionSkeleton,
  QuickActionsGridSkeleton
};
