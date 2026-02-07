/**
 * FHIR R4 Adapter Service
 * Converts ChiroClickCRM data to HL7 FHIR R4 format for interoperability
 * Supports Norwegian healthcare integration requirements
 */

import logger from '../utils/logger.js';

// FHIR R4 Resource Types used
const FHIR_RESOURCE_TYPES = {
  PATIENT: 'Patient',
  PRACTITIONER: 'Practitioner',
  ENCOUNTER: 'Encounter',
  CONDITION: 'Condition',
  PROCEDURE: 'Procedure',
  OBSERVATION: 'Observation',
  APPOINTMENT: 'Appointment',
  DOCUMENT_REFERENCE: 'DocumentReference',
  BUNDLE: 'Bundle',
};

// Norwegian-specific code systems
const CODE_SYSTEMS = {
  ICD10: 'http://hl7.org/fhir/sid/icd-10',
  ICPC2: 'http://ehelse.no/fhir/CodeSystem/icpc-2', // Norwegian ICPC-2
  FODSELSNUMMER: 'urn:oid:2.16.578.1.12.4.1.4.1', // Norwegian national ID
  HPR: 'urn:oid:2.16.578.1.12.4.1.4.4', // Helsepersonellregisteret
  ORGNR: 'urn:oid:2.16.578.1.12.4.1.4.101', // Norwegian org number
};

/**
 * FHIR Adapter class
 */
class FHIRAdapter {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://api.chiroclickcrm.no/fhir/r4';
    this.version = 'R4';
  }

  /**
   * Convert patient to FHIR Patient resource
   * @param {Object} patient - ChiroClickCRM patient object
   * @returns {Object} FHIR Patient resource
   */
  toFHIRPatient(patient) {
    const resource = {
      resourceType: FHIR_RESOURCE_TYPES.PATIENT,
      id: patient.id,
      meta: {
        versionId: '1',
        lastUpdated: patient.updated_at || new Date().toISOString(),
        profile: ['http://hl7.no/fhir/StructureDefinition/no-basis-Patient'],
      },
      identifier: [],
      active: patient.status === 'ACTIVE',
      name: [
        {
          use: 'official',
          family: patient.last_name,
          given: [patient.first_name],
          text: `${patient.first_name} ${patient.last_name}`,
        },
      ],
      telecom: [],
      gender: this.mapGender(patient.gender),
      birthDate: patient.date_of_birth,
      address: [],
    };

    // Add Norwegian personal ID (fødselsnummer)
    if (patient.fodselsnummer) {
      resource.identifier.push({
        use: 'official',
        system: CODE_SYSTEMS.FODSELSNUMMER,
        value: patient.fodselsnummer,
      });
    }

    // Add internal ID
    resource.identifier.push({
      use: 'usual',
      system: `${this.baseUrl}/patient-id`,
      value: patient.id,
    });

    // Add phone numbers
    if (patient.phone) {
      resource.telecom.push({
        system: 'phone',
        value: patient.phone,
        use: 'home',
      });
    }
    if (patient.mobile) {
      resource.telecom.push({
        system: 'phone',
        value: patient.mobile,
        use: 'mobile',
      });
    }

    // Add email
    if (patient.email) {
      resource.telecom.push({
        system: 'email',
        value: patient.email,
        use: 'home',
      });
    }

    // Add SolvIt identifier
    if (patient.solvit_id) {
      resource.identifier.push({
        use: 'secondary',
        system: `${this.baseUrl}/solvit-id`,
        value: patient.solvit_id,
      });
    }

    // Add address (handle both flat and nested address formats)
    const addr = patient.address;
    if (addr && typeof addr === 'object') {
      resource.address.push({
        use: 'home',
        type: 'physical',
        line: addr.street ? [addr.street] : [],
        city: addr.city,
        postalCode: addr.postal_code || addr.postalCode,
        country: addr.country || 'NO',
      });
    } else if (addr || patient.city || patient.postal_code) {
      resource.address.push({
        use: 'home',
        type: 'physical',
        line: addr ? [addr] : [],
        city: patient.city,
        postalCode: patient.postal_code,
        country: 'NO',
      });
    }

    // Add communication language (Norwegian)
    resource.communication = [
      {
        language: {
          coding: [
            {
              system: 'urn:ietf:bcp:47',
              code: patient.preferred_language || 'no',
              display: 'Norwegian',
            },
          ],
        },
        preferred: true,
      },
    ];

    // Add emergency contact
    if (patient.emergency_contact_name) {
      resource.contact = [
        {
          relationship: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
                  code: 'C',
                  display: 'Emergency Contact',
                },
              ],
            },
          ],
          name: {
            text: patient.emergency_contact_name,
          },
          telecom: patient.emergency_contact_phone
            ? [
                {
                  system: 'phone',
                  value: patient.emergency_contact_phone,
                },
              ]
            : [],
        },
      ];
    }

    return resource;
  }

  /**
   * Convert encounter to FHIR Encounter resource
   * @param {Object} encounter - ChiroClickCRM clinical encounter
   * @param {Object} patient - Associated patient
   * @returns {Object} FHIR Encounter resource
   */
  toFHIREncounter(encounter, patient) {
    return {
      resourceType: FHIR_RESOURCE_TYPES.ENCOUNTER,
      id: encounter.id,
      meta: {
        lastUpdated: encounter.updated_at || new Date().toISOString(),
      },
      status: this.mapEncounterStatus(encounter),
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
              code: '185349003',
              display: 'Encounter for check up',
            },
          ],
          text: encounter.encounter_type || 'Chiropractic consultation',
        },
      ],
      subject: {
        reference: `Patient/${patient.id}`,
        display: `${patient.first_name} ${patient.last_name}`,
      },
      participant: encounter.provider_id
        ? [
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
                reference: `Practitioner/${encounter.provider_id}`,
              },
            },
          ]
        : [],
      period: {
        start: encounter.encounter_date,
      },
      reasonCode: encounter.chief_complaint
        ? [
            {
              text: encounter.chief_complaint,
            },
          ]
        : [],
    };
  }

  /**
   * Convert diagnosis to FHIR Condition resource
   * @param {Object} diagnosis - ChiroClickCRM diagnosis
   * @param {Object} patient - Associated patient
   * @returns {Object} FHIR Condition resource
   */
  toFHIRCondition(diagnosis, patient) {
    const condition = {
      resourceType: FHIR_RESOURCE_TYPES.CONDITION,
      id: diagnosis.id,
      meta: {
        lastUpdated: diagnosis.updated_at || new Date().toISOString(),
      },
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: this.mapConditionStatus(diagnosis.status),
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: 'confirmed',
          },
        ],
      },
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/condition-category',
              code: 'encounter-diagnosis',
              display: 'Encounter Diagnosis',
            },
          ],
        },
      ],
      code: {
        coding: [],
        text: diagnosis.description,
      },
      subject: {
        reference: `Patient/${patient.id}`,
      },
      onsetDateTime: diagnosis.onset_date,
      recordedDate: diagnosis.created_at,
    };

    // Add ICD-10 code
    if (diagnosis.icd10_code) {
      condition.code.coding.push({
        system: CODE_SYSTEMS.ICD10,
        code: diagnosis.icd10_code,
        display: diagnosis.icd10_description,
      });
    }

    // Add ICPC-2 code (Norwegian primary care)
    if (diagnosis.icpc2_code) {
      condition.code.coding.push({
        system: CODE_SYSTEMS.ICPC2,
        code: diagnosis.icpc2_code,
        display: diagnosis.icpc2_description,
      });
    }

    return condition;
  }

  /**
   * Convert treatment to FHIR Procedure resource
   * @param {Object} treatment - ChiroClickCRM treatment
   * @param {Object} patient - Associated patient
   * @returns {Object} FHIR Procedure resource
   */
  toFHIRProcedure(treatment, patient) {
    return {
      resourceType: FHIR_RESOURCE_TYPES.PROCEDURE,
      id: treatment.id,
      meta: {
        lastUpdated: treatment.updated_at || new Date().toISOString(),
      },
      status: 'completed',
      category: {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '386053000',
            display: 'Evaluation procedure',
          },
        ],
      },
      code: {
        coding: treatment.procedure_code
          ? [
              {
                system: 'http://snomed.info/sct',
                code: treatment.procedure_code,
              },
            ]
          : [],
        text: treatment.treatment_type,
      },
      subject: {
        reference: `Patient/${patient.id}`,
      },
      performedDateTime: treatment.treatment_date,
      performer: treatment.provider_id
        ? [
            {
              actor: {
                reference: `Practitioner/${treatment.provider_id}`,
              },
            },
          ]
        : [],
      bodySite: treatment.body_region
        ? [
            {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  display: treatment.body_region,
                },
              ],
              text: treatment.body_region,
            },
          ]
        : [],
      note: treatment.notes
        ? [
            {
              text: treatment.notes,
            },
          ]
        : [],
    };
  }

  /**
   * Convert appointment to FHIR Appointment resource
   * @param {Object} appointment - ChiroClickCRM appointment
   * @param {Object} patient - Associated patient
   * @returns {Object} FHIR Appointment resource
   */
  toFHIRAppointment(appointment, patient) {
    return {
      resourceType: FHIR_RESOURCE_TYPES.APPOINTMENT,
      id: appointment.id,
      meta: {
        lastUpdated: appointment.updated_at || new Date().toISOString(),
      },
      status: this.mapAppointmentStatus(appointment.status),
      appointmentType: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0276',
            code: 'ROUTINE',
            display: 'Routine appointment',
          },
        ],
        text: appointment.appointment_type,
      },
      description: appointment.notes,
      start: `${appointment.appointment_date}T${appointment.start_time}`,
      end: `${appointment.appointment_date}T${appointment.end_time}`,
      participant: [
        {
          actor: {
            reference: `Patient/${patient.id}`,
            display: `${patient.first_name} ${patient.last_name}`,
          },
          status: 'accepted',
        },
      ],
    };
  }

  /**
   * Create a FHIR Bundle for patient export
   * @param {Object} patientData - Complete patient data including encounters, diagnoses, etc.
   * @returns {Object} FHIR Bundle resource
   */
  createPatientBundle(patientData) {
    const { patient, encounters, diagnoses, treatments, appointments } = patientData;
    const entries = [];

    // Add patient
    entries.push({
      fullUrl: `${this.baseUrl}/Patient/${patient.id}`,
      resource: this.toFHIRPatient(patient),
    });

    // Add encounters
    if (encounters) {
      encounters.forEach((encounter) => {
        entries.push({
          fullUrl: `${this.baseUrl}/Encounter/${encounter.id}`,
          resource: this.toFHIREncounter(encounter, patient),
        });
      });
    }

    // Add diagnoses/conditions
    if (diagnoses) {
      diagnoses.forEach((diagnosis) => {
        entries.push({
          fullUrl: `${this.baseUrl}/Condition/${diagnosis.id}`,
          resource: this.toFHIRCondition(diagnosis, patient),
        });
      });
    }

    // Add treatments/procedures
    if (treatments) {
      treatments.forEach((treatment) => {
        entries.push({
          fullUrl: `${this.baseUrl}/Procedure/${treatment.id}`,
          resource: this.toFHIRProcedure(treatment, patient),
        });
      });
    }

    // Add appointments
    if (appointments) {
      appointments.forEach((appointment) => {
        entries.push({
          fullUrl: `${this.baseUrl}/Appointment/${appointment.id}`,
          resource: this.toFHIRAppointment(appointment, patient),
        });
      });
    }

    return {
      resourceType: FHIR_RESOURCE_TYPES.BUNDLE,
      id: `bundle-${patient.id}-${Date.now()}`,
      meta: {
        lastUpdated: new Date().toISOString(),
      },
      type: 'document',
      timestamp: new Date().toISOString(),
      total: entries.length,
      entry: entries,
    };
  }

  /**
   * Validate FHIR resource against profile
   * @param {Object} resource - FHIR resource to validate
   * @returns {Object} Validation result
   */
  async validateResource(resource) {
    const issues = [];

    // Basic structural validation
    if (!resource.resourceType) {
      issues.push({
        severity: 'error',
        code: 'structure',
        diagnostics: 'Resource must have a resourceType',
      });
    }

    if (!resource.id) {
      issues.push({
        severity: 'warning',
        code: 'informational',
        diagnostics: 'Resource should have an id',
      });
    }

    // Resource-specific validation
    if (resource.resourceType === 'Patient') {
      if (!resource.name || resource.name.length === 0) {
        issues.push({
          severity: 'error',
          code: 'required',
          diagnostics: 'Patient must have at least one name',
        });
      }
    }

    return {
      resourceType: 'OperationOutcome',
      issue: issues,
      valid: issues.filter((i) => i.severity === 'error').length === 0,
    };
  }

  // ========== Helper Methods ==========

  mapGender(gender) {
    const genderMap = {
      M: 'male',
      F: 'female',
      MALE: 'male',
      FEMALE: 'female',
      OTHER: 'other',
      UNKNOWN: 'unknown',
    };
    return genderMap[gender?.toUpperCase()] || 'unknown';
  }

  mapEncounterStatus(encounter) {
    if (encounter.is_locked) return 'finished';
    if (encounter.encounter_date > new Date().toISOString().split('T')[0]) return 'planned';
    return 'in-progress';
  }

  mapConditionStatus(status) {
    const statusMap = {
      ACTIVE: 'active',
      RESOLVED: 'resolved',
      INACTIVE: 'inactive',
      RECURRENCE: 'recurrence',
    };
    return statusMap[status] || 'active';
  }

  mapAppointmentStatus(status) {
    const statusMap = {
      SCHEDULED: 'booked',
      CONFIRMED: 'booked',
      ARRIVED: 'arrived',
      COMPLETED: 'fulfilled',
      CANCELLED: 'cancelled',
      NO_SHOW: 'noshow',
    };
    return statusMap[status] || 'proposed';
  }

  // ========== Convenience Wrappers (test-compatible API) ==========

  /**
   * Convert patient to FHIR (convenience wrapper)
   */
  patientToFHIR(patient) {
    return this.toFHIRPatient(patient);
  }

  /**
   * Convert encounter to FHIR (convenience wrapper with flexible patient arg)
   */
  encounterToFHIR(encounter, patient) {
    // The test passes patient as { first_name, last_name } without id
    // Use encounter.patient_id for subject reference
    const fhir = {
      resourceType: FHIR_RESOURCE_TYPES.ENCOUNTER,
      id: encounter.id,
      meta: {
        lastUpdated: encounter.updated_at || new Date().toISOString(),
      },
      status: encounter.signed_at ? 'finished' : 'in-progress',
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
              code: '185349003',
              display: 'Encounter for check up',
            },
          ],
          text: encounter.encounter_type || 'Chiropractic consultation',
        },
      ],
      subject: {
        reference: `Patient/${encounter.patient_id || patient?.id}`,
        display: patient ? `${patient.first_name} ${patient.last_name}` : undefined,
      },
      participant: encounter.practitioner_id
        ? [
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
              },
            },
          ]
        : [],
      period: {
        start: encounter.encounter_date,
      },
      length: encounter.duration_minutes
        ? {
            value: encounter.duration_minutes,
            unit: 'min',
            system: 'http://unitsofmeasure.org',
            code: 'min',
          }
        : undefined,
      reasonCode: [],
      diagnosis: [],
      contained: [],
    };

    // Chief complaint from subjective
    const chiefComplaint = encounter.subjective?.chief_complaint || encounter.chief_complaint;
    if (chiefComplaint) {
      fhir.reasonCode.push({ text: chiefComplaint });
    }

    // ICPC codes as diagnosis references
    if (encounter.icpc_codes?.length) {
      fhir.diagnosis = encounter.icpc_codes.map((code, i) => ({
        condition: { reference: `#condition-${code}` },
        rank: i + 1,
      }));
    }

    // SOAP sections as contained Composition
    if (encounter.subjective || encounter.objective || encounter.assessment || encounter.plan) {
      const sections = [];
      if (encounter.subjective)
        sections.push({ title: 'Subjective', text: { div: JSON.stringify(encounter.subjective) } });
      if (encounter.objective)
        sections.push({ title: 'Objective', text: { div: JSON.stringify(encounter.objective) } });
      if (encounter.assessment)
        sections.push({ title: 'Assessment', text: { div: JSON.stringify(encounter.assessment) } });
      if (encounter.plan)
        sections.push({ title: 'Plan', text: { div: JSON.stringify(encounter.plan) } });
      fhir.contained.push({
        resourceType: 'Composition',
        id: `soap-${encounter.id}`,
        status: encounter.signed_at ? 'final' : 'preliminary',
        type: { text: 'SOAP Note' },
        section: sections,
      });
    }

    return fhir;
  }

  /**
   * Convert diagnosis to FHIR Condition (convenience wrapper accepting IDs)
   */
  diagnosisToFHIR(diagnosis, patientId, encounterId) {
    const codeSystem =
      diagnosis.system === 'ICD10'
        ? CODE_SYSTEMS.ICD10
        : diagnosis.system === 'ICPC2'
          ? CODE_SYSTEMS.ICPC2
          : CODE_SYSTEMS.ICPC2;

    const condition = {
      resourceType: FHIR_RESOURCE_TYPES.CONDITION,
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: 'active',
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: 'confirmed',
          },
        ],
      },
      code: {
        coding: [
          {
            system: codeSystem,
            code: diagnosis.code,
            display: diagnosis.description_no || diagnosis.description,
          },
        ],
        text: diagnosis.description_no || diagnosis.description,
      },
      subject: {
        reference: `Patient/${patientId}`,
      },
    };

    if (encounterId) {
      condition.encounter = { reference: `Encounter/${encounterId}` };
    }

    return condition;
  }

  /**
   * Convert clinical measurements to FHIR Observation resources
   */
  measurementToFHIR(measurement, patientId, encounterId) {
    const observations = [];

    // VAS pain score
    if (measurement.pain_intensity != null) {
      const obs = {
        resourceType: 'Observation',
        status: 'final',
        code: {
          coding: [
            { system: 'http://snomed.info/sct', code: '225908003', display: 'Pain intensity' },
          ],
          text: 'VAS Pain Score',
        },
        subject: { reference: `Patient/${patientId}` },
        effectiveDateTime: measurement.created_at,
        valueInteger: measurement.pain_intensity,
        interpretation: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: measurement.pain_intensity >= 4 ? 'H' : 'N',
                display: measurement.pain_intensity >= 4 ? 'High' : 'Normal',
              },
            ],
          },
        ],
      };
      if (encounterId) obs.encounter = { reference: `Encounter/${encounterId}` };
      observations.push(obs);
    }

    // ROM measurements
    if (measurement.rom_measurements) {
      for (const [region, values] of Object.entries(measurement.rom_measurements)) {
        for (const [movement, degrees] of Object.entries(values)) {
          const obs = {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [
                { system: 'http://snomed.info/sct', code: '364564000', display: 'Range of motion' },
              ],
              text: `${region} ${movement}`,
            },
            subject: { reference: `Patient/${patientId}` },
            effectiveDateTime: measurement.created_at,
            valueQuantity: {
              value: degrees,
              unit: 'degrees',
              system: 'http://unitsofmeasure.org',
              code: 'deg',
            },
          };
          if (encounterId) obs.encounter = { reference: `Encounter/${encounterId}` };
          observations.push(obs);
        }
      }
    }

    // Outcome measures (NDI, ODI, etc.)
    if (measurement.outcome_measure_type && measurement.outcome_score != null) {
      const obs = {
        resourceType: 'Observation',
        status: 'final',
        code: {
          text: measurement.outcome_measure_type,
        },
        subject: { reference: `Patient/${patientId}` },
        effectiveDateTime: measurement.created_at,
        valueQuantity: {
          value: measurement.outcome_score,
          unit: '%',
          system: 'http://unitsofmeasure.org',
          code: '%',
        },
      };
      if (encounterId) obs.encounter = { reference: `Encounter/${encounterId}` };
      observations.push(obs);
    }

    return observations;
  }
}

// Constants
FHIRAdapter.prototype.FHIR_VERSION = '4.0.1';
Object.defineProperty(FHIRAdapter.prototype, 'FHIR_BASE_URL', {
  get() {
    return this.baseUrl;
  },
  enumerable: true,
});

// Export singleton instance
export const fhirAdapter = new FHIRAdapter();

export default fhirAdapter;
