/**
 * Loading Spinner Component
 * Provides consistent loading states across the application
 */

import React from 'react';

export const LoadingSpinner = ({
  size = 'md',
  color = 'blue',
  className = '',
  label = 'Laster...',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colorClasses = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    white: 'text-white',
    green: 'text-green-600',
    red: 'text-red-600',
  };

  return (
    <div className={`flex items-center justify-center ${className}`} role="status">
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
};

/**
 * Full page loading component
 */
export const PageLoader = ({ message = 'Laster inn...' }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <LoadingSpinner size="xl" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
};

/**
 * Inline loading component for buttons and small areas
 */
export const InlineLoader = ({ className = '' }) => {
  return <LoadingSpinner size="sm" className={className} />;
};

/**
 * Skeleton loading component for content placeholders
 */
export const Skeleton = ({
  className = '',
  variant = 'text',
  width,
  height,
}) => {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'circular' ? width : undefined),
  };

  return (
    <div
      className={`animate-pulse bg-gray-200 ${variantClasses[variant]} ${className}`}
      style={style}
      role="status"
      aria-label="Loading..."
    />
  );
};

/**
 * Table loading skeleton
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-100 h-12 mb-2 rounded" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 py-3 border-b border-gray-100">
          {[...Array(columns)].map((_, j) => (
            <div
              key={j}
              className="bg-gray-200 h-4 rounded flex-1"
              style={{ maxWidth: j === 0 ? '200px' : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Card loading skeleton
 */
export const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" width="48px" height="48px" />
        <div className="flex-1">
          <Skeleton className="mb-2" width="60%" />
          <Skeleton width="40%" />
        </div>
      </div>
      <Skeleton className="mb-2" />
      <Skeleton className="mb-2" />
      <Skeleton width="80%" />
    </div>
  );
};

export default LoadingSpinner;
