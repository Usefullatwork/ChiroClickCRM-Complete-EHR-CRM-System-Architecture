import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// Mock all kiosk sub-components
vi.mock('../../components/kiosk/KioskLayout', () => ({
  default: ({ children, step, totalSteps, onReset }) => (
    <div data-testid="kiosk-layout" data-step={step} data-total-steps={totalSteps}>
      <button data-testid="reset-button" onClick={onReset}>
        Reset
      </button>
      {children}
    </div>
  ),
}));

vi.mock('../../components/kiosk/PatientLookup', () => ({
  default: ({ onSelect }) => (
    <div data-testid="patient-lookup">
      <button
        data-testid="select-patient"
        onClick={() => onSelect({ id: 1, patientName: 'Test', isFirstVisit: false })}
      >
        Select Patient
      </button>
      <button
        data-testid="select-first-visit"
        onClick={() => onSelect({ id: 2, patientName: 'New', isFirstVisit: true })}
      >
        Select First Visit
      </button>
    </div>
  ),
}));

vi.mock('../../components/kiosk/IdentityVerify', () => ({
  default: ({ onVerified, onBack, appointment }) => (
    <div data-testid="identity-verify">
      <button
        data-testid="verify-identity"
        onClick={() => onVerified({ ...appointment, verified: true })}
      >
        Verify
      </button>
      <button data-testid="verify-back" onClick={onBack}>
        Back
      </button>
    </div>
  ),
}));

vi.mock('../../components/kiosk/ContactUpdate', () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="contact-update">
      <button
        data-testid="contact-next"
        onClick={() => onNext({ phone: '12345678', email: 'test@test.no' })}
      >
        Next
      </button>
      <button data-testid="contact-back" onClick={onBack}>
        Back
      </button>
    </div>
  ),
}));

vi.mock('../../components/kiosk/IntakeForm', () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="intake-form">
      <button data-testid="intake-next" onClick={() => onNext({ medications: [], allergies: [] })}>
        Next
      </button>
      <button data-testid="intake-back" onClick={onBack}>
        Back
      </button>
    </div>
  ),
}));

vi.mock('../../components/kiosk/ChiefComplaintCapture', () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="chief-complaint">
      <button
        data-testid="complaint-next"
        onClick={() =>
          onNext({
            chiefComplaint: 'Back pain',
            complaintCategories: ['spine'],
            narrative: 'Back pain for 2 weeks',
          })
        }
      >
        Next
      </button>
      <button data-testid="complaint-back" onClick={onBack}>
        Back
      </button>
    </div>
  ),
}));

vi.mock('../../components/kiosk/PainAssessment', () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="pain-assessment">
      <button
        data-testid="pain-next"
        onClick={() =>
          onNext({ painLevel: 5, painLocations: ['lower back'], painDuration: '2 weeks' })
        }
      >
        Next
      </button>
      <button data-testid="pain-back" onClick={onBack}>
        Back
      </button>
    </div>
  ),
}));

vi.mock('../../components/kiosk/QuickScreening', () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="quick-screening">
      <button
        data-testid="screening-next"
        onClick={() => onNext({ comparedToLast: 'better', newSymptoms: false })}
      >
        Complete
      </button>
      <button data-testid="screening-back" onClick={onBack}>
        Back
      </button>
    </div>
  ),
}));

vi.mock('../../components/kiosk/CheckInConfirmation', () => ({
  default: ({ onReset, estimatedWaitMinutes }) => (
    <div data-testid="check-in-confirmation">
      <span data-testid="wait-time">{estimatedWaitMinutes}</span>
      <button data-testid="confirmation-reset" onClick={onReset}>
        Done
      </button>
    </div>
  ),
}));

import Kiosk from '../../pages/Kiosk';

describe('Kiosk Page', () => {
  let fetchMock;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    global.fetch = fetchMock;
  });

  it('renders without crashing', () => {
    render(<Kiosk />);
    expect(screen.getByTestId('kiosk-layout')).toBeTruthy();
  });

  it('starts on the patient lookup step', () => {
    render(<Kiosk />);
    expect(screen.getByTestId('patient-lookup')).toBeTruthy();
  });

  it('passes correct step and totalSteps to KioskLayout', () => {
    render(<Kiosk />);
    const layout = screen.getByTestId('kiosk-layout');
    expect(layout.getAttribute('data-step')).toBe('0');
    expect(layout.getAttribute('data-total-steps')).toBe('8');
  });

  it('advances to identity verification after patient selection', () => {
    render(<Kiosk />);
    fireEvent.click(screen.getByTestId('select-patient'));
    expect(screen.getByTestId('identity-verify')).toBeTruthy();
  });

  it('advances to contact update after identity verification', () => {
    render(<Kiosk />);
    fireEvent.click(screen.getByTestId('select-patient'));
    fireEvent.click(screen.getByTestId('verify-identity'));
    expect(screen.getByTestId('contact-update')).toBeTruthy();
  });

  it('skips intake form for returning patients and goes to complaint', () => {
    render(<Kiosk />);
    // Select returning patient (isFirstVisit: false)
    fireEvent.click(screen.getByTestId('select-patient'));
    fireEvent.click(screen.getByTestId('verify-identity'));
    fireEvent.click(screen.getByTestId('contact-next'));
    // Should skip intake and go directly to chief complaint
    expect(screen.getByTestId('chief-complaint')).toBeTruthy();
  });

  it('shows intake form for first-visit patients', () => {
    render(<Kiosk />);
    // Select first-visit patient (isFirstVisit: true)
    fireEvent.click(screen.getByTestId('select-first-visit'));
    fireEvent.click(screen.getByTestId('verify-identity'));
    fireEvent.click(screen.getByTestId('contact-next'));
    // Should show intake form
    expect(screen.getByTestId('intake-form')).toBeTruthy();
  });

  it('navigates back from identity verify to lookup', () => {
    render(<Kiosk />);
    fireEvent.click(screen.getByTestId('select-patient'));
    expect(screen.getByTestId('identity-verify')).toBeTruthy();
    fireEvent.click(screen.getByTestId('verify-back'));
    expect(screen.getByTestId('patient-lookup')).toBeTruthy();
  });

  it('completes full returning-patient flow through to confirmation', async () => {
    render(<Kiosk />);

    // Step 1: Patient lookup -> select returning patient
    fireEvent.click(screen.getByTestId('select-patient'));

    // Step 2: Identity verify
    fireEvent.click(screen.getByTestId('verify-identity'));

    // Step 3: Contact update
    fireEvent.click(screen.getByTestId('contact-next'));

    // Step 4: Chief complaint (intake skipped for returning patient)
    fireEvent.click(screen.getByTestId('complaint-next'));

    // Step 5: Pain assessment
    fireEvent.click(screen.getByTestId('pain-next'));

    // Step 6: Quick screening -> triggers completeCheckIn
    fireEvent.click(screen.getByTestId('screening-next'));

    // Step 7: Confirmation
    await waitFor(() => {
      expect(screen.getByTestId('check-in-confirmation')).toBeTruthy();
    });
  });

  it('submits check-in data to API on screening completion', async () => {
    render(<Kiosk />);

    // Navigate through full returning-patient flow
    fireEvent.click(screen.getByTestId('select-patient'));
    fireEvent.click(screen.getByTestId('verify-identity'));
    fireEvent.click(screen.getByTestId('contact-next'));
    fireEvent.click(screen.getByTestId('complaint-next'));
    fireEvent.click(screen.getByTestId('pain-next'));
    fireEvent.click(screen.getByTestId('screening-next'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/kiosk/checkin',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  it('sends correct payload in check-in API call', async () => {
    render(<Kiosk />);

    fireEvent.click(screen.getByTestId('select-patient'));
    fireEvent.click(screen.getByTestId('verify-identity'));
    fireEvent.click(screen.getByTestId('contact-next'));
    fireEvent.click(screen.getByTestId('complaint-next'));
    fireEvent.click(screen.getByTestId('pain-next'));
    fireEvent.click(screen.getByTestId('screening-next'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(callBody.appointmentId).toBe(1);
    expect(callBody.chiefComplaint).toBe('Back pain');
    expect(callBody.painLevel).toBe(5);
    expect(callBody.painLocations).toEqual(['lower back']);
    expect(callBody.comparedToLast).toBe('better');
    expect(callBody.lang).toBe('no');
  });

  it('shows confirmation even when API call fails', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    render(<Kiosk />);

    fireEvent.click(screen.getByTestId('select-patient'));
    fireEvent.click(screen.getByTestId('verify-identity'));
    fireEvent.click(screen.getByTestId('contact-next'));
    fireEvent.click(screen.getByTestId('complaint-next'));
    fireEvent.click(screen.getByTestId('pain-next'));
    fireEvent.click(screen.getByTestId('screening-next'));

    await waitFor(() => {
      expect(screen.getByTestId('check-in-confirmation')).toBeTruthy();
    });
  });

  it('resets to lookup step when reset is triggered', async () => {
    render(<Kiosk />);

    // Navigate forward
    fireEvent.click(screen.getByTestId('select-patient'));
    expect(screen.getByTestId('identity-verify')).toBeTruthy();

    // Trigger reset via KioskLayout
    fireEvent.click(screen.getByTestId('reset-button'));
    expect(screen.getByTestId('patient-lookup')).toBeTruthy();
  });

  it('resets from confirmation step back to lookup', async () => {
    render(<Kiosk />);

    // Navigate through full flow to confirmation
    fireEvent.click(screen.getByTestId('select-patient'));
    fireEvent.click(screen.getByTestId('verify-identity'));
    fireEvent.click(screen.getByTestId('contact-next'));
    fireEvent.click(screen.getByTestId('complaint-next'));
    fireEvent.click(screen.getByTestId('pain-next'));
    fireEvent.click(screen.getByTestId('screening-next'));

    await waitFor(() => {
      expect(screen.getByTestId('check-in-confirmation')).toBeTruthy();
    });

    // Reset from confirmation
    fireEvent.click(screen.getByTestId('confirmation-reset'));
    expect(screen.getByTestId('patient-lookup')).toBeTruthy();
  });

  it('passes estimated wait minutes to confirmation component', async () => {
    render(<Kiosk />);

    fireEvent.click(screen.getByTestId('select-patient'));
    fireEvent.click(screen.getByTestId('verify-identity'));
    fireEvent.click(screen.getByTestId('contact-next'));
    fireEvent.click(screen.getByTestId('complaint-next'));
    fireEvent.click(screen.getByTestId('pain-next'));
    fireEvent.click(screen.getByTestId('screening-next'));

    await waitFor(() => {
      expect(screen.getByTestId('wait-time').textContent).toBe('5');
    });
  });
});
