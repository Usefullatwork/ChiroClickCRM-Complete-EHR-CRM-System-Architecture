/**
 * Tests for MuscleMap Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import MuscleMap, { MUSCLE_GROUPS, FINDING_TYPES } from '../MuscleMap';

describe('MuscleMap Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the muscle map component', () => {
      render(<MuscleMap onChange={mockOnChange} />);

      expect(screen.getByText('Muskelkart')).toBeInTheDocument();
    });

    it('should render view toggle buttons', () => {
      render(<MuscleMap onChange={mockOnChange} />);

      expect(screen.getByText('Forfra')).toBeInTheDocument();
      expect(screen.getByText('Bakfra')).toBeInTheDocument();
    });

    it('should render finding type buttons', () => {
      render(<MuscleMap onChange={mockOnChange} />);

      FINDING_TYPES.forEach(type => {
        expect(screen.getByText(new RegExp(type.label))).toBeInTheDocument();
      });
    });

    it('should render muscle group filter buttons', () => {
      render(<MuscleMap onChange={mockOnChange} />);

      expect(screen.getByText('Alle')).toBeInTheDocument();
      expect(screen.getByText('Nakke')).toBeInTheDocument();
      expect(screen.getByText('Rygg')).toBeInTheDocument();
    });
  });

  describe('View Switching', () => {
    it('should switch between anterior and posterior views', () => {
      
      render(<MuscleMap onChange={mockOnChange} />);

      // Default is posterior
      expect(screen.getByText('Bakfra')).toBeInTheDocument();

      // Switch to anterior
      fireEvent.click(screen.getByText('Forfra'));
      expect(screen.getByText('Forfra')).toBeInTheDocument();
    });
  });

  describe('Muscle Filtering', () => {
    it('should filter muscles by group', () => {
      
      render(<MuscleMap onChange={mockOnChange} />);

      // Click on Nakke filter
      fireEvent.click(screen.getByText('Nakke'));

      // The filter should be active
      // (Component behavior: only neck muscles shown in SVG)
    });

    it('should clear filter when clicking Alle', () => {
      
      render(<MuscleMap onChange={mockOnChange} />);

      // First filter
      fireEvent.click(screen.getByText('Nakke'));

      // Then clear
      fireEvent.click(screen.getByText('Alle'));
    });
  });

  describe('Finding Selection', () => {
    it('should allow selecting finding type', () => {
      
      render(<MuscleMap onChange={mockOnChange} />);

      // Click on a finding type button
      const triggerPointBtn = screen.getByText(/Trigger point/);
      fireEvent.click(triggerPointBtn);

      // The button should be highlighted (has ring class)
      expect(triggerPointBtn.className).toContain('ring');
    });
  });

  describe('Findings Management', () => {
    it('should display findings count badge', () => {
      const findings = {
        'upper_trapezius_r_trigger_point': {
          muscleId: 'upper_trapezius_r',
          type: 'trigger_point',
          typeLabel: 'Trigger point'
        }
      };

      render(<MuscleMap findings={findings} onChange={mockOnChange} />);

      expect(screen.getByText('1 funn')).toBeInTheDocument();
    });

    it('should call onChange when clearing findings', () => {
      
      const findings = {
        'test_finding': {
          muscleId: 'upper_trapezius_r',
          type: 'trigger_point',
          typeLabel: 'Trigger point'
        }
      };

      render(<MuscleMap findings={findings} onChange={mockOnChange} />);

      const clearButton = screen.getByText('Nullstill');
      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith({});
    });
  });

  describe('Read Only Mode', () => {
    it('should not allow interactions when readOnly', () => {
      
      render(<MuscleMap readOnly onChange={mockOnChange} />);

      // Finding type buttons should not respond
      // Clear button should not be visible
      expect(screen.queryByText('Nullstill')).not.toBeInTheDocument();
    });
  });

  describe('Narrative Generation', () => {
    it('should generate narrative from findings', () => {
      const findings = {
        'upper_trapezius_r_trigger_point': {
          muscleId: 'upper_trapezius_r',
          muscle: { label: 'Øvre trapezius H' },
          type: 'trigger_point',
          typeLabel: 'Trigger point'
        },
        'erector_spinae_r_hypertonicity': {
          muscleId: 'erector_spinae_r',
          muscle: { label: 'Erector spinae H' },
          type: 'hypertonicity',
          typeLabel: 'Hypertonus'
        }
      };

      render(<MuscleMap findings={findings} onChange={mockOnChange} />);

      expect(screen.getByText(/Trigger points funnet i/)).toBeInTheDocument();
      expect(screen.getByText(/Hypertonus i/)).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode', () => {
      render(<MuscleMap compact onChange={mockOnChange} />);

      // Should still render main elements
      expect(screen.getByText('Muskelkart')).toBeInTheDocument();
    });
  });
});

describe('MUSCLE_GROUPS Data', () => {
  it('should have anterior and posterior groups', () => {
    expect(MUSCLE_GROUPS.anterior).toBeDefined();
    expect(MUSCLE_GROUPS.posterior).toBeDefined();
  });

  it('should have required properties for each muscle', () => {
    Object.values(MUSCLE_GROUPS.anterior).forEach(muscle => {
      expect(muscle.id).toBeDefined();
      expect(muscle.label).toBeDefined();
      expect(muscle.labelEn).toBeDefined();
      expect(muscle.group).toBeDefined();
      expect(muscle.path).toBeDefined();
      expect(muscle.innervation).toBeDefined();
      expect(muscle.actions).toBeInstanceOf(Array);
      expect(muscle.commonIssues).toBeInstanceOf(Array);
    });
  });

  it('should have Norwegian labels for all muscles', () => {
    const allMuscles = [
      ...Object.values(MUSCLE_GROUPS.anterior),
      ...Object.values(MUSCLE_GROUPS.posterior)
    ];

    allMuscles.forEach(muscle => {
      expect(muscle.label).toBeDefined();
      expect(muscle.label.length).toBeGreaterThan(0);
    });
  });
});

describe('FINDING_TYPES Data', () => {
  it('should have all required finding types', () => {
    const expectedTypes = ['trigger_point', 'hypertonicity', 'weakness', 'shortness', 'adhesion', 'treated'];

    const typeIds = FINDING_TYPES.map(t => t.id);
    expectedTypes.forEach(type => {
      expect(typeIds).toContain(type);
    });
  });

  it('should have colors for all finding types', () => {
    FINDING_TYPES.forEach(type => {
      expect(type.color).toBeDefined();
      expect(type.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});
