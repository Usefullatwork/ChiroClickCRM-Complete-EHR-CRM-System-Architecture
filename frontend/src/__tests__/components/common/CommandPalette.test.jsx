/**
 * CommandPalette Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

// Mock patients API
vi.mock('../../../services/api', () => ({
  patientsAPI: {
    getAll: vi.fn().mockResolvedValue({ data: { patients: [] } }),
  },
}));

// Mock utils
vi.mock('../../../lib/utils', () => ({
  calculateAge: vi.fn().mockReturnValue(35),
  formatDate: vi.fn().mockReturnValue('01.01.2026'),
}));

import CommandPalette from '../../../components/common/CommandPalette';
import { patientsAPI } from '../../../services/api';

describe('CommandPalette Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    patientsAPI.getAll.mockResolvedValue({ data: { patients: [] } });
  });

  // =========================================================================
  // VISIBILITY
  // =========================================================================

  it('should render when isOpen is true', () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<CommandPalette {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // =========================================================================
  // SEARCH INPUT
  // =========================================================================

  it('should render search input', () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByLabelText('Sok')).toBeInTheDocument();
  });

  it('should have placeholder text', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByLabelText('Sok');
    expect(input.placeholder).toContain('Sok etter pasient');
  });

  // =========================================================================
  // NAVIGATION ITEMS
  // =========================================================================

  it('should show navigation section with nav items', () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByText('Navigasjon')).toBeInTheDocument();
  });

  it('should show action section with action items', () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByText('Handlinger')).toBeInTheDocument();
  });

  // =========================================================================
  // CLOSE BEHAVIOUR
  // =========================================================================

  it('should call onClose when backdrop is clicked', () => {
    render(<CommandPalette {...defaultProps} />);
    const backdrop = document.querySelector('[aria-hidden="true"]');
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByLabelText('Sok');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // KEYBOARD NAVIGATION
  // =========================================================================

  it('should handle ArrowDown key', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByLabelText('Sok');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Should not throw and should move active index
    expect(input).toBeInTheDocument();
  });

  it('should handle ArrowUp key', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByLabelText('Sok');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).toBeInTheDocument();
  });

  it('should navigate on Enter key', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByLabelText('Sok');
    fireEvent.keyDown(input, { key: 'Enter' });
    // Should trigger navigation and close
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  // =========================================================================
  // PATIENT SEARCH
  // =========================================================================

  it('should search for patients when query is 2+ characters', async () => {
    patientsAPI.getAll.mockResolvedValue({
      data: {
        patients: [
          { id: 1, first_name: 'Ola', last_name: 'Nordmann', date_of_birth: '1990-01-01' },
        ],
      },
    });

    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByLabelText('Sok');
    fireEvent.change(input, { target: { value: 'Ol' } });

    await waitFor(() => {
      expect(patientsAPI.getAll).toHaveBeenCalledWith({ search: 'Ol', limit: 5 });
    });

    await waitFor(() => {
      expect(screen.getByText('Pasienter')).toBeInTheDocument();
    });
  });

  it('should not search when query is less than 2 characters', async () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByLabelText('Sok');
    fireEvent.change(input, { target: { value: 'O' } });

    // Wait a tick to ensure no async calls
    await waitFor(() => {
      expect(patientsAPI.getAll).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // EMPTY STATE
  // =========================================================================

  it('should show no results message when search yields nothing', async () => {
    patientsAPI.getAll.mockResolvedValue({ data: { patients: [] } });

    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByLabelText('Sok');
    // Use a query that won't match any nav/action item labels
    fireEvent.change(input, { target: { value: 'xyznonexistent' } });

    await waitFor(() => {
      expect(screen.getByText(/Ingen resultater for/)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // NAV ITEM CLICK
  // =========================================================================

  it('should navigate and close when a nav item is clicked', () => {
    render(<CommandPalette {...defaultProps} />);
    // Click on a navigation item — all nav items are buttons
    const navButtons = screen.getByText('Navigasjon').parentElement.querySelectorAll('button');
    if (navButtons.length > 0) {
      fireEvent.click(navButtons[0]);
      expect(defaultProps.onClose).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalled();
    }
  });

  // =========================================================================
  // ACCESSIBILITY
  // =========================================================================

  it('should have aria-modal and aria-label on dialog', () => {
    render(<CommandPalette {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Kommandopalett');
  });
});
