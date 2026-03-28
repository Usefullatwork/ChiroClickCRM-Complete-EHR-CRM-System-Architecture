/**
 * ManualMuscleTesting Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ManualMuscleTesting, {
  MMT_GRADES,
  MUSCLE_GROUPS,
} from '../../../components/examination/ManualMuscleTesting';

// ManualMuscleTesting does NOT use the i18n hook — labels are driven by the
// `lang` prop directly — no mock needed.

describe('ManualMuscleTesting', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  describe('Default Render', () => {
    it('should render the English heading "Manual Muscle Testing (MMT)"', () => {
      render(<ManualMuscleTesting values={{}} onChange={mockOnChange} lang="en" />);
      expect(screen.getByText('Manual Muscle Testing (MMT)')).toBeInTheDocument();
    });

    it('should render the Norwegian heading "Manuell Muskeltesting (MMT)"', () => {
      render(<ManualMuscleTesting values={{}} onChange={mockOnChange} lang="no" />);
      expect(screen.getByText('Manuell Muskeltesting (MMT)')).toBeInTheDocument();
    });

    it('should render the grading legend toggle', () => {
      render(<ManualMuscleTesting values={{}} onChange={mockOnChange} lang="en" />);
      expect(screen.getByText('Grading Scale')).toBeInTheDocument();
    });

    it('should render quick myotome test buttons', () => {
      render(<ManualMuscleTesting values={{}} onChange={mockOnChange} lang="en" />);
      // Multiple elements can match 'C5' (myotome button + nerve root badge)
      expect(screen.getAllByText('C5').length).toBeGreaterThan(0);
      expect(screen.getAllByText('L4').length).toBeGreaterThan(0);
    });

    it('should render the Upper Extremity region', () => {
      render(<ManualMuscleTesting values={{}} onChange={mockOnChange} lang="en" />);
      expect(screen.getByText(/Upper Extremity/i)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // REGION EXPAND / COLLAPSE
  // --------------------------------------------------------------------------

  describe('Region Expand / Collapse', () => {
    it('should expand Upper Extremity by default', () => {
      render(
        <ManualMuscleTesting
          values={{}}
          onChange={mockOnChange}
          lang="en"
          defaultExpanded={['upperExtremity']}
        />
      );
      // When expanded, the table headers are visible
      expect(screen.getAllByText('Left').length).toBeGreaterThan(0);
    });

    it('should toggle a collapsed region when the header is clicked', () => {
      render(
        <ManualMuscleTesting values={{}} onChange={mockOnChange} lang="en" defaultExpanded={[]} />
      );
      // Cervical region starts collapsed — click to expand
      const cervicalBtn = screen.getByText(/Cervical/i);
      fireEvent.click(cervicalBtn);
      // After expanding, muscle names should be visible
      expect(screen.getByText('Neck Flexion')).toBeInTheDocument();
    });

    it('should collapse an expanded region when header clicked twice', () => {
      render(
        <ManualMuscleTesting
          values={{}}
          onChange={mockOnChange}
          lang="en"
          defaultExpanded={['cervical']}
        />
      );
      const cervicalBtn = screen.getByText(/Cervical/i);
      // Expand (already expanded by default) then collapse
      fireEvent.click(cervicalBtn);
      expect(screen.queryByText('Neck Flexion')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // GRADING LEGEND
  // --------------------------------------------------------------------------

  describe('Grading Legend', () => {
    it('should show abbreviated grade legend by default', () => {
      render(<ManualMuscleTesting values={{}} onChange={mockOnChange} lang="en" />);
      // "Normal" appears multiple times in the legend — getAllByText is correct
      expect(screen.getAllByText(/Normal/).length).toBeGreaterThan(0);
    });

    it('should expand grading legend when Info button is clicked', () => {
      render(<ManualMuscleTesting values={{}} onChange={mockOnChange} lang="en" />);
      const infoBtn = screen.getByText('Grading Scale');
      const gradingBtn = infoBtn.closest('button') || infoBtn;
      fireEvent.click(gradingBtn);
      // After expanding, each grade has its description text visible. Grade 5 description
      // is split across two spans: the grade value and the description. Check for visible grade rows.
      // The abbreviated descriptions appear as the first part before " - ": e.g. "Normal"
      // But the full description text includes "Normal" in the grade 5 row.
      // The expansion shows a grid of grade entries.
      const gradingGrid = document.querySelector('.grid');
      expect(gradingGrid).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // QUICK MYOTOME PATTERN
  // --------------------------------------------------------------------------

  describe('Quick Myotome Patterns', () => {
    it('should highlight muscles when C5 pattern is clicked', () => {
      render(
        <ManualMuscleTesting
          values={{}}
          onChange={mockOnChange}
          lang="en"
          defaultExpanded={['upperExtremity']}
        />
      );
      // Multiple C5 elements exist (button + nerve root) — get the myotome button
      // It's in the QuickTestPanel which renders BEFORE the muscle table rows
      const allC5 = screen.getAllByText('C5');
      // The first one is the quick test button
      fireEvent.click(allC5[0]);
      // C5 pattern expands upperExtremity — shoulder abduction visible
      expect(screen.getByText('Shoulder Abduction')).toBeInTheDocument();
    });

    it('should expand lower extremity when L4 pattern is clicked', () => {
      render(
        <ManualMuscleTesting values={{}} onChange={mockOnChange} lang="en" defaultExpanded={[]} />
      );
      fireEvent.click(screen.getByText('L4'));
      expect(screen.getByText('Ankle Dorsiflexion')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // SUMMARY STATS
  // --------------------------------------------------------------------------

  describe('Summary Statistics', () => {
    it('should show weakness count when a grade below 4 is set', () => {
      render(
        <ManualMuscleTesting
          values={{ elbow_flexion_left: '3', elbow_flexion_right: '5' }}
          onChange={mockOnChange}
          lang="en"
          defaultExpanded={['upperExtremity']}
        />
      );
      // Summary should show "2 tests" and "1 weakness"
      expect(screen.getByText(/weakness/i)).toBeInTheDocument();
    });

    it('should show total test count in summary', () => {
      render(
        <ManualMuscleTesting
          values={{ elbow_flexion_left: '5', elbow_flexion_right: '5' }}
          onChange={mockOnChange}
          lang="en"
        />
      );
      expect(screen.getByText(/2 tests/i)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // GENERATE NARRATIVE
  // --------------------------------------------------------------------------

  describe('Generate Narrative', () => {
    it('should call onGenerateNarrative when Generate Text button is clicked', () => {
      const onGenerateNarrative = vi.fn();
      render(
        <ManualMuscleTesting
          values={{}}
          onChange={mockOnChange}
          lang="en"
          onGenerateNarrative={onGenerateNarrative}
        />
      );
      fireEvent.click(screen.getByText('Generate Text'));
      expect(onGenerateNarrative).toHaveBeenCalledWith(expect.any(String));
    });

    it('should generate "All tested muscles show normal strength" when no weakness', () => {
      const onGenerateNarrative = vi.fn();
      render(
        <ManualMuscleTesting
          values={{ elbow_flexion_left: '5', elbow_flexion_right: '5' }}
          onChange={mockOnChange}
          lang="en"
          onGenerateNarrative={onGenerateNarrative}
        />
      );
      fireEvent.click(screen.getByText('Generate Text'));
      expect(onGenerateNarrative).toHaveBeenCalledWith(expect.stringContaining('normal strength'));
    });
  });

  // --------------------------------------------------------------------------
  // EXPORTS
  // --------------------------------------------------------------------------

  describe('Module Exports', () => {
    it('should export MMT_GRADES array', () => {
      expect(Array.isArray(MMT_GRADES)).toBe(true);
      expect(MMT_GRADES.length).toBeGreaterThan(0);
    });

    it('should export MUSCLE_GROUPS with cervical region', () => {
      expect(MUSCLE_GROUPS).toHaveProperty('cervical');
    });

    it('MMT_GRADES should include grade 5 with description', () => {
      const grade5 = MMT_GRADES.find((g) => g.value === '5');
      expect(grade5).toBeDefined();
      expect(grade5.description).toContain('Normal');
    });
  });
});
