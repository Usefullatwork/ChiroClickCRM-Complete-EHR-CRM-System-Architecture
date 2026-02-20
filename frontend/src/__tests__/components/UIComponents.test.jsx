/**
 * UI Components Tests — EmptyState, LoadingButton, ConfirmDialog
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmptyState from '../../components/ui/EmptyState';
import LoadingButton from '../../components/ui/LoadingButton';
import ConfirmDialog, { ConfirmProvider, useConfirm } from '../../components/ui/ConfirmDialog';
import { Search, Trash2 } from 'lucide-react';

// ============================================================================
// EMPTY STATE
// ============================================================================

describe('EmptyState Component', () => {
  it('should render title', () => {
    render(<EmptyState title="Ingen data funnet" />);
    expect(screen.getByText('Ingen data funnet')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(<EmptyState title="Ingen data" description="Prøv å endre filteret" />);
    expect(screen.getByText('Prøv å endre filteret')).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    const { container } = render(<EmptyState title="Ingen data" />);
    expect(container.querySelectorAll('p').length).toBe(0);
  });

  it('should render default Inbox icon when no icon specified', () => {
    render(<EmptyState title="Tom" />);
    const icon = document.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('should render custom icon', () => {
    render(<EmptyState title="Søk" icon={Search} />);
    const icon = document.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('should render illustration slot instead of icon', () => {
    render(
      <EmptyState
        title="Custom"
        illustration={<img data-testid="custom-illust" src="/empty.svg" alt="" />}
      />
    );
    expect(screen.getByTestId('custom-illust')).toBeInTheDocument();
  });

  it('should render action slot (CTA button)', () => {
    render(<EmptyState title="Ingen pasienter" action={<button>Legg til pasient</button>} />);
    expect(screen.getByText('Legg til pasient')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<EmptyState title="Test" className="bg-gray-50" />);
    expect(container.firstChild).toHaveClass('bg-gray-50');
  });
});

// ============================================================================
// LOADING BUTTON
// ============================================================================

describe('LoadingButton Component', () => {
  describe('Default State', () => {
    it('should render children text', () => {
      render(<LoadingButton>Lagre</LoadingButton>);
      expect(screen.getByText('Lagre')).toBeInTheDocument();
    });

    it('should render as a button element', () => {
      render(<LoadingButton>Save</LoadingButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should not be disabled by default', () => {
      render(<LoadingButton>Save</LoadingButton>);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should call onClick when clicked', () => {
      const onClick = vi.fn();
      render(<LoadingButton onClick={onClick}>Save</LoadingButton>);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('should be disabled when loading', () => {
      render(<LoadingButton loading>Lagre</LoadingButton>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show spinner when loading', () => {
      render(<LoadingButton loading>Lagre</LoadingButton>);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show loadingText when provided', () => {
      render(
        <LoadingButton loading loadingText="Lagrer...">
          Lagre
        </LoadingButton>
      );
      expect(screen.getByText('Lagrer...')).toBeInTheDocument();
    });

    it('should show children when loadingText not provided', () => {
      render(<LoadingButton loading>Lagre</LoadingButton>);
      expect(screen.getByText('Lagre')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<LoadingButton disabled>Save</LoadingButton>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Variants', () => {
    it('should apply primary variant by default', () => {
      render(<LoadingButton>Primary</LoadingButton>);
      expect(screen.getByRole('button')).toHaveClass('bg-teal-600');
    });

    it('should apply secondary variant', () => {
      render(<LoadingButton variant="secondary">Secondary</LoadingButton>);
      expect(screen.getByRole('button')).toHaveClass('bg-gray-100');
    });

    it('should apply destructive variant', () => {
      render(<LoadingButton variant="destructive">Delete</LoadingButton>);
      expect(screen.getByRole('button')).toHaveClass('bg-red-600');
    });

    it('should apply ghost variant', () => {
      render(<LoadingButton variant="ghost">Ghost</LoadingButton>);
      expect(screen.getByRole('button')).toHaveClass('text-gray-700');
    });
  });

  describe('Sizes', () => {
    it('should apply sm size', () => {
      render(<LoadingButton size="sm">Small</LoadingButton>);
      expect(screen.getByRole('button')).toHaveClass('h-8');
    });

    it('should apply md size by default', () => {
      render(<LoadingButton>Medium</LoadingButton>);
      expect(screen.getByRole('button')).toHaveClass('h-10');
    });

    it('should apply lg size', () => {
      render(<LoadingButton size="lg">Large</LoadingButton>);
      expect(screen.getByRole('button')).toHaveClass('h-12');
    });
  });

  describe('Icon', () => {
    it('should render icon when provided', () => {
      render(<LoadingButton icon={Trash2}>Delete</LoadingButton>);
      const icon = document.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('should not render icon when loading (shows spinner instead)', () => {
      render(
        <LoadingButton icon={Trash2} loading>
          Delete
        </LoadingButton>
      );
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });
});

// ============================================================================
// CONFIRM DIALOG — DECLARATIVE
// ============================================================================

describe('ConfirmDialog Component (Declarative)', () => {
  const defaultProps = {
    open: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    title: 'Slett element',
    description: 'Denne handlingen kan ikke angres.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open is true', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Slett element')).toBeInTheDocument();
    expect(screen.getByText('Denne handlingen kan ikke angres.')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Slett element')).not.toBeInTheDocument();
  });

  it('should have role="alertdialog" for accessibility', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Bekreft'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Avbryt'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when backdrop clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(document.querySelector('[aria-hidden="true"]'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when close button clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Lukk'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should use custom button text', () => {
    render(<ConfirmDialog {...defaultProps} confirmText="Ja, slett" cancelText="Nei, behold" />);
    expect(screen.getByText('Ja, slett')).toBeInTheDocument();
    expect(screen.getByText('Nei, behold')).toBeInTheDocument();
  });
});

// ============================================================================
// CONFIRM DIALOG — IMPERATIVE (useConfirm hook)
// ============================================================================

describe('useConfirm Hook', () => {
  // Helper to test the hook inside a rendered component
  function TestComponent({ onResult }) {
    const confirm = useConfirm();

    const handleClick = async () => {
      const result = await confirm({
        title: 'Confirm Test',
        description: 'Test description',
      });
      onResult(result);
    };

    return <button onClick={handleClick}>Trigger Confirm</button>;
  }

  it('should resolve true when confirmed', async () => {
    const onResult = vi.fn();
    render(
      <ConfirmProvider>
        <TestComponent onResult={onResult} />
      </ConfirmProvider>
    );

    // Trigger the confirm dialog
    fireEvent.click(screen.getByText('Trigger Confirm'));

    // Dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Confirm Test')).toBeInTheDocument();
    });

    // Click confirm
    fireEvent.click(screen.getByText('Bekreft'));

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(true);
    });
  });

  it('should resolve false when cancelled', async () => {
    const onResult = vi.fn();
    render(
      <ConfirmProvider>
        <TestComponent onResult={onResult} />
      </ConfirmProvider>
    );

    // Trigger the confirm dialog
    fireEvent.click(screen.getByText('Trigger Confirm'));

    // Dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Confirm Test')).toBeInTheDocument();
    });

    // Click cancel
    fireEvent.click(screen.getByText('Avbryt'));

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(false);
    });
  });

  it('should throw when used outside ConfirmProvider', () => {
    function BadComponent() {
      useConfirm();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow(
      'useConfirm must be used within a ConfirmProvider'
    );
  });
});
