import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

// Mock keyboard shortcuts hook
vi.mock('../../hooks/useGlobalKeyboardShortcuts', () => ({
  default: () => ({ showHelp: false, setShowHelp: vi.fn() }),
  SHORTCUTS: [
    { keys: ['Ctrl', 'K'], description: 'Command palette' },
    { keys: ['Ctrl', 'N'], description: 'New patient' },
    { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts' },
    { keys: ['Esc'], description: 'Close dialogs' },
  ],
}));

import Help from '../../pages/Help';

const renderWithProviders = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Help', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProviders(<Help />);
    expect(screen.getByText('Hjelp')).toBeInTheDocument();
  });

  it('displays the page title and subtitle', () => {
    renderWithProviders(<Help />);
    expect(screen.getByText('Hjelp')).toBeInTheDocument();
    expect(
      screen.getByText('Hurtigguide og tastatursnarveier for ChiroClickEHR')
    ).toBeInTheDocument();
  });

  it('displays the keyboard shortcuts section', () => {
    renderWithProviders(<Help />);
    expect(screen.getByText('Tastatursnarveier')).toBeInTheDocument();
    // Shortcuts from the mock
    expect(screen.getByText('Command palette')).toBeInTheDocument();
    expect(screen.getByText('New patient')).toBeInTheDocument();
    expect(screen.getByText('Show keyboard shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Close dialogs')).toBeInTheDocument();
  });

  it('displays shortcut key badges', () => {
    renderWithProviders(<Help />);
    // Ctrl+K, Ctrl+N, Ctrl+/, Esc, plus the hard-coded Export/Import shortcuts
    const ctrlKeys = screen.getAllByText('Ctrl');
    expect(ctrlKeys.length).toBeGreaterThanOrEqual(4);

    // The export shortcut keys
    expect(screen.getByText('E')).toBeInTheDocument();
    // The import shortcut keys
    expect(screen.getByText('I')).toBeInTheDocument();
  });

  it('displays the export and import data shortcuts', () => {
    renderWithProviders(<Help />);
    expect(screen.getByText('Eksporter data')).toBeInTheDocument();
    expect(screen.getByText('Importer data')).toBeInTheDocument();
  });

  it('displays the Daily Workflow section', () => {
    renderWithProviders(<Help />);
    expect(screen.getByText('Daglig arbeidsflyt')).toBeInTheDocument();
    expect(
      screen.getByText('Åpne appen og sjekk Dashbordet for dagens oversikt')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Gå til Kalender for å se timeplan og neste pasient')
    ).toBeInTheDocument();
  });

  it('displays the Patient Management section', () => {
    renderWithProviders(<Help />);
    expect(screen.getByText('Pasienthåndtering')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+N: Opprett ny pasient')).toBeInTheDocument();
  });

  it('displays the SOAP section', () => {
    renderWithProviders(<Help />);
    expect(screen.getByText('SOAP-journalformat')).toBeInTheDocument();
    expect(
      screen.getByText('S (Subjektiv): Pasientens symptomer og sykehistorie')
    ).toBeInTheDocument();
    expect(screen.getByText('O (Objektiv): Undersøkelse, tester, funn')).toBeInTheDocument();
  });

  it('displays the AI features section', () => {
    renderWithProviders(<Help />);
    expect(screen.getByText('AI-funksjoner')).toBeInTheDocument();
    expect(
      screen.getByText('AI-forslag vises automatisk under journalskriving')
    ).toBeInTheDocument();
  });

  it('displays the Backup section', () => {
    renderWithProviders(<Help />);
    expect(screen.getByText('Sikkerhetskopiering')).toBeInTheDocument();
    expect(
      screen.getByText('Fil > Eksporter data (Ctrl+Shift+E) for SQL-backup')
    ).toBeInTheDocument();
  });

  it('displays the Privacy and Security section', () => {
    renderWithProviders(<Help />);
    expect(screen.getByText('Personvern og sikkerhet')).toBeInTheDocument();
    expect(screen.getByText('All data lagres kun på din maskin — ingen sky')).toBeInTheDocument();
    expect(screen.getByText('Kompatibel med Normen og personvernforskriften')).toBeInTheDocument();
  });

  it('displays the version info footer', () => {
    renderWithProviders(<Help />);
    expect(screen.getByText('ChiroClickEHR Desktop Edition')).toBeInTheDocument();
    expect(
      screen.getByText('Fullstendig dokumentasjon finnes i docs/-mappen i installasjonen')
    ).toBeInTheDocument();
  });

  it('renders all 6 help sections', () => {
    renderWithProviders(<Help />);
    const sectionTitles = [
      'Daglig arbeidsflyt',
      'Pasienthåndtering',
      'SOAP-journalformat',
      'AI-funksjoner',
      'Sikkerhetskopiering',
      'Personvern og sikkerhet',
    ];
    sectionTitles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });
});
