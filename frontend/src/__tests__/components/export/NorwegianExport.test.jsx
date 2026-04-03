/**
 * NorwegianExport Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    scope: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
  },
}));

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

import NorwegianExport, { ExportButton } from '../../../components/export/NorwegianExport';

const mockEncounterData = {
  encounter_date: '2026-03-15',
  encounter_type: 'FOLLOWUP',
  duration_minutes: 30,
  subjective: { chief_complaint: 'Nakke smerter' },
  icpc_codes: ['L83'],
  treatments_selected: ['Spinal manipulasjon'],
};

const mockPatientData = {
  first_name: 'Kari',
  last_name: 'Nordmann',
  date_of_birth: '1985-06-15',
};

describe('NorwegianExport', () => {
  const defaultProps = {
    encounterData: mockEncounterData,
    patientData: mockPatientData,
    language: 'no',
  };

  it('renders Norwegian title', () => {
    render(<NorwegianExport {...defaultProps} />);
    expect(screen.getByText('Eksporter Kliniske Notater')).toBeInTheDocument();
  });

  it('renders English title when language is en', () => {
    render(<NorwegianExport {...defaultProps} language="en" />);
    expect(screen.getByText('Export Clinical Notes')).toBeInTheDocument();
  });

  it('renders format selection buttons', () => {
    render(<NorwegianExport {...defaultProps} />);
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('XML (KITH)')).toBeInTheDocument();
    expect(screen.getByText('Plain Text')).toBeInTheDocument();
  });

  it('renders template selection dropdown', () => {
    render(<NorwegianExport {...defaultProps} />);
    expect(screen.getByText('Dokumentmal')).toBeInTheDocument();
  });

  it('renders date format dropdown', () => {
    render(<NorwegianExport {...defaultProps} />);
    expect(screen.getByText('Datoformat')).toBeInTheDocument();
  });

  it('renders export options checkboxes', () => {
    render(<NorwegianExport {...defaultProps} />);
    expect(screen.getByText('Inkluder pasientinformasjon')).toBeInTheDocument();
    expect(screen.getByText('Inkluder diagnosekoder (ICPC-2/ICD-10)')).toBeInTheDocument();
    expect(screen.getByText('Inkluder digital signaturblokk')).toBeInTheDocument();
  });

  it('renders preview toggle button', () => {
    render(<NorwegianExport {...defaultProps} />);
    expect(screen.getByText('Forhåndsvisning')).toBeInTheDocument();
  });

  it('renders export button', () => {
    render(<NorwegianExport {...defaultProps} />);
    expect(screen.getByText('Eksporter')).toBeInTheDocument();
  });

  it('renders copy to clipboard button', () => {
    render(<NorwegianExport {...defaultProps} />);
    expect(screen.getByText('Kopier til Utklippstavle')).toBeInTheDocument();
  });

  it('shows preview when preview is toggled', () => {
    render(<NorwegianExport {...defaultProps} />);
    fireEvent.click(screen.getByText('Forhåndsvisning'));
    expect(screen.getByText(/JOURNALNOTAT/)).toBeInTheDocument();
  });
});

describe('ExportButton', () => {
  it('renders Norwegian label by default', () => {
    render(<ExportButton onClick={vi.fn()} />);
    expect(screen.getByText('Eksporter')).toBeInTheDocument();
  });

  it('renders English label when language is en', () => {
    render(<ExportButton onClick={vi.fn()} language="en" />);
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ExportButton onClick={onClick} />);
    fireEvent.click(screen.getByText('Eksporter'));
    expect(onClick).toHaveBeenCalled();
  });
});
