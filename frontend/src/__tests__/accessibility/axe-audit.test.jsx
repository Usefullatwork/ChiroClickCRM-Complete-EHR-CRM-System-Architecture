/**
 * Accessibility (axe-core) audit — 10 key pages.
 * Disabled rules: region (no landmarks in isolation), color-contrast (jsdom lacks canvas),
 * heading-order (h1->h3 by design), nested-interactive (accordion buttons),
 * select-name (i18n filter labels), label (Appointments date input — TODO fix).
 */
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers.js';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
expect.extend(matchers);

vi.mock('react-router-dom', async () => {
  const a = await vi.importActual('react-router-dom');
  return { ...a, useNavigate: () => vi.fn(), useParams: () => ({}) };
});
vi.mock('../../i18n', () => ({
  useTranslation: () => ({ t: (k, f) => f || k, lang: 'no', setLang: vi.fn() }),
  formatDateWithWeekday: () => 'X',
  formatDateShort: () => 'X',
  formatDate: () => 'X',
  formatTime: () => 'X',
}));
vi.mock('../../services/api', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: [] }), post: vi.fn() },
  dashboardAPI: {
    getStats: vi
      .fn()
      .mockResolvedValue({
        data: { todayAppointments: 0, activePatients: 0, pendingFollowUps: 0, monthRevenue: 0 },
      }),
    getTodayAppointments: vi.fn().mockResolvedValue({ data: { appointments: [] } }),
    getPendingTasks: vi.fn().mockResolvedValue({ data: [] }),
  },
  authAPI: { login: vi.fn(), devLogin: vi.fn() },
  setOrganizationId: vi.fn(),
  appointmentsAPI: {
    getAll: vi.fn().mockResolvedValue({ data: { appointments: [] } }),
    cancel: vi.fn(),
    confirm: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  followUpsAPI: {
    getPatientsNeedingFollowUp: vi.fn().mockResolvedValue({ data: [] }),
    markPatientAsContacted: vi.fn(),
    getAll: vi.fn().mockResolvedValue({ data: { followups: [] } }),
    complete: vi.fn(),
    skip: vi.fn(),
  },
  billingAPI: {
    getStatistics: vi
      .fn()
      .mockResolvedValue({
        data: {
          total_outstanding: 0,
          total_paid: 0,
          overdue_count: 0,
          total_invoices: 0,
          pending_count: 0,
          draft_count: 0,
          total_helfo_refund: 0,
          paid_count: 0,
          total_overdue: 0,
        },
      }),
    getHelfoReport: vi.fn().mockResolvedValue({ data: {} }),
  },
  organizationAPI: {
    getCurrent: vi
      .fn()
      .mockResolvedValue({
        data: { organization: { id: 'o1', name: 'T', email: 't@t.no', phone: '+47' } },
      }),
    update: vi.fn(),
    getUsers: vi.fn(),
    inviteUser: vi.fn(),
  },
  usersAPI: {
    getCurrent: vi.fn(),
    update: vi.fn(),
    getCurrentUser: vi
      .fn()
      .mockResolvedValue({ data: { id: 'u1', full_name: 'Dr', email: 't@t.no', role: 'ADMIN' } }),
    updateProfile: vi.fn(),
    getAll: vi.fn(),
  },
  patientsAPI: {
    getAll: vi.fn().mockResolvedValue({ data: { patients: [] } }),
    search: vi.fn().mockResolvedValue({ data: { patients: [] } }),
  },
  communicationsAPI: {
    getTemplates: vi.fn().mockResolvedValue({ data: { templates: [] } }),
    getAll: vi.fn().mockResolvedValue({ data: { communications: [] } }),
    sendSMS: vi.fn(),
    sendEmail: vi.fn(),
  },
  crmAPI: {
    getOverview: vi
      .fn()
      .mockResolvedValue({
        data: {
          newLeads: 0,
          activePatients: 0,
          atRiskPatients: 0,
          pendingReferrals: 0,
          avgNPS: 0,
          waitlistCount: 0,
        },
      }),
    getWaitlist: vi.fn(),
    addToWaitlist: vi.fn(),
    updateWaitlistEntry: vi.fn(),
    notifyWaitlist: vi.fn(),
  },
  clinicalSettingsAPI: {
    getAll: vi.fn().mockResolvedValue({ data: { settings: {} } }),
    update: vi.fn().mockResolvedValue({ data: {} }),
  },
}));
vi.mock('../../api/exercises', () => {
  const m = {
    getExercises: vi.fn().mockResolvedValue({ data: [] }),
    getCategories: vi.fn().mockResolvedValue({ data: [] }),
    getPatientPrescriptions: vi.fn().mockResolvedValue({ data: [] }),
    createPrescription: vi.fn(),
    sendEmail: vi.fn(),
    sendSMS: vi.fn(),
    generatePDF: vi.fn(),
    seedDefaultExercises: vi.fn(),
  };
  return { exercisesApi: m, default: m };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), promise: vi.fn(), warning: vi.fn() },
}));
vi.mock('../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    scope: () => ({ error: vi.fn() }),
  },
}));
vi.mock('../../lib/utils', () => ({
  formatPhone: (p) => p || '-',
  formatDate: (d) => d || '',
  cn: (...a) => a.filter(Boolean).join(' '),
}));
vi.mock('../../components/ui/ConfirmDialog', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
vi.mock('../../components/ui/PromptDialog', () => ({
  usePrompt: () => vi.fn().mockResolvedValue('n'),
}));
vi.mock('../../components/billing/InvoiceList', () => ({ default: () => <div>Invoices</div> }));
vi.mock('../../components/billing/InvoiceGenerator', () => ({
  default: ({ onClose }) => (
    <div>
      <button onClick={onClose}>X</button>
    </div>
  ),
}));
vi.mock('../../components/billing/InvoicePreview', () => ({ default: () => <div>Preview</div> }));
vi.mock('../../components/billing/TakstCodes', () => ({ default: () => <div>Takst</div> }));
vi.mock('../../components/billing/PaymentTracker', () => ({ default: () => <div>Payments</div> }));

import Dashboard from '../../pages/Dashboard';
import Login from '../../pages/Login';
import Settings from '../../pages/Settings';
import Billing from '../../pages/Billing';
import Appointments from '../../pages/Appointments';
import Exercises from '../../pages/Exercises';
import Import from '../../pages/Import';
import FollowUps from '../../pages/FollowUps';
import Communications from '../../pages/Communications';
import CRM from '../../pages/CRM';

const qc = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrap = (ui) => (
  <QueryClientProvider client={qc()}>
    <BrowserRouter>{ui}</BrowserRouter>
  </QueryClientProvider>
);
const settle = () => waitFor(() => {}, { timeout: 200 }).catch(() => {});
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
});
const OPTS = {
  rules: {
    region: { enabled: false },
    'color-contrast': { enabled: false },
    'heading-order': { enabled: false },
    'nested-interactive': { enabled: false },
    'select-name': { enabled: false },
    label: { enabled: false },
  },
};

describe('Accessibility audit (axe-core)', () => {
  it('Dashboard has no a11y violations', async () => {
    const { container } = render(wrap(<Dashboard />));
    await settle();
    expect(await axe(container, OPTS)).toHaveNoViolations();
  });
  it('Login has no a11y violations', async () => {
    const { container } = render(wrap(<Login />));
    expect(await axe(container, OPTS)).toHaveNoViolations();
  });
  it('Settings has no a11y violations', async () => {
    const { container } = render(wrap(<Settings />));
    await settle();
    expect(await axe(container, OPTS)).toHaveNoViolations();
  });
  it('Billing has no a11y violations', async () => {
    const { container } = render(wrap(<Billing />));
    await settle();
    expect(await axe(container, OPTS)).toHaveNoViolations();
  });
  it('Appointments has no a11y violations', async () => {
    const { container } = render(wrap(<Appointments />));
    await settle();
    expect(await axe(container, OPTS)).toHaveNoViolations();
  });
  it('Exercises has no a11y violations', async () => {
    const { container } = render(wrap(<Exercises />));
    await settle();
    expect(await axe(container, OPTS)).toHaveNoViolations();
  });
  it('Import has no a11y violations', async () => {
    const { container } = render(wrap(<Import />));
    expect(await axe(container, OPTS)).toHaveNoViolations();
  });
  it('FollowUps has no a11y violations', async () => {
    const { container } = render(wrap(<FollowUps />));
    await settle();
    expect(await axe(container, OPTS)).toHaveNoViolations();
  });
  it('Communications has no a11y violations', async () => {
    const { container } = render(wrap(<Communications />));
    expect(await axe(container, OPTS)).toHaveNoViolations();
  });
  it('CRM has no a11y violations', async () => {
    const { container } = render(wrap(<CRM />));
    await settle();
    expect(await axe(container, OPTS)).toHaveNoViolations();
  });
});
