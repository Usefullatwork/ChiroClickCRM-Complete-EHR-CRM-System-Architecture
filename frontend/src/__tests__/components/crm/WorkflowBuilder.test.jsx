/**
 * CRM WorkflowBuilder Component Tests
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
    getWorkflows: vi.fn().mockResolvedValue({
      data: {
        workflows: [
          {
            id: 1,
            name: 'Velkomstsekvens',
            description: 'Automatisk oppfølging av nye pasienter',
            trigger_type: 'NEW_PATIENT',
            status: 'ACTIVE',
            execution_count: 42,
            success_rate: 95,
            last_executed_at: '2026-03-28T10:00:00Z',
            steps: [
              { type: 'SEND_EMAIL', config: { template: 'welcome' } },
              { type: 'WAIT', config: { days: 3 } },
              { type: 'SEND_SMS', config: {} },
            ],
          },
        ],
      },
    }),
    createWorkflow: vi.fn().mockResolvedValue({ data: {} }),
    toggleWorkflow: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../../utils/toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
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
          if (name === 'Fragment') return ({ children }) => children;
          return (props) => null;
        },
      }
    )
);

import WorkflowBuilder from '../../../components/crm/WorkflowBuilder';

describe('CRM WorkflowBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    render(<WorkflowBuilder />);
    expect(screen.getByText('Laster automatiseringer...')).toBeInTheDocument();
  });

  it('renders header after loading', async () => {
    render(<WorkflowBuilder />);
    await waitFor(() => {
      expect(screen.getByText('Automatiseringer')).toBeInTheDocument();
    });
  });

  it('renders new automation button', async () => {
    render(<WorkflowBuilder />);
    await waitFor(() => {
      expect(screen.getByText('Ny Automatisering')).toBeInTheDocument();
    });
  });

  it('renders stat cards', async () => {
    render(<WorkflowBuilder />);
    await waitFor(() => {
      expect(screen.getByText('Totalt Arbeidsflyter')).toBeInTheDocument();
      expect(screen.getByText('Aktive')).toBeInTheDocument();
    });
  });

  it('renders workflow list with workflow name', async () => {
    render(<WorkflowBuilder />);
    await waitFor(() => {
      expect(screen.getByText('Velkomstsekvens')).toBeInTheDocument();
    });
  });

  it('renders status tabs', async () => {
    render(<WorkflowBuilder />);
    await waitFor(() => {
      expect(screen.getByText('Alle')).toBeInTheDocument();
    });
  });

  it('renders workflow execution count', async () => {
    render(<WorkflowBuilder />);
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  it('renders workflow success rate', async () => {
    render(<WorkflowBuilder />);
    await waitFor(() => {
      expect(screen.getByText('95%')).toBeInTheDocument();
    });
  });
});
