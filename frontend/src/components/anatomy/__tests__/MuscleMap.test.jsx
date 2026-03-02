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

      FINDING_TYPES.forEach((type) => {
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

    it('should show posterior label when posterior is selected', () => {
      render(<MuscleMap onChange={mockOnChange} />);

      // Default is posterior, check SVG text
      expect(screen.getByText('Posterior (Bakfra)')).toBeInTheDocument();
    });

    it('should show anterior label when anterior is selected', () => {
      render(<MuscleMap onChange={mockOnChange} />);

      fireEvent.click(screen.getByText('Forfra'));
      expect(screen.getByText('Anterior (Forfra)')).toBeInTheDocument();
    });
  });

  describe('Muscle Filtering', () => {
    it('should filter muscles by group', () => {
      render(<MuscleMap onChange={mockOnChange} />);

      // Click on Nakke filter
      fireEvent.click(screen.getByText('Nakke'));

      // The filter should be active — the button gets a color style
      const nakkeBtn = screen.getByText('Nakke');
      expect(nakkeBtn.style.backgroundColor).toBeTruthy();
    });

    it('should clear filter when clicking Alle', () => {
      render(<MuscleMap onChange={mockOnChange} />);

      // First filter
      fireEvent.click(screen.getByText('Nakke'));

      // Then clear
      fireEvent.click(screen.getByText('Alle'));

      // Alle button should be active (dark bg class)
      const alleBtn = screen.getByText('Alle');
      expect(alleBtn.className).toContain('bg-gray-800');
    });

    it('should toggle filter group off when clicking the same group again', () => {
      render(<MuscleMap onChange={mockOnChange} />);

      // Click Nakke to activate
      fireEvent.click(screen.getByText('Nakke'));
      expect(screen.getByText('Nakke').style.backgroundColor).toBeTruthy();

      // Click Nakke again to deactivate
      fireEvent.click(screen.getByText('Nakke'));
      expect(screen.getByText('Nakke').style.backgroundColor).toBeFalsy();
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

    it('should switch between finding types', () => {
      render(<MuscleMap onChange={mockOnChange} />);

      // Select Hypertonus
      const hypertonusBtn = screen.getByText(/Hypertonus/);
      fireEvent.click(hypertonusBtn);
      expect(hypertonusBtn.className).toContain('ring');

      // Trigger point should no longer have ring
      const triggerPointBtn = screen.getByText(/Trigger point/);
      expect(triggerPointBtn.className).not.toContain('ring');
    });
  });

  describe('SVG Path Click Interactions', () => {
    it('should call onChange when clicking an SVG muscle path to add a finding', () => {
      const { container } = render(<MuscleMap onChange={mockOnChange} />);

      // Get all SVG path elements with cursor-pointer class (the muscle clickable areas)
      const svgPaths = container.querySelectorAll('path.cursor-pointer');
      expect(svgPaths.length).toBeGreaterThan(0);

      // Click the first SVG path
      fireEvent.click(svgPaths[0]);

      // onChange should have been called with a new finding
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      const calledWith = mockOnChange.mock.calls[0][0];
      expect(Object.keys(calledWith).length).toBe(1);
    });

    it('should remove an existing finding when clicking the same muscle path again', () => {
      // Start with an existing trigger_point finding for upper_trapezius_r (posterior view)
      const existingFindings = {
        upper_trapezius_r_trigger_point: {
          muscleId: 'upper_trapezius_r',
          muscle: { label: 'Øvre trapezius H' },
          type: 'trigger_point',
          typeLabel: 'Trigger point',
          color: '#ef4444',
        },
      };

      const { container } = render(
        <MuscleMap findings={existingFindings} onChange={mockOnChange} />
      );

      // Find SVG paths with cursor-pointer class
      const svgPaths = container.querySelectorAll('path.cursor-pointer');
      expect(svgPaths.length).toBeGreaterThan(0);

      // Click the first path — the component toggles findings
      fireEvent.click(svgPaths[0]);

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should not call onChange when readOnly and clicking an SVG path', () => {
      const { container } = render(<MuscleMap readOnly onChange={mockOnChange} />);

      const svgPaths = container.querySelectorAll('path.cursor-pointer');
      if (svgPaths.length > 0) {
        fireEvent.click(svgPaths[0]);
      }

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Label Toggle', () => {
    it('should toggle labels when Eye/EyeOff icon button is clicked', () => {
      render(<MuscleMap onChange={mockOnChange} />);

      // Initially labels are visible, button title says "Skjul etiketter"
      const toggleBtn = screen.getByTitle('Skjul etiketter');
      expect(toggleBtn).toBeInTheDocument();

      // Click to hide labels
      fireEvent.click(toggleBtn);

      // Now button title should say "Vis etiketter"
      expect(screen.getByTitle('Vis etiketter')).toBeInTheDocument();

      // Click again to show labels
      fireEvent.click(screen.getByTitle('Vis etiketter'));
      expect(screen.getByTitle('Skjul etiketter')).toBeInTheDocument();
    });
  });

  describe('Findings Management', () => {
    it('should display findings count badge', () => {
      const findings = {
        upper_trapezius_r_trigger_point: {
          muscleId: 'upper_trapezius_r',
          type: 'trigger_point',
          typeLabel: 'Trigger point',
        },
      };

      render(<MuscleMap findings={findings} onChange={mockOnChange} />);

      expect(screen.getByText('1 funn')).toBeInTheDocument();
    });

    it('should call onChange when clearing findings', () => {
      const findings = {
        test_finding: {
          muscleId: 'upper_trapezius_r',
          type: 'trigger_point',
          typeLabel: 'Trigger point',
        },
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
        upper_trapezius_r_trigger_point: {
          muscleId: 'upper_trapezius_r',
          muscle: { label: 'Øvre trapezius H' },
          type: 'trigger_point',
          typeLabel: 'Trigger point',
        },
        erector_spinae_r_hypertonicity: {
          muscleId: 'erector_spinae_r',
          muscle: { label: 'Erector spinae H' },
          type: 'hypertonicity',
          typeLabel: 'Hypertonus',
        },
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
    Object.values(MUSCLE_GROUPS.anterior).forEach((muscle) => {
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
      ...Object.values(MUSCLE_GROUPS.posterior),
    ];

    allMuscles.forEach((muscle) => {
      expect(muscle.label).toBeDefined();
      expect(muscle.label.length).toBeGreaterThan(0);
    });
  });
});

describe('FINDING_TYPES Data', () => {
  it('should have all required finding types', () => {
    const expectedTypes = [
      'trigger_point',
      'hypertonicity',
      'weakness',
      'shortness',
      'adhesion',
      'treated',
    ];

    const typeIds = FINDING_TYPES.map((t) => t.id);
    expectedTypes.forEach((type) => {
      expect(typeIds).toContain(type);
    });
  });

  it('should have colors for all finding types', () => {
    FINDING_TYPES.forEach((type) => {
      expect(type.color).toBeDefined();
      expect(type.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});
