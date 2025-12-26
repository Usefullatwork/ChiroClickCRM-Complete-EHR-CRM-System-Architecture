/**
 * FHIR Adapter Service Tests
 */

import fhirAdapter from '../../src/services/fhirAdapter.js';

describe('FHIR Adapter Service', () => {

  describe('patientToFHIR', () => {
    const mockPatient = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      first_name: 'Ola',
      last_name: 'Nordmann',
      date_of_birth: '1985-03-15',
      gender: 'MALE',
      phone: '+4712345678',
      email: 'ola@example.no',
      address: {
        street: 'Storgata 1',
        city: 'Oslo',
        postal_code: '0123',
        country: 'NO'
      },
      status: 'ACTIVE',
      solvit_id: 'SOL-12345',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-06-01T12:00:00Z'
    };

    test('should convert patient to FHIR R4 Patient resource', () => {
      const fhirPatient = fhirAdapter.patientToFHIR(mockPatient);

      expect(fhirPatient.resourceType).toBe('Patient');
      expect(fhirPatient.id).toBe(mockPatient.id);
      expect(fhirPatient.active).toBe(true);
    });

    test('should include correct name structure', () => {
      const fhirPatient = fhirAdapter.patientToFHIR(mockPatient);

      expect(fhirPatient.name).toHaveLength(1);
      expect(fhirPatient.name[0].family).toBe('Nordmann');
      expect(fhirPatient.name[0].given).toContain('Ola');
      expect(fhirPatient.name[0].use).toBe('official');
    });

    test('should map gender correctly', () => {
      const fhirPatient = fhirAdapter.patientToFHIR(mockPatient);
      expect(fhirPatient.gender).toBe('male');

      const femalePatient = { ...mockPatient, gender: 'FEMALE' };
      const fhirFemale = fhirAdapter.patientToFHIR(femalePatient);
      expect(fhirFemale.gender).toBe('female');
    });

    test('should include birth date', () => {
      const fhirPatient = fhirAdapter.patientToFHIR(mockPatient);
      expect(fhirPatient.birthDate).toBe('1985-03-15');
    });

    test('should include telecom contacts', () => {
      const fhirPatient = fhirAdapter.patientToFHIR(mockPatient);

      expect(fhirPatient.telecom).toHaveLength(2);
      expect(fhirPatient.telecom.some(t => t.system === 'phone')).toBe(true);
      expect(fhirPatient.telecom.some(t => t.system === 'email')).toBe(true);
    });

    test('should include address', () => {
      const fhirPatient = fhirAdapter.patientToFHIR(mockPatient);

      expect(fhirPatient.address).toHaveLength(1);
      expect(fhirPatient.address[0].city).toBe('Oslo');
      expect(fhirPatient.address[0].postalCode).toBe('0123');
      expect(fhirPatient.address[0].country).toBe('NO');
    });

    test('should include Norwegian profile', () => {
      const fhirPatient = fhirAdapter.patientToFHIR(mockPatient);

      expect(fhirPatient.meta.profile).toContain('http://hl7.no/fhir/StructureDefinition/no-basis-Patient');
    });

    test('should include SolvIt identifier', () => {
      const fhirPatient = fhirAdapter.patientToFHIR(mockPatient);

      expect(fhirPatient.identifier.some(i => i.value === 'SOL-12345')).toBe(true);
    });

    test('should include Norwegian as communication language', () => {
      const fhirPatient = fhirAdapter.patientToFHIR(mockPatient);

      expect(fhirPatient.communication).toHaveLength(1);
      expect(fhirPatient.communication[0].language.coding[0].code).toBe('no');
    });

  });

  describe('encounterToFHIR', () => {
    const mockEncounter = {
      id: '223e4567-e89b-12d3-a456-426614174001',
      patient_id: '123e4567-e89b-12d3-a456-426614174000',
      practitioner_id: '323e4567-e89b-12d3-a456-426614174002',
      encounter_date: '2024-06-15T09:00:00Z',
      encounter_type: 'FOLLOWUP',
      duration_minutes: 30,
      subjective: {
        chief_complaint: 'Neck pain',
        history: 'Gradual onset over 2 weeks'
      },
      objective: {
        observation: 'Forward head posture',
        palpation: 'Tenderness C5-C7',
        rom: 'Cervical rotation reduced 20%'
      },
      assessment: {
        clinical_reasoning: 'Mechanical neck pain without radiculopathy'
      },
      plan: {
        treatment: 'SMT C5-C7, soft tissue therapy',
        follow_up: '1 week'
      },
      icpc_codes: ['L01', 'L83'],
      signed_at: '2024-06-15T09:30:00Z',
      version: 1,
      created_at: '2024-06-15T09:00:00Z'
    };

    const mockPatient = {
      first_name: 'Ola',
      last_name: 'Nordmann'
    };

    test('should convert encounter to FHIR R4 Encounter resource', () => {
      const fhirEncounter = fhirAdapter.encounterToFHIR(mockEncounter, mockPatient);

      expect(fhirEncounter.resourceType).toBe('Encounter');
      expect(fhirEncounter.id).toBe(mockEncounter.id);
    });

    test('should set status based on signed_at', () => {
      const fhirEncounter = fhirAdapter.encounterToFHIR(mockEncounter, mockPatient);
      expect(fhirEncounter.status).toBe('finished');

      const unsignedEncounter = { ...mockEncounter, signed_at: null };
      const fhirUnsigned = fhirAdapter.encounterToFHIR(unsignedEncounter, mockPatient);
      expect(fhirUnsigned.status).toBe('in-progress');
    });

    test('should include ambulatory class', () => {
      const fhirEncounter = fhirAdapter.encounterToFHIR(mockEncounter, mockPatient);

      expect(fhirEncounter.class.code).toBe('AMB');
      expect(fhirEncounter.class.display).toBe('ambulatory');
    });

    test('should reference patient', () => {
      const fhirEncounter = fhirAdapter.encounterToFHIR(mockEncounter, mockPatient);

      expect(fhirEncounter.subject.reference).toBe(`Patient/${mockEncounter.patient_id}`);
      expect(fhirEncounter.subject.display).toBe('Ola Nordmann');
    });

    test('should include period with duration', () => {
      const fhirEncounter = fhirAdapter.encounterToFHIR(mockEncounter, mockPatient);

      expect(fhirEncounter.period.start).toBe(mockEncounter.encounter_date);
      expect(fhirEncounter.length.value).toBe(30);
      expect(fhirEncounter.length.unit).toBe('min');
    });

    test('should include reason code from chief complaint', () => {
      const fhirEncounter = fhirAdapter.encounterToFHIR(mockEncounter, mockPatient);

      expect(fhirEncounter.reasonCode).toHaveLength(1);
      expect(fhirEncounter.reasonCode[0].text).toBe('Neck pain');
    });

    test('should include diagnosis references', () => {
      const fhirEncounter = fhirAdapter.encounterToFHIR(mockEncounter, mockPatient);

      expect(fhirEncounter.diagnosis).toHaveLength(2);
      expect(fhirEncounter.diagnosis[0].rank).toBe(1);
    });

    test('should include contained SOAP composition', () => {
      const fhirEncounter = fhirAdapter.encounterToFHIR(mockEncounter, mockPatient);

      expect(fhirEncounter.contained).toHaveLength(1);
      expect(fhirEncounter.contained[0].resourceType).toBe('Composition');
      expect(fhirEncounter.contained[0].section).toHaveLength(4);
    });

    test('should include participant practitioner', () => {
      const fhirEncounter = fhirAdapter.encounterToFHIR(mockEncounter, mockPatient);

      expect(fhirEncounter.participant).toHaveLength(1);
      expect(fhirEncounter.participant[0].individual.reference).toBe(`Practitioner/${mockEncounter.practitioner_id}`);
    });

  });

  describe('diagnosisToFHIR', () => {

    test('should convert ICPC-2 diagnosis to Condition', () => {
      const diagnosis = { code: 'L01', system: 'ICPC2', description_no: 'Nakke symptom' };
      const condition = fhirAdapter.diagnosisToFHIR(diagnosis, 'patient-123', 'encounter-456');

      expect(condition.resourceType).toBe('Condition');
      expect(condition.code.coding[0].code).toBe('L01');
      expect(condition.code.coding[0].system).toContain('icpc');
      expect(condition.subject.reference).toBe('Patient/patient-123');
      expect(condition.encounter.reference).toBe('Encounter/encounter-456');
    });

    test('should convert ICD-10 diagnosis to Condition', () => {
      const diagnosis = { code: 'M54.2', system: 'ICD10' };
      const condition = fhirAdapter.diagnosisToFHIR(diagnosis, 'patient-123');

      expect(condition.code.coding[0].system).toBe('http://hl7.org/fhir/sid/icd-10');
    });

    test('should set clinical status to active', () => {
      const diagnosis = { code: 'L01' };
      const condition = fhirAdapter.diagnosisToFHIR(diagnosis, 'patient-123');

      expect(condition.clinicalStatus.coding[0].code).toBe('active');
    });

    test('should set verification status to confirmed', () => {
      const diagnosis = { code: 'L01' };
      const condition = fhirAdapter.diagnosisToFHIR(diagnosis, 'patient-123');

      expect(condition.verificationStatus.coding[0].code).toBe('confirmed');
    });

  });

  describe('measurementToFHIR', () => {

    test('should convert VAS pain score to Observation', () => {
      const measurement = {
        pain_intensity: 7,
        created_at: '2024-06-15T10:00:00Z'
      };
      const observations = fhirAdapter.measurementToFHIR(measurement, 'patient-123', 'encounter-456');

      expect(observations.length).toBeGreaterThan(0);
      const vasObs = observations.find(o => o.code.text === 'VAS Pain Score');
      expect(vasObs).toBeDefined();
      expect(vasObs.valueInteger).toBe(7);
      expect(vasObs.interpretation[0].coding[0].code).toBe('H'); // High
    });

    test('should convert ROM measurements to Observations', () => {
      const measurement = {
        rom_measurements: {
          cervical: { flexion: 45, extension: 40 }
        },
        created_at: '2024-06-15T10:00:00Z'
      };
      const observations = fhirAdapter.measurementToFHIR(measurement, 'patient-123');

      expect(observations.length).toBe(2);
      expect(observations[0].valueQuantity.unit).toBe('degrees');
    });

    test('should convert outcome measures to Observations', () => {
      const measurement = {
        outcome_measure_type: 'NDI',
        outcome_score: 34.5,
        created_at: '2024-06-15T10:00:00Z'
      };
      const observations = fhirAdapter.measurementToFHIR(measurement, 'patient-123');

      expect(observations.length).toBe(1);
      expect(observations[0].code.text).toBe('NDI');
      expect(observations[0].valueQuantity.value).toBe(34.5);
    });

    test('should handle empty measurement', () => {
      const measurement = { created_at: '2024-06-15T10:00:00Z' };
      const observations = fhirAdapter.measurementToFHIR(measurement, 'patient-123');

      expect(observations).toEqual([]);
    });

  });

  describe('FHIR constants', () => {

    test('should export FHIR version', () => {
      expect(fhirAdapter.FHIR_VERSION).toBe('4.0.1');
    });

    test('should export FHIR base URL', () => {
      expect(fhirAdapter.FHIR_BASE_URL).toBeDefined();
    });

  });

});
