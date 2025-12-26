/**
 * FHIR R4 Adapter Service
 * Converts ChiroClickCRM data to/from HL7 FHIR R4 resources
 *
 * Supported Resources:
 * - Patient (R4)
 * - Encounter (R4)
 * - Condition (for diagnoses)
 * - Observation (for measurements)
 *
 * @see https://www.hl7.org/fhir/R4/
 */

import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { decrypt } from '../utils/encryption.js';
import logger from '../utils/logger.js';

// FHIR R4 Constants
const FHIR_VERSION = '4.0.1';
const FHIR_BASE_URL = process.env.FHIR_BASE_URL || 'https://fhir.chiroclickcrm.no';

// Norwegian OIDs
const NORWEGIAN_FNR_SYSTEM = 'urn:oid:2.16.578.1.12.4.1.4.1'; // Norwegian fødselsnummer
const NORWEGIAN_HPR_SYSTEM = 'urn:oid:2.16.578.1.12.4.1.4.4'; // Health Personnel Registry
const ICPC2_SYSTEM = 'urn:oid:2.16.578.1.12.4.1.1.7170'; // ICPC-2
const ICD10_SYSTEM = 'http://hl7.org/fhir/sid/icd-10';

// ============================================================================
// PATIENT RESOURCE
// ============================================================================

/**
 * Convert ChiroClickCRM patient to FHIR R4 Patient resource
 */
export const patientToFHIR = (patient, options = {}) => {
  const { includeIdentifier = false } = options;

  const fhirPatient = {
    resourceType: 'Patient',
    id: patient.id,
    meta: {
      versionId: '1',
      lastUpdated: patient.updated_at || patient.created_at,
      profile: ['http://hl7.no/fhir/StructureDefinition/no-basis-Patient']
    },
    // Text summary
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">
        <p>${patient.first_name} ${patient.last_name}</p>
        <p>DOB: ${patient.date_of_birth}</p>
      </div>`
    },
    // Identifiers
    identifier: [
      {
        use: 'official',
        system: `${FHIR_BASE_URL}/patient`,
        value: patient.id
      }
    ],
    // Active status
    active: patient.status === 'ACTIVE',
    // Name
    name: [
      {
        use: 'official',
        family: patient.last_name,
        given: [patient.first_name]
      }
    ],
    // Gender
    gender: mapGender(patient.gender),
    // Birth date
    birthDate: patient.date_of_birth,
    // Telecom (contact info)
    telecom: [],
    // Address
    address: []
  };

  // Add Norwegian fødselsnummer if requested and available
  if (includeIdentifier && patient.encrypted_personal_number) {
    try {
      const fnr = decrypt(patient.encrypted_personal_number);
      fhirPatient.identifier.push({
        use: 'official',
        system: NORWEGIAN_FNR_SYSTEM,
        value: fnr
      });
    } catch (error) {
      logger.warn('Could not decrypt personal number for FHIR export');
    }
  }

  // Add SolvIt ID
  if (patient.solvit_id) {
    fhirPatient.identifier.push({
      use: 'secondary',
      system: 'https://solvit.no/patient',
      value: patient.solvit_id
    });
  }

  // Add contact information
  if (patient.phone) {
    fhirPatient.telecom.push({
      system: 'phone',
      value: patient.phone,
      use: 'mobile'
    });
  }
  if (patient.email) {
    fhirPatient.telecom.push({
      system: 'email',
      value: patient.email,
      use: 'home'
    });
  }

  // Add address
  if (patient.address) {
    const addr = typeof patient.address === 'string'
      ? JSON.parse(patient.address)
      : patient.address;

    fhirPatient.address.push({
      use: 'home',
      type: 'physical',
      line: [addr.street || addr.line1],
      city: addr.city,
      postalCode: addr.postal_code || addr.postalCode,
      country: addr.country || 'NO'
    });
  }

  // Add general practitioner reference if available
  if (patient.referring_doctor) {
    fhirPatient.generalPractitioner = [{
      display: patient.referring_doctor
    }];
  }

  // Add communication preferences
  fhirPatient.communication = [{
    language: {
      coding: [{
        system: 'urn:ietf:bcp:47',
        code: 'no',
        display: 'Norwegian'
      }]
    },
    preferred: true
  }];

  return fhirPatient;
};

// ============================================================================
// ENCOUNTER RESOURCE
// ============================================================================

/**
 * Convert ChiroClickCRM clinical encounter to FHIR R4 Encounter resource
 */
export const encounterToFHIR = (encounter, patient, practitioner) => {
  const fhirEncounter = {
    resourceType: 'Encounter',
    id: encounter.id,
    meta: {
      versionId: String(encounter.version || 1),
      lastUpdated: encounter.updated_at || encounter.created_at,
      profile: ['http://hl7.no/fhir/StructureDefinition/no-basis-Encounter']
    },
    // Text summary
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">
        <p>Encounter on ${encounter.encounter_date}</p>
        <p>Type: ${encounter.encounter_type}</p>
      </div>`
    },
    // Identifier
    identifier: [{
      system: `${FHIR_BASE_URL}/encounter`,
      value: encounter.id
    }],
    // Status
    status: mapEncounterStatus(encounter),
    // Class (ambulatory)
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory'
    },
    // Type (chiropractic encounter)
    type: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '386053000',
        display: 'Chiropractic visit'
      }],
      text: encounter.encounter_type
    }],
    // Service type
    serviceType: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/service-type',
        code: '65',
        display: 'Chiropractic'
      }]
    },
    // Priority
    priority: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActPriority',
        code: encounter.encounter_type === 'EMERGENCY' ? 'EM' : 'R',
        display: encounter.encounter_type === 'EMERGENCY' ? 'emergency' : 'routine'
      }]
    },
    // Patient reference
    subject: {
      reference: `Patient/${encounter.patient_id}`,
      display: patient ? `${patient.first_name} ${patient.last_name}` : undefined
    },
    // Period
    period: {
      start: encounter.encounter_date,
      end: encounter.duration_minutes
        ? new Date(new Date(encounter.encounter_date).getTime() + encounter.duration_minutes * 60000).toISOString()
        : encounter.encounter_date
    },
    // Length
    length: encounter.duration_minutes ? {
      value: encounter.duration_minutes,
      unit: 'min',
      system: 'http://unitsofmeasure.org',
      code: 'min'
    } : undefined,
    // Reason (chief complaint)
    reasonCode: [],
    // Diagnosis references
    diagnosis: [],
    // Participant (practitioner)
    participant: []
  };

  // Add practitioner
  if (practitioner || encounter.practitioner_id) {
    fhirEncounter.participant.push({
      type: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
          code: 'PPRF',
          display: 'primary performer'
        }]
      }],
      individual: {
        reference: `Practitioner/${encounter.practitioner_id}`,
        display: practitioner ? `${practitioner.first_name} ${practitioner.last_name}` : undefined
      }
    });
  }

  // Add reason (chief complaint)
  if (encounter.subjective?.chief_complaint) {
    fhirEncounter.reasonCode.push({
      text: encounter.subjective.chief_complaint
    });
  }

  // Add diagnoses (ICPC-2 and ICD-10)
  if (encounter.icpc_codes?.length > 0) {
    encounter.icpc_codes.forEach((code, index) => {
      fhirEncounter.diagnosis.push({
        condition: {
          reference: `#condition-${index}`,
          display: code
        },
        use: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/diagnosis-role',
            code: index === 0 ? 'billing' : 'CM',
            display: index === 0 ? 'Billing' : 'Comorbidity'
          }]
        },
        rank: index + 1
      });
    });
  }

  // Add contained Composition for SOAP notes
  fhirEncounter.contained = [
    createSOAPComposition(encounter)
  ];

  return fhirEncounter;
};

/**
 * Create FHIR Composition resource for SOAP notes
 */
const createSOAPComposition = (encounter) => {
  return {
    resourceType: 'Composition',
    id: 'soap-composition',
    status: encounter.signed_at ? 'final' : 'preliminary',
    type: {
      coding: [{
        system: 'http://loinc.org',
        code: '34133-9',
        display: 'Summarization of episode note'
      }]
    },
    date: encounter.encounter_date,
    title: 'Clinical Encounter SOAP Note',
    section: [
      {
        title: 'Subjective',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '61150-9',
            display: 'Subjective narrative'
          }]
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">
            <p><strong>Chief Complaint:</strong> ${encounter.subjective?.chief_complaint || 'Not recorded'}</p>
            <p><strong>History:</strong> ${encounter.subjective?.history || 'Not recorded'}</p>
          </div>`
        }
      },
      {
        title: 'Objective',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '61149-1',
            display: 'Objective narrative'
          }]
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">
            <p><strong>Observation:</strong> ${encounter.objective?.observation || 'Not recorded'}</p>
            <p><strong>Palpation:</strong> ${encounter.objective?.palpation || 'Not recorded'}</p>
            <p><strong>ROM:</strong> ${encounter.objective?.rom || 'Not recorded'}</p>
          </div>`
        }
      },
      {
        title: 'Assessment',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '51848-0',
            display: 'Assessment narrative'
          }]
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">
            <p>${encounter.assessment?.clinical_reasoning || 'Not recorded'}</p>
          </div>`
        }
      },
      {
        title: 'Plan',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '18776-5',
            display: 'Plan of care note'
          }]
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">
            <p><strong>Treatment:</strong> ${encounter.plan?.treatment || 'Not recorded'}</p>
            <p><strong>Follow-up:</strong> ${encounter.plan?.follow_up || 'Not recorded'}</p>
          </div>`
        }
      }
    ]
  };
};

// ============================================================================
// CONDITION RESOURCE (Diagnoses)
// ============================================================================

/**
 * Convert diagnosis codes to FHIR Condition resources
 */
export const diagnosisToFHIR = (diagnosis, patientId, encounterId) => {
  const isICPC = diagnosis.system === 'ICPC2' || diagnosis.code?.match(/^[A-Z]\d{2}$/);

  return {
    resourceType: 'Condition',
    id: uuidv4(),
    meta: {
      profile: ['http://hl7.no/fhir/StructureDefinition/no-basis-Condition']
    },
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: 'active',
        display: 'Active'
      }]
    },
    verificationStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        code: 'confirmed',
        display: 'Confirmed'
      }]
    },
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-category',
        code: 'encounter-diagnosis',
        display: 'Encounter Diagnosis'
      }]
    }],
    code: {
      coding: [{
        system: isICPC ? ICPC2_SYSTEM : ICD10_SYSTEM,
        code: diagnosis.code,
        display: diagnosis.description_no || diagnosis.description
      }],
      text: diagnosis.description_no || diagnosis.description
    },
    subject: {
      reference: `Patient/${patientId}`
    },
    encounter: encounterId ? {
      reference: `Encounter/${encounterId}`
    } : undefined,
    recordedDate: new Date().toISOString()
  };
};

// ============================================================================
// OBSERVATION RESOURCE (Measurements)
// ============================================================================

/**
 * Convert clinical measurement to FHIR Observation
 */
export const measurementToFHIR = (measurement, patientId, encounterId) => {
  const observations = [];

  // VAS Pain Score
  if (measurement.pain_intensity !== null && measurement.pain_intensity !== undefined) {
    observations.push({
      resourceType: 'Observation',
      id: uuidv4(),
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'survey',
          display: 'Survey'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '38208-5',
          display: 'Pain severity - Visual Analog Scale'
        }],
        text: 'VAS Pain Score'
      },
      subject: { reference: `Patient/${patientId}` },
      encounter: encounterId ? { reference: `Encounter/${encounterId}` } : undefined,
      effectiveDateTime: measurement.created_at,
      valueInteger: measurement.pain_intensity,
      interpretation: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: measurement.pain_intensity <= 3 ? 'L' : measurement.pain_intensity <= 6 ? 'N' : 'H',
          display: measurement.pain_intensity <= 3 ? 'Low' : measurement.pain_intensity <= 6 ? 'Normal' : 'High'
        }]
      }]
    });
  }

  // ROM Measurements
  if (measurement.rom_measurements) {
    const rom = typeof measurement.rom_measurements === 'string'
      ? JSON.parse(measurement.rom_measurements)
      : measurement.rom_measurements;

    for (const [region, values] of Object.entries(rom)) {
      for (const [movement, degrees] of Object.entries(values)) {
        observations.push({
          resourceType: 'Observation',
          id: uuidv4(),
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'exam',
              display: 'Exam'
            }]
          }],
          code: {
            coding: [{
              system: 'http://snomed.info/sct',
              code: '364564000',
              display: 'Range of motion finding'
            }],
            text: `${region} ${movement}`
          },
          subject: { reference: `Patient/${patientId}` },
          encounter: encounterId ? { reference: `Encounter/${encounterId}` } : undefined,
          effectiveDateTime: measurement.created_at,
          valueQuantity: {
            value: degrees,
            unit: 'degrees',
            system: 'http://unitsofmeasure.org',
            code: 'deg'
          },
          bodySite: {
            text: region
          }
        });
      }
    }
  }

  // Outcome Measures (OSWESTRY, NDI, etc.)
  if (measurement.outcome_measure_type && measurement.outcome_score !== null) {
    const outcomeCodeMap = {
      'OSWESTRY': { code: '72106-4', display: 'Oswestry Disability Index' },
      'NDI': { code: '72107-2', display: 'Neck Disability Index' },
      'PSFS': { code: '77576-4', display: 'Patient Specific Functional Scale' },
      'EQ5D': { code: '80342-8', display: 'EQ-5D' }
    };

    const outcomeCode = outcomeCodeMap[measurement.outcome_measure_type] || {
      code: '77576-4',
      display: measurement.outcome_measure_type
    };

    observations.push({
      resourceType: 'Observation',
      id: uuidv4(),
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'survey',
          display: 'Survey'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: outcomeCode.code,
          display: outcomeCode.display
        }],
        text: measurement.outcome_measure_type
      },
      subject: { reference: `Patient/${patientId}` },
      encounter: encounterId ? { reference: `Encounter/${encounterId}` } : undefined,
      effectiveDateTime: measurement.created_at,
      valueQuantity: {
        value: measurement.outcome_score,
        unit: '%',
        system: 'http://unitsofmeasure.org',
        code: '%'
      }
    });
  }

  return observations;
};

// ============================================================================
// BUNDLE CREATION
// ============================================================================

/**
 * Create FHIR Bundle for patient export
 */
export const createPatientBundle = async (patientId, options = {}) => {
  try {
    // Get patient
    const patientResult = await query(
      'SELECT * FROM patients WHERE id = $1',
      [patientId]
    );
    if (patientResult.rows.length === 0) {
      throw new Error('Patient not found');
    }
    const patient = patientResult.rows[0];

    // Get encounters
    const encountersResult = await query(
      'SELECT * FROM clinical_encounters WHERE patient_id = $1 ORDER BY encounter_date DESC',
      [patientId]
    );

    // Get measurements
    const measurementsResult = await query(
      'SELECT * FROM clinical_measurements WHERE patient_id = $1 ORDER BY created_at DESC',
      [patientId]
    );

    // Build bundle
    const bundle = {
      resourceType: 'Bundle',
      id: uuidv4(),
      meta: {
        lastUpdated: new Date().toISOString()
      },
      type: 'collection',
      total: 0,
      entry: []
    };

    // Add patient
    bundle.entry.push({
      fullUrl: `${FHIR_BASE_URL}/Patient/${patient.id}`,
      resource: patientToFHIR(patient, options)
    });

    // Add encounters
    for (const encounter of encountersResult.rows) {
      bundle.entry.push({
        fullUrl: `${FHIR_BASE_URL}/Encounter/${encounter.id}`,
        resource: encounterToFHIR(encounter, patient)
      });

      // Add diagnoses for each encounter
      if (encounter.icpc_codes) {
        for (const code of encounter.icpc_codes) {
          const condition = diagnosisToFHIR(
            { code, system: 'ICPC2' },
            patient.id,
            encounter.id
          );
          bundle.entry.push({
            fullUrl: `${FHIR_BASE_URL}/Condition/${condition.id}`,
            resource: condition
          });
        }
      }
    }

    // Add measurements as observations
    for (const measurement of measurementsResult.rows) {
      const observations = measurementToFHIR(measurement, patient.id, measurement.encounter_id);
      for (const obs of observations) {
        bundle.entry.push({
          fullUrl: `${FHIR_BASE_URL}/Observation/${obs.id}`,
          resource: obs
        });
      }
    }

    bundle.total = bundle.entry.length;

    return bundle;

  } catch (error) {
    logger.error('FHIR bundle creation error:', error);
    throw error;
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const mapGender = (gender) => {
  const genderMap = {
    'MALE': 'male',
    'FEMALE': 'female',
    'OTHER': 'other',
    'M': 'male',
    'F': 'female'
  };
  return genderMap[gender?.toUpperCase()] || 'unknown';
};

const mapEncounterStatus = (encounter) => {
  if (encounter.signed_at) return 'finished';
  if (encounter.encounter_date > new Date()) return 'planned';
  return 'in-progress';
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  patientToFHIR,
  encounterToFHIR,
  diagnosisToFHIR,
  measurementToFHIR,
  createPatientBundle,
  FHIR_VERSION,
  FHIR_BASE_URL
};
