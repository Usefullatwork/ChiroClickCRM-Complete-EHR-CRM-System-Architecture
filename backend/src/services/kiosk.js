/**
 * Kiosk Service
 * Business logic for patient self-service kiosk:
 * check-in, intake forms, consent, and practitioner queue.
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import { NotFoundError, BusinessLogicError } from '../utils/errors.js';

/**
 * Check in a patient for their appointment.
 * Marks the patient as arrived and returns their queue position.
 *
 * @param {string} patientId
 * @param {string} appointmentId
 * @returns {{ checkedIn: boolean, queuePosition: number, appointment }}
 */
export const checkIn = async (patientId, appointmentId) => {
  // Verify appointment exists and belongs to patient
  const apptResult = await query(
    `SELECT a.*, p.first_name, p.last_name
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     WHERE a.id = $1 AND a.patient_id = $2`,
    [appointmentId, patientId]
  );

  if (apptResult.rows.length === 0) {
    throw new NotFoundError('Appointment', appointmentId);
  }

  const appointment = apptResult.rows[0];

  if (appointment.status === 'checked_in' || appointment.status === 'in_progress') {
    throw new BusinessLogicError('Patient is already checked in for this appointment');
  }

  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    throw new BusinessLogicError(`Cannot check in: appointment is ${appointment.status}`);
  }

  // Mark as checked in
  await query(
    `UPDATE appointments
     SET status = 'checked_in', checked_in_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [appointmentId]
  );

  // Calculate queue position (how many patients checked in before this one today)
  const queueResult = await query(
    `SELECT COUNT(*) as position
     FROM appointments
     WHERE practitioner_id = $1
       AND DATE(start_time) = CURRENT_DATE
       AND status = 'checked_in'
       AND checked_in_at < NOW()`,
    [appointment.practitioner_id]
  );

  const queuePosition = parseInt(queueResult.rows[0].position) + 1;

  logger.info('Patient checked in', {
    patientId,
    appointmentId,
    queuePosition,
  });

  return {
    checkedIn: true,
    queuePosition,
    appointment: {
      id: appointment.id,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      type: appointment.appointment_type,
      patientName: `${appointment.first_name} ${appointment.last_name}`,
    },
  };
};

/**
 * Get the intake form for a patient based on encounter type.
 *
 * @param {string} patientId
 * @param {string} [encounterType] - Optional, used to customize form fields
 * @returns {{ form, patientInfo }}
 */
export const getIntakeForm = async (patientId, encounterType = null) => {
  // Get patient's existing data to pre-fill form
  const patientResult = await query(
    `SELECT
      id, first_name, last_name, date_of_birth, email, phone,
      address, postal_code, city,
      allergies, current_medications, red_flags, contraindications,
      emergency_contact_name, emergency_contact_phone
     FROM patients
     WHERE id = $1`,
    [patientId]
  );

  if (patientResult.rows.length === 0) {
    throw new NotFoundError('Patient', patientId);
  }

  const patient = patientResult.rows[0];

  // Build intake form fields
  const form = {
    sections: [
      {
        id: 'chief_complaint',
        title: 'Hovedplage',
        titleEn: 'Chief Complaint',
        fields: [
          {
            id: 'chief_complaint',
            type: 'textarea',
            label: 'Hva er din hovedplage i dag?',
            labelEn: 'What is your main complaint today?',
            required: true,
          },
          {
            id: 'pain_duration',
            type: 'select',
            label: 'Hvor lenge har du hatt plagene?',
            labelEn: 'How long have you had the problem?',
            options: ['Under 1 uke', '1-4 uker', '1-3 maneder', '3-6 maneder', 'Over 6 maneder'],
            required: true,
          },
          {
            id: 'pain_score',
            type: 'slider',
            label: 'Smerteskala (0-10)',
            labelEn: 'Pain scale (0-10)',
            min: 0,
            max: 10,
            required: true,
          },
        ],
      },
      {
        id: 'medical_history',
        title: 'Medisinsk historie',
        titleEn: 'Medical History',
        fields: [
          {
            id: 'allergies',
            type: 'textarea',
            label: 'Allergier',
            labelEn: 'Allergies',
            prefilled: patient.allergies || [],
          },
          {
            id: 'medications',
            type: 'textarea',
            label: 'Navaerende medisiner',
            labelEn: 'Current medications',
            prefilled: patient.current_medications || [],
          },
          {
            id: 'previous_treatment',
            type: 'textarea',
            label: 'Tidligere behandling for dette problemet',
            labelEn: 'Previous treatment for this problem',
          },
          {
            id: 'surgeries',
            type: 'textarea',
            label: 'Tidligere operasjoner',
            labelEn: 'Previous surgeries',
          },
        ],
      },
      {
        id: 'red_flags',
        title: 'Viktige symptomer',
        titleEn: 'Important Symptoms',
        fields: [
          {
            id: 'weight_loss',
            type: 'checkbox',
            label: 'Uforklart vekttap',
            labelEn: 'Unexplained weight loss',
          },
          {
            id: 'night_pain',
            type: 'checkbox',
            label: 'Nattsmerter som vekker deg',
            labelEn: 'Night pain that wakes you',
          },
          {
            id: 'bladder_bowel',
            type: 'checkbox',
            label: 'Endring i blaere-/tarmfunksjon',
            labelEn: 'Change in bladder/bowel function',
          },
          {
            id: 'numbness',
            type: 'checkbox',
            label: 'Dovhet eller prikking i armer/ben',
            labelEn: 'Numbness or tingling in arms/legs',
          },
          { id: 'fever', type: 'checkbox', label: 'Feber', labelEn: 'Fever' },
          { id: 'dizziness', type: 'checkbox', label: 'Svimmelhet', labelEn: 'Dizziness' },
        ],
      },
      {
        id: 'contact_info',
        title: 'Kontaktinformasjon',
        titleEn: 'Contact Information',
        fields: [
          {
            id: 'phone',
            type: 'tel',
            label: 'Telefon',
            labelEn: 'Phone',
            prefilled: patient.phone,
          },
          {
            id: 'email',
            type: 'email',
            label: 'E-post',
            labelEn: 'Email',
            prefilled: patient.email,
          },
          {
            id: 'emergency_contact_name',
            type: 'text',
            label: 'Parorende (navn)',
            labelEn: 'Emergency contact (name)',
            prefilled: patient.emergency_contact_name,
          },
          {
            id: 'emergency_contact_phone',
            type: 'tel',
            label: 'Parorende (telefon)',
            labelEn: 'Emergency contact (phone)',
            prefilled: patient.emergency_contact_phone,
          },
        ],
      },
    ],
    encounterType: encounterType || 'FOLLOW_UP',
  };

  // Add vestibular-specific section if applicable
  if (encounterType === 'VESTIBULAR') {
    form.sections.splice(1, 0, {
      id: 'vestibular',
      title: 'Svimmelhet',
      titleEn: 'Dizziness',
      fields: [
        {
          id: 'vertigo_type',
          type: 'select',
          label: 'Type svimmelhet',
          labelEn: 'Type of dizziness',
          options: ['Roterende', 'Ustabil', 'Svimmelhetsfornemmelse', 'Annet'],
        },
        {
          id: 'vertigo_triggers',
          type: 'textarea',
          label: 'Hva utloser svimmelheten?',
          labelEn: 'What triggers your dizziness?',
        },
        {
          id: 'vertigo_duration',
          type: 'select',
          label: 'Varighet av episoder',
          labelEn: 'Duration of episodes',
          options: ['Sekunder', 'Minutter', 'Timer', 'Konstant'],
        },
      ],
    });
  }

  return {
    form,
    patientInfo: {
      id: patient.id,
      name: `${patient.first_name} ${patient.last_name}`,
      dateOfBirth: patient.date_of_birth,
    },
  };
};

/**
 * Submit a completed intake form.
 * Stores the intake data and updates patient records if needed.
 *
 * @param {string} patientId
 * @param {object} formData - Submitted form data
 * @returns {{ stored: boolean, redFlagsDetected: string[] }}
 */
export const submitIntakeForm = async (patientId, formData) => {
  // Verify patient exists
  const patientResult = await query('SELECT id, organization_id FROM patients WHERE id = $1', [
    patientId,
  ]);

  if (patientResult.rows.length === 0) {
    throw new NotFoundError('Patient', patientId);
  }

  // Store intake form data as a JSON record
  await query(
    `INSERT INTO patient_intake_forms (patient_id, form_data, submitted_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (patient_id, DATE(submitted_at))
     DO UPDATE SET form_data = $2, submitted_at = NOW()`,
    [patientId, JSON.stringify(formData)]
  ).catch(async () => {
    // If table doesn't exist, store in patient notes instead
    await query(
      `UPDATE patients
       SET notes = COALESCE(notes, '') || $2, updated_at = NOW()
       WHERE id = $1`,
      [patientId, `\n[Intake ${new Date().toISOString()}]: ${JSON.stringify(formData)}`]
    );
  });

  // Update patient record with new medical info
  const updates = {};
  if (formData.allergies) {
    updates.allergies = formData.allergies;
  }
  if (formData.medications) {
    updates.current_medications = formData.medications;
  }
  if (formData.phone) {
    updates.phone = formData.phone;
  }
  if (formData.email) {
    updates.email = formData.email;
  }
  if (formData.emergency_contact_name) {
    updates.emergency_contact_name = formData.emergency_contact_name;
  }
  if (formData.emergency_contact_phone) {
    updates.emergency_contact_phone = formData.emergency_contact_phone;
  }

  if (Object.keys(updates).length > 0) {
    const setClauses = [];
    const values = [patientId];
    let paramIdx = 2;

    for (const [field, value] of Object.entries(updates)) {
      setClauses.push(`${field} = $${paramIdx}`);
      values.push(Array.isArray(value) ? value : value);
      paramIdx++;
    }

    await query(
      `UPDATE patients SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1`,
      values
    );
  }

  // Detect red flags from intake
  const redFlagsDetected = [];
  const redFlagFields = ['weight_loss', 'night_pain', 'bladder_bowel', 'numbness', 'fever'];
  for (const field of redFlagFields) {
    if (formData[field]) {
      redFlagsDetected.push(field);
    }
  }

  if (redFlagsDetected.length > 0) {
    // Store red flags on patient record
    await query(
      `UPDATE patients
       SET red_flags = COALESCE(red_flags, ARRAY[]::text[]) || $2, updated_at = NOW()
       WHERE id = $1`,
      [patientId, redFlagsDetected]
    );
  }

  logger.info('Intake form submitted', {
    patientId,
    redFlagsDetected: redFlagsDetected.length,
  });

  return {
    stored: true,
    redFlagsDetected,
  };
};

/**
 * Submit a signed consent form.
 *
 * @param {string} patientId
 * @param {string} consentType - e.g. 'treatment', 'gdpr', 'imaging'
 * @param {string} signature - Base64 signature or name-based signature
 * @returns {{ stored: boolean, consentType, signedAt }}
 */
export const submitConsent = async (patientId, consentType, signature) => {
  // Verify patient exists
  const patientResult = await query('SELECT id FROM patients WHERE id = $1', [patientId]);

  if (patientResult.rows.length === 0) {
    throw new NotFoundError('Patient', patientId);
  }

  if (!consentType || !signature) {
    throw new BusinessLogicError('Consent type and signature are required');
  }

  // Store consent record
  const signedAt = new Date();

  await query(
    `INSERT INTO patient_consents (patient_id, consent_type, signature, signed_at)
     VALUES ($1, $2, $3, $4)`,
    [patientId, consentType, signature, signedAt]
  ).catch(async () => {
    // If table doesn't exist, store consent in patient metadata
    await query(
      `UPDATE patients
       SET metadata = COALESCE(metadata, '{}'::jsonb) || $2, updated_at = NOW()
       WHERE id = $1`,
      [
        patientId,
        JSON.stringify({
          [`consent_${consentType}`]: {
            signature: '***signed***',
            signedAt: signedAt.toISOString(),
          },
        }),
      ]
    );
  });

  logger.info('Consent submitted', {
    patientId,
    consentType,
    signedAt,
  });

  return {
    stored: true,
    consentType,
    signedAt,
  };
};

/**
 * Get the practitioner's patient queue for today.
 *
 * @param {string} practitionerId
 * @returns {Array<{ position, patientId, patientName, appointmentTime, status, checkedInAt }>}
 */
export const getQueue = async (practitionerId) => {
  const result = await query(
    `SELECT
      a.id as appointment_id,
      a.patient_id,
      p.first_name || ' ' || p.last_name as patient_name,
      a.start_time,
      a.end_time,
      a.status,
      a.checked_in_at,
      a.appointment_type
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     WHERE a.practitioner_id = $1
       AND DATE(a.start_time) = CURRENT_DATE
       AND a.status NOT IN ('cancelled', 'no_show')
     ORDER BY
       CASE a.status
         WHEN 'checked_in' THEN 1
         WHEN 'confirmed' THEN 2
         WHEN 'scheduled' THEN 3
         WHEN 'in_progress' THEN 0
         WHEN 'completed' THEN 4
         ELSE 5
       END,
       a.checked_in_at NULLS LAST,
       a.start_time ASC`,
    [practitionerId]
  );

  return result.rows.map((row, index) => ({
    position: index + 1,
    appointmentId: row.appointment_id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    appointmentTime: row.start_time,
    endTime: row.end_time,
    appointmentType: row.appointment_type,
    status: row.status,
    checkedInAt: row.checked_in_at,
  }));
};

export default {
  checkIn,
  getIntakeForm,
  submitIntakeForm,
  submitConsent,
  getQueue,
};
