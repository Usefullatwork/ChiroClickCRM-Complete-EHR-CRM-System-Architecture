/**
 * NeurologicalExam Component Tests
 *
 * NeurologicalExam uses useTranslation('neuroexam') from '../../i18n'.
 * Relative path from this test file:
 *   test:  src/__tests__/components/neuroexam/
 *   i18n:  src/i18n/
 * => mock path: '../../../i18n'
 *
 * Also imports from ./neurologicalExamDefinitions — tested via integration
 * through the component. A partial mock of the definitions is used to keep
 * tests fast and deterministic.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the i18n module (useTranslation hook)
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
    getBilingual: (obj) => obj,
  }),
}));

// Mock the definitions module to avoid loading the 2000+ line file in tests
vi.mock('../../../components/neuroexam/neurologicalExamDefinitions', () => {
  const MOCK_CLUSTERS = {
    CEREBELLAR: {
      id: 'CEREBELLAR',
      name: { no: 'Cerebellær Funksjon', en: 'Cerebellar Function' },
      description: {
        no: 'Test beskrivelse',
        en: 'Test description',
      },
      diagnosticCriteria: { threshold: 4, total: 8, sensitivity: 85, specificity: 90 },
      referralAction: { no: 'Henvis til nevrolog', en: 'Refer to neurologist' },
      tests: [
        {
          id: 'finger_nose',
          name: { no: 'Finger-nese test', en: 'Finger-Nose Test' },
          criteria: [
            { id: 'dysmetria', label: { no: 'Dysmetri', en: 'Dysmetria' } },
            { id: 'intention_tremor', label: { no: 'Intensjonstremor', en: 'Intention Tremor' } },
          ],
        },
      ],
    },
    VESTIBULAR: {
      id: 'VESTIBULAR',
      name: { no: 'Vestibulær Funksjon', en: 'Vestibular Function' },
      description: {
        no: 'Vestibulær test beskrivelse',
        en: 'Vestibular test description',
      },
      diagnosticCriteria: { threshold: 3, total: 6 },
      hintsPlus: {
        centralSigns: [
          {
            id: 'nystagmus',
            label: { no: 'Bidireksjonell nystagmus', en: 'Bidirectional nystagmus' },
          },
        ],
        action: { no: 'Utelukk hjerneslag', en: 'Rule out stroke' },
      },
      tests: [],
    },
    BPPV: {
      id: 'BPPV',
      name: { no: 'BPPV', en: 'BPPV' },
      description: { no: 'BPPV test', en: 'BPPV test' },
      diagnosticCriteria: { threshold: 2, total: 4 },
      subClusters: {
        posterior_canal: { name: { no: 'Bakre kanal', en: 'Posterior Canal' } },
      },
      tests: [],
    },
    CERVICOGENIC: {
      id: 'CERVICOGENIC',
      name: { no: 'Cervikal svimmelhet', en: 'Cervicogenic Dizziness' },
      description: { no: 'Cervikal test', en: 'Cervical test' },
      diagnosticCriteria: { threshold: 3, total: 6 },
      tests: [],
    },
    TMJ: {
      id: 'TMJ',
      name: { no: 'TMJ / Kjeve', en: 'TMJ / Jaw' },
      description: { no: 'TMJ test', en: 'TMJ test' },
      diagnosticCriteria: { threshold: 2, total: 4 },
      tests: [],
    },
    UPPER_CERVICAL_INSTABILITY: {
      id: 'UPPER_CERVICAL_INSTABILITY',
      name: { no: 'Øvre cervikal instabilitet', en: 'Upper Cervical Instability' },
      description: { no: 'Øvre cervikal', en: 'Upper cervical' },
      isRedFlagCluster: true,
      criticalAction: { no: 'Stopp behandling', en: 'Stop treatment' },
      diagnosticCriteria: { threshold: 2, total: 4 },
      tests: [],
    },
    MYELOPATHY: {
      id: 'MYELOPATHY',
      name: { no: 'Myelopati', en: 'Myelopathy' },
      description: { no: 'Myelopati screening', en: 'Myelopathy screening' },
      isRedFlagCluster: true,
      criticalAction: { no: 'Akutt henvisning', en: 'Urgent referral' },
      diagnosticCriteria: { threshold: 2, total: 5 },
      tests: [],
    },
    VNG_OCULOMOTOR: {
      id: 'VNG_OCULOMOTOR',
      name: { no: 'VNG / Okulomotorisk', en: 'VNG / Oculomotor' },
      description: { no: 'VNG test', en: 'VNG test' },
      diagnosticCriteria: { threshold: 3, total: 6 },
      tests: [],
    },
    ACTIVATOR: {
      id: 'ACTIVATOR',
      name: { no: 'Aktivator', en: 'Activator' },
      description: { no: 'Aktivator test', en: 'Activator test' },
      diagnosticCriteria: { threshold: 2, total: 4 },
      tests: [],
    },
  };

  return {
    EXAM_CLUSTERS: MOCK_CLUSTERS,
    calculateClusterScore: vi.fn(() => ({
      score: 0,
      total: 8,
      threshold: 4,
      meetsThreshold: false,
      interpretation: null,
    })),
    checkRedFlags: vi.fn(() => []),
    generateNarrative: vi.fn(() => []),
    formatNarrativeForSOAP: vi.fn(() => 'Mock SOAP narrative'),
    diagnoseBPPV: vi.fn(() => ({ type: null })),
    default: MOCK_CLUSTERS,
  };
});

import NeurologicalExam, {
  NeurologicalExamCompact,
} from '../../../components/neuroexam/NeurologicalExam';

describe('NeurologicalExam', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  describe('Default Render', () => {
    it('should render the "Nevrologisk Undersøkelse" title', () => {
      render(<NeurologicalExam lang="no" />);
      expect(screen.getByText('Nevrologisk Undersøkelse')).toBeInTheDocument();
    });

    it('should render the subtitle', () => {
      render(<NeurologicalExam lang="no" />);
      expect(screen.getByText('Kluster-basert diagnostisk protokoll')).toBeInTheDocument();
    });

    it('should render the Save button', () => {
      render(<NeurologicalExam lang="no" onSave={mockOnSave} />);
      expect(screen.getByText('Lagre')).toBeInTheDocument();
    });

    it('should render the Generate Narrative button', () => {
      render(<NeurologicalExam lang="no" />);
      expect(screen.getByText('Generer klinisk notat')).toBeInTheDocument();
    });

    it('should render the Clear All / Reset button', () => {
      render(<NeurologicalExam lang="no" />);
      expect(screen.getByText('Nullstill')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // CLUSTER SELECTION
  // --------------------------------------------------------------------------

  describe('Cluster Sidebar', () => {
    it('should render cluster names in the sidebar', () => {
      render(<NeurologicalExam lang="no" />);
      expect(screen.getAllByText('Cerebellær Funksjon').length).toBeGreaterThan(0);
    });

    it('should switch cluster when a sidebar button is clicked', () => {
      render(<NeurologicalExam lang="no" />);
      const vestibularBtn = screen.getByText('Vestibulær Funksjon');
      fireEvent.click(vestibularBtn);
      // The cluster description panel should update
      expect(screen.getByText('Vestibulær test beskrivelse')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // TEST CARD INTERACTION
  // --------------------------------------------------------------------------

  describe('Test Card', () => {
    it('should render the Finger-Nose Test card for CEREBELLAR cluster', () => {
      render(<NeurologicalExam lang="no" />);
      expect(screen.getByText('Finger-nese test')).toBeInTheDocument();
    });

    it('should check a criterion checkbox when clicked', () => {
      render(<NeurologicalExam lang="no" />);
      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  // --------------------------------------------------------------------------
  // SAVE
  // --------------------------------------------------------------------------

  describe('Save Button', () => {
    it('should call onSave when Save is clicked', () => {
      render(<NeurologicalExam lang="no" onSave={mockOnSave} />);
      fireEvent.click(screen.getByText('Lagre'));
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({ testResults: {} }));
    });

    it('should call onNarrativeGenerated when Save is clicked', () => {
      const onNarrativeGenerated = vi.fn();
      render(
        <NeurologicalExam
          lang="no"
          onSave={mockOnSave}
          onNarrativeGenerated={onNarrativeGenerated}
        />
      );
      fireEvent.click(screen.getByText('Lagre'));
      expect(onNarrativeGenerated).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // CLEAR ALL
  // --------------------------------------------------------------------------

  describe('Clear All', () => {
    it('should reset test results when Nullstill is clicked', () => {
      render(<NeurologicalExam lang="no" onSave={mockOnSave} />);
      // Check a box, then clear
      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      fireEvent.click(screen.getByText('Nullstill'));
      // After reset the checkbox should be unchecked
      expect(checkbox).not.toBeChecked();
    });
  });

  // --------------------------------------------------------------------------
  // NARRATIVE TOGGLE
  // --------------------------------------------------------------------------

  describe('Narrative Toggle', () => {
    it('should toggle to narrative view when Generate Narrative is clicked', () => {
      render(<NeurologicalExam lang="no" />);
      fireEvent.click(screen.getByText('Generer klinisk notat'));
      // Narrative panel shows "Testresultater"
      expect(screen.getByText('Testresultater')).toBeInTheDocument();
    });

    it('should toggle back to test view when Generate Narrative is clicked again', () => {
      render(<NeurologicalExam lang="no" />);
      fireEvent.click(screen.getByText('Generer klinisk notat'));
      fireEvent.click(screen.getByText('Generer klinisk notat'));
      // Should show the Finger-Nose test again
      expect(screen.getByText('Finger-nese test')).toBeInTheDocument();
    });
  });
});

// =============================================================================
// NeurologicalExamCompact
// =============================================================================

describe('NeurologicalExamCompact', () => {
  it('should render the compact Nevrologisk Undersøkelse header', () => {
    render(<NeurologicalExamCompact testResults={{}} onChange={vi.fn()} lang="no" />);
    expect(screen.getByText('Nevrologisk Undersøkelse')).toBeInTheDocument();
  });

  it('should render cluster names in compact view', () => {
    render(<NeurologicalExamCompact testResults={{}} onChange={vi.fn()} lang="no" />);
    expect(screen.getByText('Cerebellær Funksjon')).toBeInTheDocument();
  });

  it('should expand a cluster when clicked in compact view', () => {
    render(<NeurologicalExamCompact testResults={{}} onChange={vi.fn()} lang="no" />);
    const cerebBtn = screen.getByText('Cerebellær Funksjon');
    fireEvent.click(cerebBtn);
    // After expanding, the Finger-Nose test should appear
    expect(screen.getByText('Finger-nese test')).toBeInTheDocument();
  });
});
