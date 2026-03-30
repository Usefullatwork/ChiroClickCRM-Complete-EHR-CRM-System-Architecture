/**
 * Unit Tests for Clinical Data Parser (src/services/clinical/clinicalDataParser.js)
 * Tests parsing of Norwegian clinical notes into structured training data
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const {
  parseClinicalCase,
  extractFindings,
  extractTreatment,
  classifyCase,
  convertToTrainingExample,
  convertToJSONL,
} = await import('../../../src/services/clinical/clinicalDataParser.js');

describe('clinicalDataParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // parseClinicalCase
  // ===========================================================================
  describe('parseClinicalCase', () => {
    it('should extract anamnese section', () => {
      const text = 'Anamnese: Pasient har hatt smerter i 3 uker. Undersøkelse: ROM nedsatt.';
      const result = parseClinicalCase(text);
      expect(result.anamnese).toContain('Pasient har hatt smerter i 3 uker');
    });

    it('should extract undersokelse section with subsections', () => {
      const text =
        'Undersøkelse: Inspeksjon: Normal holdning.\nROM: Nedsatt fleksjon.\nPalpasjon: Øm L4-L5.\nBehandling: Mobilisering.';
      const result = parseClinicalCase(text);
      expect(result.undersokelse.inspeksjon).toContain('Normal holdning');
      expect(result.undersokelse.rom).toContain('Nedsatt fleksjon');
    });

    it('should extract behandling section', () => {
      const text = 'Behandling: Leddjustering L4-L5. Konklusjon: Fasettleddsdysfunksjon.';
      const result = parseClinicalCase(text);
      expect(result.behandling).toContain('Leddjustering L4-L5');
    });

    it('should extract konklusjon section', () => {
      const text = 'Konklusjon: Mekanisk ryggsmerte. Oppfølging: Ny time om 1 uke.';
      const result = parseClinicalCase(text);
      expect(result.konklusjon).toContain('Mekanisk ryggsmerte');
    });

    it('should extract oppfolging notes', () => {
      const text = 'Oppfølging: Pasient melder bedring etter behandling.';
      const result = parseClinicalCase(text);
      expect(result.oppfolging.length).toBeGreaterThan(0);
      expect(result.oppfolging[0]).toContain('Pasient melder bedring');
    });

    it('should return null on error (non-string input that crashes regex)', () => {
      // If text.match throws, parseClinicalCase catches and returns null
      const result = parseClinicalCase(null);
      expect(result).toBeNull();
    });

    it('should return default sections for empty text', () => {
      const result = parseClinicalCase('');
      expect(result).toBeDefined();
      expect(result.anamnese).toBe('');
      expect(result.oppfolging).toEqual([]);
    });

    it('should handle text with Beh: abbreviation', () => {
      const text = 'Beh: Traksjon og mobilisering. Konklusjon: Bra.';
      const result = parseClinicalCase(text);
      expect(result.behandling).toContain('Traksjon og mobilisering');
    });

    it('should extract palpasjon with abbreviated keyword Palp', () => {
      const text = 'Undersøkelse: Palp: Øm over processus spinosus L5. Behandling: Justering.';
      const result = parseClinicalCase(text);
      expect(result.undersokelse.palpasjon).toContain('Øm over processus spinosus L5');
    });

    it('should handle complete case note with all sections', () => {
      const text = `Anamnese: Smerter i korsryggen i 2 uker.
Undersøkelse: ROM: Nedsatt. Palp: Øm L4. O/N: SLR negativ.
Behandling: Mobilisering L4-L5.
Konklusjon: Lumbal fasettleddsdysfunksjon.
Oppfølging: Ny time om 1 uke.`;
      const result = parseClinicalCase(text);
      expect(result.anamnese).toBeTruthy();
      expect(result.behandling).toBeTruthy();
      expect(result.konklusjon).toBeTruthy();
      expect(result.oppfolging.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // extractFindings
  // ===========================================================================
  describe('extractFindings', () => {
    it('should extract positive findings with (+) notation', () => {
      const text = '(+) Kemps test høyre';
      const result = extractFindings(text);
      expect(result.positive.length).toBeGreaterThan(0);
    });

    it('should extract negative findings with (-) notation', () => {
      const text = '(-) SLR begge sider';
      const result = extractFindings(text);
      expect(result.negative.length).toBeGreaterThan(0);
    });

    it('should extract "nedsatt" as positive finding', () => {
      const text = 'nedsatt fleksjon i lumbal';
      const result = extractFindings(text);
      expect(result.positive.length).toBeGreaterThan(0);
    });

    it('should extract "normal" as negative finding', () => {
      const text = 'normal nevrologisk status';
      const result = extractFindings(text);
      expect(result.negative.length).toBeGreaterThan(0);
    });

    it('should extract "ingen" as negative finding', () => {
      const text = 'ingen utstråling til bena';
      const result = extractFindings(text);
      expect(result.negative.length).toBeGreaterThan(0);
    });

    it('should return both positive and negative findings', () => {
      const text = 'nedsatt ROM nakke. Normal kraft. (+) Spurlings.';
      const result = extractFindings(text);
      expect(result.positive.length).toBeGreaterThan(0);
      expect(result.negative.length).toBeGreaterThan(0);
    });

    it('should extract palp.øm pattern as positive', () => {
      const text = 'palp.øm over C5-C6';
      const result = extractFindings(text);
      expect(result.positive.length).toBeGreaterThan(0);
    });

    it('should return empty arrays for text with no findings', () => {
      const text = 'Generell vurdering utført.';
      const result = extractFindings(text);
      expect(result.positive).toEqual([]);
      expect(result.negative).toEqual([]);
    });
  });

  // ===========================================================================
  // extractTreatment
  // ===========================================================================
  describe('extractTreatment', () => {
    it('should extract manipulation (Leddjustering)', () => {
      const text = 'Leddjustering L4-L5 og T5-T6.';
      const result = extractTreatment(text);
      expect(result.manipulation.length).toBeGreaterThan(0);
    });

    it('should extract soft tissue techniques (Trp, bvm, ART)', () => {
      const text = 'Trp behandling av levator scapulae.';
      const result = extractTreatment(text);
      expect(result.soft_tissue.length).toBeGreaterThan(0);
    });

    it('should extract exercises', () => {
      const text = 'Øvelser: Chin tucks og bryststrekkøvelser.';
      const result = extractTreatment(text);
      expect(result.exercises.length).toBeGreaterThan(0);
    });

    it('should extract advice', () => {
      const text = 'Råd om ergonomi og pauser ved skrivebordsarbeid.';
      const result = extractTreatment(text);
      expect(result.advice.length).toBeGreaterThan(0);
    });

    it('should return empty arrays for generic text', () => {
      const text = 'Pasienten ble behandlet.';
      const result = extractTreatment(text);
      expect(result.manipulation).toEqual([]);
      expect(result.soft_tissue).toEqual([]);
      expect(result.exercises).toEqual([]);
      expect(result.advice).toEqual([]);
    });
  });

  // ===========================================================================
  // classifyCase
  // ===========================================================================
  describe('classifyCase', () => {
    it('should classify cervical region from "nakke"', () => {
      const result = classifyCase('Pasient med smerter i nakke og hodepine.');
      expect(result.region).toContain('Cervical');
    });

    it('should classify lumbar region from "korsrygg"', () => {
      const result = classifyCase('Korsrygg smerter etter løft.');
      expect(result.region).toContain('Lumbar');
    });

    it('should classify myalgi pathology', () => {
      const result = classifyCase('Triggerpunkt i trapezius.');
      expect(result.pathology).toContain('Myalgi');
    });

    it('should classify BPPV pathology', () => {
      const result = classifyCase('Positiv Dix-Hallpike test. Svimmelhet.');
      expect(result.pathology).toContain('BPPV');
    });

    it('should classify multiple regions', () => {
      const result = classifyCase('Smerter i nakke og korsrygg.');
      expect(result.region).toContain('Cervical');
      expect(result.region).toContain('Lumbar');
    });

    it('should set primary category to first detected region', () => {
      const result = classifyCase('Cervical smerte.');
      expect(result.category).toBe('Cervical');
    });

    it('should return empty arrays for text without region/pathology keywords', () => {
      const result = classifyCase('Generell konsultasjon.');
      expect(result.region).toEqual([]);
      expect(result.pathology).toEqual([]);
      expect(result.category).toBe('');
    });

    it('should not duplicate regions', () => {
      const result = classifyCase('nakke nakke nakke cervical');
      expect(result.region.filter((r) => r === 'Cervical').length).toBe(1);
    });

    it('should detect pelvis region from bekken', () => {
      const result = classifyCase('Bekkensmerter og IS ledd dysfunksjon.');
      expect(result.region).toContain('Pelvis');
    });

    it('should classify shoulder region', () => {
      const result = classifyCase('Skulder smerter med rotator cuff problem.');
      expect(result.region).toContain('Shoulder');
    });
  });

  // ===========================================================================
  // convertToTrainingExample
  // ===========================================================================
  describe('convertToTrainingExample', () => {
    it('should convert full case to training example', () => {
      const caseText = `Anamnese: Smerter i nakke etter bilulykke.
Undersøkelse: ROM: Nedsatt. Palp: Øm C5-C6.
Behandling: Leddjustering C5.
Konklusjon: Cervical fasettleddsdysfunksjon.`;
      const result = convertToTrainingExample(caseText);
      expect(result).toBeDefined();
      expect(result.input.region).toContain('Cervical');
      expect(result.output.subjective).toBeTruthy();
      expect(result.output.assessment).toBeTruthy();
      expect(result.metadata.classification).toBeDefined();
    });

    it('should return null when parseClinicalCase returns null', () => {
      const result = convertToTrainingExample(null);
      expect(result).toBeNull();
    });

    it('should include followup outcome when present', () => {
      const caseText = `Anamnese: Smerter.
Undersøkelse: ROM normal.
Behandling: Mobilisering.
Konklusjon: Myalgi.
Oppfølging: Pasient melder god bedring.`;
      const result = convertToTrainingExample(caseText);
      expect(result.metadata.has_followup).toBe(true);
      expect(result.metadata.outcome).toBeDefined();
      expect(result.metadata.outcome.status).toBe('improved');
    });
  });

  // ===========================================================================
  // convertToJSONL
  // ===========================================================================
  describe('convertToJSONL', () => {
    it('should produce JSONL string from training examples', () => {
      const examples = [
        {
          input: { chief_complaint: 'Smerter', symptoms: ['rygg'], region: ['Lumbar'] },
          output: { subjective: 'Test', objective: {}, assessment: '', plan: {} },
        },
      ];
      const jsonl = convertToJSONL(examples);
      expect(jsonl).toBeTruthy();
      const parsed = JSON.parse(jsonl.split('\n')[0]);
      expect(parsed.messages).toBeDefined();
      expect(parsed.messages.length).toBe(3);
    });

    it('should filter null examples', () => {
      const examples = [null, null];
      const jsonl = convertToJSONL(examples);
      expect(jsonl).toBe('');
    });

    it('should join multiple examples with newlines', () => {
      const examples = [
        { input: { chief_complaint: 'A', symptoms: [], region: [] }, output: {} },
        { input: { chief_complaint: 'B', symptoms: [], region: [] }, output: {} },
      ];
      const jsonl = convertToJSONL(examples);
      const lines = jsonl.split('\n');
      expect(lines.length).toBe(2);
    });
  });
});
