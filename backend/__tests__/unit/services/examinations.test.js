import { jest } from '@jest/globals';

/* ------------------------------------------------------------------ */
/* Mocks — declared outside factories so we can reference them        */
/* ------------------------------------------------------------------ */
let mockQuery;
let mockLogger;

jest.unstable_mockModule('../../../src/config/database.js', () => {
  mockQuery = jest.fn();
  return { query: mockQuery };
});

jest.unstable_mockModule('../../../src/config/logger.js', () => {
  mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return { default: mockLogger };
});

/* ------------------------------------------------------------------ */
/* Import the module under test AFTER mocks are registered            */
/* ------------------------------------------------------------------ */
const {
  getBodyRegions,
  getCategories,
  getAllProtocols,
  getProtocolById,
  searchProtocols,
  getProtocolsByRegion,
  getProtocolsByCategory,
  getFindingsByEncounter,
  getFindingById,
  createFinding,
  updateFinding,
  deleteFinding,
  createBatchFindings,
  getExaminationSummary,
  getRedFlags,
  getAllTemplateSets,
  getTemplateSetsByComplaint,
  getTemplateSetById,
  createTemplateSet,
  mapFindingsToObjective,
  incrementTemplateSetUsage,
} = await import('../../../src/services/examinations.js');

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const ORG_ID = 'org-1';
const USER_ID = 'user-1';
const ENCOUNTER_ID = 'enc-1';
const FINDING_ID = 'find-1';
const PROTOCOL_ID = 'proto-1';
const TEMPLATE_ID = 'tmpl-1';

const makeRows = (rows) => ({ rows });

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */
describe('examinations service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ================================================================
  // EXAMINATION PROTOCOLS
  // ================================================================
  describe('getBodyRegions', () => {
    it('should return distinct body regions for default language', async () => {
      mockQuery.mockResolvedValueOnce(
        makeRows([{ body_region: 'Cervical' }, { body_region: 'Lumbar' }])
      );

      const result = await getBodyRegions();

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery.mock.calls[0][1]).toEqual(['NO']);
      expect(result).toEqual(['Cervical', 'Lumbar']);
    });

    it('should accept a custom language parameter', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([{ body_region: 'Cervical' }]));

      await getBodyRegions('EN');

      expect(mockQuery.mock.calls[0][1]).toEqual(['EN']);
    });
  });

  describe('getCategories', () => {
    it('should return distinct categories', async () => {
      mockQuery.mockResolvedValueOnce(
        makeRows([{ category: 'Orthopaedic' }, { category: 'Neurological' }])
      );

      const result = await getCategories();

      expect(result).toEqual(['Orthopaedic', 'Neurological']);
      expect(mockQuery.mock.calls[0][1]).toEqual(['NO']);
    });
  });

  describe('getAllProtocols', () => {
    it('should return protocols with default options', async () => {
      const rows = [{ id: '1', test_name: 'SLR' }];
      mockQuery.mockResolvedValueOnce(makeRows(rows));

      const result = await getAllProtocols();

      expect(result).toEqual({ protocols: rows, total: 1 });
      // default params: language, limit, offset
      const params = mockQuery.mock.calls[0][1];
      expect(params[0]).toBe('NO');
      expect(params).toContain(100); // limit
      expect(params).toContain(0); // offset
    });

    it('should apply bodyRegion, category, and redFlagsOnly filters', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await getAllProtocols({
        bodyRegion: 'Cervical',
        category: 'Orthopaedic',
        redFlagsOnly: true,
        limit: 50,
        offset: 10,
      });

      const sql = mockQuery.mock.calls[0][0];
      const params = mockQuery.mock.calls[0][1];

      expect(sql).toContain('body_region = $2');
      expect(sql).toContain('category = $3');
      expect(sql).toContain('is_red_flag = true');
      expect(params).toContain('Cervical');
      expect(params).toContain('Orthopaedic');
      expect(params).toContain(50);
      expect(params).toContain(10);
    });

    it('should apply search filter with ILIKE and ts_vector', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await getAllProtocols({ search: 'slump' });

      const sql = mockQuery.mock.calls[0][0];
      const params = mockQuery.mock.calls[0][1];

      expect(sql).toContain('ILIKE');
      expect(params).toContain('slump');
      expect(params).toContain('%slump%');
    });
  });

  describe('getProtocolById', () => {
    it('should return a single protocol', async () => {
      const row = { id: PROTOCOL_ID, test_name: 'SLR' };
      mockQuery.mockResolvedValueOnce(makeRows([row]));

      const result = await getProtocolById(PROTOCOL_ID);

      expect(result).toEqual(row);
      expect(mockQuery.mock.calls[0][1]).toEqual([PROTOCOL_ID]);
    });

    it('should throw when protocol not found', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await expect(getProtocolById('nonexistent')).rejects.toThrow('Protocol not found');
    });
  });

  describe('searchProtocols', () => {
    it('should search with default language and limit', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([{ id: '1' }]));

      const result = await searchProtocols('SLR');

      expect(result).toEqual([{ id: '1' }]);
      const params = mockQuery.mock.calls[0][1];
      expect(params).toEqual(['NO', 'SLR', '%SLR%', 50]);
    });
  });

  describe('getProtocolsByRegion', () => {
    it('should return protocols grouped by category', async () => {
      mockQuery.mockResolvedValueOnce(
        makeRows([
          { category: 'Ortho', id: '1' },
          { category: 'Ortho', id: '2' },
          { category: 'Neuro', id: '3' },
        ])
      );

      const result = await getProtocolsByRegion('Cervical');

      expect(result).toEqual({
        Ortho: [
          { category: 'Ortho', id: '1' },
          { category: 'Ortho', id: '2' },
        ],
        Neuro: [{ category: 'Neuro', id: '3' }],
      });
      expect(mockQuery.mock.calls[0][1]).toEqual(['Cervical', 'NO']);
    });
  });

  describe('getProtocolsByCategory', () => {
    it('should return protocols for given category', async () => {
      const rows = [{ id: '1' }];
      mockQuery.mockResolvedValueOnce(makeRows(rows));

      const result = await getProtocolsByCategory('Orthopaedic', 'EN');

      expect(result).toEqual(rows);
      expect(mockQuery.mock.calls[0][1]).toEqual(['Orthopaedic', 'EN']);
    });
  });

  // ================================================================
  // EXAMINATION FINDINGS
  // ================================================================
  describe('getFindingsByEncounter', () => {
    it('should return findings for an encounter', async () => {
      const rows = [{ id: FINDING_ID, test_name: 'SLR' }];
      mockQuery.mockResolvedValueOnce(makeRows(rows));

      const result = await getFindingsByEncounter(ORG_ID, ENCOUNTER_ID);

      expect(result).toEqual(rows);
      expect(mockQuery.mock.calls[0][1]).toEqual([ENCOUNTER_ID, ORG_ID]);
    });
  });

  describe('getFindingById', () => {
    it('should return a single finding', async () => {
      const row = { id: FINDING_ID };
      mockQuery.mockResolvedValueOnce(makeRows([row]));

      const result = await getFindingById(ORG_ID, FINDING_ID);

      expect(result).toEqual(row);
    });

    it('should throw when finding not found', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await expect(getFindingById(ORG_ID, 'nonexistent')).rejects.toThrow('Finding not found');
    });
  });

  describe('createFinding', () => {
    const findingData = {
      encounter_id: ENCOUNTER_ID,
      protocol_id: PROTOCOL_ID,
      body_region: 'Lumbar',
      category: 'Orthopaedic',
      test_name: 'SLR',
      result: 'positive',
      laterality: 'left',
      severity: 'moderate',
      findings_text: 'Pain at 45 degrees',
      clinician_notes: 'Suggestive of disc herniation',
      measurement_value: 45,
      measurement_unit: 'degrees',
      pain_score: 6,
      pain_location: 'L4-L5',
    };

    it('should create a finding after verifying encounter ownership', async () => {
      // verify encounter
      mockQuery.mockResolvedValueOnce(makeRows([{ id: ENCOUNTER_ID }]));
      // insert
      const created = { id: FINDING_ID, ...findingData };
      mockQuery.mockResolvedValueOnce(makeRows([created]));

      const result = await createFinding(ORG_ID, USER_ID, findingData);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(result).toEqual(created);
      // verify second call contains the INSERT
      expect(mockQuery.mock.calls[1][0]).toContain('INSERT');
    });

    it('should throw when encounter not found or access denied', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await expect(createFinding(ORG_ID, USER_ID, findingData)).rejects.toThrow(
        'Encounter not found or access denied'
      );
    });
  });

  describe('updateFinding', () => {
    it('should update allowed fields', async () => {
      // verify ownership
      mockQuery.mockResolvedValueOnce(makeRows([{ id: FINDING_ID }]));
      // update
      const updated = { id: FINDING_ID, result: 'negative', severity: 'mild' };
      mockQuery.mockResolvedValueOnce(makeRows([updated]));

      const result = await updateFinding(ORG_ID, FINDING_ID, {
        result: 'negative',
        severity: 'mild',
      });

      expect(result).toEqual(updated);
      const updateSql = mockQuery.mock.calls[1][0];
      expect(updateSql).toContain('UPDATE');
      expect(updateSql).toContain('result = $1');
      expect(updateSql).toContain('severity = $2');
    });

    it('should throw when finding not found or access denied', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await expect(updateFinding(ORG_ID, FINDING_ID, { result: 'negative' })).rejects.toThrow(
        'Finding not found or access denied'
      );
    });

    it('should throw when no valid fields to update', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([{ id: FINDING_ID }]));

      await expect(updateFinding(ORG_ID, FINDING_ID, { invalid_field: 'nope' })).rejects.toThrow(
        'No valid fields to update'
      );
    });
  });

  describe('deleteFinding', () => {
    it('should delete a finding after verifying ownership', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([{ id: FINDING_ID }]));
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await deleteFinding(ORG_ID, FINDING_ID);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery.mock.calls[1][0]).toContain('DELETE');
    });

    it('should throw when finding not found or access denied', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await expect(deleteFinding(ORG_ID, 'nonexistent')).rejects.toThrow(
        'Finding not found or access denied'
      );
    });
  });

  describe('createBatchFindings', () => {
    it('should create multiple findings and return results array', async () => {
      const findings = [
        { encounter_id: ENCOUNTER_ID, body_region: 'Lumbar', test_name: 'SLR' },
        { encounter_id: ENCOUNTER_ID, body_region: 'Cervical', test_name: 'Spurling' },
      ];

      // Each createFinding call does 2 queries (verify + insert)
      mockQuery
        .mockResolvedValueOnce(makeRows([{ id: ENCOUNTER_ID }]))
        .mockResolvedValueOnce(makeRows([{ id: 'f1', test_name: 'SLR' }]))
        .mockResolvedValueOnce(makeRows([{ id: ENCOUNTER_ID }]))
        .mockResolvedValueOnce(makeRows([{ id: 'f2', test_name: 'Spurling' }]));

      const results = await createBatchFindings(ORG_ID, USER_ID, findings);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should capture errors for individual findings without failing the batch', async () => {
      const findings = [{ encounter_id: ENCOUNTER_ID, body_region: 'Lumbar', test_name: 'SLR' }];

      // verify fails
      mockQuery.mockResolvedValueOnce(makeRows([]));

      const results = await createBatchFindings(ORG_ID, USER_ID, findings);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Encounter not found or access denied');
    });
  });

  // ================================================================
  // SUMMARIES & RED FLAGS
  // ================================================================
  describe('getExaminationSummary', () => {
    it('should return the summary for an encounter', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([{ id: ENCOUNTER_ID }]));
      mockQuery.mockResolvedValueOnce(makeRows([{ summary: 'All tests normal' }]));

      const result = await getExaminationSummary(ORG_ID, ENCOUNTER_ID);

      expect(result).toBe('All tests normal');
    });

    it('should return empty string when no summary', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([{ id: ENCOUNTER_ID }]));
      mockQuery.mockResolvedValueOnce(makeRows([{}]));

      const result = await getExaminationSummary(ORG_ID, ENCOUNTER_ID);

      expect(result).toBe('');
    });

    it('should throw when encounter not found', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await expect(getExaminationSummary(ORG_ID, 'nonexistent')).rejects.toThrow(
        'Encounter not found or access denied'
      );
    });
  });

  describe('getRedFlags', () => {
    it('should return red flag findings', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([{ id: ENCOUNTER_ID }]));
      const flags = [{ test_name: 'Babinski', severity: 'high' }];
      mockQuery.mockResolvedValueOnce(makeRows(flags));

      const result = await getRedFlags(ORG_ID, ENCOUNTER_ID);

      expect(result).toEqual(flags);
    });

    it('should throw when encounter not found', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await expect(getRedFlags(ORG_ID, 'nonexistent')).rejects.toThrow(
        'Encounter not found or access denied'
      );
    });
  });

  // ================================================================
  // TEMPLATE SETS
  // ================================================================
  describe('getAllTemplateSets', () => {
    it('should return all template sets for default language', async () => {
      const rows = [{ id: TEMPLATE_ID, template_name: 'Low Back' }];
      mockQuery.mockResolvedValueOnce(makeRows(rows));

      const result = await getAllTemplateSets();

      expect(result).toEqual(rows);
      expect(mockQuery.mock.calls[0][1]).toEqual(['NO']);
    });
  });

  describe('getTemplateSetsByComplaint', () => {
    it('should return templates matching a chief complaint', async () => {
      const rows = [{ id: TEMPLATE_ID }];
      mockQuery.mockResolvedValueOnce(makeRows(rows));

      const result = await getTemplateSetsByComplaint('Ryggsmerter');

      expect(result).toEqual(rows);
      expect(mockQuery.mock.calls[0][1]).toEqual(['Ryggsmerter', 'NO']);
    });
  });

  describe('getTemplateSetById', () => {
    it('should return a single template set', async () => {
      const row = { id: TEMPLATE_ID, template_name: 'Low Back' };
      mockQuery.mockResolvedValueOnce(makeRows([row]));

      const result = await getTemplateSetById(TEMPLATE_ID);

      expect(result).toEqual(row);
    });

    it('should throw when template set not found', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await expect(getTemplateSetById('nonexistent')).rejects.toThrow('Template set not found');
    });
  });

  describe('createTemplateSet', () => {
    it('should create a new template set', async () => {
      const setData = {
        template_name: 'Low Back Exam',
        template_name_no: 'Korsrygg',
        description: 'Standard low back protocol',
        description_no: 'Standard korsrygg protokoll',
        chief_complaint: 'Low back pain',
        chief_complaint_no: 'Korsryggsmerter',
        protocol_ids: [PROTOCOL_ID],
      };
      const created = { id: TEMPLATE_ID, ...setData, is_system: false };
      mockQuery.mockResolvedValueOnce(makeRows([created]));

      const result = await createTemplateSet(setData);

      expect(result).toEqual(created);
      expect(mockQuery.mock.calls[0][0]).toContain('INSERT');
    });
  });

  describe('incrementTemplateSetUsage', () => {
    it('should increment usage_count for a template set', async () => {
      mockQuery.mockResolvedValueOnce(makeRows([]));

      await incrementTemplateSetUsage(TEMPLATE_ID);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery.mock.calls[0][0]).toContain('usage_count = usage_count + 1');
      expect(mockQuery.mock.calls[0][1]).toEqual([TEMPLATE_ID]);
    });
  });

  // ================================================================
  // PURE FUNCTION — mapFindingsToObjective
  // ================================================================
  describe('mapFindingsToObjective', () => {
    it('should merge free-text exam data fields into objective', () => {
      const existing = { observation: 'old' };
      const examData = {
        observation: 'Antalgic gait',
        palpation: 'Tender L4-L5',
        rom: 'Flexion limited',
        ortho_tests: 'SLR positive',
        neuro_tests: 'Reflexes normal',
        vital_signs: 'BP 120/80',
      };

      const result = mapFindingsToObjective(existing, examData);

      expect(result.observation).toBe('Antalgic gait');
      expect(result.palpation).toBe('Tender L4-L5');
      expect(result.rom).toBe('Flexion limited');
      expect(result.ortho_tests).toBe('SLR positive');
      expect(result.neuro_tests).toBe('Reflexes normal');
      expect(result.vital_signs).toBe('BP 120/80');
    });

    it('should build structured_findings from stored findings', () => {
      const existing = { structured_findings: ['Existing finding'] };
      const findings = [
        {
          test_name: 'SLR',
          result: 'positive',
          laterality: 'left',
          findings_text: 'Pain at 45 degrees',
        },
        { test_name: 'Spurling', result: 'negative' },
      ];

      const result = mapFindingsToObjective(existing, {}, findings);

      expect(result.structured_findings).toHaveLength(3);
      expect(result.structured_findings[0]).toBe('Existing finding');
      expect(result.structured_findings[1]).toContain('SLR');
      expect(result.structured_findings[1]).toContain('positive');
      expect(result.structured_findings[1]).toContain('left');
      expect(result.structured_findings[1]).toContain('Pain at 45 degrees');
      expect(result.structured_findings[2]).toContain('Spurling');
    });

    it('should not add structured_findings when no stored findings', () => {
      const existing = {};
      const result = mapFindingsToObjective(existing, { observation: 'test' });

      expect(result.structured_findings).toBeUndefined();
    });

    it('should not modify the original objective object', () => {
      const existing = { observation: 'original' };
      const result = mapFindingsToObjective(existing, { observation: 'new' });

      expect(existing.observation).toBe('original');
      expect(result.observation).toBe('new');
    });
  });
});
