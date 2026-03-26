/**
 * GDPRExportModal Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', () => ({
  useMutation: (opts) => {
    const mutate = vi.fn((type) => {
      if (opts?.mutationFn) {
        const promise = opts.mutationFn(type);
        if (promise && typeof promise.then === 'function') {
          promise.then((data) => opts.onSuccess?.(data)).catch((err) => opts.onError?.(err));
        }
      }
    });
    return {
      mutate,
      isPending: false,
    };
  },
}));

// Mock gdprAPI
vi.mock('../../../services/api', () => ({
  gdprAPI: {
    exportPatientData: vi.fn(),
    exportDataPortability: vi.fn(),
  },
}));

// Mock toast
vi.mock('../../../utils/toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <svg data-testid="x-icon" />,
  Download: () => <svg data-testid="download-icon" />,
  Shield: () => <svg data-testid="shield-icon" />,
  FileText: () => <svg data-testid="file-text-icon" />,
  Database: () => <svg data-testid="database-icon" />,
  Loader2: () => <svg data-testid="loader-icon" />,
}));

import GDPRExportModal from '../../../components/GDPRExportModal';
import { gdprAPI } from '../../../services/api';

const mockPatient = {
  id: 'pat-123',
  first_name: 'Ola',
  last_name: 'Nordmann',
  solvit_id: 'SLV-001',
  date_of_birth: '1985-06-15',
  gender: 'Male',
};

describe('GDPRExportModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the modal title', () => {
    render(<GDPRExportModal patient={mockPatient} onClose={onClose} />);
    expect(screen.getByText('GDPR Data Export')).toBeDefined();
  });

  it('should display the patient name in the header', () => {
    render(<GDPRExportModal patient={mockPatient} onClose={onClose} />);
    // Patient name appears in header subtitle AND patient info grid
    const instances = screen.getAllByText('Ola Nordmann');
    expect(instances.length).toBeGreaterThanOrEqual(1);
  });

  it('should show both export type options', () => {
    render(<GDPRExportModal patient={mockPatient} onClose={onClose} />);
    expect(screen.getByText('Data Access Request (Article 15)')).toBeDefined();
    expect(screen.getByText('Data Portability (Article 20)')).toBeDefined();
  });

  it('should default to data-access export type', () => {
    render(<GDPRExportModal patient={mockPatient} onClose={onClose} />);
    const radios = screen.getAllByRole('radio');
    // First radio is data-access
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
  });

  it('should switch to data-portability when that radio is selected', () => {
    render(<GDPRExportModal patient={mockPatient} onClose={onClose} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]);
    expect(radios[1].checked).toBe(true);
  });

  it('should display the patient ID and gender in the info grid', () => {
    render(<GDPRExportModal patient={mockPatient} onClose={onClose} />);
    expect(screen.getByText('SLV-001')).toBeDefined();
    expect(screen.getByText('Male')).toBeDefined();
  });

  it('should call onClose when the header close button is clicked', () => {
    render(<GDPRExportModal patient={mockPatient} onClose={onClose} />);
    const closeBtn = screen.getByTestId('x-icon').closest('button');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when the footer Close button is clicked', () => {
    render(<GDPRExportModal patient={mockPatient} onClose={onClose} />);
    const footerClose = screen.getByText('Close');
    fireEvent.click(footerClose);
    expect(onClose).toHaveBeenCalled();
  });

  it('should call gdprAPI.exportPatientData when Export button is clicked with data-access type', async () => {
    gdprAPI.exportPatientData.mockResolvedValue({ data: { patient: { id: 'pat-123' } } });
    render(<GDPRExportModal patient={mockPatient} onClose={onClose} />);
    fireEvent.click(screen.getByText('Export Patient Data'));
    await waitFor(() => {
      expect(gdprAPI.exportPatientData).toHaveBeenCalledWith('pat-123');
    });
  });

  it('should call gdprAPI.exportDataPortability when data-portability type is selected', async () => {
    gdprAPI.exportDataPortability.mockResolvedValue({ data: { patient: { id: 'pat-123' } } });
    render(<GDPRExportModal patient={mockPatient} onClose={onClose} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]);
    fireEvent.click(screen.getByText('Export Patient Data'));
    await waitFor(() => {
      expect(gdprAPI.exportDataPortability).toHaveBeenCalledWith('pat-123');
    });
  });

  it('should display the GDPR compliance footer notice', () => {
    render(<GDPRExportModal patient={mockPatient} onClose={onClose} />);
    expect(
      screen.getByText('Export processed in compliance with GDPR Articles 15 & 20')
    ).toBeDefined();
  });
});
