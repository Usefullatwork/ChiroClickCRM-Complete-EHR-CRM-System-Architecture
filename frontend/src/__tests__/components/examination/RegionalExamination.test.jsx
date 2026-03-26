/**
 * RegionalExamination Component Tests
 *
 * RegionalExamination uses useTranslation('clinical') from ../../i18n.
 * Relative path from this test file:
 *   test:  src/__tests__/components/examination/
 *   i18n:  src/i18n/
 * => mock path: '../../../i18n'
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
    getBilingual: (obj) => obj,
  }),
}));

import RegionalExamination from '../../../components/examination/RegionalExamination';

describe('RegionalExamination', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  describe('Default Render', () => {
    it('should render the "Regional undersøkelse" heading', () => {
      render(<RegionalExamination values={{}} onChange={mockOnChange} />);
      expect(screen.getByText('Regional undersøkelse')).toBeInTheDocument();
    });

    it('should render the subtitle text', () => {
      render(<RegionalExamination values={{}} onChange={mockOnChange} />);
      expect(
        screen.getByText('Full kroppsundersøkelse organisert etter region')
      ).toBeInTheDocument();
    });

    it('should render a Reset button', () => {
      render(<RegionalExamination values={{}} onChange={mockOnChange} />);
      expect(screen.getByText('Nullstill')).toBeInTheDocument();
    });

    it('should render a Generate report button', () => {
      render(<RegionalExamination values={{}} onChange={mockOnChange} />);
      expect(screen.getByText('Generer rapport')).toBeInTheDocument();
    });

    it('should render all body regions', () => {
      render(<RegionalExamination values={{}} onChange={mockOnChange} />);
      expect(screen.getByText('Nakke / Cervikalcolumna')).toBeInTheDocument();
      expect(screen.getByText('Korsrygg / Lumbalcolumna')).toBeInTheDocument();
      expect(screen.getByText('Skulder')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // REGION TOGGLE
  // --------------------------------------------------------------------------

  describe('Region Expand / Collapse', () => {
    it('should expand a region when its header is clicked', () => {
      render(<RegionalExamination values={{}} onChange={mockOnChange} />);
      const cervicalHeader = screen.getByText('Nakke / Cervikalcolumna');
      fireEvent.click(cervicalHeader);
      // After expanding, the test names inside normalTests are visible
      expect(screen.getByText('Aktiv ROM')).toBeInTheDocument();
    });

    it('should collapse a region when its header is clicked twice', () => {
      render(<RegionalExamination values={{}} onChange={mockOnChange} />);
      const cervicalHeader = screen.getByText('Nakke / Cervikalcolumna');
      fireEvent.click(cervicalHeader); // expand
      fireEvent.click(cervicalHeader); // collapse
      expect(screen.queryByText('Normale tester')).not.toBeInTheDocument();
    });

    it('should show extra tests toggle when region is expanded', () => {
      render(<RegionalExamination values={{}} onChange={mockOnChange} />);
      fireEvent.click(screen.getByText('Nakke / Cervikalcolumna'));
      // "Ekstra tester" text is part of the button — contains the count too
      expect(
        screen.getByText((content) => content.startsWith('Ekstra tester'))
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // TEST INTERACTION
  // --------------------------------------------------------------------------

  describe('Test Interactions', () => {
    it('should call onChange when a test result is set to Positive', () => {
      render(<RegionalExamination values={{}} onChange={mockOnChange} />);
      fireEvent.click(screen.getByText('Nakke / Cervikalcolumna')); // expand

      // Click "Positiv" button for the first test
      const posButtons = screen.getAllByText('Positiv');
      fireEvent.click(posButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          cervical: expect.any(Object),
        })
      );
    });

    it('should call onChange when a test result is set to Negative', () => {
      render(<RegionalExamination values={{}} onChange={mockOnChange} />);
      fireEvent.click(screen.getByText('Nakke / Cervikalcolumna'));

      const negButtons = screen.getAllByText('Negativ');
      fireEvent.click(negButtons[0]);

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // RESET
  // --------------------------------------------------------------------------

  describe('Reset', () => {
    it('should call onChange with empty object when Reset is clicked', () => {
      render(
        <RegionalExamination
          values={{ cervical: { cerv_spurling: true } }}
          onChange={mockOnChange}
        />
      );
      fireEvent.click(screen.getByText('Nullstill'));
      expect(mockOnChange).toHaveBeenCalledWith({});
    });
  });

  // --------------------------------------------------------------------------
  // REPORT GENERATION
  // --------------------------------------------------------------------------

  describe('Report Generation', () => {
    it('should call onGenerateReport when Generate report is clicked', () => {
      const onGenerateReport = vi.fn();
      render(
        <RegionalExamination
          values={{}}
          onChange={mockOnChange}
          onGenerateReport={onGenerateReport}
        />
      );
      fireEvent.click(screen.getByText('Generer rapport'));
      expect(onGenerateReport).toHaveBeenCalledWith(expect.any(String));
    });

    it('should include region name in generated report when tests are positive', () => {
      const onGenerateReport = vi.fn();
      render(
        <RegionalExamination
          values={{ cervical: { cerv_spurling: true } }}
          onChange={mockOnChange}
          onGenerateReport={onGenerateReport}
        />
      );
      fireEvent.click(screen.getByText('Generer rapport'));
      const report = onGenerateReport.mock.calls[0][0];
      expect(report).toContain('Nakke / Cervikalcolumna');
    });
  });

  // --------------------------------------------------------------------------
  // POSITIVE COUNT DISPLAY
  // --------------------------------------------------------------------------

  describe('Positive Count', () => {
    it('should show positive count in region header when tests are positive', () => {
      render(
        <RegionalExamination
          values={{ cervical: { cerv_spurling: true } }}
          onChange={mockOnChange}
        />
      );
      // "1 positiv" appears in the header — use getAllByText since it may appear multiple places
      const positiveElements = screen.getAllByText(/positiv/i);
      expect(positiveElements.length).toBeGreaterThan(0);
    });
  });
});
