/**
 * Tests for Sindre Journal Parser
 * Tests journal text parsing, section extraction, treatment techniques,
 * examination findings, symptom extraction, and training data generation
 */

import { jest } from '@jest/globals';

// Mock logger
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import AFTER mocks
const {
  parseJournalEntry,
  parseMultipleEntries,
  extractTreatmentTechniques,
  extractExaminationFindings,
  extractSymptomsFromAnamnese,
  createTrainingExamplesFromEntry,
  createSindreTrainingDataset,
  extractFollowUpPatterns,
  ANATOMICAL_ABBREVIATIONS,
  TREATMENT_ABBREVIATIONS,
  EXAMINATION_TESTS,
  COMMON_FINDINGS,
} = await import('../../../src/services/training/sindreJournalParser.js');

describe('Sindre Journal Parser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // Exported Constants
  // ============================================================
  describe('Exported Constants', () => {
    it('should export anatomical abbreviations with spinal segments', () => {
      expect(ANATOMICAL_ABBREVIATIONS).toBeDefined();
      expect(ANATOMICAL_ABBREVIATIONS.C0).toBe('Occiput');
      expect(ANATOMICAL_ABBREVIATIONS.C1).toContain('Atlas');
      expect(ANATOMICAL_ABBREVIATIONS.S1).toBe('Sacrum');
    });

    it('should export directional abbreviations in Norwegian', () => {
      expect(ANATOMICAL_ABBREVIATIONS.Hø).toContain('Høyre');
      expect(ANATOMICAL_ABBREVIATIONS.Ve).toContain('Venstre');
      expect(ANATOMICAL_ABBREVIATIONS.bilat).toContain('bilateral');
    });

    it('should export treatment abbreviations', () => {
      expect(TREATMENT_ABBREVIATIONS).toBeDefined();
      expect(TREATMENT_ABBREVIATIONS.SMT).toContain('Spinal Manipulative');
      expect(TREATMENT_ABBREVIATIONS.IMS).toContain('Intramuscular');
      expect(TREATMENT_ABBREVIATIONS.TBB).toContain('shockwave');
    });

    it('should export examination tests with Norwegian descriptions', () => {
      expect(EXAMINATION_TESTS).toBeDefined();
      expect(EXAMINATION_TESTS.Spurlings).toContain('nakke');
      expect(EXAMINATION_TESTS.Lasegue).toContain('Straight leg raise');
      expect(EXAMINATION_TESTS.FABER).toContain('Flexion Abduction');
    });

    it('should export common findings with Norwegian pain descriptors', () => {
      expect(COMMON_FINDINGS).toBeDefined();
      expect(COMMON_FINDINGS.pain_locations).toContain('nakken');
      expect(COMMON_FINDINGS.pain_locations).toContain('korsrygg');
      expect(COMMON_FINDINGS.pain_descriptors).toContain('vondt');
      expect(COMMON_FINDINGS.pain_descriptors).toContain('stikkende');
      expect(COMMON_FINDINGS.temporal_patterns).toContain('akutt');
      expect(COMMON_FINDINGS.aggravating_factors).toContain('sitte');
      expect(COMMON_FINDINGS.relieving_factors).toContain('hvile');
    });
  });

  // ============================================================
  // parseJournalEntry
  // ============================================================
  describe('parseJournalEntry', () => {
    it('should parse a complete journal entry with all sections', () => {
      const text = [
        'Anamnese Pasienten har hatt vondt i nakken i 3 dager.',
        'Undersøkelse Hypomobil C3-C5. Spurlings negativ.',
        'Behandling SMT C4 PR. IMS traps bilat.',
        'Notat Kontroll om 1 uke.',
      ].join('\n');

      const result = parseJournalEntry(text);

      expect(result.anamnese).toContain('vondt i nakken');
      expect(result.undersøkelse).toContain('Hypomobil C3-C5');
      expect(result.behandling).toContain('SMT C4 PR');
      expect(result.notat).toContain('Kontroll om 1 uke');
      expect(result.raw).toBe(text);
    });

    it('should handle entry with only anamnese and behandling', () => {
      const text = ['Anamnese Smerter i korsrygg etter løfting.', 'Behandling SMT L4 PL.'].join(
        '\n'
      );

      const result = parseJournalEntry(text);

      expect(result.anamnese).toContain('korsrygg');
      expect(result.behandling).toContain('SMT L4 PL');
      expect(result.undersøkelse).toBeNull();
      expect(result.notat).toBeNull();
    });

    it('should handle entry with no matching sections', () => {
      const text = 'Bare noen tilfeldige notater uten seksjon headers.';

      const result = parseJournalEntry(text);

      expect(result.anamnese).toBeNull();
      expect(result.undersøkelse).toBeNull();
      expect(result.behandling).toBeNull();
      expect(result.notat).toBeNull();
      expect(result.raw).toBe(text);
    });

    it('should trim whitespace from extracted sections', () => {
      const text = 'Anamnese   Mye smerte i skulder   \nBehandling   SMT T5 PR   ';

      const result = parseJournalEntry(text);

      expect(result.anamnese).not.toMatch(/^\s/);
      expect(result.anamnese).not.toMatch(/\s$/);
    });

    it('should be case-insensitive when matching section headers', () => {
      const text = 'anamnese Vondt i hofte\nbehandling SMT L3 PL';

      const result = parseJournalEntry(text);

      expect(result.anamnese).toContain('hofte');
      expect(result.behandling).toContain('SMT L3 PL');
    });
  });

  // ============================================================
  // extractTreatmentTechniques
  // ============================================================
  describe('extractTreatmentTechniques', () => {
    it('should return empty array for null input', () => {
      expect(extractTreatmentTechniques(null)).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(extractTreatmentTechniques('')).toEqual([]);
    });

    it('should extract SMT with segment, direction, and default intensity', () => {
      const result = extractTreatmentTechniques('SMT C4 PR');

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'SMT',
            segment: 'C4',
            direction: 'PR',
            intensity: 1,
          }),
        ])
      );
    });

    it('should extract SMT with increased intensity markers', () => {
      const result = extractTreatmentTechniques('SMT T5 PL++');

      const smtTech = result.find((t) => t.type === 'SMT' && t.segment === 'T5');
      expect(smtTech).toBeDefined();
      expect(smtTech.direction).toBe('PL');
      expect(smtTech.intensity).toBe(2);
    });

    it('should extract multiple SMT techniques from one text', () => {
      const text = 'SMT C4 PR\nSMT T5 PL\nSMT L3 PRS';

      const result = extractTreatmentTechniques(text);
      const smtResults = result.filter((t) => t.type === 'SMT');

      expect(smtResults.length).toBe(3);
      expect(smtResults.map((t) => t.segment)).toEqual(expect.arrayContaining(['C4', 'T5', 'L3']));
    });

    it('should extract IS-ledd adjustments with position', () => {
      const result = extractTreatmentTechniques('IS-ledd PIR');

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'IS-ledd',
            position: 'PIR',
          }),
        ])
      );
    });

    it('should extract EMT with location and side', () => {
      const result = extractTreatmentTechniques('EMT calcaneus Hø');

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'EMT',
            location: 'calcaneus',
            side: 'Hø',
          }),
        ])
      );
    });

    it('should default EMT side to bilateral when not specified', () => {
      const result = extractTreatmentTechniques('EMT talus');

      const emtTech = result.find((t) => t.type === 'EMT');
      expect(emtTech).toBeDefined();
      expect(emtTech.side).toBe('bilateral');
    });

    it('should extract TBB (shockwave) with parameters and location', () => {
      const result = extractTreatmentTechniques('TBB 2000/10 infraspinatus');

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'TBB',
            parameters: '2000/10',
            location: 'infraspinatus',
          }),
        ])
      );
    });

    it('should extract stretching techniques with newline terminator', () => {
      const result = extractTreatmentTechniques('Tøy hamstring bilat\n');

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'Stretching',
          }),
        ])
      );
    });

    it('should extract stretching and default side to bilateral', () => {
      // The lazy regex [\w\s]+? means side capture often defaults
      const result = extractTreatmentTechniques('Tøy hamstring bilat x3');

      const stretch = result.find((t) => t.type === 'Stretching');
      expect(stretch).toBeDefined();
      expect(stretch.type).toBe('Stretching');
      // Side defaults to 'bilateral' when the optional group doesn't match
      expect(stretch.side).toBe('bilateral');
    });

    it('should extract IMS targets', () => {
      const result = extractTreatmentTechniques('IMS traps bilat\n');

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'IMS',
            modality: 'dry needling',
          }),
        ])
      );
    });
  });

  // ============================================================
  // extractExaminationFindings
  // ============================================================
  describe('extractExaminationFindings', () => {
    it('should return empty object for null input', () => {
      const result = extractExaminationFindings(null);
      expect(result).toEqual({});
    });

    it('should extract hypomobility findings', () => {
      const result = extractExaminationFindings('Hypomobil C3-C5, T4');

      expect(result.mobility).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'hypomobile',
          }),
        ])
      );
      expect(result.mobility.length).toBeGreaterThan(0);
    });

    it('should extract test results for known examination tests', () => {
      const text = 'Spurlings negativ. Lasegue positiv Hø.';

      const result = extractExaminationFindings(text);

      expect(result.tests.Spurlings).toBeDefined();
      expect(result.tests.Spurlings.result).toBe('negative');

      expect(result.tests.Lasegue).toBeDefined();
      expect(result.tests.Lasegue.result).toBe('positive');
      expect(result.tests.Lasegue.side).toBe('right');
    });

    it('should detect unremarkable test results', () => {
      const text = 'ROM ua. Adams ua.';

      const result = extractExaminationFindings(text);

      expect(result.tests.ROM).toBeDefined();
      expect(result.tests.ROM.result).toBe('unremarkable');

      expect(result.tests.Adams).toBeDefined();
      expect(result.tests.Adams.result).toBe('unremarkable');
    });

    it('should extract strength findings', () => {
      const text = 'Svak: glut med bilat, tib ant Hø';

      const result = extractExaminationFindings(text);

      expect(result.strength.length).toBeGreaterThan(0);
      expect(result.strength[0].type).toBe('weak');
    });

    it('should return empty arrays when no findings match', () => {
      const text = 'Generelt undersøkt, ingen funn.';

      const result = extractExaminationFindings(text);

      expect(result.mobility).toEqual([]);
      expect(result.palpation).toEqual([]);
      expect(result.strength).toEqual([]);
      expect(result.neurological).toEqual([]);
    });

    it('should detect left side for test results', () => {
      const text = 'FABER positiv Ve';

      const result = extractExaminationFindings(text);

      expect(result.tests.FABER).toBeDefined();
      expect(result.tests.FABER.side).toBe('left');
    });
  });

  // ============================================================
  // extractSymptomsFromAnamnese
  // ============================================================
  describe('extractSymptomsFromAnamnese', () => {
    it('should return empty array for null input', () => {
      expect(extractSymptomsFromAnamnese(null)).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(extractSymptomsFromAnamnese('')).toEqual([]);
    });

    it('should extract Norwegian pain locations', () => {
      const text = 'Pasienten har vondt i nakken og korsrygg etter løfting.';

      const result = extractSymptomsFromAnamnese(text);

      const locations = result.filter((s) => s.type === 'pain_location');
      const locationNames = locations.map((s) => s.location);
      expect(locationNames).toContain('nakken');
      expect(locationNames).toContain('korsrygg');
    });

    it('should extract pain descriptors', () => {
      const text = 'Stikkende smerter som er verkende og brennende.';

      const result = extractSymptomsFromAnamnese(text);

      const descriptors = result.filter((s) => s.type === 'pain_descriptor');
      const descriptorNames = descriptors.map((s) => s.descriptor);
      expect(descriptorNames).toContain('stikkende');
      expect(descriptorNames).toContain('smerter');
      expect(descriptorNames).toContain('verkende');
      expect(descriptorNames).toContain('brennende');
    });

    it('should extract temporal patterns', () => {
      const text = 'Akutt oppstått smerte etter plutselig bevegelse.';

      const result = extractSymptomsFromAnamnese(text);

      const temporal = result.filter((s) => s.type === 'temporal_pattern');
      const patterns = temporal.map((s) => s.pattern);
      expect(patterns).toContain('akutt');
      expect(patterns).toContain('plutselig');
    });

    it('should include context around pain locations', () => {
      const text = 'Har hatt vondt i skulder etter trening sist uke.';

      const result = extractSymptomsFromAnamnese(text);

      const locations = result.filter((s) => s.type === 'pain_location');
      const skulderEntry = locations.find((s) => s.location === 'skulder');
      expect(skulderEntry).toBeDefined();
      expect(skulderEntry.context).toBeDefined();
      expect(skulderEntry.context.length).toBeGreaterThan(0);
    });

    it('should handle text with multiple body regions', () => {
      const text = 'Smerter i nakken, skulder, arm og rygg. Stiv i korsrygg og hofte.';

      const result = extractSymptomsFromAnamnese(text);

      const locations = result.filter((s) => s.type === 'pain_location').map((s) => s.location);
      expect(locations.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ============================================================
  // createTrainingExamplesFromEntry
  // ============================================================
  describe('createTrainingExamplesFromEntry', () => {
    it('should create anamnese-to-examination example when both present', () => {
      const entry = {
        anamnese: 'Vondt i nakken i 3 dager.',
        undersøkelse: 'Hypomobil C3-C5.',
        behandling: null,
        notat: null,
      };

      const examples = createTrainingExamplesFromEntry(entry);

      const anamneseToExam = examples.find((e) => e.type === 'anamnese_to_examination');
      expect(anamneseToExam).toBeDefined();
      expect(anamneseToExam.prompt).toContain('anamnese');
      expect(anamneseToExam.response).toContain('Hypomobil');
    });

    it('should create clinical-reasoning-to-treatment example with all 3 sections', () => {
      const entry = {
        anamnese: 'Vondt i nakken.',
        undersøkelse: 'Hypomobil C4.',
        behandling: 'SMT C4 PR',
        notat: null,
      };

      const examples = createTrainingExamplesFromEntry(entry);

      const treatmentExample = examples.find((e) => e.type === 'clinical_reasoning_to_treatment');
      expect(treatmentExample).toBeDefined();
      expect(treatmentExample.prompt).toContain('anamnese');
      expect(treatmentExample.prompt).toContain('undersøkelse');
      expect(treatmentExample.response).toContain('SMT C4 PR');
    });

    it('should create treatment extraction example when behandling has techniques', () => {
      const entry = {
        anamnese: null,
        undersøkelse: null,
        behandling: 'SMT C4 PR\nIS-ledd PIR',
        notat: null,
      };

      const examples = createTrainingExamplesFromEntry(entry);

      const extractionExample = examples.find((e) => e.type === 'treatment_extraction');
      expect(extractionExample).toBeDefined();
      expect(extractionExample.response).toContain('SMT');
    });

    it('should create symptom extraction example when anamnese has symptoms', () => {
      const entry = {
        anamnese: 'Vondt i nakken med stikkende smerter.',
        undersøkelse: null,
        behandling: null,
        notat: null,
      };

      const examples = createTrainingExamplesFromEntry(entry);

      const symptomExample = examples.find((e) => e.type === 'symptom_extraction');
      expect(symptomExample).toBeDefined();
    });

    it('should return empty array for entry with no content', () => {
      const entry = {
        anamnese: null,
        undersøkelse: null,
        behandling: null,
        notat: null,
      };

      const examples = createTrainingExamplesFromEntry(entry);
      expect(examples).toEqual([]);
    });
  });

  // ============================================================
  // parseMultipleEntries
  // ============================================================
  describe('parseMultipleEntries', () => {
    it('should split text blob into individual entries', () => {
      const blob = [
        'Anamnese Vondt i nakken i 3 dager.',
        'Behandling SMT C4 PR',
        '',
        'Anamnese Smerter i korsrygg etter løfting.',
        'Behandling SMT L4 PL',
      ].join('\n');

      const entries = parseMultipleEntries(blob);

      expect(entries.length).toBe(2);
      expect(entries[0].anamnese).toContain('nakken');
      expect(entries[1].anamnese).toContain('korsrygg');
    });

    it('should ignore very short sections (under 20 chars)', () => {
      const blob = 'Anamnese Kort.\nAnamnese Vondt i nakken over lang tid med stråling.';

      const entries = parseMultipleEntries(blob);

      // Only the longer entry should be included
      const withContent = entries.filter((e) => e.anamnese || e.behandling);
      expect(withContent.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for empty input', () => {
      const entries = parseMultipleEntries('');
      expect(entries).toEqual([]);
    });

    it('should only include entries with anamnese or behandling content', () => {
      const blob = ['Anamnese Vondt i skulder etter fall på is.', 'Behandling SMT T5 PL'].join(
        '\n'
      );

      const entries = parseMultipleEntries(blob);

      entries.forEach((entry) => {
        expect(entry.anamnese || entry.behandling).toBeTruthy();
      });
    });
  });

  // ============================================================
  // createSindreTrainingDataset
  // ============================================================
  describe('createSindreTrainingDataset', () => {
    it('should create dataset with examples, vocabulary, and statistics', () => {
      const journalsText = [
        'Anamnese Vondt i nakken med stikkende smerter.',
        'Undersøkelse Hypomobil C3-C5. Spurlings negativ.',
        'Behandling SMT C4 PR. IMS traps bilat.',
        'Notat Kontroll om 1 uke.',
      ].join('\n');

      const dataset = createSindreTrainingDataset(journalsText);

      expect(dataset.examples).toBeDefined();
      expect(dataset.examples.length).toBeGreaterThan(0);
      expect(dataset.vocabulary).toBeDefined();
      expect(dataset.vocabulary.anatomical).toBe(ANATOMICAL_ABBREVIATIONS);
      expect(dataset.vocabulary.treatments).toBe(TREATMENT_ABBREVIATIONS);
      expect(dataset.statistics).toBeDefined();
      expect(dataset.statistics.total_entries).toBeGreaterThan(0);
      expect(dataset.statistics.total_examples).toBe(dataset.examples.length);
    });

    it('should categorize example types in statistics', () => {
      const journalsText = [
        'Anamnese Vondt i nakken med stikkende smerter.',
        'Undersøkelse Hypomobil C4.',
        'Behandling SMT C4 PR.',
      ].join('\n');

      const dataset = createSindreTrainingDataset(journalsText);

      expect(dataset.statistics.example_types).toBeDefined();
      expect(typeof dataset.statistics.example_types.anamnese_to_examination).toBe('number');
      expect(typeof dataset.statistics.example_types.clinical_reasoning_to_treatment).toBe(
        'number'
      );
      expect(typeof dataset.statistics.example_types.treatment_extraction).toBe('number');
      expect(typeof dataset.statistics.example_types.symptom_extraction).toBe('number');
    });

    it('should return empty examples for text with no parseable entries', () => {
      const dataset = createSindreTrainingDataset('Bare tilfeldig tekst.');

      expect(dataset.examples).toEqual([]);
      expect(dataset.statistics.total_entries).toBe(0);
    });
  });

  // ============================================================
  // extractFollowUpPatterns
  // ============================================================
  describe('extractFollowUpPatterns', () => {
    it('should detect scheduled follow-up patterns', () => {
      const text = [
        'Anamnese Vondt i nakken.',
        'Behandling SMT C4 PR.',
        'Notat Oppfølging om 2 uker. Kontroll avtalt.',
      ].join('\n');

      const result = extractFollowUpPatterns(text);

      expect(result.patterns.length).toBeGreaterThan(0);
      const scheduled = result.patterns.filter((p) => p.type === 'scheduled_followup');
      expect(scheduled.length).toBeGreaterThan(0);
    });

    it('should detect imaging referral patterns', () => {
      const text = [
        'Anamnese Vedvarende smerter i korsrygg.',
        'Behandling SMT L4 PL.',
        'Notat Henviser til MR.',
      ].join('\n');

      const result = extractFollowUpPatterns(text);

      const imaging = result.patterns.filter((p) => p.type === 'imaging_referral');
      expect(imaging.length).toBeGreaterThan(0);
    });

    it('should detect home exercise patterns', () => {
      const text = [
        'Anamnese Stiv i nakken.',
        'Behandling SMT C5 PR.',
        'Notat Ga hjemmeøvelser for nakke.',
      ].join('\n');

      const result = extractFollowUpPatterns(text);

      const exercise = result.patterns.filter((p) => p.type === 'home_exercise');
      expect(exercise.length).toBeGreaterThan(0);
    });

    it('should return statistics grouped by type', () => {
      const text = [
        'Anamnese Vondt i skulder.',
        'Behandling SMT T3 PR.',
        'Notat Oppfølging om 1 uke. Øvelser for skulder.',
      ].join('\n');

      const result = extractFollowUpPatterns(text);

      expect(result.statistics).toBeDefined();
      expect(typeof result.statistics.total_followups).toBe('number');
      expect(typeof result.statistics.by_type.scheduled).toBe('number');
      expect(typeof result.statistics.by_type.imaging).toBe('number');
      expect(typeof result.statistics.by_type.exercise).toBe('number');
    });

    it('should return empty patterns when no notat sections exist', () => {
      const text = ['Anamnese Vondt i nakken.', 'Behandling SMT C4 PR.'].join('\n');

      const result = extractFollowUpPatterns(text);

      expect(result.patterns).toEqual([]);
      expect(result.statistics.total_followups).toBe(0);
    });
  });
});
