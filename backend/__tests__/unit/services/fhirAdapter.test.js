/**
 * Unit Tests for FHIR R4 Adapter Service
 * Tests toFHIR* converters, createPatientBundle, validateResource, and helper mappers
 */

import { jest } from '@jest/globals';

const { fhirAdapter } = await import('../../../../packages/fhir-adapter/fhirAdapter.js');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const basePatient = {
  id: 'pat-001',
  first_name: 'Kari',
  last_name: 'Hansen',
  date_of_birth: '1990-05-20',
  gender: 'F',
  status: 'ACTIVE',
  phone: '+4798765432',
  mobile: '+4799887766',
  email: 'kari@example.no',
  fodselsnummer: '20059012345',
  solvit_id: 'SOL-999',
  address: {
    street: 'Kongens gate 5',
    city: 'Bergen',
    postal_code: '5003',
    country: 'NO',
  },
  preferred_language: 'no',
  emergency_contact_name: 'Per Hansen',
  emergency_contact_phone: '+4791234567',
  updated_at: '2025-01-10T08:00:00Z',
  created_at: '2024-06-01T10:00:00Z',
};

const baseEncounter = {
  id: 'enc-001',
  encounter_date: '2025-01-15',
  encounter_type: 'Initial consultation',
  provider_id: 'prov-001',
  chief_complaint: 'Lower back pain',
  is_locked: false,
  updated_at: '2025-01-15T12:00:00Z',
};

const baseDiagnosis = {
  id: 'diag-001',
  description: 'Lumbar disc herniation',
  icd10_code: 'M51.1',
  icd10_description: 'Lumbar and other intervertebral disc disorders with radiculopathy',
  icpc2_code: 'L86',
  icpc2_description: 'Rygg syndrom med utstråling',
  status: 'ACTIVE',
  onset_date: '2025-01-10',
  created_at: '2025-01-15T09:00:00Z',
  updated_at: '2025-01-15T12:00:00Z',
};

const baseTreatment = {
  id: 'treat-001',
  treatment_type: 'Spinal manipulation',
  procedure_code: '44608003',
  body_region: 'Lumbar spine',
  treatment_date: '2025-01-15',
  provider_id: 'prov-001',
  notes: 'Applied HVLA L4-L5 left side',
  updated_at: '2025-01-15T12:30:00Z',
};

const baseAppointment = {
  id: 'appt-001',
  appointment_date: '2025-01-20',
  start_time: '10:00',
  end_time: '10:30',
  appointment_type: 'Follow-up',
  status: 'SCHEDULED',
  notes: 'Re-evaluation lumbar spine',
  updated_at: '2025-01-18T08:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FHIRAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Constructor / constants
  // =========================================================================

  describe('constructor and constants', () => {
    it('should expose FHIR version 4.0.1', () => {
      expect(fhirAdapter.FHIR_VERSION).toBe('4.0.1');
    });

    it('should have a default baseUrl', () => {
      expect(fhirAdapter.FHIR_BASE_URL).toBe('https://api.chiroclickehr.no/fhir/r4');
    });

    it('should expose version R4', () => {
      expect(fhirAdapter.version).toBe('R4');
    });
  });

  // =========================================================================
  // toFHIRPatient
  // =========================================================================

  describe('toFHIRPatient', () => {
    it('should set resourceType to Patient', () => {
      const result = fhirAdapter.toFHIRPatient(basePatient);
      expect(result.resourceType).toBe('Patient');
    });

    it('should set active true when status is ACTIVE', () => {
      const result = fhirAdapter.toFHIRPatient(basePatient);
      expect(result.active).toBe(true);
    });

    it('should set active false when status is not ACTIVE', () => {
      const result = fhirAdapter.toFHIRPatient({ ...basePatient, status: 'INACTIVE' });
      expect(result.active).toBe(false);
    });

    it('should include fodselsnummer identifier with correct system OID', () => {
      const result = fhirAdapter.toFHIRPatient(basePatient);
      const fnrId = result.identifier.find((i) => i.system === 'urn:oid:2.16.578.1.12.4.1.4.1');
      expect(fnrId).toBeDefined();
      expect(fnrId.value).toBe('20059012345');
      expect(fnrId.use).toBe('official');
    });

    it('should include internal patient id identifier', () => {
      const result = fhirAdapter.toFHIRPatient(basePatient);
      const internalId = result.identifier.find((i) => i.use === 'usual');
      expect(internalId).toBeDefined();
      expect(internalId.value).toBe('pat-001');
    });

    it('should include phone, mobile, and email in telecom', () => {
      const result = fhirAdapter.toFHIRPatient(basePatient);
      expect(result.telecom).toHaveLength(3);
      const phone = result.telecom.find((t) => t.use === 'home' && t.system === 'phone');
      const mobile = result.telecom.find((t) => t.use === 'mobile');
      const email = result.telecom.find((t) => t.system === 'email');
      expect(phone.value).toBe('+4798765432');
      expect(mobile.value).toBe('+4799887766');
      expect(email.value).toBe('kari@example.no');
    });

    it('should omit telecom entries when fields are missing', () => {
      const result = fhirAdapter.toFHIRPatient({
        ...basePatient,
        phone: null,
        mobile: undefined,
        email: '',
      });
      expect(result.telecom).toHaveLength(0);
    });

    it('should include SolvIt identifier when present', () => {
      const result = fhirAdapter.toFHIRPatient(basePatient);
      const solvit = result.identifier.find((i) => i.use === 'secondary');
      expect(solvit).toBeDefined();
      expect(solvit.value).toBe('SOL-999');
    });

    it('should handle nested address object', () => {
      const result = fhirAdapter.toFHIRPatient(basePatient);
      expect(result.address).toHaveLength(1);
      expect(result.address[0].line).toEqual(['Kongens gate 5']);
      expect(result.address[0].city).toBe('Bergen');
      expect(result.address[0].postalCode).toBe('5003');
    });

    it('should handle flat address string with city/postal_code', () => {
      const patient = {
        ...basePatient,
        address: 'Storgata 10',
        city: 'Trondheim',
        postal_code: '7010',
      };
      const result = fhirAdapter.toFHIRPatient(patient);
      expect(result.address[0].line).toEqual(['Storgata 10']);
      expect(result.address[0].city).toBe('Trondheim');
      expect(result.address[0].postalCode).toBe('7010');
      expect(result.address[0].country).toBe('NO');
    });

    it('should include emergency contact when present', () => {
      const result = fhirAdapter.toFHIRPatient(basePatient);
      expect(result.contact).toHaveLength(1);
      expect(result.contact[0].name.text).toBe('Per Hansen');
      expect(result.contact[0].telecom[0].value).toBe('+4791234567');
    });

    it('should omit emergency contact when not provided', () => {
      const patient = { ...basePatient, emergency_contact_name: null };
      const result = fhirAdapter.toFHIRPatient(patient);
      expect(result.contact).toBeUndefined();
    });

    it('should include Norwegian profile in meta', () => {
      const result = fhirAdapter.toFHIRPatient(basePatient);
      expect(result.meta.profile).toContain(
        'http://hl7.no/fhir/StructureDefinition/no-basis-Patient'
      );
      expect(result.meta.lastUpdated).toBe('2025-01-10T08:00:00Z');
    });

    it('should set communication language from preferred_language', () => {
      const result = fhirAdapter.toFHIRPatient(basePatient);
      expect(result.communication[0].language.coding[0].code).toBe('no');
      expect(result.communication[0].preferred).toBe(true);
    });
  });

  // =========================================================================
  // mapGender
  // =========================================================================

  describe('mapGender', () => {
    it.each([
      ['M', 'male'],
      ['F', 'female'],
      ['MALE', 'male'],
      ['FEMALE', 'female'],
      ['OTHER', 'other'],
      ['UNKNOWN', 'unknown'],
    ])('should map %s to %s', (input, expected) => {
      expect(fhirAdapter.mapGender(input)).toBe(expected);
    });

    it('should return unknown for null/undefined', () => {
      expect(fhirAdapter.mapGender(null)).toBe('unknown');
      expect(fhirAdapter.mapGender(undefined)).toBe('unknown');
    });

    it('should return unknown for unrecognized value', () => {
      expect(fhirAdapter.mapGender('X')).toBe('unknown');
    });
  });

  // =========================================================================
  // toFHIREncounter
  // =========================================================================

  describe('toFHIREncounter', () => {
    it('should set resourceType to Encounter', () => {
      const result = fhirAdapter.toFHIREncounter(baseEncounter, basePatient);
      expect(result.resourceType).toBe('Encounter');
    });

    it('should reference patient in subject', () => {
      const result = fhirAdapter.toFHIREncounter(baseEncounter, basePatient);
      expect(result.subject.reference).toBe('Patient/pat-001');
      expect(result.subject.display).toBe('Kari Hansen');
    });

    it('should include encounter type text', () => {
      const result = fhirAdapter.toFHIREncounter(baseEncounter, basePatient);
      expect(result.type[0].text).toBe('Initial consultation');
    });

    it('should default encounter type to Chiropractic consultation', () => {
      const enc = { ...baseEncounter, encounter_type: undefined };
      const result = fhirAdapter.toFHIREncounter(enc, basePatient);
      expect(result.type[0].text).toBe('Chiropractic consultation');
    });

    it('should include participant when provider_id is present', () => {
      const result = fhirAdapter.toFHIREncounter(baseEncounter, basePatient);
      expect(result.participant).toHaveLength(1);
      expect(result.participant[0].individual.reference).toBe('Practitioner/prov-001');
    });

    it('should have empty participant when no provider_id', () => {
      const enc = { ...baseEncounter, provider_id: null };
      const result = fhirAdapter.toFHIREncounter(enc, basePatient);
      expect(result.participant).toEqual([]);
    });

    it('should include chief_complaint in reasonCode', () => {
      const result = fhirAdapter.toFHIREncounter(baseEncounter, basePatient);
      expect(result.reasonCode).toHaveLength(1);
      expect(result.reasonCode[0].text).toBe('Lower back pain');
    });

    it('should have empty reasonCode when no chief_complaint', () => {
      const enc = { ...baseEncounter, chief_complaint: null };
      const result = fhirAdapter.toFHIREncounter(enc, basePatient);
      expect(result.reasonCode).toEqual([]);
    });
  });

  // =========================================================================
  // mapEncounterStatus
  // =========================================================================

  describe('mapEncounterStatus', () => {
    it('should return finished when encounter is locked', () => {
      expect(fhirAdapter.mapEncounterStatus({ is_locked: true })).toBe('finished');
    });

    it('should return planned for future dates', () => {
      const futureDate = '2099-12-31';
      expect(fhirAdapter.mapEncounterStatus({ is_locked: false, encounter_date: futureDate })).toBe(
        'planned'
      );
    });

    it('should return in-progress for past unlocked encounters', () => {
      expect(
        fhirAdapter.mapEncounterStatus({ is_locked: false, encounter_date: '2020-01-01' })
      ).toBe('in-progress');
    });
  });

  // =========================================================================
  // toFHIRCondition
  // =========================================================================

  describe('toFHIRCondition', () => {
    it('should set resourceType to Condition', () => {
      const result = fhirAdapter.toFHIRCondition(baseDiagnosis, basePatient);
      expect(result.resourceType).toBe('Condition');
    });

    it('should reference patient in subject', () => {
      const result = fhirAdapter.toFHIRCondition(baseDiagnosis, basePatient);
      expect(result.subject.reference).toBe('Patient/pat-001');
    });

    it('should include ICD-10 coding', () => {
      const result = fhirAdapter.toFHIRCondition(baseDiagnosis, basePatient);
      const icd10 = result.code.coding.find((c) => c.system === 'http://hl7.org/fhir/sid/icd-10');
      expect(icd10).toBeDefined();
      expect(icd10.code).toBe('M51.1');
    });

    it('should include ICPC-2 coding', () => {
      const result = fhirAdapter.toFHIRCondition(baseDiagnosis, basePatient);
      const icpc2 = result.code.coding.find((c) => c.system.includes('icpc'));
      expect(icpc2).toBeDefined();
      expect(icpc2.code).toBe('L86');
    });

    it('should map clinical status from diagnosis status', () => {
      const result = fhirAdapter.toFHIRCondition(baseDiagnosis, basePatient);
      expect(result.clinicalStatus.coding[0].code).toBe('active');

      const resolved = { ...baseDiagnosis, status: 'RESOLVED' };
      const result2 = fhirAdapter.toFHIRCondition(resolved, basePatient);
      expect(result2.clinicalStatus.coding[0].code).toBe('resolved');
    });

    it('should set verification status to confirmed', () => {
      const result = fhirAdapter.toFHIRCondition(baseDiagnosis, basePatient);
      expect(result.verificationStatus.coding[0].code).toBe('confirmed');
    });

    it('should include description as code text', () => {
      const result = fhirAdapter.toFHIRCondition(baseDiagnosis, basePatient);
      expect(result.code.text).toBe('Lumbar disc herniation');
    });

    it('should include onset and recorded dates', () => {
      const result = fhirAdapter.toFHIRCondition(baseDiagnosis, basePatient);
      expect(result.onsetDateTime).toBe('2025-01-10');
      expect(result.recordedDate).toBe('2025-01-15T09:00:00Z');
    });

    it('should handle diagnosis without ICD-10 or ICPC-2 codes', () => {
      const diag = { ...baseDiagnosis, icd10_code: null, icpc2_code: null };
      const result = fhirAdapter.toFHIRCondition(diag, basePatient);
      expect(result.code.coding).toEqual([]);
    });
  });

  // =========================================================================
  // mapConditionStatus
  // =========================================================================

  describe('mapConditionStatus', () => {
    it.each([
      ['ACTIVE', 'active'],
      ['RESOLVED', 'resolved'],
      ['INACTIVE', 'inactive'],
      ['RECURRENCE', 'recurrence'],
    ])('should map %s to %s', (input, expected) => {
      expect(fhirAdapter.mapConditionStatus(input)).toBe(expected);
    });

    it('should default to active for unknown status', () => {
      expect(fhirAdapter.mapConditionStatus('SOMETHING')).toBe('active');
      expect(fhirAdapter.mapConditionStatus(undefined)).toBe('active');
    });
  });

  // =========================================================================
  // toFHIRProcedure
  // =========================================================================

  describe('toFHIRProcedure', () => {
    it('should set resourceType to Procedure', () => {
      const result = fhirAdapter.toFHIRProcedure(baseTreatment, basePatient);
      expect(result.resourceType).toBe('Procedure');
    });

    it('should set status to completed', () => {
      const result = fhirAdapter.toFHIRProcedure(baseTreatment, basePatient);
      expect(result.status).toBe('completed');
    });

    it('should reference patient in subject', () => {
      const result = fhirAdapter.toFHIRProcedure(baseTreatment, basePatient);
      expect(result.subject.reference).toBe('Patient/pat-001');
    });

    it('should include procedure code in code.coding', () => {
      const result = fhirAdapter.toFHIRProcedure(baseTreatment, basePatient);
      expect(result.code.coding).toHaveLength(1);
      expect(result.code.coding[0].code).toBe('44608003');
    });

    it('should include treatment_type as code text', () => {
      const result = fhirAdapter.toFHIRProcedure(baseTreatment, basePatient);
      expect(result.code.text).toBe('Spinal manipulation');
    });

    it('should include performer when provider_id present', () => {
      const result = fhirAdapter.toFHIRProcedure(baseTreatment, basePatient);
      expect(result.performer).toHaveLength(1);
      expect(result.performer[0].actor.reference).toBe('Practitioner/prov-001');
    });

    it('should have empty performer when no provider_id', () => {
      const t = { ...baseTreatment, provider_id: null };
      const result = fhirAdapter.toFHIRProcedure(t, basePatient);
      expect(result.performer).toEqual([]);
    });

    it('should include bodySite when body_region present', () => {
      const result = fhirAdapter.toFHIRProcedure(baseTreatment, basePatient);
      expect(result.bodySite).toHaveLength(1);
      expect(result.bodySite[0].text).toBe('Lumbar spine');
    });

    it('should include notes when present', () => {
      const result = fhirAdapter.toFHIRProcedure(baseTreatment, basePatient);
      expect(result.note).toHaveLength(1);
      expect(result.note[0].text).toBe('Applied HVLA L4-L5 left side');
    });

    it('should have empty arrays when optional fields missing', () => {
      const t = {
        ...baseTreatment,
        procedure_code: null,
        provider_id: null,
        body_region: null,
        notes: null,
      };
      const result = fhirAdapter.toFHIRProcedure(t, basePatient);
      expect(result.code.coding).toEqual([]);
      expect(result.performer).toEqual([]);
      expect(result.bodySite).toEqual([]);
      expect(result.note).toEqual([]);
    });
  });

  // =========================================================================
  // toFHIRAppointment
  // =========================================================================

  describe('toFHIRAppointment', () => {
    it('should set resourceType to Appointment', () => {
      const result = fhirAdapter.toFHIRAppointment(baseAppointment, basePatient);
      expect(result.resourceType).toBe('Appointment');
    });

    it('should map SCHEDULED status to booked', () => {
      const result = fhirAdapter.toFHIRAppointment(baseAppointment, basePatient);
      expect(result.status).toBe('booked');
    });

    it('should compose start/end from date and time', () => {
      const result = fhirAdapter.toFHIRAppointment(baseAppointment, basePatient);
      expect(result.start).toBe('2025-01-20T10:00');
      expect(result.end).toBe('2025-01-20T10:30');
    });

    it('should include patient as participant', () => {
      const result = fhirAdapter.toFHIRAppointment(baseAppointment, basePatient);
      expect(result.participant).toHaveLength(1);
      expect(result.participant[0].actor.reference).toBe('Patient/pat-001');
      expect(result.participant[0].actor.display).toBe('Kari Hansen');
    });

    it('should include appointment type text', () => {
      const result = fhirAdapter.toFHIRAppointment(baseAppointment, basePatient);
      expect(result.appointmentType.text).toBe('Follow-up');
    });

    it('should include description from notes', () => {
      const result = fhirAdapter.toFHIRAppointment(baseAppointment, basePatient);
      expect(result.description).toBe('Re-evaluation lumbar spine');
    });
  });

  // =========================================================================
  // mapAppointmentStatus
  // =========================================================================

  describe('mapAppointmentStatus', () => {
    it.each([
      ['SCHEDULED', 'booked'],
      ['CONFIRMED', 'booked'],
      ['ARRIVED', 'arrived'],
      ['COMPLETED', 'fulfilled'],
      ['CANCELLED', 'cancelled'],
      ['NO_SHOW', 'noshow'],
    ])('should map %s to %s', (input, expected) => {
      expect(fhirAdapter.mapAppointmentStatus(input)).toBe(expected);
    });

    it('should default to proposed for unknown status', () => {
      expect(fhirAdapter.mapAppointmentStatus('PENDING')).toBe('proposed');
    });
  });

  // =========================================================================
  // createPatientBundle
  // =========================================================================

  describe('createPatientBundle', () => {
    it('should return a Bundle with resourceType Bundle', () => {
      const bundle = fhirAdapter.createPatientBundle({ patient: basePatient });
      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('document');
    });

    it('should contain the patient as first entry', () => {
      const bundle = fhirAdapter.createPatientBundle({ patient: basePatient });
      expect(bundle.entry).toHaveLength(1);
      expect(bundle.entry[0].resource.resourceType).toBe('Patient');
    });

    it('should include encounters, diagnoses, treatments, and appointments', () => {
      const bundle = fhirAdapter.createPatientBundle({
        patient: basePatient,
        encounters: [baseEncounter],
        diagnoses: [baseDiagnosis],
        treatments: [baseTreatment],
        appointments: [baseAppointment],
      });
      // 1 patient + 1 encounter + 1 diagnosis + 1 treatment + 1 appointment = 5
      expect(bundle.entry).toHaveLength(5);
      expect(bundle.total).toBe(5);

      const types = bundle.entry.map((e) => e.resource.resourceType);
      expect(types).toContain('Patient');
      expect(types).toContain('Encounter');
      expect(types).toContain('Condition');
      expect(types).toContain('Procedure');
      expect(types).toContain('Appointment');
    });

    it('should include fullUrl for each entry', () => {
      const bundle = fhirAdapter.createPatientBundle({
        patient: basePatient,
        encounters: [baseEncounter],
      });
      expect(bundle.entry[0].fullUrl).toContain('Patient/pat-001');
      expect(bundle.entry[1].fullUrl).toContain('Encounter/enc-001');
    });

    it('should handle missing optional collections gracefully', () => {
      const bundle = fhirAdapter.createPatientBundle({
        patient: basePatient,
        encounters: undefined,
        diagnoses: undefined,
        treatments: undefined,
        appointments: undefined,
      });
      expect(bundle.entry).toHaveLength(1);
      expect(bundle.total).toBe(1);
    });

    it('should include meta.lastUpdated and timestamp', () => {
      const bundle = fhirAdapter.createPatientBundle({ patient: basePatient });
      expect(bundle.meta.lastUpdated).toBeDefined();
      expect(bundle.timestamp).toBeDefined();
    });
  });

  // =========================================================================
  // validateResource
  // =========================================================================

  describe('validateResource', () => {
    it('should return valid for a well-formed Patient', async () => {
      const patient = fhirAdapter.toFHIRPatient(basePatient);
      const result = await fhirAdapter.validateResource(patient);
      expect(result.resourceType).toBe('OperationOutcome');
      expect(result.valid).toBe(true);
      expect(result.issue).toEqual([]);
    });

    it('should return error when resourceType is missing', async () => {
      const result = await fhirAdapter.validateResource({ id: '123' });
      expect(result.valid).toBe(false);
      const error = result.issue.find((i) => i.severity === 'error');
      expect(error.diagnostics).toContain('resourceType');
    });

    it('should return warning when id is missing', async () => {
      const result = await fhirAdapter.validateResource({ resourceType: 'Observation' });
      expect(result.valid).toBe(true); // warning only, not error
      const warning = result.issue.find((i) => i.severity === 'warning');
      expect(warning).toBeDefined();
    });

    it('should return error when Patient has no name', async () => {
      const result = await fhirAdapter.validateResource({
        resourceType: 'Patient',
        id: 'p1',
        name: [],
      });
      expect(result.valid).toBe(false);
      const error = result.issue.find((i) => i.code === 'required');
      expect(error.diagnostics).toContain('name');
    });

    it('should pass validation for non-Patient resources without name', async () => {
      const result = await fhirAdapter.validateResource({
        resourceType: 'Observation',
        id: 'obs-1',
      });
      expect(result.valid).toBe(true);
    });
  });
});
