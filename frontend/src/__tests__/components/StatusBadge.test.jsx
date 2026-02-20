/**
 * StatusBadge Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge, { STATUS_CONFIG } from '../../components/ui/StatusBadge';

describe('StatusBadge Component', () => {
  // ============================================================================
  // BASIC RENDERING
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render with status text', () => {
      render(<StatusBadge status="CONFIRMED" />);
      expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
    });

    it('should render with custom label', () => {
      render(<StatusBadge status="CONFIRMED" label="Bekreftet" />);
      expect(screen.getByText('Bekreftet')).toBeInTheDocument();
      expect(screen.queryByText('CONFIRMED')).not.toBeInTheDocument();
    });

    it('should have role="status" for accessibility', () => {
      render(<StatusBadge status="PENDING" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-label matching display text', () => {
      render(<StatusBadge status="PENDING" label="Venter" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Venter');
    });

    it('should apply custom className', () => {
      render(<StatusBadge status="CONFIRMED" className="ml-2" />);
      expect(screen.getByRole('status')).toHaveClass('ml-2');
    });
  });

  // ============================================================================
  // STATUS VARIANTS
  // ============================================================================

  describe('Status Variants', () => {
    const appointmentStatuses = [
      'CONFIRMED',
      'PENDING',
      'CANCELLED',
      'COMPLETED',
      'NO_SHOW',
      'IN_PROGRESS',
    ];
    const lifecycleStatuses = ['active', 'overdue', 'at_risk', 'inactive', 'new'];

    appointmentStatuses.forEach((status) => {
      it(`should render appointment status: ${status}`, () => {
        render(<StatusBadge status={status} />);
        expect(screen.getByText(status)).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveClass(STATUS_CONFIG[status].bg);
      });
    });

    lifecycleStatuses.forEach((status) => {
      it(`should render lifecycle status: ${status}`, () => {
        render(<StatusBadge status={status} />);
        expect(screen.getByText(status)).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveClass(STATUS_CONFIG[status].bg);
      });
    });

    it('should use fallback for unknown status', () => {
      render(<StatusBadge status="UNKNOWN_STATUS" />);
      expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('bg-gray-50');
    });
  });

  // ============================================================================
  // ICON
  // ============================================================================

  describe('Icon', () => {
    it('should show icon by default', () => {
      render(<StatusBadge status="CONFIRMED" />);
      // Icon has aria-hidden="true"
      const icon = document.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
      render(<StatusBadge status="CONFIRMED" showIcon={false} />);
      const icon = document.querySelector('[aria-hidden="true"]');
      expect(icon).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // SIZE VARIANTS
  // ============================================================================

  describe('Size Variants', () => {
    it('should use sm size by default', () => {
      render(<StatusBadge status="CONFIRMED" />);
      expect(screen.getByRole('status')).toHaveClass('px-2');
    });

    it('should use xs size when specified', () => {
      render(<StatusBadge status="CONFIRMED" size="xs" />);
      expect(screen.getByRole('status')).toHaveClass('px-1.5');
    });

    it('should use smaller icon for xs size', () => {
      render(<StatusBadge status="CONFIRMED" size="xs" />);
      const icon = document.querySelector('.w-3');
      expect(icon).toBeInTheDocument();
    });
  });
});
