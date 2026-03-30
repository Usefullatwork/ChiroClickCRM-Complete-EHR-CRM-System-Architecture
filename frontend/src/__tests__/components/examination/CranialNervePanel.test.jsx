/**
 * CranialNervePanel Component Tests
 *
 * Tests the cranial nerve examination panel (CN I-XII) with OSCE-style
 * checklist items, bilateral testing, and finding state cycling.
 * Component does NOT use i18n hook — uses internal data and lang prop.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import CranialNervePanel, {
  CRANIAL_NERVES,
  FINDING_STATES,
} from '../../../components/examination/CranialNervePanel';

describe('CranialNervePanel', () => {
  const mockOnChange = vi.fn();
  const mockOnGenerateNarrative = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // DEFAULT RENDER (Norwegian)
  // --------------------------------------------------------------------------

  describe('Default Render', () => {
    it('should render the Norwegian heading "Hjernenerveundersøkelse (CN I-XII)"', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} />);
      expect(screen.getByText('Hjernenerveundersøkelse (CN I-XII)')).toBeInTheDocument();
    });

    it('should render the English heading when lang="en"', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} lang="en" />);
      expect(screen.getByText('Cranial Nerve Examination (CN I-XII)')).toBeInTheDocument();
    });

    it('should render 12 cranial nerve sections', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} />);
      // Each CN section has "CN I", "CN II", ... "CN XII" in its header
      expect(screen.getByText('CN I')).toBeInTheDocument();
      expect(screen.getByText('CN II')).toBeInTheDocument();
      expect(screen.getByText('CN III')).toBeInTheDocument();
      expect(screen.getByText('CN XII')).toBeInTheDocument();
    });

    it('should render the Expand All button in Norwegian', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} />);
      expect(screen.getByText('Åpne alle')).toBeInTheDocument();
    });

    it('should render Quick Screening panel', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} />);
      expect(screen.getByText('Hurtigscreening')).toBeInTheDocument();
    });

    it('should render the "Alle normale" button in Quick Screening', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} />);
      expect(screen.getByText('Alle normale')).toBeInTheDocument();
    });

    it('should render the legend with 4 finding states', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} />);
      expect(screen.getByText('Normal')).toBeInTheDocument();
      expect(screen.getByText('Patologisk')).toBeInTheDocument();
      expect(screen.getByText('Usikker')).toBeInTheDocument();
      expect(screen.getByText('Ikke testet')).toBeInTheDocument();
    });

    it('should render the clinical tips info box', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} />);
      expect(screen.getByText('Klinisk tips')).toBeInTheDocument();
    });

    it('should render Norwegian nerve names in sidebar', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} />);
      expect(screen.getByText('Olfaktorius')).toBeInTheDocument();
      expect(screen.getByText('Optikus')).toBeInTheDocument();
      expect(screen.getByText('Facialis')).toBeInTheDocument();
      expect(screen.getByText('Hypoglossus')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // EXPAND / COLLAPSE
  // --------------------------------------------------------------------------

  describe('Expand and Collapse', () => {
    it('should expand a nerve section when clicked', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} />);
      // Click on CN I (Olfaktorius) row
      const cn1Row = screen.getByText('CN I').closest('button');
      fireEvent.click(cn1Row);

      // After expanding, should see the test "Luktidentifikasjon"
      expect(screen.getByText('Luktidentifikasjon')).toBeInTheDocument();
    });

    it('should collapse a nerve section when clicked again', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} />);
      const cn1Row = screen.getByText('CN I').closest('button');

      // Expand
      fireEvent.click(cn1Row);
      expect(screen.getByText('Luktidentifikasjon')).toBeInTheDocument();

      // Collapse
      fireEvent.click(cn1Row);
      expect(screen.queryByText('Luktidentifikasjon')).not.toBeInTheDocument();
    });

    it('should expand all when "Åpne alle" is clicked', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} />);
      fireEvent.click(screen.getByText('Åpne alle'));

      // After expanding all, CN I tests should be visible
      expect(screen.getByText('Luktidentifikasjon')).toBeInTheDocument();
      // CN XII tests should also be visible
      expect(screen.getByText('Tungeprotrusjon')).toBeInTheDocument();
    });

    it('should collapse all when "Lukk alle" is clicked after expand', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} />);
      fireEvent.click(screen.getByText('Åpne alle'));

      // Now it says "Lukk alle"
      expect(screen.getByText('Lukk alle')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Lukk alle'));
      // Tests should no longer be visible
      expect(screen.queryByText('Luktidentifikasjon')).not.toBeInTheDocument();
    });

    it('should support defaultExpanded prop', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} defaultExpanded={['cn1']} />);
      // CN I should be expanded by default
      expect(screen.getByText('Luktidentifikasjon')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // FINDING STATE CYCLING
  // --------------------------------------------------------------------------

  describe('Finding State Cycling', () => {
    it('should show "IT" (Ikke testet) as default finding state', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} defaultExpanded={['cn1']} />);
      // The default state buttons should say IT (Norwegian for NT)
      const itButtons = screen.getAllByText('IT');
      expect(itButtons.length).toBeGreaterThan(0);
    });

    it('should cycle finding state from IT to Normal when clicked', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} defaultExpanded={['cn1']} />);
      const itButtons = screen.getAllByText('IT');
      fireEvent.click(itButtons[0]);

      // Should have called onChange with the new value
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          cn1_smell_identification_left: 'normal',
        })
      );
    });

    it('should cycle from Normal to Abnormal', () => {
      const values = { cn1_smell_identification_left: 'normal' };
      render(
        <CranialNervePanel values={values} onChange={mockOnChange} defaultExpanded={['cn1']} />
      );

      // Find the "Normal" button and click it
      const normalButtons = screen.getAllByText('Normal');
      // Find the one that is a toggle button (inside the test row, not in legend)
      const toggleBtn = normalButtons.find((btn) => btn.closest('button')?.type === 'button');
      if (toggleBtn) {
        fireEvent.click(toggleBtn.closest('button'));
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            cn1_smell_identification_left: 'abnormal',
          })
        );
      }
    });
  });

  // --------------------------------------------------------------------------
  // BILATERAL TESTING
  // --------------------------------------------------------------------------

  describe('Bilateral Testing', () => {
    it('should show V (venstre) and H (høyre) labels for bilateral nerves', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} defaultExpanded={['cn1']} />);
      // CN I is bilateral — should show V and H
      expect(screen.getByText('V')).toBeInTheDocument();
      expect(screen.getByText('H')).toBeInTheDocument();
    });

    it('should show L and R labels in English for bilateral nerves', () => {
      render(
        <CranialNervePanel
          values={{}}
          onChange={mockOnChange}
          lang="en"
          defaultExpanded={['cn1']}
        />
      );
      expect(screen.getByText('L')).toBeInTheDocument();
      expect(screen.getByText('R')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // QUICK SCREENING
  // --------------------------------------------------------------------------

  describe('Quick Screening', () => {
    it('should set all screening tests to normal when "Alle normale" is clicked', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} />);
      fireEvent.click(screen.getByText('Alle normale'));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          cn2_visual_acuity_left: 'normal',
          cn2_visual_acuity_right: 'normal',
          cn7_show_teeth_left: 'normal',
          cn12_tongue_protrusion_left: 'normal',
        })
      );
    });

    it('should display screening test labels in Quick Screening', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} />);
      expect(screen.getByText('Visus')).toBeInTheDocument();
      expect(screen.getByText('Pupiller')).toBeInTheDocument();
      expect(screen.getByText('Hørsel')).toBeInTheDocument();
      expect(screen.getByText('Tunge')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // GENERATE NARRATIVE
  // --------------------------------------------------------------------------

  describe('Generate Narrative', () => {
    it('should render Generate Text button when onGenerateNarrative is provided', () => {
      render(
        <CranialNervePanel
          values={{}}
          onChange={mockOnChange}
          onGenerateNarrative={mockOnGenerateNarrative}
        />
      );
      expect(screen.getByText('Generer tekst')).toBeInTheDocument();
    });

    it('should NOT render Generate Text button when onGenerateNarrative is not provided', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} />);
      expect(screen.queryByText('Generer tekst')).not.toBeInTheDocument();
    });

    it('should generate "all normal" narrative when no abnormal findings', () => {
      render(
        <CranialNervePanel
          values={{}}
          onChange={mockOnChange}
          onGenerateNarrative={mockOnGenerateNarrative}
        />
      );
      fireEvent.click(screen.getByText('Generer tekst'));
      expect(mockOnGenerateNarrative).toHaveBeenCalledWith(
        expect.stringContaining('innen normalgrenser')
      );
    });

    it('should generate narrative listing abnormal findings', () => {
      const values = {
        cn7_show_teeth_left: 'abnormal',
      };
      render(
        <CranialNervePanel
          values={values}
          onChange={mockOnChange}
          onGenerateNarrative={mockOnGenerateNarrative}
        />
      );
      fireEvent.click(screen.getByText('Generer tekst'));
      expect(mockOnGenerateNarrative).toHaveBeenCalledWith(expect.stringContaining('CN VII'));
    });
  });

  // --------------------------------------------------------------------------
  // SUMMARY STATS
  // --------------------------------------------------------------------------

  describe('Summary Statistics', () => {
    it('should show test count and normal/abnormal breakdown', () => {
      const values = {
        cn1_smell_identification_left: 'normal',
        cn1_smell_identification_right: 'normal',
        cn7_show_teeth_left: 'abnormal',
      };
      render(<CranialNervePanel values={values} onChange={mockOnChange} />);
      // Summary should show counts — use getAllByText since "3" may appear in multiple places
      expect(screen.getByText(/3 tester/)).toBeInTheDocument();
      expect(screen.getByText(/2 normale/)).toBeInTheDocument();
      expect(screen.getByText(/1 patologiske/)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // RED FLAGS
  // --------------------------------------------------------------------------

  describe('Red Flags', () => {
    it('should show red flags when a nerve section is expanded', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} defaultExpanded={['cn1']} />);
      expect(screen.getByText('Røde flagg')).toBeInTheDocument();
      // Red flag text is prefixed with "• " — use regex or substring match
      expect(screen.getByText(/Anosmi etter hodeskade/)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // NOTES FIELD
  // --------------------------------------------------------------------------

  describe('Notes Field', () => {
    it('should render a textarea for clinical notes when expanded', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} defaultExpanded={['cn1']} />);
      const textarea = screen.getByPlaceholderText('Kliniske notater...');
      expect(textarea).toBeInTheDocument();
    });

    it('should call onChange when notes are typed', () => {
      render(<CranialNervePanel values={{}} onChange={mockOnChange} defaultExpanded={['cn1']} />);
      const textarea = screen.getByPlaceholderText('Kliniske notater...');
      fireEvent.change(textarea, { target: { value: 'Test notat' } });
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ cn1_notes: 'Test notat' })
      );
    });
  });

  // --------------------------------------------------------------------------
  // ABNORMAL COUNT BADGE
  // --------------------------------------------------------------------------

  describe('Abnormal Count Badge', () => {
    it('should show abnormal count badge on nerve row when findings are abnormal', () => {
      const values = {
        cn7_show_teeth_left: 'abnormal',
        cn7_raise_eyebrows_right: 'abnormal',
      };
      render(<CranialNervePanel values={values} onChange={mockOnChange} />);
      // The CN VII row should show "2 patologisk"
      expect(screen.getByText('2 patologisk')).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// EXPORTED DATA
// ===========================================================================

describe('CRANIAL_NERVES Data', () => {
  it('should define exactly 12 cranial nerves', () => {
    expect(CRANIAL_NERVES).toHaveLength(12);
  });

  it('should have Roman numeral identifiers I-XII', () => {
    const numbers = CRANIAL_NERVES.map((n) => n.number);
    expect(numbers).toEqual([
      'I',
      'II',
      'III',
      'IV',
      'V',
      'VI',
      'VII',
      'VIII',
      'IX',
      'X',
      'XI',
      'XII',
    ]);
  });

  it('should have bilingual names for each nerve', () => {
    CRANIAL_NERVES.forEach((nerve) => {
      expect(nerve.name).toBeDefined();
      expect(nerve.nameNo).toBeDefined();
      expect(nerve.function).toBeDefined();
      expect(nerve.functionNo).toBeDefined();
    });
  });

  it('should have tests for each nerve', () => {
    CRANIAL_NERVES.forEach((nerve) => {
      expect(nerve.tests.length).toBeGreaterThan(0);
    });
  });

  it('should have red flags for each nerve', () => {
    CRANIAL_NERVES.forEach((nerve) => {
      expect(nerve.redFlags.length).toBeGreaterThan(0);
      expect(nerve.redFlagsNo.length).toBeGreaterThan(0);
    });
  });
});

describe('FINDING_STATES Data', () => {
  it('should define NOT_TESTED, NORMAL, ABNORMAL, EQUIVOCAL', () => {
    expect(FINDING_STATES.NOT_TESTED).toBeDefined();
    expect(FINDING_STATES.NORMAL).toBeDefined();
    expect(FINDING_STATES.ABNORMAL).toBeDefined();
    expect(FINDING_STATES.EQUIVOCAL).toBeDefined();
  });

  it('should have bilingual labels for each state', () => {
    Object.values(FINDING_STATES).forEach((state) => {
      expect(state.label).toBeDefined();
      expect(state.labelNo).toBeDefined();
      expect(state.value).toBeDefined();
      expect(state.color).toBeDefined();
    });
  });
});
