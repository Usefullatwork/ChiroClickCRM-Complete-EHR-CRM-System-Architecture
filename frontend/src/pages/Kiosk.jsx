/**
 * Kiosk Page - Patient Self-Check-In
 *
 * Full-screen kiosk mode for patient self-service:
 * 1. Patient lookup by name/phone
 * 2. Identity verification (DOB)
 * 3. Contact info update
 * 4. Intake form (first-visit patients only)
 * 5. Chief complaint capture
 * 6. Pain assessment
 * 7. Quick screening (follow-up visits)
 * 8. Confirmation
 *
 * Data flows to SOAP note pre-population for provider
 */

import { useState, useCallback } from 'react';
import { useTranslation } from '../i18n';
import KioskLayout from '../components/kiosk/KioskLayout';
import PatientLookup from '../components/kiosk/PatientLookup';
import IdentityVerify from '../components/kiosk/IdentityVerify';
import ContactUpdate from '../components/kiosk/ContactUpdate';
import IntakeForm from '../components/kiosk/IntakeForm';
import ChiefComplaintCapture from '../components/kiosk/ChiefComplaintCapture';
import PainAssessment from '../components/kiosk/PainAssessment';
import QuickScreening from '../components/kiosk/QuickScreening';
import CheckInConfirmation from '../components/kiosk/CheckInConfirmation';

import logger from '../utils/logger';
const STEPS = {
  LOOKUP: 'lookup',
  VERIFY: 'verify',
  CONTACT: 'contact',
  INTAKE: 'intake',
  COMPLAINT: 'complaint',
  PAIN: 'pain',
  SCREENING: 'screening',
  CONFIRMATION: 'confirmation',
};

const STEP_ORDER = [
  STEPS.LOOKUP,
  STEPS.VERIFY,
  STEPS.CONTACT,
  STEPS.INTAKE,
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
    contact: null,
    intake: null,
    complaint: null,
    pain: null,
    screening: null,
  });

  // Get current step number for progress indicator
  const stepNumber = STEP_ORDER.indexOf(currentStep);

  // Go back one step
  const prevStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      // Skip intake step when going back if not first visit
      let targetIndex = currentIndex - 1;
      if (STEP_ORDER[targetIndex] === STEPS.INTAKE && !data.appointment?.isFirstVisit) {
        targetIndex = targetIndex - 1;
      }
      setCurrentStep(STEP_ORDER[Math.max(0, targetIndex)]);
    }
  }, [currentStep, data.appointment?.isFirstVisit]);

  // Reset to beginning
  const reset = useCallback(() => {
    setCurrentStep(STEPS.LOOKUP);
    setData({
      appointment: null,
      contact: null,
      intake: null,
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
            contactUpdate: data.contact,
            intakeForm: data.intake,
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
        logger.error('Check-in error:', error);
        // Still show confirmation but log error
        setData((prev) => ({ ...prev, screening: screeningData }));
        setCurrentStep(STEPS.CONFIRMATION);
      }
    },
    [data.appointment, data.complaint, data.pain, data.contact, data.intake, startTime, lang]
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
              setData((prev) => ({ ...prev, appointment }));
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
              setData((prev) => ({ ...prev, appointment: verifiedAppointment }));
              setCurrentStep(STEPS.CONTACT);
            }}
            onBack={prevStep}
          />
        );

      case STEPS.CONTACT:
        return (
          <ContactUpdate
            appointment={data.appointment}
            lang={lang}
            onNext={(contactData) => {
              setData((prev) => ({ ...prev, contact: contactData }));
              // Skip intake for returning patients
              if (data.appointment?.isFirstVisit) {
                setCurrentStep(STEPS.INTAKE);
              } else {
                setCurrentStep(STEPS.COMPLAINT);
              }
            }}
            onBack={prevStep}
          />
        );

      case STEPS.INTAKE:
        return (
          <IntakeForm
            lang={lang}
            onNext={(intakeData) => {
              setData((prev) => ({ ...prev, intake: intakeData }));
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
              setData((prev) => ({ ...prev, complaint }));
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
              setData((prev) => ({ ...prev, pain }));
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
