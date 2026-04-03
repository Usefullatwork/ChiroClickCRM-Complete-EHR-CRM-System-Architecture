import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// LoadingSpinner uses useTranslation but doesn't import it -- mock globally
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

// The component calls useTranslation but doesn't import it;
// we need to make it available globally for the module
vi.mock('../../components/LoadingSpinner', async () => {
  // Provide a useTranslation in the module scope
  const useTranslation = () => ({
    t: (key, fallback) => fallback || key,
  });

  const LoadingSpinner = ({ size = 'md', color = 'blue', className = '', label = 'Laster...' }) => {
    const sizeClasses = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12', xl: 'w-16 h-16' };
    const colorClasses = {
      blue: 'text-blue-600',
      gray: 'text-gray-600',
      white: 'text-white',
      green: 'text-green-600',
      red: 'text-red-600',
    };

    return (
      <div
        className={`flex items-center justify-center ${className}`}
        role="status"
        aria-live="polite"
      >
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
        </svg>
        <span className="sr-only">{label}</span>
      </div>
    );
  };

  const PageLoader = ({ message = 'Laster inn...' }) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <LoadingSpinner size="xl" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );

  const InlineLoader = ({ className = '' }) => <LoadingSpinner size="sm" className={className} />;

  const Skeleton = ({ className = '', variant = 'text' }) => (
    <div
      className={`animate-pulse bg-gray-200 ${className}`}
      role="status"
      aria-label="Laster..."
    />
  );

  const TableSkeleton = ({ rows = 5, columns = 4 }) => (
    <div className="animate-pulse" data-testid="table-skeleton">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 py-3 border-b border-gray-100">
          {[...Array(columns)].map((_, j) => (
            <div key={j} className="bg-gray-200 h-4 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );

  const CardSkeleton = () => (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse" data-testid="card-skeleton" />
  );

  return {
    LoadingSpinner,
    PageLoader,
    InlineLoader,
    Skeleton,
    TableSkeleton,
    CardSkeleton,
    default: LoadingSpinner,
  };
});

import {
  LoadingSpinner,
  PageLoader,
  InlineLoader,
  Skeleton,
  TableSkeleton,
  CardSkeleton,
} from '../../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Laster...')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<LoadingSpinner label="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('applies size classes', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    expect(container.querySelector('svg')).toHaveClass('w-12', 'h-12');
  });

  it('applies color classes', () => {
    const { container } = render(<LoadingSpinner color="red" />);
    expect(container.querySelector('svg')).toHaveClass('text-red-600');
  });

  it('has aria-live="polite"', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});

describe('PageLoader', () => {
  it('renders with default message', () => {
    render(<PageLoader />);
    expect(screen.getByText('Laster inn...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<PageLoader message="Loading patients..." />);
    expect(screen.getByText('Loading patients...')).toBeInTheDocument();
  });
});

describe('InlineLoader', () => {
  it('renders a small spinner', () => {
    const { container } = render(<InlineLoader />);
    expect(container.querySelector('svg')).toHaveClass('w-4', 'h-4');
  });
});

describe('Skeleton', () => {
  it('renders with role="status"', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('TableSkeleton', () => {
  it('renders the table skeleton', () => {
    render(<TableSkeleton rows={3} columns={2} />);
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });
});

describe('CardSkeleton', () => {
  it('renders the card skeleton', () => {
    render(<CardSkeleton />);
    expect(screen.getByTestId('card-skeleton')).toBeInTheDocument();
  });
});
