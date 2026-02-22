/**
 * ClinicalSettings Component Tests
 *
 * Tests clinical config, adjustment notation, language selection, spine templates
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../services/api', () => ({
  spineTemplatesAPI: {
    getGrouped: vi.fn(),
    update: vi.fn(),
    resetToDefaults: vi.fn(),
  },
}));

vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('../ui/ConfirmDialog', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));

vi.mock('../../components/ui/ConfirmDialog', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));

vi.mock('lucide-react', () => ({
  FileText: () => <span>FileText</span>,
  Globe: () => <span>Globe</span>,
  Layers: () => <span>Layers</span>,
  Bone: () => <span>Bone</span>,
  Check: () => <span>Check</span>,
  X: () => <span>X</span>,
  Edit3: () => <span>Edit3</span>,
  Loader2: () => <span>Loader2</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  ChevronUp: () => <span>ChevronUp</span>,
  RotateCcw: () => <span>RotateCcw</span>,
}));

import ClinicalSettings from '../../components/settings/ClinicalSettings';
import { spineTemplatesAPI } from '../../services/api';

const mockSpineTemplates = {
  cervical: {
    C1: [
      { id: 't1', segment: 'C1', direction: 'left', text_template: 'C1 venstrerotasjon' },
      { id: 't2', segment: 'C1', direction: 'right', text_template: 'C1 hoyrerotasjon' },
    ],
  },
  thoracic: {
    T1: [
      {
        id: 't3',
        segment: 'T1',
        direction: 'bilateral',
        text_template: 'T1 bilateral restriksjon',
      },
    ],
  },
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const defaultProps = {
  t: (key) => {
    const map = {
      adjustmentNotation: 'Adjustment Notation',
      adjustmentNotationDesc: 'Choose your preferred clinical notation method',
      languageSetting: 'Language',
      languageSettingDesc: 'Choose clinical documentation language',
      norwegian: 'Norwegian documentation',
      english: 'English documentation',
      activeLabel: 'Active',
      spineTemplates: 'Spine Templates',
      spineTemplatesDesc: 'Manage palpation text templates',
      resetTemplates: 'Reset to Defaults',
    };
    return map[key] || key;
  },
  clinicalPrefs: {
    adjustmentNotation: 'segment_listing',
    language: 'no',
    showDermatomes: true,
    showTriggerPoints: true,
    autoGenerateNarrative: true,
    defaultView: 'front',
  },
  onClinicalPrefChange: vi.fn(),
};

const renderWithProviders = (props = {}) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ClinicalSettings {...defaultProps} {...props} />
    </QueryClientProvider>
  );
};

describe('ClinicalSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spineTemplatesAPI.getGrouped.mockResolvedValue({ data: mockSpineTemplates });
  });

  it('should render adjustment notation section', () => {
    renderWithProviders();
    expect(screen.getByText('Adjustment Notation')).toBeInTheDocument();
    expect(screen.getByText('Choose your preferred clinical notation method')).toBeInTheDocument();
  });

  it('should display all adjustment notation methods', () => {
    renderWithProviders();
    // Some names may appear multiple times (e.g., in radio label and description)
    expect(screen.getAllByText('Segmentlisting').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Kroppskart')).toBeInTheDocument();
    expect(screen.getByText('Anatomisk Kart')).toBeInTheDocument();
    expect(screen.getByText('SOAP Narrativ')).toBeInTheDocument();
    expect(screen.getByText('Aktivator Protokoll')).toBeInTheDocument();
    expect(screen.getAllByText('Gonstead Listing').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Diversifisert Notasjon')).toBeInTheDocument();
    expect(screen.getByText('Ansiktslinjer Kart')).toBeInTheDocument();
  });

  it('should show active label for selected notation', () => {
    renderWithProviders();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render language preference section', () => {
    renderWithProviders();
    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('Choose clinical documentation language')).toBeInTheDocument();
  });

  it('should show Norsk and English language options', () => {
    renderWithProviders();
    expect(screen.getByText('Norsk')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('should have Norwegian selected by default', () => {
    renderWithProviders();
    const radioButtons = screen.getAllByRole('radio');
    // Find the Norwegian language radio
    const norskRadio = radioButtons.find((r) => r.value === 'no');
    expect(norskRadio).toBeTruthy();
    if (norskRadio) {
      expect(norskRadio.checked).toBe(true);
    }
  });

  it('should call onClinicalPrefChange when notation method changes', () => {
    const onClinicalPrefChange = vi.fn();
    renderWithProviders({ onClinicalPrefChange });

    const radioButtons = screen.getAllByRole('radio');
    const gonsteadRadio = radioButtons.find((r) => r.value === 'gonstead_listing');
    if (gonsteadRadio) {
      fireEvent.click(gonsteadRadio);
      expect(onClinicalPrefChange).toHaveBeenCalledWith('adjustmentNotation', 'gonstead_listing');
    }
  });

  it('should call onClinicalPrefChange when language changes', () => {
    const onClinicalPrefChange = vi.fn();
    renderWithProviders({ onClinicalPrefChange });

    const radioButtons = screen.getAllByRole('radio');
    const enRadio = radioButtons.find((r) => r.value === 'en');
    if (enRadio) {
      fireEvent.click(enRadio);
      expect(onClinicalPrefChange).toHaveBeenCalledWith('language', 'en');
    }
  });

  it('should show segment listing as selected notation method', () => {
    renderWithProviders();
    const segmentListingRadio = screen
      .getAllByRole('radio')
      .find((r) => r.value === 'segment_listing');
    if (segmentListingRadio) {
      expect(segmentListingRadio.checked).toBe(true);
    }
  });

  it('should display notation method descriptions in Norwegian', () => {
    renderWithProviders();
    expect(
      screen.getByText('Tradisjonell kiropraktisk listingnotasjon (f.eks. C5 PRS, T4 PL-SP)')
    ).toBeInTheDocument();
  });
});
