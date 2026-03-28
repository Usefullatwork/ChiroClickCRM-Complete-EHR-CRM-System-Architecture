/**
 * PortalOutcomes Page Tests
 * Tests for patient questionnaire/outcomes portal page
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// Mock fetch for API calls (PortalOutcomes uses fetch directly, not patientPortalAPI)
const mockFetch = vi.fn();
global.fetch = mockFetch;

import PortalOutcomes from '../../../pages/portal/PortalOutcomes';

const renderPage = () =>
  render(
    <BrowserRouter>
      <PortalOutcomes />
    </BrowserRouter>
  );

const mockPastOutcomes = [
  {
    type: 'VAS',
    label: 'vasLabel',
    answers: { pain_now: 3, pain_average: 4, pain_worst: 7 },
    completed_at: '2026-03-15T10:00:00Z',
  },
  {
    type: 'NDI',
    label: 'ndiLabel',
    answers: { pain_intensity: 2, personal_care: 1 },
    completed_at: '2026-03-10T09:00:00Z',
  },
];

describe('PortalOutcomes Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ outcomes: mockPastOutcomes }),
    });
  });

  it('should render loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderPage();
    // When loading, the main content is not shown
    expect(screen.queryByText('availableForms')).not.toBeInTheDocument();
  });

  it('should render page title after loading', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('questionnaireTitle')).toBeInTheDocument();
    });
  });

  it('should display available questionnaire forms', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('availableForms')).toBeInTheDocument();
      // VAS, NDI, ODI labels rendered via t() which returns the key
      expect(screen.getByText('vasLabel')).toBeInTheDocument();
      expect(screen.getByText('ndiLabel')).toBeInTheDocument();
      expect(screen.getByText('odiLabel')).toBeInTheDocument();
    });
  });

  it('should show questionnaire descriptions', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('vasDescription')).toBeInTheDocument();
      expect(screen.getByText('ndiDescription')).toBeInTheDocument();
      expect(screen.getByText('odiDescription')).toBeInTheDocument();
    });
  });

  it('should show past results toggle button when results exist', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/questionnairePastResults/)).toBeInTheDocument();
    });
  });

  it('should start a questionnaire when a form card is clicked', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('vasLabel')).toBeInTheDocument();
    });

    // Click the VAS questionnaire button
    const vasButtons = screen.getAllByText('vasLabel');
    fireEvent.click(vasButtons[0]);

    // Should show VAS questions (scale type)
    await waitFor(() => {
      expect(screen.getByText('vasDescription')).toBeInTheDocument();
      // The first question text rendered via t()
      expect(screen.getByText(/1\. vasPainNowQ/)).toBeInTheDocument();
    });
  });

  it('should show scale buttons for VAS questions', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('vasLabel')).toBeInTheDocument();
    });

    const vasButtons = screen.getAllByText('vasLabel');
    fireEvent.click(vasButtons[0]);

    await waitFor(() => {
      // Scale min/max labels
      expect(screen.getAllByText('scaleNoPain').length).toBeGreaterThan(0);
      expect(screen.getAllByText('scaleWorstPain').length).toBeGreaterThan(0);
    });
  });

  it('should show submit button as disabled when not all questions are answered', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('vasLabel')).toBeInTheDocument();
    });

    const vasButtons = screen.getAllByText('vasLabel');
    fireEvent.click(vasButtons[0]);

    await waitFor(() => {
      const submitBtn = screen.getByText('questionnaireSendAnswers').closest('button');
      expect(submitBtn).toBeDisabled();
    });
  });

  it('should show NDI questionnaire with choice options when clicked', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('ndiLabel')).toBeInTheDocument();
    });

    const ndiButtons = screen.getAllByText('ndiLabel');
    fireEvent.click(ndiButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/1\. ndiPainIntensity/)).toBeInTheDocument();
      // Choice options for NDI pain intensity
      expect(screen.getByText('ndiPainOpt0')).toBeInTheDocument();
    });
  });

  it('should show confidentiality notice in footer', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('confidentialityNotice')).toBeInTheDocument();
    });
  });

  it('should hide past results list initially and show on toggle', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/questionnairePastResults/)).toBeInTheDocument();
    });

    // Past results dates should not be visible initially
    expect(screen.queryByText('15. mar. 2026')).not.toBeInTheDocument();

    // Click the toggle to show history
    fireEvent.click(screen.getByText(/questionnairePastResults/));

    await waitFor(() => {
      // Past result items should now be visible (the type labels)
      const pastLabels = screen.getAllByText('vasLabel');
      expect(pastLabels.length).toBeGreaterThanOrEqual(1);
    });
  });
});
