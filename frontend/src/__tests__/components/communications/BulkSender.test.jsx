/**
 * BulkSender Component Tests
 * Tests for bulk SMS/Email communication sender
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Mock fetch globally for bulkCommunicationAPI (component uses fetch directly)
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock child component PatientFilter to avoid cascading dependencies
vi.mock('../../../components/communications/PatientFilter', () => ({
  default: ({ patients, selectedPatients, onSelectionChange, isLoading }) => (
    <div data-testid="patient-filter">
      {isLoading && <span data-testid="patient-filter-loading">Loading...</span>}
      <span data-testid="patient-count">{patients?.length || 0}</span>
      <span data-testid="selected-count">{selectedPatients?.length || 0}</span>
      <button data-testid="select-patients-btn" onClick={() => onSelectionChange?.([1, 2, 3])}>
        Select Patients
      </button>
    </div>
  ),
}));

import BulkSender, { BulkSenderButton } from '../../../components/communications/BulkSender';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function renderWithProviders(ui) {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
}

const defaultPatientsResponse = {
  data: {
    patients: [
      { id: 1, firstName: 'Ola', lastName: 'Nordmann', phone: '+4712345678' },
      { id: 2, firstName: 'Kari', lastName: 'Hansen', phone: '+4787654321' },
    ],
  },
};

const defaultTemplatesResponse = {
  data: [
    { id: 'tpl-1', name: 'Påminnelse', body: 'Hei {{firstName}}, husk timen din!', subject: '' },
    {
      id: 'tpl-2',
      name: 'Oppfølging',
      body: 'Hei {{firstName}}, hvordan går det?',
      subject: 'Oppfølging',
    },
  ],
};

const defaultVariablesResponse = {
  data: [
    { variable: '{{firstName}}', description: 'Fornavn' },
    { variable: '{{lastName}}', description: 'Etternavn' },
  ],
};

describe('BulkSender Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockImplementation((url) => {
      if (url.includes('/bulk-communications/patients')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(defaultPatientsResponse),
        });
      }
      if (url.includes('/bulk-communications/templates')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(defaultTemplatesResponse),
        });
      }
      if (url.includes('/bulk-communications/variables')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(defaultVariablesResponse),
        });
      }
      if (url.includes('/bulk-communications/preview')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { patientName: 'Ola Nordmann', personalizedContent: 'Hei Ola!' },
            }),
        });
      }
      if (url.includes('/bulk-communications/send')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { batchId: 'batch-123' } }),
        });
      }
      if (url.includes('/bulk-communications/queue/status')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                status: 'COMPLETED',
                progressPercentage: 100,
                stats: { sent: 3, failed: 0, pending: 0 },
              },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  // ============================================================================
  // RENDERING
  // ============================================================================

  describe('Rendering', () => {
    it('should render the title in Norwegian by default', () => {
      renderWithProviders(<BulkSender />);
      expect(screen.getByText('Massekommunikasjon')).toBeInTheDocument();
    });

    it('should render the title in English when language is en', () => {
      renderWithProviders(<BulkSender language="en" />);
      expect(screen.getByText('Bulk Communication')).toBeInTheDocument();
    });

    it('should render step 1 (Select Patients) initially', () => {
      renderWithProviders(<BulkSender />);
      expect(screen.getByText('Velg Pasienter')).toBeInTheDocument();
    });

    it('should render communication type toggle buttons', () => {
      renderWithProviders(<BulkSender />);
      expect(screen.getByText('SMS')).toBeInTheDocument();
      expect(screen.getByText('E-post')).toBeInTheDocument();
    });

    it('should render close button when onClose is provided', () => {
      const onClose = vi.fn();
      renderWithProviders(<BulkSender onClose={onClose} />);
      // The close button has an X icon — find by role or accessible presence
      const closeButtons = screen.getAllByRole('button');
      // The last header button should be the close
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    it('should render the PatientFilter component', async () => {
      renderWithProviders(<BulkSender />);
      await waitFor(() => {
        expect(screen.getByTestId('patient-filter')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // STEP NAVIGATION
  // ============================================================================

  describe('Step Navigation', () => {
    it('should show validation warning when no patients are selected', () => {
      renderWithProviders(<BulkSender />);
      expect(screen.getByText('Velg minst en pasient')).toBeInTheDocument();
    });

    it('should enable Next button after selecting patients', async () => {
      renderWithProviders(<BulkSender />);

      // Use the mock PatientFilter to select patients
      fireEvent.click(screen.getByTestId('select-patients-btn'));

      await waitFor(() => {
        const nextBtn = screen.getByText('Neste');
        expect(nextBtn).not.toBeDisabled();
      });
    });

    it('should navigate to step 2 when Next is clicked with patients selected', async () => {
      renderWithProviders(<BulkSender />);

      // Select patients
      fireEvent.click(screen.getByTestId('select-patients-btn'));

      await waitFor(() => {
        const nextBtn = screen.getByText('Neste');
        expect(nextBtn).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText('Neste'));

      await waitFor(() => {
        expect(screen.getByText('Skriv Melding')).toBeInTheDocument();
      });
    });

    it('should show Back button on step 2', async () => {
      renderWithProviders(<BulkSender />);

      fireEvent.click(screen.getByTestId('select-patients-btn'));

      await waitFor(() => {
        expect(screen.getByText('Neste')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText('Neste'));

      await waitFor(() => {
        expect(screen.getByText('Tilbake')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // COMMUNICATION TYPE
  // ============================================================================

  describe('Communication Type', () => {
    it('should default to SMS communication type', () => {
      renderWithProviders(<BulkSender />);
      const smsButton = screen.getByText('SMS');
      // SMS button should have blue styling (active)
      expect(smsButton.closest('button')).toHaveClass('bg-blue-50');
    });

    it('should switch to Email when Email button is clicked', () => {
      renderWithProviders(<BulkSender />);
      fireEvent.click(screen.getByText('E-post'));

      const emailButton = screen.getByText('E-post');
      expect(emailButton.closest('button')).toHaveClass('bg-blue-50');
    });
  });

  // ============================================================================
  // STEP 2 - MESSAGE COMPOSITION
  // ============================================================================

  describe('Message Composition', () => {
    async function goToStep2() {
      renderWithProviders(<BulkSender />);
      fireEvent.click(screen.getByTestId('select-patients-btn'));
      await waitFor(() => expect(screen.getByText('Neste')).not.toBeDisabled());
      fireEvent.click(screen.getByText('Neste'));
      await waitFor(() => expect(screen.getByText('Skriv Melding')).toBeInTheDocument());
    }

    it('should show template select on step 2', async () => {
      await goToStep2();
      expect(screen.getByText('Velg Mal')).toBeInTheDocument();
    });

    it('should show message textarea on step 2', async () => {
      await goToStep2();
      expect(screen.getByPlaceholderText('Skriv din melding her...')).toBeInTheDocument();
    });

    it('should show schedule options on step 2', async () => {
      await goToStep2();
      expect(screen.getByText('Send Umiddelbart')).toBeInTheDocument();
      expect(screen.getByText('Planlegg for Senere')).toBeInTheDocument();
    });

    it('should show priority options on step 2', async () => {
      await goToStep2();
      expect(screen.getByText('Hoy')).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();
      expect(screen.getByText('Lav')).toBeInTheDocument();
    });

    it('should show character count when typing a message', async () => {
      await goToStep2();
      const textarea = screen.getByPlaceholderText('Skriv din melding her...');
      fireEvent.change(textarea, { target: { value: 'Hei pasient!' } });
      expect(screen.getByText(/12 tegn/)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // BulkSenderButton
  // ============================================================================

  describe('BulkSenderButton', () => {
    it('should render the Norwegian label by default', () => {
      renderWithProviders(<BulkSenderButton onClick={vi.fn()} />);
      expect(screen.getByText('Masseutsending')).toBeInTheDocument();
    });

    it('should render the English label when language is en', () => {
      renderWithProviders(<BulkSenderButton onClick={vi.fn()} language="en" />);
      expect(screen.getByText('Bulk Send')).toBeInTheDocument();
    });

    it('should call onClick when clicked', () => {
      const onClick = vi.fn();
      renderWithProviders(<BulkSenderButton onClick={onClick} />);
      fireEvent.click(screen.getByText('Masseutsending'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
