/**
 * EnhancedClinicalSidebar Tests
 *
 * Tests:
 * - Renders in default mode
 * - Header and footer
 * - Collapse/expand
 * - Returns null when disabled
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Layers: (props) => <span data-testid="icon-Layers" />,
  Box: (props) => <span data-testid="icon-Box" />,
  User: (props) => <span data-testid="icon-User" />,
  ChevronDown: (props) => <span data-testid="icon-ChevronDown" />,
  ChevronUp: (props) => <span data-testid="icon-ChevronUp" />,
  Settings: (props) => <span data-testid="icon-Settings" />,
}));

// Mock child components
vi.mock('../../../components/clinical/QuickPalpationSpine', () => ({
  default: ({ disabled }) =>
    disabled ? null : <div data-testid="quick-palpation-spine">QuickPalpation</div>,
}));

vi.mock('../../../components/anatomy/spine/EnhancedSpineDiagram', () => ({
  default: () => <div data-testid="enhanced-spine-diagram">SpineDiagram</div>,
}));

vi.mock('../../../components/anatomy/body/EnhancedBodyDiagram', () => ({
  default: () => <div data-testid="enhanced-body-diagram">BodyDiagram</div>,
}));

vi.mock('../../../components/anatomy/spine/Spine3DViewer', () => ({
  default: () => <div data-testid="spine-3d-viewer">3DViewer</div>,
}));

import EnhancedClinicalSidebar, {
  SidebarModeBar,
  SIDEBAR_MODES,
} from '../../../components/clinical/EnhancedClinicalSidebar';

describe('EnhancedClinicalSidebar', () => {
  const defaultProps = {
    onInsertText: vi.fn(),
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when disabled', () => {
    const { container } = render(<EnhancedClinicalSidebar {...defaultProps} disabled={true} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the header with PALPASJON title', () => {
    render(<EnhancedClinicalSidebar {...defaultProps} />);
    expect(screen.getByText('PALPASJON')).toBeInTheDocument();
  });

  it('renders the description for default mode', () => {
    render(<EnhancedClinicalSidebar {...defaultProps} />);
    expect(screen.getByText('Hurtig knapp-basert')).toBeInTheDocument();
  });

  it('renders the QuickPalpationSpine component in default mode', () => {
    render(<EnhancedClinicalSidebar {...defaultProps} />);
    expect(screen.getByTestId('quick-palpation-spine')).toBeInTheDocument();
  });

  it('renders the footer hint in default mode', () => {
    render(<EnhancedClinicalSidebar {...defaultProps} />);
    expect(screen.getByText('Klikk segment → Velg retning → Tekst settes inn')).toBeInTheDocument();
  });

  it('hides footer and content when collapsed', () => {
    render(<EnhancedClinicalSidebar {...defaultProps} />);

    // Click collapse button
    const collapseBtn = screen.getByTitle('Minimer');
    fireEvent.click(collapseBtn);

    // QuickPalpation should be gone
    expect(screen.queryByTestId('quick-palpation-spine')).not.toBeInTheDocument();
    // Footer should be gone
    expect(
      screen.queryByText('Klikk segment → Velg retning → Tekst settes inn')
    ).not.toBeInTheDocument();
  });

  it('shows mode selector when settings button is clicked', () => {
    render(<EnhancedClinicalSidebar {...defaultProps} />);

    const settingsBtn = screen.getByTitle('Bytt visning');
    fireEvent.click(settingsBtn);

    // Mode labels should appear
    expect(screen.getByText('Q')).toBeInTheDocument();
    expect(screen.getByText('2D')).toBeInTheDocument();
    expect(screen.getByText('3D')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EnhancedClinicalSidebar {...defaultProps} className="test-class" />
    );
    expect(container.firstChild).toHaveClass('test-class');
  });
});

describe('SidebarModeBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when disabled', () => {
    const { container } = render(
      <SidebarModeBar mode="quick" onModeChange={vi.fn()} disabled={true} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders mode buttons', () => {
    render(<SidebarModeBar mode="quick" onModeChange={vi.fn()} disabled={false} />);
    // Should have 4 buttons for the 4 modes
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(4);
  });

  it('calls onModeChange when a mode button is clicked', () => {
    const onModeChange = vi.fn();
    render(<SidebarModeBar mode="quick" onModeChange={onModeChange} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]); // Click second mode
    expect(onModeChange).toHaveBeenCalled();
  });
});

describe('SIDEBAR_MODES', () => {
  it('exports the mode constants', () => {
    expect(SIDEBAR_MODES.QUICK).toBe('quick');
    expect(SIDEBAR_MODES.SPINE_2D).toBe('spine2d');
    expect(SIDEBAR_MODES.SPINE_3D).toBe('spine3d');
    expect(SIDEBAR_MODES.BODY).toBe('body');
  });
});
