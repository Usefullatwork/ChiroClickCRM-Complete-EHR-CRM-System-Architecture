/**
 * NorwegianTemplates Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock(
  'lucide-react',
  () =>
    new Proxy(
      {},
      {
        get: (_, name) => {
          if (name === '__esModule') return false;
          return (props) => null;
        },
      }
    )
);

import NorwegianDocumentTemplates, {
  formatNorwegianDate,
  formatNorwegianPhone,
  formatPersonnummer,
  generateDocument,
} from '../../../components/export/NorwegianTemplates';

describe('formatNorwegianDate', () => {
  it('returns empty string for null', () => {
    expect(formatNorwegianDate(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatNorwegianDate(undefined)).toBe('');
  });

  it('formats a valid date', () => {
    const result = formatNorwegianDate('2026-03-15');
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });
});

describe('formatNorwegianPhone', () => {
  it('returns empty string for null', () => {
    expect(formatNorwegianPhone(null)).toBe('');
  });

  it('formats 8-digit number with +47 prefix', () => {
    expect(formatNorwegianPhone('90012345')).toBe('+47 900 12 345');
  });

  it('returns raw phone for non-standard format', () => {
    expect(formatNorwegianPhone('+1 555-1234')).toBe('+1 555-1234');
  });
});

describe('formatPersonnummer', () => {
  it('returns empty string for null', () => {
    expect(formatPersonnummer(null)).toBe('');
  });

  it('formats 11-digit personnummer with space', () => {
    expect(formatPersonnummer('01018512345')).toBe('010185 12345');
  });

  it('returns raw value for non-11-digit input', () => {
    expect(formatPersonnummer('12345')).toBe('12345');
  });
});

describe('generateDocument', () => {
  it('generates journal entry document', () => {
    const result = generateDocument(
      'journal_entry',
      {
        practice: { name: 'Test Klinikk' },
        patient: { name: 'Ola Nordmann' },
        encounter: { date: '2026-03-15', type: 'FOLLOWUP', duration: 30 },
        soap: {
          subjective: 'Smerte',
          objective: 'Funn',
          assessment: 'Vurdering',
          plan: 'Behandling',
        },
        codes: ['L83'],
      },
      'no'
    );
    expect(result).toContain('JOURNALNOTAT');
    expect(result).toContain('Test Klinikk');
    expect(result).toContain('Ola Nordmann');
  });

  it('throws error for unknown template', () => {
    expect(() => generateDocument('nonexistent', {}, 'no')).toThrow();
  });
});

describe('NorwegianDocumentTemplates', () => {
  const defaultProps = {
    encounterData: { encounter_date: '2026-03-15' },
    patientData: { first_name: 'Kari', last_name: 'Nordmann' },
    language: 'no',
  };

  it('renders the heading', () => {
    render(<NorwegianDocumentTemplates {...defaultProps} />);
    expect(screen.getByText('Dokumentmaler')).toBeInTheDocument();
  });

  it('renders template selection buttons', () => {
    render(<NorwegianDocumentTemplates {...defaultProps} />);
    expect(screen.getByText('Journalnotat')).toBeInTheDocument();
    expect(screen.getByText('Henvisning')).toBeInTheDocument();
    expect(screen.getByText('Behandlingsoppsummering')).toBeInTheDocument();
    expect(screen.getByText('Forsikringsrapport')).toBeInTheDocument();
  });

  it('renders generate button', () => {
    render(<NorwegianDocumentTemplates {...defaultProps} />);
    expect(screen.getByText('Generer Dokument')).toBeInTheDocument();
  });

  it('generates document on button click', () => {
    render(<NorwegianDocumentTemplates {...defaultProps} />);
    fireEvent.click(screen.getByText('Generer Dokument'));
    expect(screen.getByText('Forhåndsvisning')).toBeInTheDocument();
  });

  it('renders English heading when language is en', () => {
    render(<NorwegianDocumentTemplates {...defaultProps} language="en" />);
    expect(screen.getByText('Document Templates')).toBeInTheDocument();
  });

  it('shows referral fields when REFERRAL template selected', () => {
    render(<NorwegianDocumentTemplates {...defaultProps} />);
    fireEvent.click(screen.getByText('Henvisning'));
    expect(screen.getByText('Tilleggsinformasjon')).toBeInTheDocument();
  });
});
