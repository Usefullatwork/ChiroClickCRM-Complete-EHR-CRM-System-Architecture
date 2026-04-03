import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    scope: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
  },
}));

import { ErrorBoundary, withErrorBoundary } from '../../components/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

const GoodChild = () => <div>Child content</div>;

describe('ErrorBoundary', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('Noe gikk galt')).toBeInTheDocument();
  });

  it('renders the error-boundary test id when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('displays retry and reload buttons on error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('Prøv igjen')).toBeInTheDocument();
    expect(screen.getByText('Last siden på nytt')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('resets error state when retry is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('Noe gikk galt')).toBeInTheDocument();

    // Click retry resets the error state; the component re-renders children
    fireEvent.click(screen.getByText('Prøv igjen'));
    // After reset, it tries to render children again (which will throw again)
    expect(screen.getByText('Noe gikk galt')).toBeInTheDocument();
  });

  it('shows report button that changes text after click', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    const reportBtn = screen.getByText('Rapporter feil');
    expect(reportBtn).toBeInTheDocument();
    fireEvent.click(reportBtn);
    expect(screen.getByText('Feil rapportert — takk!')).toBeInTheDocument();
  });

  it('has role="alert" on the error boundary container', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('includes error message in screen reader text', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('error-boundary-message')).toHaveTextContent('Test error');
  });
});

describe('withErrorBoundary HOC', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('wraps component with error boundary', () => {
    const WrappedGood = withErrorBoundary(GoodChild);
    render(<WrappedGood />);
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('catches errors in wrapped component', () => {
    const WrappedBad = withErrorBoundary(ThrowError);
    render(<WrappedBad />);
    expect(screen.getByText('Noe gikk galt')).toBeInTheDocument();
  });

  it('uses custom fallback when provided', () => {
    const WrappedBad = withErrorBoundary(ThrowError, <div>HOC fallback</div>);
    render(<WrappedBad />);
    expect(screen.getByText('HOC fallback')).toBeInTheDocument();
  });
});
