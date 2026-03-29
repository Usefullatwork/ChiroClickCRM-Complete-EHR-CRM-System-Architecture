/**
 * Tests for Sigrun Journal Parser
 * Tests abbreviated treatment parsing, anamnese assessment, practitioner detection,
 * training example generation, and multi-entry parsing
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

// Import AFTER mocks (sigrunJournalParser imports sindreJournalParser internally)
const {
  parseSigrunEntry,
  parseSigrunEntries,
  parseSigrunTreatment,
  parseSigrunAnamnese,
  createSigrunTrainingExamples,
  createSigrunTrainingDataset,
  detectPractitionerStyle,
  SIGRUN_TREATMENT_PATTERNS,
  SIGRUN_ASSESSMENT_PATTERNS,
} = await import('../../../src/services/training/sigrunJournalParser.js');

describe('Sigrun Journal Parser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // Exported Constants
  // ============================================================
  describe('Exported Constants', () => {
    it('should export treatment patterns with Sigrun-specific abbreviations', () => {
      expect(SIGRUN_TREATMENT_PATTERNS).toBeDefined();
      expect(SIGRUN_TREATMENT_PATTERNS['cx mob']).toContain('Cervical');
      expect(SIGRUN_TREATMENT_PATTERNS['tx mob']).toContain('Thoracic');
      expect(SIGRUN_TREATMENT_PATTERNS['lx mob']).toContain('Lumbar');
      expect(SIGRUN_TREATMENT_PATTERNS.tp).toContain('Trigger point');
      expect(SIGRUN_TREATMENT_PATTERNS['som sist']).toContain('sist');
    });

    it('should export assessment patterns with Norwegian improvement phrases', () => {
      expect(SIGRUN_ASSESSMENT_PATTERNS).toBeDefined();
      expect(SIGRUN_ASSESSMENT_PATTERNS.improvement).toContain('bedre');
      expect(SIGRUN_ASSESSMENT_PATTERNS.improvement).toContain('mye bedre');
      expect(SIGRUN_ASSESSMENT_PATTERNS.no_change).toContain('som sist');
      expect(SIGRUN_ASSESSMENT_PATTERNS.worsening).toContain('verre');
      expect(SIGRUN_ASSESSMENT_PATTERNS.location_descriptors).toContain('nakke');
    });
  });

  // ============================================================
  // parseSigrunTreatment
  // ============================================================
  describe('parseSigrunTreatment', () => {
    it('should return empty array for null input', () => {
      expect(parseSigrunTreatment(null)).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(parseSigrunTreatment('')).toEqual([]);
    });

    it('should extract spinal SMT in lowercase style (c2 prs)', () => {
      const result = parseSigrunTreatment('c2 prs');

      const smt = result.find((t) => t.type === 'SMT');
      expect(smt).toBeDefined();
      expect(smt.segment).toBe('C2');
      expect(smt.direction).toBe('PRS');
      expect(smt.practitioner).toBe('Sigrun');
    });

    it('should extract multiple spinal segments', () => {
      const result = parseSigrunTreatment('c2 prs. t5 pl. l4 pr');

      const smtResults = result.filter((t) => t.type === 'SMT');
      expect(smtResults.length).toBe(3);
      expect(smtResults.map((t) => t.segment)).toEqual(expect.arrayContaining(['C2', 'T5', 'L4']));
    });

    it('should extract intensity markers on spinal techniques', () => {
      const result = parseSigrunTreatment('t5 pl++');

      const smt = result.find((t) => t.type === 'SMT' && t.segment === 'T5');
      expect(smt).toBeDefined();
      expect(smt.intensity).toBe(2);
    });

    it('should extract cervical mobilization (cx mob)', () => {
      const result = parseSigrunTreatment('cx mob supine');

      const mob = result.find((t) => t.type === 'Mobilization');
      expect(mob).toBeDefined();
      expect(mob.region).toBe('Cervical');
      expect(mob.practitioner).toBe('Sigrun');
    });

    it('should extract thoracic mobilization (tx mob)', () => {
      const result = parseSigrunTreatment('tx mob prone');

      const mob = result.find((t) => t.type === 'Mobilization');
      expect(mob).toBeDefined();
      expect(mob.region).toBe('Thoracic');
    });

    it('should extract lumbar mobilization (lx mob)', () => {
      const result = parseSigrunTreatment('lx mob side');

      const mob = result.find((t) => t.type === 'Mobilization');
      expect(mob).toBeDefined();
      expect(mob.region).toBe('Lumbar');
    });

    it('should extract IS-ledd adjustments with side', () => {
      const result = parseSigrunTreatment('is-ledd hø');

      const isLedd = result.find((t) => t.type === 'IS-ledd');
      expect(isLedd).toBeDefined();
      expect(isLedd.practitioner).toBe('Sigrun');
    });

    it('should extract massage targets', () => {
      const result = parseSigrunTreatment('mass traps bilat.');

      const massage = result.find((t) => t.type === 'Massage');
      expect(massage).toBeDefined();
      expect(massage.target).toContain('traps');
    });

    it('should extract stretching techniques', () => {
      const result = parseSigrunTreatment('tøy hamstring bilat.');

      const stretch = result.find((t) => t.type === 'Stretching');
      expect(stretch).toBeDefined();
      expect(stretch.target).toContain('hamstring');
    });
  });

  // ============================================================
  // parseSigrunAnamnese
  // ============================================================
  describe('parseSigrunAnamnese', () => {
    it('should return null for null input', () => {
      expect(parseSigrunAnamnese(null)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseSigrunAnamnese('')).toBeNull();
    });

    it('should detect improvement status', () => {
      const result = parseSigrunAnamnese('Mye bedre etter siste behandling.');

      expect(result).toBeDefined();
      expect(result.improvement_status).toBe('improved');
    });

    it('should detect no-change status', () => {
      const result = parseSigrunAnamnese('Som sist, ingen endring.');

      expect(result).toBeDefined();
      expect(result.improvement_status).toBe('unchanged');
    });

    it('should detect worsening status', () => {
      const result = parseSigrunAnamnese('Verre enn sist, mer vondt.');

      expect(result).toBeDefined();
      expect(result.improvement_status).toBe('worsened');
    });

    it('should extract body locations mentioned', () => {
      const result = parseSigrunAnamnese('Bedre i nakke, men fortsatt vondt i skulder og hofte.');

      expect(result.locations).toContain('nakke');
      expect(result.locations).toContain('skulder');
      expect(result.locations).toContain('hofte');
    });

    it('should extract symptoms using sindre parser compatibility', () => {
      const result = parseSigrunAnamnese('Stikkende smerter i nakken etter trening.');

      expect(result.symptoms).toBeDefined();
      expect(result.symptoms.length).toBeGreaterThan(0);
    });

    it('should preserve raw text', () => {
      const text = 'Klart bedre i korsrygg etter øvelser.';
      const result = parseSigrunAnamnese(text);

      expect(result.raw).toBe(text);
    });

    it('should return null improvement_status when no pattern matches', () => {
      const result = parseSigrunAnamnese('Pasienten kommer inn for første gang.');

      expect(result.improvement_status).toBeNull();
    });
  });

  // ============================================================
  // parseSigrunEntry
  // ============================================================
  describe('parseSigrunEntry', () => {
    it('should parse entry with standard Behandling header', () => {
      const text = ['Anamnese: Bedre i nakken.', 'Behandling: cx mob supine. c2 prs.'].join('\n');

      const entry = parseSigrunEntry(text);

      expect(entry.anamnese).toContain('Bedre i nakken');
      expect(entry.behandling).toContain('cx mob');
      expect(entry.practitioner).toBe('Sigrun');
    });

    it('should parse entry with lowercase beh: abbreviation', () => {
      const text = ['Anamnese: Vondt i korsrygg.', 'beh: lx mob. l4 pl.'].join('\n');

      const entry = parseSigrunEntry(text);

      expect(entry.behandling).toContain('lx mob');
      expect(entry.anamnese).toContain('korsrygg');
    });

    it('should parse notat section', () => {
      const text = ['Anamnese: Bedre.', 'Behandling: cx mob.', 'Notat: Kontroll om 2 uker.'].join(
        '\n'
      );

      const entry = parseSigrunEntry(text);

      expect(entry.notat).toContain('Kontroll');
    });

    it('should preserve raw text', () => {
      const text = 'Anamnese: Test.\nBehandling: c2 pr.';

      const entry = parseSigrunEntry(text);

      expect(entry.raw).toBe(text);
    });

    it('should handle entry with only behandling', () => {
      const text = 'Behandling: cx mob supine. t5 pl.';

      const entry = parseSigrunEntry(text);

      expect(entry.behandling).toContain('cx mob');
      expect(entry.anamnese).toBeNull();
    });
  });

  // ============================================================
  // createSigrunTrainingExamples
  // ============================================================
  describe('createSigrunTrainingExamples', () => {
    it('should create followup-to-treatment example when anamnese and behandling present', () => {
      const entry = {
        anamnese: 'Bedre i nakken etter sist.',
        behandling: 'cx mob supine. c2 prs.',
        notat: null,
        practitioner: 'Sigrun',
      };

      const examples = createSigrunTrainingExamples(entry);

      const followup = examples.find((e) => e.type === 'followup_to_treatment');
      expect(followup).toBeDefined();
      expect(followup.practitioner).toBe('Sigrun');
      expect(followup.prompt).toContain('Subjektivt');
      expect(followup.response).toContain('cx mob');
    });

    it('should create treatment extraction example when behandling has techniques', () => {
      const entry = {
        anamnese: null,
        behandling: 'cx mob supine. c2 prs.',
        notat: null,
        practitioner: 'Sigrun',
      };

      const examples = createSigrunTrainingExamples(entry);

      const extraction = examples.find((e) => e.type === 'treatment_extraction_sigrun');
      expect(extraction).toBeDefined();
      expect(extraction.practitioner).toBe('Sigrun');
    });

    it('should create progress assessment example when improvement detected', () => {
      const entry = {
        anamnese: 'Mye bedre i skulder og nakke.',
        behandling: null,
        notat: null,
        practitioner: 'Sigrun',
      };

      const examples = createSigrunTrainingExamples(entry);

      const progress = examples.find((e) => e.type === 'progress_assessment');
      expect(progress).toBeDefined();
      expect(progress.response).toContain('improved');
    });

    it('should include metadata with improvement status and locations', () => {
      const entry = {
        anamnese: 'Klart bedre i nakke.',
        behandling: 'cx mob.',
        notat: null,
        practitioner: 'Sigrun',
      };

      const examples = createSigrunTrainingExamples(entry);

      const followup = examples.find((e) => e.type === 'followup_to_treatment');
      expect(followup.metadata).toBeDefined();
      expect(followup.metadata.improvement_status).toBe('improved');
      expect(followup.metadata.locations).toContain('nakke');
    });

    it('should return empty array for entry with no content', () => {
      const entry = {
        anamnese: null,
        behandling: null,
        notat: null,
        practitioner: 'Sigrun',
      };

      const examples = createSigrunTrainingExamples(entry);
      expect(examples).toEqual([]);
    });
  });

  // ============================================================
  // parseSigrunEntries
  // ============================================================
  describe('parseSigrunEntries', () => {
    it('should split text by Anamnese keyword', () => {
      const blob = [
        'Anamnese: Bedre i nakken.',
        'Behandling: cx mob.',
        '',
        'Anamnese: Vondt i korsrygg.',
        'Behandling: lx mob. l4 pl.',
      ].join('\n');

      const entries = parseSigrunEntries(blob);

      expect(entries.length).toBe(2);
    });

    it('should split text by date patterns (DD.MM.YYYY)', () => {
      const blob = [
        '15.03.2026',
        'Anamnese: Bedre i nakken.',
        'Behandling: cx mob.',
        '22.03.2026',
        'Anamnese: Fortsatt vondt i skulder.',
        'Behandling: tx mob.',
      ].join('\n');

      const entries = parseSigrunEntries(blob);

      expect(entries.length).toBeGreaterThanOrEqual(1);
    });

    it('should ignore very short sections (under 15 chars)', () => {
      const blob = 'Kort.\nAnamnese: Bedre i nakken etter forrige behandling.\nBehandling: cx mob.';

      const entries = parseSigrunEntries(blob);

      entries.forEach((entry) => {
        expect(entry.anamnese || entry.behandling).toBeTruthy();
      });
    });

    it('should return empty array for empty input', () => {
      const entries = parseSigrunEntries('');
      expect(entries).toEqual([]);
    });

    it('should set practitioner to Sigrun on all entries', () => {
      const blob = ['Anamnese: Bedre i nakken.', 'Behandling: cx mob supine.'].join('\n');

      const entries = parseSigrunEntries(blob);

      entries.forEach((entry) => {
        expect(entry.practitioner).toBe('Sigrun');
      });
    });
  });

  // ============================================================
  // createSigrunTrainingDataset
  // ============================================================
  describe('createSigrunTrainingDataset', () => {
    it('should create dataset with examples and statistics', () => {
      const text = [
        'Anamnese: Mye bedre i nakke og skulder.',
        'Behandling: cx mob supine. c2 prs. tx mob.',
      ].join('\n');

      const dataset = createSigrunTrainingDataset(text);

      expect(dataset.examples).toBeDefined();
      expect(dataset.examples.length).toBeGreaterThan(0);
      expect(dataset.practitioner).toBe('Sigrun');
      expect(dataset.statistics).toBeDefined();
      expect(dataset.statistics.total_entries).toBeGreaterThan(0);
    });

    it('should categorize examples by type in statistics', () => {
      const text = ['Anamnese: Bedre i nakken.', 'Behandling: cx mob. c2 pr.'].join('\n');

      const dataset = createSigrunTrainingDataset(text);

      expect(dataset.statistics.example_types).toBeDefined();
      expect(typeof dataset.statistics.example_types.followup_to_treatment).toBe('number');
      expect(typeof dataset.statistics.example_types.treatment_extraction).toBe('number');
      expect(typeof dataset.statistics.example_types.progress_assessment).toBe('number');
    });

    it('should return empty examples for unparseable text', () => {
      const dataset = createSigrunTrainingDataset('Bare tilfeldig tekst.');

      expect(dataset.examples).toEqual([]);
      expect(dataset.statistics.total_entries).toBe(0);
    });
  });

  // ============================================================
  // detectPractitionerStyle
  // ============================================================
  describe('detectPractitionerStyle', () => {
    it('should detect Sigrun style from lowercase abbreviations', () => {
      const text = 'beh: cx mob supine. c2 prs. tp traps.';

      const result = detectPractitionerStyle(text);

      expect(result.practitioner).toBe('Sigrun');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect Sindre style from uppercase technique abbreviations', () => {
      const text = 'SMT C4 PR. EMT calcaneus Hø. IMS traps bilat.';

      const result = detectPractitionerStyle(text);

      expect(result.practitioner).toBe('Sindre');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return Unknown when no clear indicators', () => {
      const text = 'Generelt behandlingsnotat uten spesifikke teknikker.';

      const result = detectPractitionerStyle(text);

      expect(result.practitioner).toBe('Unknown');
      expect(result.confidence).toBe(0);
    });

    it('should detect Sigrun from som sist pattern', () => {
      const text = 'beh: som sist.';

      const result = detectPractitionerStyle(text);

      expect(result.practitioner).toBe('Sigrun');
    });

    it('should detect Sindre from formal journal markers', () => {
      const text =
        'Sykdommer/Skader/Operasjoner: Ingen.\nPasienten er informert om behandlingsplan.';

      const result = detectPractitionerStyle(text);

      expect(result.practitioner).toBe('Sindre');
    });

    it('should return confidence as ratio of matching indicators', () => {
      const text = 'SMT C4 PR. EMT talus. IMS traps.';

      const result = detectPractitionerStyle(text);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});
