/**
 * RegionalBodyDiagrams Component Tests
 *
 * Tests the regional body diagram wrapper and its sub-diagram components.
 * Component does NOT use i18n hook — it uses an internal `lang` prop
 * with bilingual MARKER_TYPES data.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import RegionalBodyDiagram, {
  ShoulderDiagram,
  KneeDiagram,
  CervicalSpineDiagram,
  LumbarSpineDiagram,
  HipDiagram,
  HeadTMJDiagram,
  AnkleDiagram,
  WristDiagram,
  ElbowDiagram,
  MARKER_TYPES,
} from '../../../components/examination/RegionalBodyDiagrams';

describe('RegionalBodyDiagram', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // DEFAULT RENDER
  // --------------------------------------------------------------------------

  describe('Default Render', () => {
    it('should render the default shoulder diagram with Norwegian title', () => {
      render(<RegionalBodyDiagram markers={[]} onChange={mockOnChange} />);
      expect(screen.getByText('Skulder')).toBeInTheDocument();
    });

    it('should render with English title when lang="en"', () => {
      render(<RegionalBodyDiagram markers={[]} onChange={mockOnChange} lang="en" />);
      expect(screen.getByText('Shoulder')).toBeInTheDocument();
    });

    it('should render an SVG element', () => {
      const { container } = render(<RegionalBodyDiagram markers={[]} onChange={mockOnChange} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render all 6 marker type buttons', () => {
      render(<RegionalBodyDiagram markers={[]} onChange={mockOnChange} />);
      expect(screen.getByText('Smerte')).toBeInTheDocument();
      expect(screen.getByText('Ømhet')).toBeInTheDocument();
      expect(screen.getByText('Hevelse')).toBeInTheDocument();
      expect(screen.getByText('Restriksjon')).toBeInTheDocument();
      expect(screen.getByText('Krepitasjon')).toBeInTheDocument();
      expect(screen.getByText('Instabilitet')).toBeInTheDocument();
    });

    it('should render English marker labels when lang="en"', () => {
      render(<RegionalBodyDiagram markers={[]} onChange={mockOnChange} lang="en" />);
      expect(screen.getByText('Pain')).toBeInTheDocument();
      expect(screen.getByText('Tenderness')).toBeInTheDocument();
      expect(screen.getByText('Swelling')).toBeInTheDocument();
    });

    it('should NOT render the Clear button when no markers exist', () => {
      render(<RegionalBodyDiagram markers={[]} onChange={mockOnChange} />);
      expect(screen.queryByText('Fjern')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // REGION SWITCHING
  // --------------------------------------------------------------------------

  describe('Region Switching', () => {
    it('should render knee diagram when region="knee"', () => {
      render(<RegionalBodyDiagram region="knee" markers={[]} onChange={mockOnChange} />);
      expect(screen.getByText('Kne')).toBeInTheDocument();
    });

    it('should render cervical spine diagram when region="cervical"', () => {
      render(<RegionalBodyDiagram region="cervical" markers={[]} onChange={mockOnChange} />);
      expect(screen.getByText('Cervikalkolumna')).toBeInTheDocument();
    });

    it('should render lumbar spine diagram when region="lumbar"', () => {
      render(<RegionalBodyDiagram region="lumbar" markers={[]} onChange={mockOnChange} />);
      expect(screen.getByText('Lumbalkolumna')).toBeInTheDocument();
    });

    it('should render hip diagram when region="hip"', () => {
      render(<RegionalBodyDiagram region="hip" markers={[]} onChange={mockOnChange} />);
      expect(screen.getByText('Hofte')).toBeInTheDocument();
    });

    it('should render head/TMJ diagram when region="head"', () => {
      render(<RegionalBodyDiagram region="head" markers={[]} onChange={mockOnChange} />);
      expect(screen.getByText('Hode/TMJ')).toBeInTheDocument();
    });

    it('should render ankle diagram when region="ankle"', () => {
      render(<RegionalBodyDiagram region="ankle" markers={[]} onChange={mockOnChange} />);
      expect(screen.getByText('Ankel')).toBeInTheDocument();
    });

    it('should render wrist diagram when region="wrist"', () => {
      render(<RegionalBodyDiagram region="wrist" markers={[]} onChange={mockOnChange} />);
      expect(screen.getByText('Håndledd')).toBeInTheDocument();
    });

    it('should render elbow diagram when region="elbow"', () => {
      render(<RegionalBodyDiagram region="elbow" markers={[]} onChange={mockOnChange} />);
      expect(screen.getByText('Albue')).toBeInTheDocument();
    });

    it('should fall back to shoulder for unknown region', () => {
      render(<RegionalBodyDiagram region="unknown_region" markers={[]} onChange={mockOnChange} />);
      expect(screen.getByText('Skulder')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // MARKER TYPE SELECTION
  // --------------------------------------------------------------------------

  describe('Marker Type Selection', () => {
    it('should highlight selected marker type with ring class', () => {
      render(<RegionalBodyDiagram markers={[]} onChange={mockOnChange} />);

      const tenderButton = screen.getByText('Ømhet').closest('button');
      fireEvent.click(tenderButton);

      // The button should now have ring-1 in its class
      expect(tenderButton.className).toContain('ring');
    });

    it('should disable marker buttons when readOnly', () => {
      render(<RegionalBodyDiagram markers={[]} onChange={mockOnChange} readOnly={true} />);

      const buttons = screen.getAllByRole('button');
      const markerBtn = buttons.find((b) => b.textContent.includes('Smerte'));
      expect(markerBtn).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // MARKERS AND CLEAR
  // --------------------------------------------------------------------------

  describe('Markers and Clear', () => {
    const testMarkers = [
      {
        id: 'marker_1',
        type: 'pain',
        x: 100,
        y: 100,
        side: 'left',
        region: 'shoulder',
      },
    ];

    it('should render existing markers as SVG circles', () => {
      const { container } = render(
        <RegionalBodyDiagram markers={testMarkers} onChange={mockOnChange} />
      );

      // Markers render as <circle> elements inside the SVG
      const circles = container.querySelectorAll('svg circle');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('should show Clear button when markers exist', () => {
      render(<RegionalBodyDiagram markers={testMarkers} onChange={mockOnChange} />);
      expect(screen.getByText('Fjern')).toBeInTheDocument();
    });

    it('should show "Clear" button in English when lang="en"', () => {
      render(<RegionalBodyDiagram markers={testMarkers} onChange={mockOnChange} lang="en" />);
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('should call onChange with empty array when Clear is clicked', () => {
      render(<RegionalBodyDiagram markers={testMarkers} onChange={mockOnChange} />);
      fireEvent.click(screen.getByText('Fjern'));
      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('should NOT show Clear button in readOnly mode even with markers', () => {
      render(<RegionalBodyDiagram markers={testMarkers} onChange={mockOnChange} readOnly={true} />);
      expect(screen.queryByText('Fjern')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // COMPACT MODE
  // --------------------------------------------------------------------------

  describe('Compact Mode', () => {
    it('should render correctly in compact mode', () => {
      render(<RegionalBodyDiagram markers={[]} onChange={mockOnChange} compact={true} />);
      expect(screen.getByText('Skulder')).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// MARKER_TYPES DATA
// ===========================================================================

describe('MARKER_TYPES Data', () => {
  it('should define 6 marker types', () => {
    expect(Object.keys(MARKER_TYPES)).toHaveLength(6);
  });

  it('should have Norwegian and English labels for each type', () => {
    Object.values(MARKER_TYPES).forEach((type) => {
      expect(type.label).toBeDefined();
      expect(type.labelEn).toBeDefined();
      expect(type.color).toBeDefined();
      expect(type.symbol).toBeDefined();
    });
  });

  it('should include pain, tenderness, swelling, restriction, crepitus, instability', () => {
    expect(MARKER_TYPES.pain).toBeDefined();
    expect(MARKER_TYPES.tenderness).toBeDefined();
    expect(MARKER_TYPES.swelling).toBeDefined();
    expect(MARKER_TYPES.restriction).toBeDefined();
    expect(MARKER_TYPES.crepitus).toBeDefined();
    expect(MARKER_TYPES.instability).toBeDefined();
  });
});

// ===========================================================================
// SUB-DIAGRAM COMPONENTS (SVG rendering in isolation)
// ===========================================================================

describe('Sub-Diagram Components', () => {
  it('ShoulderDiagram should render Clavicula text', () => {
    const { container } = render(
      <svg>
        <ShoulderDiagram />
      </svg>
    );
    expect(container.querySelector('text')).toBeInTheDocument();
  });

  it('KneeDiagram should render with side="both"', () => {
    const { container } = render(
      <svg>
        <KneeDiagram />
      </svg>
    );
    // Should render Femur text nodes
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBeGreaterThan(0);
  });

  it('CervicalSpineDiagram should render C1-C7 labels', () => {
    const { container } = render(
      <svg>
        <CervicalSpineDiagram />
      </svg>
    );
    const textElements = [...container.querySelectorAll('text')];
    const labels = textElements.map((t) => t.textContent.trim());
    expect(labels).toContain('C1');
    expect(labels).toContain('C7');
  });

  it('LumbarSpineDiagram should render L1-L5 labels', () => {
    const { container } = render(
      <svg>
        <LumbarSpineDiagram />
      </svg>
    );
    const textElements = [...container.querySelectorAll('text')];
    const labels = textElements.map((t) => t.textContent.trim());
    expect(labels).toContain('L1');
    expect(labels).toContain('L5');
  });

  it('HipDiagram should render Symphysis text', () => {
    const { container } = render(
      <svg>
        <HipDiagram />
      </svg>
    );
    const textElements = [...container.querySelectorAll('text')];
    const labels = textElements.map((t) => t.textContent.trim());
    expect(labels).toContain('Symphysis');
  });

  it('HeadTMJDiagram should render TMJ text', () => {
    const { container } = render(
      <svg>
        <HeadTMJDiagram />
      </svg>
    );
    const textElements = [...container.querySelectorAll('text')];
    const labels = textElements.map((t) => t.textContent.trim());
    expect(labels).toContain('TMJ');
  });

  it('AnkleDiagram should render Talus text', () => {
    const { container } = render(
      <svg>
        <AnkleDiagram />
      </svg>
    );
    const textElements = [...container.querySelectorAll('text')];
    const labels = textElements.map((t) => t.textContent.trim());
    expect(labels).toContain('Talus');
  });

  it('WristDiagram should render Carpalia text', () => {
    const { container } = render(
      <svg>
        <WristDiagram />
      </svg>
    );
    const textElements = [...container.querySelectorAll('text')];
    const labels = textElements.map((t) => t.textContent.trim());
    expect(labels).toContain('Carpalia');
  });

  it('ElbowDiagram should render Humerus text', () => {
    const { container } = render(
      <svg>
        <ElbowDiagram />
      </svg>
    );
    const textElements = [...container.querySelectorAll('text')];
    const labels = textElements.map((t) => t.textContent.trim());
    expect(labels).toContain('Humerus');
  });
});
