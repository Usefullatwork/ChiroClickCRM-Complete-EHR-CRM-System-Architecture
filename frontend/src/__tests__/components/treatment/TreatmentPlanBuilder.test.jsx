/**
 * TreatmentPlanBuilder Component Tests
 * Tests wizard steps: template selection, details form, milestones, review, and save
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
  formatDate: () => '15.03.2024',
}));

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  treatmentPlansAPI: {
    createPlan: vi.fn(),
    addMilestone: vi.fn(),
    addSession: vi.fn(),
  },
}));

vi.mock('../../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), promise: vi.fn() },
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Test User', role: 'ADMIN' } }),
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { treatmentPlansAPI } from '../../../services/api';
import TreatmentPlanBuilder from '../../../components/treatment/TreatmentPlanBuilder';

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProviders = (ui) => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('TreatmentPlanBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step 0: Template Selection', () => {
    it('should render template selection as first step', () => {
      renderWithProviders(<TreatmentPlanBuilder patientId={1} />);

      expect(screen.getByText('Velg mal')).toBeInTheDocument();
    });

    it('should display all four templates and custom option', () => {
      renderWithProviders(<TreatmentPlanBuilder patientId={1} lang="no" />);

      expect(screen.getByText('Akuttbehandling')).toBeInTheDocument();
      expect(screen.getByText('Korrigerende behandling')).toBeInTheDocument();
      expect(screen.getByText('Vedlikeholdsbehandling')).toBeInTheDocument();
      expect(screen.getByText('Rehabilitering')).toBeInTheDocument();
      expect(screen.getByText('Tilpasset plan')).toBeInTheDocument();
    });

    it('should show template details (duration, visits)', () => {
      renderWithProviders(<TreatmentPlanBuilder patientId={1} lang="no" />);

      // Multiple templates show weeks/visits, verify at least one exists
      const weekLabels = screen.getAllByText(/uker/);
      expect(weekLabels.length).toBeGreaterThanOrEqual(4); // 4 templates
      const visitLabels = screen.getAllByText(/besøk/);
      expect(visitLabels.length).toBeGreaterThanOrEqual(4);
    });

    it('should show cancel button when onCancel is provided', () => {
      const onCancel = vi.fn();
      renderWithProviders(<TreatmentPlanBuilder patientId={1} onCancel={onCancel} />);

      const cancelBtn = screen.getByText('Avbryt');
      expect(cancelBtn).toBeInTheDocument();

      fireEvent.click(cancelBtn);
      expect(onCancel).toHaveBeenCalled();
    });

    it('should advance to step 1 when template is selected', () => {
      renderWithProviders(<TreatmentPlanBuilder patientId={1} lang="no" />);

      fireEvent.click(screen.getByText('Akuttbehandling'));

      // Should now see Step 1 (details)
      expect(screen.getByText('Plandetaljer')).toBeInTheDocument();
    });

    it('should advance to step 1 when custom plan is selected', () => {
      renderWithProviders(<TreatmentPlanBuilder patientId={1} lang="no" />);

      fireEvent.click(screen.getByText('Tilpasset plan'));

      expect(screen.getByText('Plandetaljer')).toBeInTheDocument();
    });

    it('should pre-fill title from template', () => {
      renderWithProviders(<TreatmentPlanBuilder patientId={1} lang="no" />);

      fireEvent.click(screen.getByText('Akuttbehandling'));

      expect(screen.getByDisplayValue('Akuttbehandling')).toBeInTheDocument();
    });
  });

  describe('Step 1: Details Form', () => {
    function goToStep1() {
      renderWithProviders(<TreatmentPlanBuilder patientId={1} lang="no" />);
      fireEvent.click(screen.getByText('Akuttbehandling'));
    }

    it('should render title, condition, diagnosis code fields', () => {
      goToStep1();

      expect(screen.getByText('Tittel')).toBeInTheDocument();
      expect(screen.getByText('Tilstand')).toBeInTheDocument();
      expect(screen.getByText(/Diagnosekode/)).toBeInTheDocument();
    });

    it('should render frequency, total sessions, and start date fields', () => {
      goToStep1();

      expect(screen.getByText('Besøksfrekvens')).toBeInTheDocument();
      expect(screen.getByText('Totalt antall besøk')).toBeInTheDocument();
      expect(screen.getByText('Startdato')).toBeInTheDocument();
    });

    it('should render pre-filled goals from template', () => {
      goToStep1();

      // Acute template goals in Norwegian
      expect(screen.getByDisplayValue('Redusere smerte med 50%')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Redusere betennelse')).toBeInTheDocument();
    });

    it('should allow adding a new goal', () => {
      goToStep1();

      fireEvent.click(screen.getByText(/Legg til mål/));

      // Should now have one more empty input
      const goalInputs = screen
        .getAllByRole('textbox')
        .filter((el) => el.closest('[class*="space-y-2"]'));
      expect(goalInputs.length).toBeGreaterThanOrEqual(5);
    });

    it('should allow removing a goal', () => {
      goToStep1();

      const removeButtons = screen.getAllByText('Fjern');
      const initialCount = removeButtons.length;
      fireEvent.click(removeButtons[0]);

      const remaining = screen.getAllByText('Fjern');
      expect(remaining.length).toBe(initialCount - 1);
    });

    it('should disable Next button when title is empty', () => {
      renderWithProviders(<TreatmentPlanBuilder patientId={1} lang="no" />);
      fireEvent.click(screen.getByText('Tilpasset plan'));

      // Custom plan has empty title
      expect(screen.getByText('Neste')).toBeDisabled();
    });

    it('should enable Next button when title is filled', () => {
      goToStep1();

      // Title is pre-filled from template
      expect(screen.getByText('Neste')).not.toBeDisabled();
    });
  });

  describe('Step 2: Milestones', () => {
    function goToStep2() {
      renderWithProviders(<TreatmentPlanBuilder patientId={1} lang="no" />);
      fireEvent.click(screen.getByText('Akuttbehandling'));
      fireEvent.click(screen.getByText('Neste'));
    }

    it('should display milestones step heading', () => {
      goToStep2();

      expect(screen.getByText('Milepæler')).toBeInTheDocument();
    });

    it('should show pre-created milestones from template phases', () => {
      goToStep2();

      // Acute has 2 phases -> 2 milestones auto-created
      expect(screen.getByDisplayValue('Intensiv')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Stabilisering')).toBeInTheDocument();
    });

    it('should allow adding a new milestone', () => {
      goToStep2();

      fireEvent.click(screen.getByText(/Legg til milepæl/));

      // Should now have 3 milestones (2 from template + 1 new)
      const milestoneLabels = screen.getAllByText(/Milepæltittel/);
      expect(milestoneLabels.length).toBe(3);
    });

    it('should allow removing a milestone', () => {
      goToStep2();

      const removeButtons = screen.getAllByText('Fjern');
      fireEvent.click(removeButtons[0]);

      // Should now have 1 milestone
      const milestoneLabels = screen.getAllByText(/Milepæltittel/);
      expect(milestoneLabels.length).toBe(1);
    });

    it('should render outcome measure dropdown with options', () => {
      goToStep2();

      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2); // 2 milestones x 1 select each
    });
  });

  describe('Step 3: Review', () => {
    function goToStep3() {
      renderWithProviders(<TreatmentPlanBuilder patientId={1} lang="no" />);
      fireEvent.click(screen.getByText('Akuttbehandling'));
      fireEvent.click(screen.getByText('Neste'));
      fireEvent.click(screen.getByText('Neste'));
    }

    it('should display review heading', () => {
      goToStep3();

      expect(screen.getByText('Gjennomgang')).toBeInTheDocument();
    });

    it('should display plan summary in review', () => {
      goToStep3();

      expect(screen.getByText('Akuttbehandling')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // totalSessions
    });

    it('should display goals list in review', () => {
      goToStep3();

      expect(screen.getByText('Redusere smerte med 50%')).toBeInTheDocument();
    });

    it('should display milestones count in review', () => {
      goToStep3();

      expect(screen.getByText(/Milepæler \(2\)/)).toBeInTheDocument();
    });

    it('should show save button instead of next on review step', () => {
      goToStep3();

      expect(screen.getByText('Lagre plan')).toBeInTheDocument();
      expect(screen.queryByText('Neste')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should go back to template selection from step 1', () => {
      renderWithProviders(<TreatmentPlanBuilder patientId={1} lang="no" />);
      fireEvent.click(screen.getByText('Akuttbehandling'));

      expect(screen.getByText('Plandetaljer')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Tilbake'));

      expect(screen.getByText('Velg mal')).toBeInTheDocument();
    });

    it('should go back from step 2 to step 1', () => {
      renderWithProviders(<TreatmentPlanBuilder patientId={1} lang="no" />);
      fireEvent.click(screen.getByText('Akuttbehandling'));
      fireEvent.click(screen.getByText('Neste'));

      expect(screen.getByText('Milepæler')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Tilbake'));

      expect(screen.getByText('Plandetaljer')).toBeInTheDocument();
    });
  });

  describe('Save', () => {
    it('should call API to create plan, milestones, and sessions on save', async () => {
      treatmentPlansAPI.createPlan.mockResolvedValue({ data: { id: 99 } });
      treatmentPlansAPI.addMilestone.mockResolvedValue({ data: {} });
      treatmentPlansAPI.addSession.mockResolvedValue({ data: {} });

      const onCreated = vi.fn();
      renderWithProviders(<TreatmentPlanBuilder patientId={1} lang="no" onCreated={onCreated} />);

      // Navigate through all steps
      fireEvent.click(screen.getByText('Akuttbehandling'));
      fireEvent.click(screen.getByText('Neste'));
      fireEvent.click(screen.getByText('Neste'));
      fireEvent.click(screen.getByText('Lagre plan'));

      await waitFor(() => {
        expect(treatmentPlansAPI.createPlan).toHaveBeenCalledWith(
          expect.objectContaining({
            patientId: 1,
            title: 'Akuttbehandling',
            totalSessions: 5,
          })
        );
      });

      await waitFor(() => {
        expect(onCreated).toHaveBeenCalledWith({ id: 99 });
      });

      // 2 milestones from acute template
      expect(treatmentPlansAPI.addMilestone).toHaveBeenCalledTimes(2);

      // 5 sessions for acute template
      expect(treatmentPlansAPI.addSession).toHaveBeenCalledTimes(5);
    });

    it('should show error message when save fails', async () => {
      treatmentPlansAPI.createPlan.mockRejectedValue({
        response: { data: { error: 'Database error' } },
      });

      renderWithProviders(<TreatmentPlanBuilder patientId={1} lang="no" />);

      fireEvent.click(screen.getByText('Akuttbehandling'));
      fireEvent.click(screen.getByText('Neste'));
      fireEvent.click(screen.getByText('Neste'));
      fireEvent.click(screen.getByText('Lagre plan'));

      await waitFor(() => {
        expect(screen.getByText('Database error')).toBeInTheDocument();
      });
    });

    it('should show saving state on button while saving', async () => {
      treatmentPlansAPI.createPlan.mockReturnValue(new Promise(() => {})); // never resolves

      renderWithProviders(<TreatmentPlanBuilder patientId={1} lang="no" />);

      fireEvent.click(screen.getByText('Akuttbehandling'));
      fireEvent.click(screen.getByText('Neste'));
      fireEvent.click(screen.getByText('Neste'));
      fireEvent.click(screen.getByText('Lagre plan'));

      await waitFor(() => {
        expect(screen.getByText('Lagrer...')).toBeInTheDocument();
      });
    });
  });
});
