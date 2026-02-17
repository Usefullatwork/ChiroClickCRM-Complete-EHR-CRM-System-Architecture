import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ClinicalEncounter from '../../pages/ClinicalEncounter';
import * as api from '../../services/api';

vi.mock('../../services/api');

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ClinicalEncounter Component', () => {
  const _mockPatient = {
    id: 'patient-123',
    first_name: 'Ola',
    last_name: 'Nordmann',
    date_of_birth: '1985-05-15',
  };

  it('should render SOAP note form', () => {
    renderWithRouter(<ClinicalEncounter />);

    expect(screen.getByLabelText(/subjective/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/objective/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/assessment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/plan/i)).toBeInTheDocument();
  });

  it('should validate required fields before submission', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ClinicalEncounter />);

    const submitButton = screen.getByRole('button', { name: /save encounter/i });
    await user.click(submitButton);

    expect(screen.getByText(/chief complaint is required/i)).toBeInTheDocument();
  });

  it('should submit SOAP note successfully', async () => {
    const user = userEvent.setup();
    const mockEncountersAPI = {
      create: vi.fn().mockResolvedValue({
        id: 'encounter-123',
        patient_id: 'patient-123',
        encounter_date: '2025-01-15T14:30:00Z',
      }),
    };

    vi.spyOn(api, 'encountersAPI').mockReturnValue(mockEncountersAPI);

    renderWithRouter(<ClinicalEncounter />);

    // Fill out form
    await user.type(screen.getByLabelText(/chief complaint/i), 'Low back pain');
    await user.type(
      screen.getByLabelText(/subjective/i),
      'Patient reports 2 weeks of low back pain'
    );
    await user.type(screen.getByLabelText(/objective/i), 'Positive SLR at 45 degrees');
    await user.type(screen.getByLabelText(/assessment/i), 'L03 - Low back pain');
    await user.type(screen.getByLabelText(/plan/i), 'HVLA manipulation, home exercises');

    const submitButton = screen.getByRole('button', { name: /save encounter/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockEncountersAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          chief_complaint: 'Low back pain',
        })
      );
    });
  });

  it('should calculate VAS pain score difference', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ClinicalEncounter />);

    const preVAS = screen.getByLabelText(/pain before treatment/i);
    const postVAS = screen.getByLabelText(/pain after treatment/i);

    await user.clear(preVAS);
    await user.type(preVAS, '7');
    await user.clear(postVAS);
    await user.type(postVAS, '3');

    expect(screen.getByText(/improvement: 4 points/i)).toBeInTheDocument();
  });

  it('should prevent editing signed encounters', () => {
    const signedEncounter = {
      id: 'encounter-123',
      is_signed: true,
      soap_notes: { subjective: 'Test', objective: 'Test' },
    };

    renderWithRouter(<ClinicalEncounter encounter={signedEncounter} />);

    const subjectiveField = screen.getByLabelText(/subjective/i);
    expect(subjectiveField).toBeDisabled();
  });

  it('should show red flag warnings for dangerous conditions', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ClinicalEncounter />);

    const redFlagCheckbox = screen.getByLabelText(/saddle anesthesia/i);
    await user.click(redFlagCheckbox);

    expect(screen.getByText(/urgent: possible cauda equina/i)).toBeInTheDocument();
  });
});
