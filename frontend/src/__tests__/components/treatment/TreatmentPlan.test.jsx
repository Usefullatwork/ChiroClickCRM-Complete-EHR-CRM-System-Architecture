/**
 * TreatmentPlan Component Tests
 * Tests template selector, plan display, phase cards, goal tracking, and editing
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
  formatDate: () => '15.03.2024',
}));

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), promise: vi.fn() },
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Test User', role: 'ADMIN' } }),
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TreatmentPlan, { PLAN_TEMPLATES } from '../../../components/treatment/TreatmentPlan';

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProviders = (ui) => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('TreatmentPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Template Selector (no plan)', () => {
    it('should show template selector when no plan is provided', () => {
      renderWithProviders(<TreatmentPlan lang="en" />);

      expect(screen.getByText('Ny behandlingsplan')).toBeInTheDocument();
      expect(screen.getByText('Maler')).toBeInTheDocument();
    });

    it('should display all four plan templates', () => {
      renderWithProviders(<TreatmentPlan lang="en" />);

      expect(screen.getByText('Acute Care')).toBeInTheDocument();
      expect(screen.getByText('Corrective Care')).toBeInTheDocument();
      expect(screen.getByText('Maintenance Care')).toBeInTheDocument();
      expect(screen.getByText('Rehabilitative')).toBeInTheDocument();
    });

    it('should display Norwegian template names when lang is no', () => {
      renderWithProviders(<TreatmentPlan lang="no" />);

      expect(screen.getByText('Akuttbehandling')).toBeInTheDocument();
      expect(screen.getByText('Korrigerende behandling')).toBeInTheDocument();
      expect(screen.getByText('Vedlikeholdsbehandling')).toBeInTheDocument();
      expect(screen.getByText('Rehabilitering')).toBeInTheDocument();
    });

    it('should show custom plan option', () => {
      renderWithProviders(<TreatmentPlan lang="en" />);

      expect(screen.getByText('Tilpasset plan')).toBeInTheDocument();
    });

    it('should switch to editing view when template is selected', () => {
      renderWithProviders(<TreatmentPlan lang="en" />);

      fireEvent.click(screen.getByText('Acute Care'));

      // After selecting, should see the plan editor
      expect(screen.getByText('Behandlingsplan')).toBeInTheDocument();
      expect(screen.getByText('Lagre plan')).toBeInTheDocument();
    });

    it('should populate phases when template is selected', () => {
      renderWithProviders(<TreatmentPlan lang="en" />);

      fireEvent.click(screen.getByText('Acute Care'));

      // Acute template has Intensive and Stabilization phases
      expect(screen.getByText('Intensive')).toBeInTheDocument();
      expect(screen.getByText('Stabilization')).toBeInTheDocument();
    });
  });

  describe('Plan Display (with existing plan)', () => {
    const existingPlan = {
      diagnosis: 'L03 - Low back pain',
      chiefComplaint: 'Lower back pain for 2 weeks',
      startDate: '2024-03-01',
      phases: PLAN_TEMPLATES.acute.phases,
      goals: [
        { id: '0-0', description: 'Reduce pain by 50%', phase: 0, achieved: false },
        { id: '0-1', description: 'Decrease inflammation', phase: 0, achieved: true },
      ],
      totalVisits: 5,
      visitsCompleted: 2,
      notes: 'Patient responds well to manual therapy',
    };

    it('should display diagnosis and chief complaint', () => {
      renderWithProviders(<TreatmentPlan plan={existingPlan} lang="en" />);

      expect(screen.getByText('L03 - Low back pain')).toBeInTheDocument();
      expect(screen.getByText('Lower back pain for 2 weeks')).toBeInTheDocument();
    });

    it('should display visit progress bar', () => {
      renderWithProviders(<TreatmentPlan plan={existingPlan} lang="en" />);

      expect(screen.getByText(/2 \/ 5/)).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('should display goals with achieved status', () => {
      renderWithProviders(<TreatmentPlan plan={existingPlan} lang="en" />);

      // Goals appear both in phase cards and goal tracker, so use getAllByText
      const painGoals = screen.getAllByText('Reduce pain by 50%');
      expect(painGoals.length).toBeGreaterThanOrEqual(1);
      const inflammationGoals = screen.getAllByText('Decrease inflammation');
      expect(inflammationGoals.length).toBeGreaterThanOrEqual(1);
    });

    it('should display notes', () => {
      renderWithProviders(<TreatmentPlan plan={existingPlan} lang="en" />);

      expect(screen.getByText('Patient responds well to manual therapy')).toBeInTheDocument();
    });

    it('should show Edit and New Plan buttons in view mode', () => {
      renderWithProviders(<TreatmentPlan plan={existingPlan} lang="en" />);

      expect(screen.getByText('Rediger plan')).toBeInTheDocument();
      expect(screen.getByText('Ny behandlingsplan')).toBeInTheDocument();
    });
  });

  describe('Editing Mode', () => {
    const existingPlan = {
      diagnosis: 'L03',
      chiefComplaint: 'Back pain',
      startDate: '2024-03-01',
      phases: [],
      goals: [],
      totalVisits: 5,
      visitsCompleted: 0,
      notes: '',
    };

    it('should switch to editing mode when Edit button is clicked', () => {
      renderWithProviders(<TreatmentPlan plan={existingPlan} lang="en" />);

      fireEvent.click(screen.getByText('Rediger plan'));

      // In editing mode, should see input fields and Cancel/Save buttons
      expect(screen.getByText('Avbryt')).toBeInTheDocument();
      expect(screen.getByText('Lagre plan')).toBeInTheDocument();
    });

    it('should show input fields in editing mode', () => {
      renderWithProviders(<TreatmentPlan plan={existingPlan} lang="en" />);

      fireEvent.click(screen.getByText('Rediger plan'));

      const diagnosisInput = screen.getByDisplayValue('L03');
      expect(diagnosisInput).toBeInTheDocument();
      expect(diagnosisInput.tagName).toBe('INPUT');
    });

    it('should call onSave when Save button is clicked', () => {
      const onSave = vi.fn();
      renderWithProviders(<TreatmentPlan plan={existingPlan} onSave={onSave} lang="en" />);

      fireEvent.click(screen.getByText('Rediger plan'));
      fireEvent.click(screen.getByText('Lagre plan'));

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          diagnosis: 'L03',
          chiefComplaint: 'Back pain',
        })
      );
    });

    it('should exit editing mode when Cancel is clicked', () => {
      renderWithProviders(<TreatmentPlan plan={existingPlan} lang="en" />);

      fireEvent.click(screen.getByText('Rediger plan'));
      expect(screen.getByText('Avbryt')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Avbryt'));
      expect(screen.getByText('Rediger plan')).toBeInTheDocument();
    });
  });

  describe('Goal Toggle', () => {
    it('should toggle goal achieved status when clicked', () => {
      const plan = {
        diagnosis: '',
        chiefComplaint: '',
        startDate: '2024-03-01',
        phases: PLAN_TEMPLATES.acute.phases,
        goals: [{ id: '0-0', description: 'Reduce pain by 50%', phase: 0, achieved: false }],
        totalVisits: 5,
        visitsCompleted: 0,
        notes: '',
      };

      renderWithProviders(<TreatmentPlan plan={plan} lang="en" />);

      // Goal text appears in both phase card and GoalTracker, find the clickable one
      const goalElements = screen.getAllByText('Reduce pain by 50%');
      // The GoalTracker one is inside a cursor-pointer div
      const goalInTracker = goalElements.find((el) => el.closest('[class*="cursor-pointer"]'));
      expect(goalInTracker).toBeTruthy();

      fireEvent.click(goalInTracker.closest('[class*="cursor-pointer"]'));

      // After clicking, the goal text should be styled as achieved (line-through)
      expect(goalInTracker).toHaveClass('line-through');
    });
  });

  describe('PLAN_TEMPLATES export', () => {
    it('should export all four plan templates', () => {
      expect(PLAN_TEMPLATES.acute).toBeDefined();
      expect(PLAN_TEMPLATES.corrective).toBeDefined();
      expect(PLAN_TEMPLATES.maintenance).toBeDefined();
      expect(PLAN_TEMPLATES.rehabilitative).toBeDefined();
    });

    it('should have bilingual names for each template', () => {
      expect(PLAN_TEMPLATES.acute.name.en).toBe('Acute Care');
      expect(PLAN_TEMPLATES.acute.name.no).toBe('Akuttbehandling');
    });
  });
});
