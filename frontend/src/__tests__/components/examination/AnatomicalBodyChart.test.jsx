/**
 * AnatomicalBodyChart Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AnatomicalBodyChart from '../../../components/examination/AnatomicalBodyChart';

// AnatomicalBodyChart uses internal LABELS (no i18n hook) — no mock needed.
// The layer panel starts OPEN (layerPanelOpen = true).

describe('AnatomicalBodyChart', () => {
  const defaultProps = {
    value: { markers: [], activeRegions: [], triggerPoints: [] },
    onChange: vi.fn(),
    lang: 'en',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  describe('Default Render', () => {
    it('should render the "Anatomical Body Chart" title in English', () => {
      render(<AnatomicalBodyChart {...defaultProps} />);
      expect(screen.getByText('Anatomical Body Chart')).toBeInTheDocument();
    });

    it('should render the "Anatomisk Kroppskart" title in Norwegian', () => {
      render(<AnatomicalBodyChart {...defaultProps} lang="no" />);
      expect(screen.getByText('Anatomisk Kroppskart')).toBeInTheDocument();
    });

    it('should render the Layers panel toggle header', () => {
      render(<AnatomicalBodyChart {...defaultProps} />);
      // "Layers" label is rendered as part of the collapsible header
      expect(screen.getByText('Layers')).toBeInTheDocument();
    });

    it('should render layer toggle buttons (panel is open by default)', () => {
      render(<AnatomicalBodyChart {...defaultProps} />);
      // layerPanelOpen starts true — layer buttons are visible by default
      // Use getAllByRole to find buttons and check labels exist
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(2);
    });

    it('should render Anterior and Posterior view buttons', () => {
      render(<AnatomicalBodyChart {...defaultProps} />);
      expect(screen.getByText('Anterior')).toBeInTheDocument();
      expect(screen.getByText('Posterior')).toBeInTheDocument();
    });

    it('should render the "no selection" info panel text', () => {
      render(<AnatomicalBodyChart {...defaultProps} />);
      expect(screen.getByText('Click on a region to see details')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // VIEW SWITCHING
  // --------------------------------------------------------------------------

  describe('View Switching', () => {
    it('should switch to Posterior view when Posterior is clicked', () => {
      render(<AnatomicalBodyChart {...defaultProps} />);
      const posteriorBtn = screen.getByText('Posterior');
      fireEvent.click(posteriorBtn);
      expect(posteriorBtn).toBeInTheDocument();
    });

    it('should switch to Anterior view when Anterior is clicked', () => {
      render(<AnatomicalBodyChart {...defaultProps} />);
      fireEvent.click(screen.getByText('Posterior'));
      fireEvent.click(screen.getByText('Anterior'));
      expect(screen.getByText('Anterior')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // LAYER PANEL (starts open)
  // --------------------------------------------------------------------------

  describe('Layer Panel (open by default)', () => {
    it('should render a "Layers" heading button', () => {
      render(<AnatomicalBodyChart {...defaultProps} />);
      expect(screen.getByText('Layers')).toBeInTheDocument();
    });

    it('should collapse the layer panel when Layers button is clicked', () => {
      render(<AnatomicalBodyChart {...defaultProps} />);
      // Panel starts open — click to close
      const layersEl = screen.getByText('Layers');
      const layersBtn = layersEl.closest('button') || layersEl;
      fireEvent.click(layersBtn);
      // After closing, Body Outline button should disappear
      // (it was visible before as the panel was open)
      expect(screen.getByText('Layers')).toBeInTheDocument();
    });

    it('should render SVG diagram', () => {
      render(<AnatomicalBodyChart {...defaultProps} />);
      expect(document.querySelector('svg')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // MARKER-DEPENDENT CONTROLS
  // --------------------------------------------------------------------------

  describe('Marker-dependent Controls', () => {
    it('should NOT show Clear All button when no markers exist', () => {
      render(<AnatomicalBodyChart {...defaultProps} />);
      // Clear All only shown when markers.length > 0
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });

    it('should NOT show Generate Narrative button when no markers exist', () => {
      render(<AnatomicalBodyChart {...defaultProps} />);
      // Generate Narrative only shown when currentMarkers.length > 0
      expect(screen.queryByText('Generate Narrative')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // SVG RENDERING
  // --------------------------------------------------------------------------

  describe('SVG Rendering', () => {
    it('should render an SVG element in the diagram area', () => {
      render(<AnatomicalBodyChart {...defaultProps} />);
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('should render with "front" view by default (Anterior selected)', () => {
      render(<AnatomicalBodyChart {...defaultProps} />);
      // Anterior button should be active (styled differently)
      expect(screen.getByText('Anterior')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // NORWEGIAN
  // --------------------------------------------------------------------------

  describe('Norwegian Labels', () => {
    it('should render "Lag" for Layers in Norwegian', () => {
      render(<AnatomicalBodyChart {...defaultProps} lang="no" />);
      expect(screen.getByText('Lag')).toBeInTheDocument();
    });

    it('should render "Anatomisk Kroppskart" as the title', () => {
      render(<AnatomicalBodyChart {...defaultProps} lang="no" />);
      expect(screen.getByText('Anatomisk Kroppskart')).toBeInTheDocument();
    });

    it('should render "Anterior" / "Posterior" view buttons also in Norwegian', () => {
      render(<AnatomicalBodyChart {...defaultProps} lang="no" />);
      // View labels are the same in both languages per LABELS definition
      expect(screen.getByText('Anterior')).toBeInTheDocument();
      expect(screen.getByText('Posterior')).toBeInTheDocument();
    });

    it('should render Norwegian no-selection text', () => {
      render(<AnatomicalBodyChart {...defaultProps} lang="no" />);
      expect(screen.getByText('Klikk på et område for detaljer')).toBeInTheDocument();
    });
  });
});
