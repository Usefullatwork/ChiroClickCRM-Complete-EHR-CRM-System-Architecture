/**
 * ExamToggle Component Tests
 * Tests collapsible panel rendering, toggle behavior, badge display, and children visibility.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  ChevronDown: () => null,
  ChevronUp: () => null,
}));

import ExamToggle from '../../../../components/encounter/exam-panels/ExamToggle';

const MockIcon = () => <span data-testid="mock-icon" />;

function buildProps(overrides = {}) {
  return {
    show: false,
    onToggle: vi.fn(),
    icon: MockIcon,
    label: 'Test Panel',
    color: 'blue',
    badgeText: null,
    children: <div data-testid="panel-content">Panel Content</div>,
    ...overrides,
  };
}

describe('ExamToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the panel label', () => {
    render(<ExamToggle {...buildProps()} />);
    expect(screen.getByText('Test Panel')).toBeTruthy();
  });

  it('hides children when show is false', () => {
    render(<ExamToggle {...buildProps({ show: false })} />);
    expect(screen.queryByTestId('panel-content')).toBeNull();
  });

  it('shows children when show is true', () => {
    render(<ExamToggle {...buildProps({ show: true })} />);
    expect(screen.getByTestId('panel-content')).toBeTruthy();
    expect(screen.getByText('Panel Content')).toBeTruthy();
  });

  it('calls onToggle when the header button is clicked', () => {
    const onToggle = vi.fn();
    render(<ExamToggle {...buildProps({ onToggle })} />);
    fireEvent.click(screen.getByText('Test Panel').closest('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders badge text when provided', () => {
    render(<ExamToggle {...buildProps({ badgeText: '5 funn' })} />);
    expect(screen.getByText('5 funn')).toBeTruthy();
  });

  it('does not render badge when badgeText is null', () => {
    render(<ExamToggle {...buildProps({ badgeText: null })} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0].textContent).not.toContain('funn');
  });

  it('renders the provided icon component', () => {
    render(<ExamToggle {...buildProps()} />);
    expect(screen.getByTestId('mock-icon')).toBeTruthy();
  });
});
