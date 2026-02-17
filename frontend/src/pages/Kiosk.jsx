/**
 * Kiosk Page - Patient Self-Check-In
 *
 * Full-screen kiosk mode for patient self-service:
 * 1. Patient lookup by name/phone
 * 2. Identity verification (DOB)
 * 3. Chief complaint capture
 * 4. Pain assessment
 * 5. Quick screening (follow-up visits)
 * 6. Confirmation
 *
 * Data flows to SOAP note pre-population for provider
 */

import _React, { useState, useCallback } from 'react';
import { useTranslation } from '../i18n';
import KioskLayout from '../components/kiosk/KioskLayout';
import PatientLookup from '../components/kiosk/PatientLookup';
import IdentityVerify from '../components/kiosk/IdentityVerify';
import ChiefComplaintCapture from '../components/kiosk/ChiefComplaintCapture';
import PainAssessment from '../components/kiosk/PainAssessment';
import QuickScreening from '../components/kiosk/QuickScreening';
import CheckInConfirmation from '../components/kiosk/CheckInConfirmation';

const STEPS = {
  LOOKUP: 'lookup',
  VERIFY: 'verify',
  COMPLAINT: 'complaint',
  PAIN: 'pain',
  SCREENING: 'screening',
  CONFIRMATION: 'confirmation',
};

const STEP_ORDER = [
  STEPS.LOOKUP,
  STEPS.VERIFY,
  STEPS.COMPLAINT,
  STEPS.PAIN,
  STEPS.SCREENING,
  STEPS.CONFIRMATION,
];

// API base URL
const API_BASE = '/api/v1';

export default function Kiosk() {
  const { _t, lang } = useTranslation('kiosk');
  const [currentStep, setCurrentStep] = useState(STEPS.LOOKUP);
  const [startTime] = useState(Date.now());

  // Collected data
  const [data, setData] = useState({
    appointment: null,
    complaint: null,
    pain: null,
    screening: null,
  });

  // Get current step number for progress indicator
  const stepNumber = STEP_ORDER.indexOf(currentStep);

  // Update data and go to next step
  const nextStep = useCallback(
    (stepData, stepKey) => {
      setData((prev) => ({ ...prev, [stepKey]: stepData }));

      const currentIndex = STEP_ORDER.indexOf(currentStep);
      if (currentIndex < STEP_ORDER.length - 1) {
        setCurrentStep(STEP_ORDER[currentIndex + 1]);
      }
    },
    [currentStep]
  );

  // Go back one step
  const prevStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1]);
    }
  }, [currentStep]);

  // Reset to beginning
  const reset = useCallback(() => {
    setCurrentStep(STEPS.LOOKUP);
    setData({
      appointment: null,
      complaint: null,
      pain: null,
      screening: null,
    });
  }, []);

  // Complete check-in - submit to API
  const completeCheckIn = useCallback(
    async (screeningData) => {
      const duration = Math.round((Date.now() - startTime) / 1000);

      try {
        const response = await fetch(`${API_BASE}/kiosk/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId: data.appointment?.id,
            complaintCategories: data.complaint?.complaintCategories || [],
            chiefComplaint: data.complaint?.chiefComplaint || data.complaint?.narrative || '',
            painLocations: data.pain?.painLocations || [],
            painLevel: data.pain?.painLevel,
            painDuration: data.pain?.painDuration,
            comparedToLast: screeningData?.comparedToLast,
            newSymptoms: screeningData?.newSymptoms,
            newSymptomsText: screeningData?.newSymptomsText,
            aggravatingFactors: [],
            relievingFactors: [],
            intakeDuration: duration,
            lang,
          }),
        });

        if (!response.ok) {
          throw new Error('Check-in failed');
        }

        // Move to confirmation
        setData((prev) => ({ ...prev, screening: screeningData }));
        setCurrentStep(STEPS.CONFIRMATION);
      } catch (error) {
        console.error('Check-in error:', error);
        // Still show confirmation but log error
        setData((prev) => ({ ...prev, screening: screeningData }));
        setCurrentStep(STEPS.CONFIRMATION);
      }
    },
    [data.appointment, data.complaint, data.pain, startTime, lang]
  );

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case STEPS.LOOKUP:
        return (
          <PatientLookup
            lang={lang}
            apiBase={API_BASE}
            onSelect={(appointment) => {
              nextStep(appointment, 'appointment');
              setCurrentStep(STEPS.VERIFY);
            }}
          />
        );

      case STEPS.VERIFY:
        return (
          <IdentityVerify
            appointment={data.appointment}
            lang={lang}
            apiBase={API_BASE}
            onVerified={(verifiedAppointment) => {
              nextStep(verifiedAppointment, 'appointment');
              setCurrentStep(STEPS.COMPLAINT);
            }}
            onBack={prevStep}
          />
        );

      case STEPS.COMPLAINT:
        return (
          <ChiefComplaintCapture
            lang={lang}
            onNext={(complaint) => {
              nextStep(complaint, 'complaint');
              setCurrentStep(STEPS.PAIN);
            }}
            onBack={prevStep}
          />
        );

      case STEPS.PAIN:
        return (
          <PainAssessment
            lang={lang}
            onNext={(pain) => {
              nextStep(pain, 'pain');
              setCurrentStep(STEPS.SCREENING);
            }}
            onBack={prevStep}
          />
        );

      case STEPS.SCREENING:
        return (
          <QuickScreening
            appointment={data.appointment}
            lang={lang}
            onNext={(screening) => {
              completeCheckIn(screening);
            }}
            onBack={prevStep}
          />
        );

      case STEPS.CONFIRMATION:
        return (
          <CheckInConfirmation
            appointment={data.appointment}
            lang={lang}
            onReset={reset}
            estimatedWaitMinutes={5}
          />
        );

      default:
        return null;
    }
  };

  return (
    <KioskLayout
      step={stepNumber}
      totalSteps={STEP_ORDER.length}
      lang={lang}
      clinicName="ChiroClickCRM"
      onReset={reset}
    >
      {renderStep()}
    </KioskLayout>
  );
}
