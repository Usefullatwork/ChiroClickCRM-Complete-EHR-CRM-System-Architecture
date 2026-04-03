/**
 * OrthopedicExam Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
    getBilingual: (obj) => obj?.['no'] || obj?.['en'] || obj || '',
  }),
}));

vi.mock('../../../components/orthoexam/orthopedicExamDefinitions', () => ({
  _ORTHO_EXAM_CLUSTERS: [],
  calculateOrthoClusterScore: vi.fn().mockReturnValue({ score: 0, positive: 0, total: 0 }),
  checkOrthoRedFlags: vi.fn().mockReturnValue([]),
  generateOrthoNarrative: vi.fn().mockReturnValue(''),
  getClustersByRegion: vi.fn().mockReturnValue([]),
  getAvailableRegions: vi.fn().mockReturnValue(['CERVICAL', 'SHOULDER', 'LUMBAR']),
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

import OrthopedicExam from '../../../components/orthoexam/OrthopedicExam';

describe('OrthopedicExam', () => {
  it('renders without crashing', () => {
    const { container } = render(<OrthopedicExam />);
    expect(container).toBeTruthy();
  });

  it('renders region selector buttons', () => {
    render(<OrthopedicExam />);
    // The component uses translation keys for region labels
    // With our mock, getAvailableRegions returns three regions
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('renders with passed props', () => {
    const { container } = render(
      <OrthopedicExam patientId="123" encounterId="456" onSave={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });
});
