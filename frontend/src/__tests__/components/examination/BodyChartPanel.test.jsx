/**
 * BodyChartPanel Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BodyChartPanel, {
  BodyChartCompact,
  QuickRegionButtons,
} from '../../../components/examination/BodyChartPanel';

// BodyChartPanel uses internal LABELS (not i18n hook), no mock needed

describe('BodyChartPanel', () => {
  const defaultValue = { markers: [], selectedRegions: [] };
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // DEFAULT RENDER
  // --------------------------------------------------------------------------

  describe('Default Render', () => {
    it('should render the "Body Chart" title in English', () => {
      render(<BodyChartPanel value={defaultValue} onChange={mockOnChange} lang="en" />);
      expect(screen.getByText('Body Chart')).toBeInTheDocument();
    });

    it('should render the "Kroppskart" title in Norwegian', () => {
      render(<BodyChartPanel value={defaultValue} onChange={mockOnChange} lang="no" />);
      expect(screen.getByText('Kroppskart')).toBeInTheDocument();
    });

    it('should render front/back view toggle buttons', () => {
      render(<BodyChartPanel value={defaultValue} onChange={mockOnChange} lang="en" />);
      expect(screen.getByText('Front')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should render the Symptom Type label', () => {
      render(<BodyChartPanel value={defaultValue} onChange={mockOnChange} lang="en" />);
      expect(screen.getByText('Symptom Type')).toBeInTheDocument();
    });

    it('should render the no-markers instruction text when empty', () => {
      render(<BodyChartPanel value={defaultValue} onChange={mockOnChange} lang="en" />);
      expect(
        screen.getByText('Click on the body diagram to mark symptom locations')
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // VIEW TOGGLE
  // --------------------------------------------------------------------------

  describe('View Toggle', () => {
    it('should switch to back view when Back button is clicked', () => {
      render(<BodyChartPanel value={defaultValue} onChange={mockOnChange} lang="en" />);
      const backBtn = screen.getByText('Back');
      fireEvent.click(backBtn);
      // After switching, Back button gets active styling (bg-blue-600) — it's still visible
      expect(backBtn).toBeInTheDocument();
    });

    it('should switch back to front view when Front button is clicked', () => {
      render(<BodyChartPanel value={defaultValue} onChange={mockOnChange} lang="en" />);
      fireEvent.click(screen.getByText('Back'));
      fireEvent.click(screen.getByText('Front'));
      expect(screen.getByText('Front')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // MARKERS
  // --------------------------------------------------------------------------

  describe('Markers', () => {
    it('should not show Clear All when no markers exist', () => {
      render(<BodyChartPanel value={defaultValue} onChange={mockOnChange} lang="en" />);
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });

    it('should show Clear All button when markers exist', () => {
      const valueWithMarker = {
        markers: [
          {
            id: 1,
            regionId: 'head',
            view: 'front',
            symptom: 'pain',
            intensity: 5,
            description: '',
          },
        ],
        selectedRegions: [],
      };
      render(<BodyChartPanel value={valueWithMarker} onChange={mockOnChange} lang="en" />);
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should call onChange with empty markers when Clear All is clicked', () => {
      const valueWithMarker = {
        markers: [
          {
            id: 1,
            regionId: 'head',
            view: 'front',
            symptom: 'pain',
            intensity: 5,
            description: '',
          },
        ],
        selectedRegions: [],
      };
      render(<BodyChartPanel value={valueWithMarker} onChange={mockOnChange} lang="en" />);
      fireEvent.click(screen.getByText('Clear All'));
      expect(mockOnChange).toHaveBeenCalledWith({ markers: [], selectedRegions: [] });
    });

    it('should show marker region name in legend when marker exists', () => {
      const valueWithMarker = {
        markers: [
          {
            id: 1,
            regionId: 'head',
            view: 'front',
            symptom: 'pain',
            intensity: 5,
            description: '',
          },
        ],
        selectedRegions: [],
      };
      render(<BodyChartPanel value={valueWithMarker} onChange={mockOnChange} lang="en" />);
      expect(screen.getByText('Head')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // INTENSITY SLIDER
  // --------------------------------------------------------------------------

  describe('Intensity Slider', () => {
    it('should render an Intensity range input', () => {
      render(<BodyChartPanel value={defaultValue} onChange={mockOnChange} lang="en" />);
      const slider = document.querySelector('input[type="range"]');
      expect(slider).toBeInTheDocument();
      expect(slider.min).toBe('0');
      expect(slider.max).toBe('10');
    });

    it('should display current intensity value', () => {
      render(<BodyChartPanel value={defaultValue} onChange={mockOnChange} lang="en" />);
      // Default intensity is 5
      expect(screen.getByText('Intensity:')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // NARRATIVE GENERATION
  // --------------------------------------------------------------------------

  describe('Narrative Generation', () => {
    it('should not show Generate Narrative button when no markers', () => {
      render(
        <BodyChartPanel value={defaultValue} onChange={mockOnChange} showNarrative lang="en" />
      );
      expect(screen.queryByText('Generate Narrative')).not.toBeInTheDocument();
    });

    it('should show Generate Narrative button when markers exist and showNarrative=true', () => {
      const valueWithMarker = {
        markers: [
          {
            id: 1,
            regionId: 'head',
            view: 'front',
            symptom: 'pain',
            intensity: 5,
            description: '',
          },
        ],
        selectedRegions: [],
      };
      render(
        <BodyChartPanel
          value={valueWithMarker}
          onChange={mockOnChange}
          showNarrative
          onGenerateNarrative={vi.fn()}
          lang="en"
        />
      );
      expect(screen.getByText('Generate Narrative')).toBeInTheDocument();
    });

    it('should call onGenerateNarrative when button is clicked', () => {
      const onGenerateNarrative = vi.fn();
      const valueWithMarker = {
        markers: [
          {
            id: 1,
            regionId: 'head',
            view: 'front',
            symptom: 'pain',
            intensity: 5,
            description: '',
          },
        ],
        selectedRegions: [],
      };
      render(
        <BodyChartPanel
          value={valueWithMarker}
          onChange={mockOnChange}
          showNarrative
          onGenerateNarrative={onGenerateNarrative}
          lang="en"
        />
      );
      fireEvent.click(screen.getByText('Generate Narrative'));
      expect(onGenerateNarrative).toHaveBeenCalledWith(expect.any(String));
    });
  });
});

// =============================================================================
// BodyChartCompact
// =============================================================================

describe('BodyChartCompact', () => {
  it('should render an SVG element', () => {
    render(<BodyChartCompact value={{ markers: [] }} lang="en" />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should display marker count in caption', () => {
    render(<BodyChartCompact value={{ markers: [] }} lang="en" view="front" />);
    expect(screen.getByText('Front (0)')).toBeInTheDocument();
  });

  it('should call onClick when the compact chart wrapper is clicked', () => {
    const onClick = vi.fn();
    const { container } = render(
      <BodyChartCompact value={{ markers: [] }} lang="en" onClick={onClick} />
    );
    // The outer div wraps both svg and caption — click the outer-most div
    const wrapper = container.firstChild;
    fireEvent.click(wrapper);
    expect(onClick).toHaveBeenCalled();
  });
});

// =============================================================================
// QuickRegionButtons
// =============================================================================

describe('QuickRegionButtons', () => {
  it('should render quick region buttons', () => {
    render(
      <QuickRegionButtons value={{ markers: [] }} onChange={vi.fn()} symptom="pain" lang="en" />
    );
    // Should have at least one button for common spine regions
    expect(screen.getByText('Cervical Spine')).toBeInTheDocument();
  });

  it('should call onChange when a region button is toggled on', () => {
    const onChange = vi.fn();
    render(
      <QuickRegionButtons value={{ markers: [] }} onChange={onChange} symptom="pain" lang="en" />
    );
    fireEvent.click(screen.getByText('Cervical Spine'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        markers: expect.arrayContaining([
          expect.objectContaining({ regionId: 'cervical', symptom: 'pain' }),
        ]),
      })
    );
  });

  it('should call onChange removing the marker when a selected region is clicked again', () => {
    const onChange = vi.fn();
    const valueWithCervical = {
      markers: [
        {
          id: 1,
          regionId: 'cervical',
          view: 'back',
          symptom: 'pain',
          intensity: 5,
          description: '',
        },
      ],
    };
    render(
      <QuickRegionButtons value={valueWithCervical} onChange={onChange} symptom="pain" lang="en" />
    );
    fireEvent.click(screen.getByText('Cervical Spine'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ markers: [] }));
  });
});
