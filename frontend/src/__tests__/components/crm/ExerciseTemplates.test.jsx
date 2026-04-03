/**
 * ExerciseTemplates Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../../services/api', () => ({
  crmAPI: {
    getExerciseTemplates: vi.fn().mockResolvedValue({ data: [] }),
    getCommunications: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

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

import ExerciseTemplates from '../../../components/crm/ExerciseTemplates';

describe('ExerciseTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    render(<ExerciseTemplates />);
    expect(screen.getByText('Laster øvelsesmaler...')).toBeInTheDocument();
  });

  it('renders header after loading', async () => {
    render(<ExerciseTemplates />);
    await waitFor(() => {
      expect(screen.getByText('Øvelsesmaler')).toBeInTheDocument();
    });
  });

  it('renders Ny Mal button', async () => {
    render(<ExerciseTemplates />);
    await waitFor(() => {
      expect(screen.getByText('Ny Mal')).toBeInTheDocument();
    });
  });

  it('renders stat cards with zero counts when no data', async () => {
    render(<ExerciseTemplates />);
    await waitFor(() => {
      expect(screen.getByText('Maler')).toBeInTheDocument();
      expect(screen.getByText('Sendt Totalt')).toBeInTheDocument();
    });
  });

  it('renders tab navigation with Maler and Sendt', async () => {
    render(<ExerciseTemplates />);
    await waitFor(() => {
      expect(screen.getByText('Maler')).toBeInTheDocument();
      expect(screen.getByText('Sendt')).toBeInTheDocument();
    });
  });

  it('renders category filter buttons', async () => {
    render(<ExerciseTemplates />);
    await waitFor(() => {
      expect(screen.getByText('Alle')).toBeInTheDocument();
      expect(screen.getByText('Nakke')).toBeInTheDocument();
      expect(screen.getByText('Rygg')).toBeInTheDocument();
      expect(screen.getByText('Skulder')).toBeInTheDocument();
    });
  });

  it('renders search input', async () => {
    render(<ExerciseTemplates />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Søk etter mal...')).toBeInTheDocument();
    });
  });
});
