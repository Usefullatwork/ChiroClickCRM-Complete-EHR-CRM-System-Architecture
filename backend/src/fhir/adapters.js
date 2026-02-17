/**
 * FHIR R4 Adapters for ChiroClickCRM
 * Converts internal data structures to/from FHIR R4 standard
 *
 * Norway-specific:
 * - Uses Norwegian OIDs for identifiers
 * - ICPC-2 coding (Norwegian primary care)
 * - Norwegian address format
 *
 * FHIR Resources Implemented:
 * - Patient
 * - Encounter
 * - Observation
 * - Composition (for SOAP notes)
 * - Practitioner
 */

import { getICPC2Description as getICPC2Desc } from '../data/icpc2-codes.js';
import logger from '../utils/logger.js';

/**
 * Norwegian OID (Object Identifiers) for healthcare
 */
const NORWEGIAN_OIDS = {
  FODSELSNUMMER: 'urn:oid:2.16.578.1.12.4.1.4.1', // Norwegian national ID
  HPR_NUMMER: 'urn:oid:2.16.578.1.12.4.1.4.4', // Health Personnel Register
  ICPC2: 'urn:oid:2.16.578.1.12.4.1.1.7170', // ICPC-2 codes
  ICD10: 'urn:oid:2.16.578.1.12.4.1.1.7110', // ICD-10 codes
  HER_ID: 'urn:oid:2.16.578.1.12.4.1.2', // Health Enterprise Register
  ORGANIZATION_NUMBER: 'urn:oid:2.16.578.1.12.4.1.4.101', // Norwegian org number
};

/**
 * Convert internal Patient to FHIR Patient resource
 */
export const patientToFHIR = (patient) => {
  const fhirPatient = {
    resourceType: 'Patient',
    id: patient.id,
    meta: {
      versionId: patient.version || '1',
      lastUpdated: patient.updated_at || patient.created_at,
    },

    // Norwegian national ID (fødselsnummer)
    identifier: [],

    // Name
    name: [
      {
        use: 'official',
        family: patient.last_name,
        given: patient.first_name ? [patient.first_name] : [],
      },
    ],

    // Contact details
    telecom: [],

    // Gender
    gender: patient.gender === 'M' ? 'male' : patient.gender === 'F' ? 'female' : 'other',

    // Birth date (extracted from fødselsnummer or stored separately)
    birthDate:
      patient.birth_date || extractBirthDateFromFodselsnummer(patient.fodselsnummer_encrypted),

    // Address
    address: [],

    // Active status
    active: patient.is_active !== false,

    // Communication (preferred language)
    communication: [],
  };

  // Add fødselsnummer if available (encrypted in DB, decrypted for FHIR export)
  if (patient.fodselsnummer_decrypted) {
    fhirPatient.identifier.push({
      use: 'official',
      system: NORWEGIAN_OIDS.FODSELSNUMMER,
      value: patient.fodselsnummer_decrypted,
    });
  }

  // Add internal ID
  fhirPatient.identifier.push({
    use: 'usual',
    system: 'urn:chiroclickcrm:patient-id',
    value: patient.id,
  });

  // Phone
  if (patient.phone) {
    fhirPatient.telecom.push({
      system: 'phone',
      value: patient.phone,
      use: 'mobile',
    });
  }

  // Email
  if (patient.email) {
    fhirPatient.telecom.push({
      system: 'email',
      value: patient.email,
    });
  }

  // Address
  if (patient.address || patient.city || patient.postal_code) {
    fhirPatient.address.push({
      use: 'home',
      type: 'both',
      line: patient.address ? [patient.address] : [],
      city: patient.city,
      postalCode: patient.postal_code,
      country: 'NO', // Norway
    });
  }

  // Language
  if (patient.preferred_language) {
    fhirPatient.communication.push({
      language: {
        coding: [
          {
            system: 'urn:ietf:bcp:47',
            code: patient.preferred_language, // 'no', 'nn', 'en'
          },
        ],
      },
      preferred: true,
    });
  }

  return fhirPatient;
};

/**
 * Convert FHIR Patient to internal format
 */
export const patientFromFHIR = (fhirPatient) => {
  const patient = {
    id: fhirPatient.id,
    first_name: fhirPatient.name?.[0]?.given?.[0] || '',
    last_name: fhirPatient.name?.[0]?.family || '',
    birth_date: fhirPatient.birthDate,
    gender: fhirPatient.gender === 'male' ? 'M' : fhirPatient.gender === 'female' ? 'F' : 'O',
    is_active: fhirPatient.active !== false,
  };

  // Extract fødselsnummer
  const fnrIdentifier = fhirPatient.identifier?.find(
    (id) => id.system === NORWEGIAN_OIDS.FODSELSNUMMER
  );
  if (fnrIdentifier) {
    patient.fodselsnummer = fnrIdentifier.value; // Will be encrypted on save
  }

  // Extract contact info
  const phone = fhirPatient.telecom?.find((t) => t.system === 'phone');
  if (phone) {
    patient.phone = phone.value;
  }

  const email = fhirPatient.telecom?.find((t) => t.system === 'email');
  if (email) {
    patient.email = email.value;
  }

  // Extract address
  if (fhirPatient.address?.[0]) {
    const addr = fhirPatient.address[0];
    patient.address = addr.line?.[0];
    patient.city = addr.city;
    patient.postal_code = addr.postalCode;
  }

  // Extract language
  if (fhirPatient.communication?.[0]?.language?.coding?.[0]) {
    patient.preferred_language = fhirPatient.communication[0].language.coding[0].code;
  }

  return patient;
};

/**
 * Convert internal Encounter to FHIR Encounter resource
 */
export const encounterToFHIR = (encounter, patient, practitioner) => ({
  resourceType: 'Encounter',
  id: encounter.id,
  meta: {
    lastUpdated: encounter.updated_at || encounter.created_at,
  },

  status: encounter.is_signed ? 'finished' : 'in-progress',

  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
    display: 'ambulatory',
  },

  type: [
    {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '185347001',
          display: 'Encounter for problem (procedure)',
        },
      ],
    },
  ],

  subject: {
    reference: `Patient/${encounter.patient_id}`,
    display: patient ? `${patient.first_name} ${patient.last_name}` : undefined,
  },

  participant: [
    {
      type: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
              code: 'PPRF',
              display: 'primary performer',
            },
          ],
        },
      ],
      individual: {
        reference: `Practitioner/${encounter.practitioner_id}`,
        display: practitioner?.name,
      },
    },
  ],

  period: {
    start: encounter.encounter_date,
    end: encounter.encounter_date, // Same day for chiropractic visits
  },

  reasonCode:
    encounter.icpc_codes?.map((code) => ({
      coding: [
        {
          system: NORWEGIAN_OIDS.ICPC2,
          code: code,
          display: getICPC2Description(code),
        },
      ],
    })) || [],

  // Link to SOAP notes (Composition resource)
  contained: encounter.subjective ? [compositionToFHIR(encounter)] : [],
});

/**
 * Convert SOAP notes to FHIR Composition resource
 */
export const compositionToFHIR = (encounter) => ({
  resourceType: 'Composition',
  id: `${encounter.id}-notes`,
  status: encounter.is_signed ? 'final' : 'preliminary',
  type: {
    coding: [
      {
        system: 'http://loinc.org',
        code: '11506-3',
        display: 'Progress note',
      },
    ],
  },
  subject: {
    reference: `Patient/${encounter.patient_id}`,
  },
  date: encounter.encounter_date,
  author: [
    {
      reference: `Practitioner/${encounter.practitioner_id}`,
    },
  ],
  title: 'Chiropractic SOAP Note',

  // SOAP sections
  section: [
    {
      title: 'Subjective',
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '61150-9',
            display: 'Subjective',
          },
        ],
      },
      text: {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml">${escapeHtml(encounter.subjective)}</div>`,
      },
    },
    {
      title: 'Objective',
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '61149-1',
            display: 'Objective',
          },
        ],
      },
      text: {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml">${escapeHtml(encounter.objective)}</div>`,
      },
    },
    {
      title: 'Assessment',
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '51848-0',
            display: 'Assessment',
          },
        ],
      },
      text: {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml">${escapeHtml(encounter.assessment)}</div>`,
      },
    },
    {
      title: 'Plan',
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '18776-5',
            display: 'Plan of care',
          },
        ],
      },
      text: {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml">${escapeHtml(encounter.plan)}</div>`,
      },
    },
  ],
});

/**
 * Convert internal Practitioner to FHIR Practitioner resource
 */
export const practitionerToFHIR = (practitioner) => ({
  resourceType: 'Practitioner',
  id: practitioner.id,
  meta: {
    lastUpdated: practitioner.updated_at || practitioner.created_at,
  },

  identifier: [
    {
      use: 'official',
      system: NORWEGIAN_OIDS.HPR_NUMMER,
      value: practitioner.hpr_nummer, // Health Personnel Register number
    },
    {
      use: 'usual',
      system: 'urn:chiroclickcrm:practitioner-id',
      value: practitioner.id,
    },
  ],

  active: practitioner.is_active !== false,

  name: [
    {
      use: 'official',
      text: practitioner.name,
      family: practitioner.last_name,
      given: practitioner.first_name ? [practitioner.first_name] : [],
    },
  ],

  telecom: [
    practitioner.phone
      ? {
          system: 'phone',
          value: practitioner.phone,
        }
      : null,
    practitioner.email
      ? {
          system: 'email',
          value: practitioner.email,
        }
      : null,
  ].filter(Boolean),

  qualification: [
    {
      code: {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '3842006',
            display: 'Chiropractor',
          },
        ],
      },
    },
  ],
});

/**
 * Helper: Extract birth date from Norwegian fødselsnummer
 * Format: DDMMYYXXXXX
 */
const extractBirthDateFromFodselsnummer = (fnr) => {
  if (!fnr || fnr.length !== 11) {
    return null;
  }

  try {
    const day = fnr.substring(0, 2);
    const month = fnr.substring(2, 4);
    let year = fnr.substring(4, 6);

    // Determine century (simplified - full logic is more complex)
    const individnummer = parseInt(fnr.substring(6, 9));
    if (individnummer < 500) {
      year = `19${year}`;
    } else if (individnummer >= 500 && individnummer < 750) {
      year = `20${year}`;
    } else {
      year = `19${year}`; // Fallback
    }

    return `${year}-${month}-${day}`;
  } catch (error) {
    logger.error('Error extracting birth date from fødselsnummer:', error);
    return null;
  }
};

/**
 * Helper: Get ICPC-2 description
 * Now loads from comprehensive ICPC-2 codes database (resolved TODO)
 */
const getICPC2Description = (code) => getICPC2Desc(code) || code;

/**
 * Helper: Escape HTML for FHIR narrative
 */
const escapeHtml = (text) => {
  if (!text) {
    return '';
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>');
};

/**
 * Create FHIR Bundle for multiple resources
 */
export const createBundle = (resources, type = 'collection') => ({
  resourceType: 'Bundle',
  type: type, // 'collection', 'searchset', 'transaction', etc.
  timestamp: new Date().toISOString(),
  total: resources.length,
  entry: resources.map((resource) => ({
    fullUrl: `${resource.resourceType}/${resource.id}`,
    resource: resource,
  })),
});

/**
 * Validate FHIR resource (basic validation)
 */
export const validateFHIRResource = (resource) => {
  const errors = [];

  if (!resource.resourceType) {
    errors.push('Missing resourceType');
  }

  if (!resource.id) {
    errors.push('Missing id');
  }

  // Type-specific validation
  if (resource.resourceType === 'Patient') {
    if (!resource.name || resource.name.length === 0) {
      errors.push('Patient must have at least one name');
    }
  }

  if (resource.resourceType === 'Encounter') {
    if (!resource.subject) {
      errors.push('Encounter must have a subject (patient)');
    }
    if (!resource.status) {
      errors.push('Encounter must have a status');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export default {
  patientToFHIR,
  patientFromFHIR,
  encounterToFHIR,
  compositionToFHIR,
  practitionerToFHIR,
  createBundle,
  validateFHIRResource,
  NORWEGIAN_OIDS,
};
