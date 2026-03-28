/**
 * Tests for Neurological Examination Service & Questionnaires Service
 * Covers neuro exam CRUD, referral urgency, BPPV treatment, red flags,
 * questionnaire management, scoring algorithms, and response tracking.
 */

import { jest } from '@jest/globals';

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */
let mockQuery;
let mockTransaction;

jest.unstable_mockModule('../../../src/config/database.js', () => {
  mockQuery = jest.fn();
  mockTransaction = jest.fn();
  return {
    query: mockQuery,
    transaction: mockTransaction,
    default: {
      query: mockQuery,
      transaction: mockTransaction,
    },
  };
});

/* ------------------------------------------------------------------ */
/* Import modules under test AFTER mocks are registered               */
/* ------------------------------------------------------------------ */
const {
  listExams,
  getExamById,
  createExam,
  updateExam,
  completeExam,
  recordReferral,
  logBPPVTreatment,
  getRedFlagAlerts,
  getPatientHistory,
} = await import('../../../src/services/clinical/neuroexam.js');

const {
  getAllQuestionnaires,
  getQuestionnaireByCode,
  submitQuestionnaireResponse,
  getPatientQuestionnaireHistory,
  getQuestionnaireResponse,
  getOutcomesByDiagnosis,
  calculateTreatmentEffectiveness,
} = await import('../../../src/services/clinical/questionnaires.js');

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const ORG_ID = 'org-1';
const PATIENT_ID = 'pat-1';
const PRACTITIONER_ID = 'user-1';
const EXAM_ID = 'exam-1';

const makeRows = (rows) => ({ rows, rowCount: rows.length });

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */
describe('neuroexam service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ================================================================
  // listExams
  // ================================================================
  describe('listExams', () => {
    it('should return paginated exams with default filters', async () => {
      const rows = [{ id: EXAM_ID, patient_name: 'Ola Nordmann' }];
      mockQuery.mockResolvedValueOnce(makeRows(rows));

      const result = await listExams(ORG_ID);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(result.data).toEqual(rows);
      expect(result.pagination).toEqual({
        limit: 50,
        offset: 0,
        total: 1,
      });
    });

    it('should apply patientId, status, and hasRedFlags filters', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await listExams(ORG_ID, {
        patientId: PATIENT_ID,
        status: 'COMPLETED',
        hasRedFlags: 'true',
        limit: 10,
        offset: 5,
      });

      const sql = mockQuery.mock.calls[0][0];
      const params = mockQuery.mock.calls[0][1];

      expect(sql).toContain('patient_id');
      expect(sql).toContain('status');
      expect(sql).toContain('has_red_flags');
      expect(params).toContain(PATIENT_ID);
      expect(params).toContain('COMPLETED');
      expect(params).toContain(true);
      expect(params).toContain(10);
      expect(params).toContain(5);
    });
  });

  // ================================================================
  // getExamById
  // ================================================================
  describe('getExamById', () => {
    it('should return exam with test results and vestibular findings', async () => {
      const examRow = { id: EXAM_ID, patient_name: 'Ola Nordmann' };
      const testResultRows = [{ test_id: 'romberg', is_positive: true }];
      const vestibularRow = { spontaneous_nystagmus_present: false };

      mockQuery
        .mockResolvedValueOnce(makeRows([examRow]))
        .mockResolvedValueOnce(makeRows(testResultRows))
        .mockResolvedValueOnce(makeRows([vestibularRow]));

      const result = await getExamById(ORG_ID, EXAM_ID);

      expect(mockQuery).toHaveBeenCalledTimes(3);
      expect(result.id).toBe(EXAM_ID);
      expect(result.detailed_test_results).toEqual(testResultRows);
      expect(result.vestibular_findings).toEqual(vestibularRow);
    });

    it('should return null when exam not found', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      const result = await getExamById(ORG_ID, 'nonexistent');

      expect(result).toBeNull();
    });

    it('should return null vestibular_findings when none exist', async () => {
      mockQuery
        .mockResolvedValueOnce(makeRows([{ id: EXAM_ID }]))
        .mockResolvedValueOnce(makeRows([]))
        .mockResolvedValueOnce(makeRows([]));

      const result = await getExamById(ORG_ID, EXAM_ID);

      expect(result.vestibular_findings).toBeNull();
    });
  });

  // ================================================================
  // createExam
  // ================================================================
  describe('createExam', () => {
    it('should create an exam via transaction and return the row', async () => {
      const createdRow = { id: EXAM_ID, status: 'IN_PROGRESS' };
      const mockClient = { query: jest.fn() };
      mockClient.query.mockResolvedValueOnce(makeRows([createdRow]));

      mockTransaction.mockImplementationOnce(async (cb) => cb(mockClient));

      const result = await createExam(ORG_ID, PRACTITIONER_ID, {
        patientId: PATIENT_ID,
      });

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual(createdRow);
    });

    it('should insert normalized test results within the transaction', async () => {
      const createdRow = { id: EXAM_ID };
      const mockClient = { query: jest.fn() };
      // First call: INSERT exam
      mockClient.query.mockResolvedValueOnce(makeRows([createdRow]));
      // Second call: INSERT test result
      mockClient.query.mockResolvedValue(makeRows([]));

      mockTransaction.mockImplementationOnce(async (cb) => cb(mockClient));

      await createExam(ORG_ID, PRACTITIONER_ID, {
        patientId: PATIENT_ID,
        testResults: {
          romberg: { criteria: { swayPresent: true }, notes: 'Unsteady' },
        },
      });

      // The first client.query is the INSERT exam, the second is INSERT test result
      expect(mockClient.query.mock.calls.length).toBeGreaterThanOrEqual(2);
      const testResultSql = mockClient.query.mock.calls[1][0];
      expect(testResultSql).toContain('neuro_exam_test_results');
    });

    it('should set referral urgency to EMERGENT for myelopathy red flags', async () => {
      const createdRow = { id: EXAM_ID };
      const mockClient = { query: jest.fn() };
      mockClient.query.mockResolvedValueOnce(makeRows([createdRow]));

      mockTransaction.mockImplementationOnce(async (cb) => cb(mockClient));

      await createExam(ORG_ID, PRACTITIONER_ID, {
        patientId: PATIENT_ID,
        redFlags: [{ clusterId: 'MYELOPATHY', testId: 'hoffmann_sign' }],
      });

      // Check the params passed to the INSERT query include 'EMERGENT'
      const insertParams = mockClient.query.mock.calls[0][1];
      expect(insertParams).toContain('EMERGENT');
    });
  });

  // ================================================================
  // updateExam
  // ================================================================
  describe('updateExam', () => {
    it('should update an existing exam and return the row', async () => {
      const updatedRow = { id: EXAM_ID, status: 'COMPLETED' };
      const mockClient = { query: jest.fn() };
      // First query: check existence
      mockClient.query.mockResolvedValueOnce(makeRows([{ id: EXAM_ID }]));
      // Second query: UPDATE
      mockClient.query.mockResolvedValueOnce(makeRows([updatedRow]));

      mockTransaction.mockImplementationOnce(async (cb) => cb(mockClient));

      const result = await updateExam(ORG_ID, EXAM_ID, { status: 'COMPLETED' });

      expect(result).toEqual(updatedRow);
    });

    it('should return null when exam not found', async () => {
      const mockClient = { query: jest.fn() };
      mockClient.query.mockResolvedValueOnce(makeRows([]));

      mockTransaction.mockImplementationOnce(async (cb) => cb(mockClient));

      const result = await updateExam(ORG_ID, 'nonexistent', { status: 'COMPLETED' });

      expect(result).toBeNull();
    });

    it('should re-insert test results when testResults provided', async () => {
      const mockClient = { query: jest.fn() };
      // existence check
      mockClient.query.mockResolvedValueOnce(makeRows([{ id: EXAM_ID }]));
      // UPDATE
      mockClient.query.mockResolvedValueOnce(makeRows([{ id: EXAM_ID }]));
      // DELETE old test results
      mockClient.query.mockResolvedValueOnce(makeRows([]));
      // INSERT new test result
      mockClient.query.mockResolvedValueOnce(makeRows([]));

      mockTransaction.mockImplementationOnce(async (cb) => cb(mockClient));

      await updateExam(ORG_ID, EXAM_ID, {
        testResults: {
          finger_nose: { criteria: { dysmetria: true } },
        },
      });

      // 4 calls: check + update + delete + insert
      expect(mockClient.query).toHaveBeenCalledTimes(4);
      const deleteSql = mockClient.query.mock.calls[2][0];
      expect(deleteSql).toContain('DELETE');
    });
  });

  // ================================================================
  // completeExam
  // ================================================================
  describe('completeExam', () => {
    it('should mark an exam as COMPLETED', async () => {
      const completedRow = { id: EXAM_ID, status: 'COMPLETED' };
      mockQuery.mockResolvedValueOnce(makeRows([completedRow]));

      const result = await completeExam(ORG_ID, EXAM_ID, 'Narrative text');

      expect(result).toEqual(completedRow);
      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('COMPLETED');
    });

    it('should return null when exam not found', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      const result = await completeExam(ORG_ID, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  // ================================================================
  // recordReferral
  // ================================================================
  describe('recordReferral', () => {
    it('should record a referral with specialty and urgency', async () => {
      const row = { id: EXAM_ID, referral_specialty: 'Neurology', referral_urgency: 'URGENT' };
      mockQuery.mockResolvedValueOnce(makeRows([row]));

      const result = await recordReferral(ORG_ID, EXAM_ID, {
        specialty: 'Neurology',
        urgency: 'URGENT',
      });

      expect(result.referral_specialty).toBe('Neurology');
      expect(result.referral_urgency).toBe('URGENT');
    });

    it('should return null when exam not found', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      const result = await recordReferral(ORG_ID, 'nonexistent', {
        specialty: 'Neurology',
        urgency: 'URGENT',
      });

      expect(result).toBeNull();
    });
  });

  // ================================================================
  // logBPPVTreatment
  // ================================================================
  describe('logBPPVTreatment', () => {
    it('should insert a BPPV treatment and return the row', async () => {
      const row = {
        id: 'bppv-1',
        canal_affected: 'posterior',
        side_affected: 'left',
        treatment_maneuver: 'Epley',
      };
      mockQuery.mockResolvedValueOnce(makeRows([row]));

      const result = await logBPPVTreatment(PRACTITIONER_ID, {
        patientId: PATIENT_ID,
        canalAffected: 'posterior',
        sideAffected: 'left',
        treatmentManeuver: 'Epley',
        preVAS: 7,
        postVAS: 2,
      });

      expect(result.canal_affected).toBe('posterior');
      expect(result.treatment_maneuver).toBe('Epley');
    });
  });

  // ================================================================
  // getRedFlagAlerts
  // ================================================================
  describe('getRedFlagAlerts', () => {
    it('should return alerts sorted by urgency', async () => {
      const alerts = [
        { exam_id: 'e1', referral_urgency: 'EMERGENT' },
        { exam_id: 'e2', referral_urgency: 'ROUTINE' },
      ];
      mockQuery.mockResolvedValueOnce(makeRows(alerts));

      const result = await getRedFlagAlerts(ORG_ID);

      expect(result).toEqual(alerts);
      expect(result).toHaveLength(2);
    });
  });

  // ================================================================
  // getPatientHistory
  // ================================================================
  describe('getPatientHistory', () => {
    it('should return examinations and BPPV treatment history', async () => {
      const exams = [{ id: EXAM_ID, status: 'COMPLETED' }];
      const bppv = [{ canal_affected: 'posterior', immediate_resolution: true }];

      mockQuery.mockResolvedValueOnce(makeRows(exams)).mockResolvedValueOnce(makeRows(bppv));

      const result = await getPatientHistory(ORG_ID, PATIENT_ID);

      expect(result.examinations).toEqual(exams);
      expect(result.bppvTreatments).toEqual(bppv);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });
});

// ================================================================
// QUESTIONNAIRES SERVICE
// ================================================================
describe('questionnaires service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ================================================================
  // getAllQuestionnaires
  // ================================================================
  describe('getAllQuestionnaires', () => {
    it('should return questionnaires with default options', async () => {
      const rows = [{ id: 'q1', code: 'NDI', name: 'Neck Disability Index' }];
      mockQuery.mockResolvedValueOnce(makeRows(rows));

      const result = await getAllQuestionnaires(ORG_ID);

      expect(result).toEqual(rows);
      const params = mockQuery.mock.calls[0][1];
      expect(params[0]).toBe(ORG_ID);
      expect(params[1]).toBe('NO'); // default language
    });

    it('should filter by bodyRegion when provided', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await getAllQuestionnaires(ORG_ID, { bodyRegion: 'Cervical', language: 'EN' });

      const sql = mockQuery.mock.calls[0][0];
      const params = mockQuery.mock.calls[0][1];

      expect(sql).toContain('target_body_region');
      expect(params).toContain('Cervical');
      expect(params).toContain('EN');
    });
  });

  // ================================================================
  // getQuestionnaireByCode
  // ================================================================
  describe('getQuestionnaireByCode', () => {
    it('should return questionnaire by code', async () => {
      const row = { id: 'q1', code: 'NDI' };
      mockQuery.mockResolvedValueOnce(makeRows([row]));

      const result = await getQuestionnaireByCode('NDI');

      expect(result).toEqual(row);
    });

    it('should throw when questionnaire not found', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await expect(getQuestionnaireByCode('UNKNOWN')).rejects.toThrow(
        'Questionnaire UNKNOWN not found'
      );
    });
  });

  // ================================================================
  // submitQuestionnaireResponse — NDI scoring
  // ================================================================
  describe('submitQuestionnaireResponse', () => {
    it('should submit an NDI response with correct scoring', async () => {
      // 1. questionnaire lookup
      mockQuery.mockResolvedValueOnce(
        makeRows([
          {
            id: 'q1',
            code: 'NDI',
            scoring_method: 'SUM',
            min_score: 0,
            max_score: 50,
            score_interpretation: null,
            clinical_cutoff_scores: { minimal_clinically_important_difference: 5 },
          },
        ])
      );
      // 2. previous score lookup
      mockQuery.mockResolvedValueOnce(makeRows([]));
      // 3. insert response
      const insertedRow = {
        id: 'resp-1',
        total_score: 25,
        percentage_score: 50,
        severity_level: 'Moderate',
      };
      mockQuery.mockResolvedValueOnce(makeRows([insertedRow]));

      const result = await submitQuestionnaireResponse({
        patientId: PATIENT_ID,
        encounterId: 'enc-1',
        questionnaireId: 'q1',
        responses: {
          q1: 3,
          q2: 2,
          q3: 4,
          q4: 1,
          q5: 3,
          q6: 2,
          q7: 3,
          q8: 2,
          q9: 3,
          q10: 2,
        },
        administeredBy: PRACTITIONER_ID,
      });

      expect(result).toEqual(insertedRow);
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it('should detect clinically significant change from previous score', async () => {
      // questionnaire lookup
      mockQuery.mockResolvedValueOnce(
        makeRows([
          {
            id: 'q1',
            code: 'NDI',
            scoring_method: 'SUM',
            min_score: 0,
            max_score: 50,
            score_interpretation: null,
            clinical_cutoff_scores: { minimal_clinically_important_difference: 5 },
          },
        ])
      );
      // previous score
      mockQuery.mockResolvedValueOnce(
        makeRows([{ total_score: 30, administered_date: '2026-01-01' }])
      );
      // insert
      mockQuery.mockResolvedValueOnce(makeRows([{ id: 'resp-2' }]));

      await submitQuestionnaireResponse({
        patientId: PATIENT_ID,
        encounterId: 'enc-1',
        questionnaireId: 'q1',
        responses: { q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1, q7: 1, q8: 1, q9: 1, q10: 1 },
        administeredBy: PRACTITIONER_ID,
      });

      // The INSERT call is the 3rd query call
      const insertParams = mockQuery.mock.calls[2][1];
      // param index 10 is clinicallySignificantChange (true because |10-30|=20 >= 5)
      expect(insertParams[10]).toBe(true);
    });

    it('should throw when questionnaire not found', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await expect(
        submitQuestionnaireResponse({
          patientId: PATIENT_ID,
          questionnaireId: 'nonexistent',
          responses: {},
        })
      ).rejects.toThrow('Questionnaire not found');
    });
  });

  // ================================================================
  // getPatientQuestionnaireHistory
  // ================================================================
  describe('getPatientQuestionnaireHistory', () => {
    it('should return all history for a patient', async () => {
      const rows = [{ id: 'resp-1', code: 'NDI' }];
      mockQuery.mockResolvedValueOnce(makeRows(rows));

      const result = await getPatientQuestionnaireHistory(PATIENT_ID);

      expect(result).toEqual(rows);
    });

    it('should filter by questionnaire code when provided', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await getPatientQuestionnaireHistory(PATIENT_ID, 'OSWESTRY');

      const sql = mockQuery.mock.calls[0][0];
      const params = mockQuery.mock.calls[0][1];
      expect(sql).toContain('q.code = $2');
      expect(params).toContain('OSWESTRY');
    });
  });

  // ================================================================
  // getQuestionnaireResponse
  // ================================================================
  describe('getQuestionnaireResponse', () => {
    it('should return a response by ID', async () => {
      const row = { id: 'resp-1', total_score: 25 };
      mockQuery.mockResolvedValueOnce(makeRows([row]));

      const result = await getQuestionnaireResponse('resp-1');

      expect(result).toEqual(row);
    });

    it('should throw when response not found', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await expect(getQuestionnaireResponse('nonexistent')).rejects.toThrow(
        'Questionnaire response not found'
      );
    });
  });

  // ================================================================
  // getOutcomesByDiagnosis
  // ================================================================
  describe('getOutcomesByDiagnosis', () => {
    it('should return aggregate outcomes for an ICPC code', async () => {
      const rows = [{ questionnaire_code: 'NDI', avg_score: 22.5, response_count: 10 }];
      mockQuery.mockResolvedValueOnce(makeRows(rows));

      const result = await getOutcomesByDiagnosis(ORG_ID, 'L84');

      expect(result).toEqual(rows);
      expect(mockQuery.mock.calls[0][1]).toEqual([ORG_ID, 'L84']);
    });
  });

  // ================================================================
  // calculateTreatmentEffectiveness
  // ================================================================
  describe('calculateTreatmentEffectiveness', () => {
    it('should return pre/post score comparison', async () => {
      const rows = [
        {
          code: 'NDI',
          initial_score: 35,
          latest_score: 15,
          score_change: -20,
          clinically_significant_change: true,
        },
      ];
      mockQuery.mockResolvedValueOnce(makeRows(rows));

      const result = await calculateTreatmentEffectiveness(PATIENT_ID);

      expect(result).toEqual(rows);
      expect(result[0].score_change).toBe(-20);
    });
  });
});
