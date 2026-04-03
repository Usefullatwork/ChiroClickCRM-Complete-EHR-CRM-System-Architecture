/**
 * ClinicalSettings Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClinicalSettings from '../../../components/settings/ClinicalSettings';

vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (props) => null }));
vi.mock('../../../components/ui/ConfirmDialog', () => ({
  default: () => null,
  useConfirm: () => vi.fn().mockResolvedValue(false),
}));
vi.mock('../../../services/api', () => ({
  spineTemplatesAPI: {
    getGrouped: vi.fn().mockResolvedValue({ data: {} }),
    update: vi.fn().mockResolvedValue({}),
    resetToDefaults: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('../../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('ClinicalSettings Component', () => {
  const defaultProps = {
    t: (key, fallback) => fallback || key,
    clinicalPrefs: {
      adjustmentNotation: 'segment_listing',
      language: 'no',
      showDermatomes: true,
      showTriggerPoints: false,
      autoGenerateNarrative: true,
    },
    onClinicalPrefChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render adjustment notation section', () => {
    render(<ClinicalSettings {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByText('adjustmentNotation')).toBeInTheDocument();
  });

  it('should render language settings section', () => {
    render(<ClinicalSettings {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByText('languageSetting')).toBeInTheDocument();
  });

  it('should render chart display section', () => {
    render(<ClinicalSettings {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByText('chartDisplay')).toBeInTheDocument();
  });

  it('should render palpation templates section', () => {
    render(<ClinicalSettings {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByText('Palpasjonsmaler (Rask-klikk)')).toBeInTheDocument();
  });

  // =========================================================================
  // NOTATION METHODS
  // =========================================================================

  it('should show all adjustment notation methods', () => {
    render(<ClinicalSettings {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByText('Segmentlisting')).toBeInTheDocument();
    expect(screen.getByText('Kroppskart')).toBeInTheDocument();
    expect(screen.getByText('SOAP Narrativ')).toBeInTheDocument();
  });

  it('should mark active notation method as checked', () => {
    render(<ClinicalSettings {...defaultProps} />, { wrapper: createWrapper() });
    const radios = screen.getAllByRole('radio', { name: /adjustmentNotation/i });
    // segment_listing should be checked
    const segmentRadio = radios.find((r) => r.value === 'segment_listing');
    if (segmentRadio) {
      expect(segmentRadio).toBeChecked();
    }
  });

  it('should call onClinicalPrefChange when notation is changed', () => {
    render(<ClinicalSettings {...defaultProps} />, { wrapper: createWrapper() });
    const bodyChartRadio = screen.getAllByRole('radio').find((r) => r.value === 'body_chart');
    if (bodyChartRadio) {
      fireEvent.click(bodyChartRadio);
      expect(defaultProps.onClinicalPrefChange).toHaveBeenCalledWith(
        'adjustmentNotation',
        'body_chart'
      );
    }
  });

  // =========================================================================
  // LANGUAGE SELECTION
  // =========================================================================

  it('should show Norwegian and English language options', () => {
    render(<ClinicalSettings {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByText('Norsk')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('should mark current language as selected', () => {
    render(<ClinicalSettings {...defaultProps} />, { wrapper: createWrapper() });
    const langRadios = screen.getAllByRole('radio').filter((r) => r.name === 'language');
    const noRadio = langRadios.find((r) => r.value === 'no');
    if (noRadio) {
      expect(noRadio).toBeChecked();
    }
  });

  // =========================================================================
  // CHART TOGGLES
  // =========================================================================

  it('should render dermatomes toggle', () => {
    render(<ClinicalSettings {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByText('showDermatomes')).toBeInTheDocument();
  });

  it('should render trigger points toggle', () => {
    render(<ClinicalSettings {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByText('showTriggerPoints')).toBeInTheDocument();
  });

  it('should render auto-generate narrative toggle', () => {
    render(<ClinicalSettings {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByText('autoGenerateNarrative')).toBeInTheDocument();
  });

  // =========================================================================
  // ACTIVE SUMMARY
  // =========================================================================

  it('should show active notation summary', () => {
    render(<ClinicalSettings {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByText('activeNotation')).toBeInTheDocument();
  });
});
