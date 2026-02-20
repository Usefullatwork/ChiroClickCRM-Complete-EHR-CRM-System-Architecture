/**
 * StatCard Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StatCard from '../../components/ui/StatCard';
import { Calendar } from 'lucide-react';

describe('StatCard Component', () => {
  const defaultProps = {
    label: 'Dagens timer',
    value: '12',
  };

  // ============================================================================
  // BASIC RENDERING
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render label and value', () => {
      render(<StatCard {...defaultProps} />);
      expect(screen.getByText('Dagens timer')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should render with data-testid for Dashboard integration', () => {
      render(<StatCard {...defaultProps} />);
      expect(screen.getByTestId('dashboard-stat-card')).toBeInTheDocument();
    });

    it('should render icon when provided', () => {
      render(<StatCard {...defaultProps} icon={Calendar} />);
      // Icon container should exist
      const iconContainer = document.querySelector('.w-12.h-12');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should not render icon container when icon not provided', () => {
      render(<StatCard {...defaultProps} />);
      const iconContainer = document.querySelector('.w-12.h-12');
      expect(iconContainer).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<StatCard {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('dashboard-stat-card')).toHaveClass('custom-class');
    });
  });

  // ============================================================================
  // TREND INDICATORS
  // ============================================================================

  describe('Trend Indicators', () => {
    it('should show positive trend with green styling', () => {
      render(<StatCard {...defaultProps} trend={15} trendLabel="vs forrige uke" />);
      expect(screen.getByText('15%')).toBeInTheDocument();
      expect(screen.getByText('vs forrige uke')).toBeInTheDocument();
      // Green class for positive trend
      const trendEl = screen.getByText('15%');
      expect(trendEl).toHaveClass('text-green-600');
    });

    it('should show negative trend with red styling', () => {
      render(<StatCard {...defaultProps} trend={-8} />);
      expect(screen.getByText('8%')).toBeInTheDocument();
      const trendEl = screen.getByText('8%');
      expect(trendEl).toHaveClass('text-red-600');
    });

    it('should show neutral trend (0) with gray styling', () => {
      render(<StatCard {...defaultProps} trend={0} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
      const trendEl = screen.getByText('0%');
      expect(trendEl).toHaveClass('text-gray-400');
    });

    it('should not show trend section when trend is undefined', () => {
      render(<StatCard {...defaultProps} />);
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // INTERACTIVITY
  // ============================================================================

  describe('Click Handler', () => {
    it('should render as button when onClick is provided', () => {
      const onClick = vi.fn();
      render(<StatCard {...defaultProps} onClick={onClick} />);
      expect(screen.getByTestId('dashboard-stat-card').tagName).toBe('BUTTON');
    });

    it('should render as div when onClick is not provided', () => {
      render(<StatCard {...defaultProps} />);
      expect(screen.getByTestId('dashboard-stat-card').tagName).toBe('DIV');
    });

    it('should call onClick when clicked', () => {
      const onClick = vi.fn();
      render(<StatCard {...defaultProps} onClick={onClick} />);
      fireEvent.click(screen.getByTestId('dashboard-stat-card'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should have hover cursor class when clickable', () => {
      const onClick = vi.fn();
      render(<StatCard {...defaultProps} onClick={onClick} />);
      expect(screen.getByTestId('dashboard-stat-card')).toHaveClass('cursor-pointer');
    });
  });

  // ============================================================================
  // SPARKLINE SLOT
  // ============================================================================

  describe('Sparkline', () => {
    it('should render sparkline slot when provided', () => {
      render(
        <StatCard {...defaultProps} sparkline={<div data-testid="sparkline-chart">chart</div>} />
      );
      expect(screen.getByTestId('sparkline-chart')).toBeInTheDocument();
    });

    it('should not render sparkline area when not provided', () => {
      const { container } = render(<StatCard {...defaultProps} />);
      expect(container.querySelector('.mt-3')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // STYLING
  // ============================================================================

  describe('Custom Styling', () => {
    it('should apply custom bgClass and iconClass', () => {
      render(
        <StatCard
          {...defaultProps}
          icon={Calendar}
          bgClass="bg-blue-50"
          iconClass="text-blue-600"
        />
      );
      const iconContainer = document.querySelector('.bg-blue-50');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should use default teal styling when no bgClass provided', () => {
      render(<StatCard {...defaultProps} icon={Calendar} />);
      const iconContainer = document.querySelector('.bg-teal-50');
      expect(iconContainer).toBeInTheDocument();
    });
  });
});
