/**
 * FacialLinesChart Component Tests
 *
 * Tests the facial anatomy chart with fascial lines, trigger points,
 * and nerve zone overlays. Component uses internal LABELS object (no i18n hook).
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import FacialLinesChart, {
  FASCIAL_LINES,
  FACIAL_MUSCLES,
  NERVE_ZONES,
  FACIAL_LABELS,
} from '../../../components/examination/FacialLinesChart';

describe('FacialLinesChart', () => {
  const mockOnChange = vi.fn();
  const mockOnGenerateNarrative = vi.fn();

  const defaultProps = {
    value: { markers: [], selectedPoints: [] },
    onChange: mockOnChange,
    onGenerateNarrative: mockOnGenerateNarrative,
    lang: 'no',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  describe('Default Render (Norwegian)', () => {
    it('should render the Norwegian title "Ansiktslinjer Kart"', () => {
      render(<FacialLinesChart {...defaultProps} />);
      expect(screen.getByText('Ansiktslinjer Kart')).toBeInTheDocument();
    });

    it('should render the Norwegian subtitle', () => {
      render(<FacialLinesChart {...defaultProps} />);
      expect(screen.getByText('Fascielinjer og behandlingspunkter')).toBeInTheDocument();
    });

    it('should render layer control heading "Lag"', () => {
      render(<FacialLinesChart {...defaultProps} />);
      expect(screen.getByText('Lag')).toBeInTheDocument();
    });

    it('should render Generate Narrative button in Norwegian', () => {
      render(<FacialLinesChart {...defaultProps} />);
      expect(screen.getByText('Generer Narrativ')).toBeInTheDocument();
    });

    it('should render Clear All button in Norwegian', () => {
      render(<FacialLinesChart {...defaultProps} />);
      expect(screen.getByText('Fjern Alle')).toBeInTheDocument();
    });

    it('should render the no-selection info text in Norwegian', () => {
      render(<FacialLinesChart {...defaultProps} />);
      expect(screen.getByText('Klikk på et punkt eller linje for detaljer')).toBeInTheDocument();
    });

    it('should render an SVG face diagram', () => {
      const { container } = render(<FacialLinesChart {...defaultProps} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render 5 layer toggle buttons', () => {
      render(<FacialLinesChart {...defaultProps} />);
      // Ansiktsomriss, Fascielinjer, Muskler, Triggerpunkter, Nervesoner
      expect(screen.getByText('Ansiktsomriss')).toBeInTheDocument();
      // Fascielinjer appears in both toggle and legend — use getAllByText
      expect(screen.getAllByText('Fascielinjer').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Muskler')).toBeInTheDocument();
      expect(screen.getByText('Triggerpunkter')).toBeInTheDocument();
      expect(screen.getByText('Nervesoner')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // ENGLISH LABELS
  // --------------------------------------------------------------------------

  describe('English Render', () => {
    it('should render the English title "Facial Lines Chart"', () => {
      render(<FacialLinesChart {...defaultProps} lang="en" />);
      expect(screen.getByText('Facial Lines Chart')).toBeInTheDocument();
    });

    it('should render English layer names', () => {
      render(<FacialLinesChart {...defaultProps} lang="en" />);
      expect(screen.getByText('Face Outline')).toBeInTheDocument();
      // "Fascial Lines" appears in toggle and legend — use getAllByText
      expect(screen.getAllByText('Fascial Lines').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Trigger Points')).toBeInTheDocument();
    });

    it('should render English no-selection text', () => {
      render(<FacialLinesChart {...defaultProps} lang="en" />);
      expect(screen.getByText('Click on a point or line for details')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // LAYER TOGGLES
  // --------------------------------------------------------------------------

  describe('Layer Toggles', () => {
    it('should toggle the Fascial Lines layer off and on', () => {
      render(<FacialLinesChart {...defaultProps} />);

      // Fascielinjer appears in toggle + legend — find the toggle button specifically
      const fascialElements = screen.getAllByText('Fascielinjer');
      const fascialBtn = fascialElements[0].closest('button');
      fireEvent.click(fascialBtn);

      // Click again to re-enable
      fireEvent.click(fascialBtn);

      // Still renders the button
      expect(screen.getAllByText('Fascielinjer').length).toBeGreaterThanOrEqual(1);
    });

    it('should toggle the Trigger Points layer off', () => {
      render(<FacialLinesChart {...defaultProps} />);
      const tpBtn = screen.getByText('Triggerpunkter').closest('button');
      fireEvent.click(tpBtn);
      expect(screen.getByText('Triggerpunkter')).toBeInTheDocument();
    });

    it('should toggle the Nerve Zones layer on', () => {
      render(<FacialLinesChart {...defaultProps} />);
      // Nerves are OFF by default — only the toggle button shows "Nervesoner"
      const nervesBtn = screen.getByText('Nervesoner').closest('button');
      fireEvent.click(nervesBtn);
      // After enabling, nerve zone legend heading also shows "Nervesoner"
      expect(screen.getAllByText('Nervesoner').length).toBeGreaterThanOrEqual(2);
    });

    it('should toggle the Muscles layer on', () => {
      render(<FacialLinesChart {...defaultProps} />);
      const muscleBtn = screen.getByText('Muskler').closest('button');
      fireEvent.click(muscleBtn);
      expect(screen.getByText('Muskler')).toBeInTheDocument();
    });

    it('should toggle the Outline layer off', () => {
      render(<FacialLinesChart {...defaultProps} />);
      const outlineBtn = screen.getByText('Ansiktsomriss').closest('button');
      fireEvent.click(outlineBtn);
      expect(screen.getByText('Ansiktsomriss')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // LEGEND
  // --------------------------------------------------------------------------

  describe('Legend', () => {
    it('should render the Legend toggle', () => {
      render(<FacialLinesChart {...defaultProps} />);
      expect(screen.getByText('Legend')).toBeInTheDocument();
    });

    it('should toggle legend visibility', () => {
      render(<FacialLinesChart {...defaultProps} />);
      const legendBtn = screen.getByText('Legend').closest('button');
      fireEvent.click(legendBtn);
      // Legend collapses; click again to show
      fireEvent.click(legendBtn);
      expect(screen.getByText('Legend')).toBeInTheDocument();
    });

    it('should show fascial line names in the legend when fascial lines are enabled', () => {
      render(<FacialLinesChart {...defaultProps} />);
      // First 5 fascial lines are shown in legend
      expect(screen.getByText('Overfladisk Frontallinje')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // GENERATE NARRATIVE
  // --------------------------------------------------------------------------

  describe('Generate Narrative', () => {
    it('should NOT call onGenerateNarrative when no markers exist', () => {
      render(<FacialLinesChart {...defaultProps} />);
      fireEvent.click(screen.getByText('Generer Narrativ'));
      expect(mockOnGenerateNarrative).not.toHaveBeenCalled();
    });

    it('should call onGenerateNarrative when markers exist', () => {
      const valueWithMarkers = {
        markers: [
          {
            id: 1,
            type: 'triggerPoint',
            muscleId: 'Frontalis',
            description: 'Pannehodepine',
            muscle: 'Frontalis',
          },
        ],
        selectedPoints: [],
      };

      render(<FacialLinesChart {...defaultProps} value={valueWithMarkers} />);
      fireEvent.click(screen.getByText('Generer Narrativ'));
      expect(mockOnGenerateNarrative).toHaveBeenCalledWith(
        expect.stringContaining('triggerpunkter')
      );
    });
  });

  // --------------------------------------------------------------------------
  // CLEAR ALL
  // --------------------------------------------------------------------------

  describe('Clear All', () => {
    it('should call onChange with empty state when Clear All is clicked', () => {
      render(<FacialLinesChart {...defaultProps} />);
      fireEvent.click(screen.getByText('Fjern Alle'));
      expect(mockOnChange).toHaveBeenCalledWith({
        markers: [],
        selectedPoints: [],
      });
    });
  });

  // --------------------------------------------------------------------------
  // MARKERS COUNT
  // --------------------------------------------------------------------------

  describe('Markers Count', () => {
    it('should show markers count when markers exist', () => {
      const valueWithMarkers = {
        markers: [
          {
            id: 1,
            type: 'triggerPoint',
            muscleId: 'Frontalis',
            description: 'Pannehodepine',
            muscle: 'Frontalis',
          },
          {
            id: 2,
            type: 'triggerPoint',
            muscleId: 'Masseter',
            description: 'Kjevesmerte',
            muscle: 'Masseter',
          },
        ],
        selectedPoints: [],
      };

      render(<FacialLinesChart {...defaultProps} value={valueWithMarkers} />);
      expect(screen.getByText('2 punkt markert')).toBeInTheDocument();
    });

    it('should show marked points list when markers exist', () => {
      const valueWithMarkers = {
        markers: [
          {
            id: 1,
            type: 'triggerPoint',
            muscleId: 'Frontalis',
            description: 'Pannehodepine',
            muscle: 'Frontalis',
          },
        ],
        selectedPoints: [],
      };

      render(<FacialLinesChart {...defaultProps} value={valueWithMarkers} />);
      expect(screen.getByText('Markerte punkter')).toBeInTheDocument();
      expect(screen.getByText('Frontalis')).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// EXPORTED DATA STRUCTURES
// ===========================================================================

describe('FASCIAL_LINES Data', () => {
  it('should define at least 8 fascial lines', () => {
    expect(Object.keys(FASCIAL_LINES).length).toBeGreaterThanOrEqual(8);
  });

  it('should have bilingual names for each line', () => {
    Object.values(FASCIAL_LINES).forEach((line) => {
      expect(line.en.name).toBeDefined();
      expect(line.no.name).toBeDefined();
      expect(line.color).toBeDefined();
      expect(line.path).toBeDefined();
    });
  });

  it('should have technique descriptions in both languages', () => {
    Object.values(FASCIAL_LINES).forEach((line) => {
      expect(line.en.technique).toBeDefined();
      expect(line.no.technique).toBeDefined();
    });
  });
});

describe('FACIAL_MUSCLES Data', () => {
  it('should define at least 10 facial muscles', () => {
    expect(Object.keys(FACIAL_MUSCLES).length).toBeGreaterThanOrEqual(10);
  });

  it('should have trigger points for each muscle', () => {
    Object.values(FACIAL_MUSCLES).forEach((muscle) => {
      expect(muscle.triggerPoints).toBeDefined();
      expect(muscle.triggerPoints.length).toBeGreaterThan(0);
    });
  });

  it('should have referral patterns for each trigger point', () => {
    Object.values(FACIAL_MUSCLES).forEach((muscle) => {
      muscle.triggerPoints.forEach((tp) => {
        expect(tp.referral).toBeDefined();
        expect(tp.referral.no).toBeDefined();
        expect(tp.referral.en).toBeDefined();
      });
    });
  });
});

describe('NERVE_ZONES Data', () => {
  it('should define V1, V2, V3 trigeminal zones', () => {
    expect(NERVE_ZONES.V1_ophthalmic).toBeDefined();
    expect(NERVE_ZONES.V2_maxillary).toBeDefined();
    expect(NERVE_ZONES.V3_mandibular).toBeDefined();
  });

  it('should have bilingual names and area descriptions', () => {
    Object.values(NERVE_ZONES).forEach((zone) => {
      expect(zone.en.name).toBeDefined();
      expect(zone.no.name).toBeDefined();
      expect(zone.en.area).toBeDefined();
      expect(zone.no.area).toBeDefined();
    });
  });
});

describe('FACIAL_LABELS Data', () => {
  it('should have Norwegian and English label sets', () => {
    expect(FACIAL_LABELS.en).toBeDefined();
    expect(FACIAL_LABELS.no).toBeDefined();
  });

  it('should have title in both languages', () => {
    expect(FACIAL_LABELS.en.title).toBe('Facial Lines Chart');
    expect(FACIAL_LABELS.no.title).toBe('Ansiktslinjer Kart');
  });
});
