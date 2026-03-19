/**
 * SendDocumentModal Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock api
vi.mock('../../services/api', () => ({
  pdfAPI: {
    deliverDocument: vi.fn(),
  },
  exercisesAPI: {
    deliverPrescription: vi.fn(),
  },
}));

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: {
    scope: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import SendDocumentModal from '../../components/ui/SendDocumentModal';
import { pdfAPI, exercisesAPI } from '../../services/api';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  documentType: 'referral_letter',
  documentId: 'doc-123',
  patientId: 'pat-456',
  patientName: 'Ola Nordmann',
  onSuccess: vi.fn(),
};

describe('SendDocumentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(<SendDocumentModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Send dokument til pasient')).toBeNull();
  });

  it('should render modal with patient info', () => {
    render(<SendDocumentModal {...defaultProps} />);
    expect(screen.getByText('Send dokument til pasient')).toBeDefined();
    expect(screen.getByText('Ola Nordmann')).toBeDefined();
    expect(screen.getByText('Henvisning')).toBeDefined();
  });

  it('should show delivery method options', () => {
    render(<SendDocumentModal {...defaultProps} />);
    expect(screen.getByText('E-post')).toBeDefined();
    expect(screen.getByText('SMS')).toBeDefined();
    expect(screen.getByText('Begge')).toBeDefined();
  });

  it('should call pdfAPI.deliverDocument on send for non-exercise types', async () => {
    pdfAPI.deliverDocument.mockResolvedValue({ data: { success: true } });

    render(<SendDocumentModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Send'));

    await waitFor(() => {
      expect(pdfAPI.deliverDocument).toHaveBeenCalledWith('referral_letter', 'doc-123', {
        patientId: 'pat-456',
        method: 'email',
      });
    });
  });

  it('should call exercisesAPI.deliverPrescription for exercise type', async () => {
    exercisesAPI.deliverPrescription.mockResolvedValue({ data: { success: true } });

    render(<SendDocumentModal {...defaultProps} documentType="exercise_prescription" />);
    fireEvent.click(screen.getByText('Send'));

    await waitFor(() => {
      expect(exercisesAPI.deliverPrescription).toHaveBeenCalledWith('doc-123', { method: 'email' });
    });
  });

  it('should show error on failure', async () => {
    pdfAPI.deliverDocument.mockRejectedValue(new Error('Network error'));

    render(<SendDocumentModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Send'));

    await waitFor(() => {
      expect(screen.getByText('Kunne ikke sende dokumentet')).toBeDefined();
    });
  });

  it('should call onClose when cancel is clicked', () => {
    render(<SendDocumentModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Avbryt'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
