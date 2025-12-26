/**
 * Clinical Validation Service Tests
 */

import {
  validateClinicalContent,
  checkRedFlagsInContent,
  checkMedicationWarnings,
  validateMedicalLogic,
  checkAgeRelatedRisks
} from '../../src/services/clinicalValidation.js';

describe('Clinical Validation Service', () => {

  describe('checkRedFlagsInContent', () => {

    test('should detect cauda equina symptoms', () => {
      const content = 'Pasient har blæreforstyrrelser og nummenhet mellom bena';
      const flags = checkRedFlagsInContent(content);

      expect(flags.length).toBeGreaterThan(0);
      expect(flags.some(f => f.severity === 'CRITICAL')).toBe(true);
      expect(flags.some(f => f.flag === 'cauda_equina')).toBe(true);
    });

    test('should detect saddle anesthesia', () => {
      const content = 'Patient reports saddle numbness and difficulty urinating';
      const flags = checkRedFlagsInContent(content);

      expect(flags.length).toBeGreaterThan(0);
      expect(flags.some(f => f.category === 'cauda_equina')).toBe(true);
    });

    test('should detect malignancy indicators', () => {
      const content = 'Pasienten har uforklarlig vekttap og nattlige smerter som vekker henne';
      const flags = checkRedFlagsInContent(content);

      expect(flags.length).toBeGreaterThan(0);
      expect(flags.some(f => f.flag === 'malignancy')).toBe(true);
      expect(flags.some(f => f.severity === 'HIGH')).toBe(true);
    });

    test('should detect infection indicators', () => {
      const content = 'Patient has fever and is immunocompromised due to chemotherapy';
      const flags = checkRedFlagsInContent(content);

      expect(flags.length).toBeGreaterThan(0);
      expect(flags.some(f => f.flag === 'infection')).toBe(true);
    });

    test('should detect fracture risk', () => {
      const content = 'Pasient med osteoporose etter betydelig trauma fra bilulykke';
      const flags = checkRedFlagsInContent(content);

      expect(flags.length).toBeGreaterThan(0);
      expect(flags.some(f => f.flag === 'fracture')).toBe(true);
    });

    test('should return empty array for normal content', () => {
      const content = 'Pasient med mild nakkeømhet. ROM normal. Ingen nevrologiske utfall.';
      const flags = checkRedFlagsInContent(content);

      expect(flags.length).toBe(0);
    });

    test('should detect inflammatory indicators', () => {
      const content = 'Morning stiffness lasting more than 30 minutes that improves with activity';
      const flags = checkRedFlagsInContent(content);

      expect(flags.some(f => f.flag === 'inflammatory')).toBe(true);
    });

    test('should detect neurological symptoms', () => {
      const content = 'Progressive weakness in both legs with hyperreflexia';
      const flags = checkRedFlagsInContent(content);

      expect(flags.length).toBeGreaterThan(0);
      expect(flags.some(f => f.flag === 'neurological')).toBe(true);
    });

  });

  describe('checkMedicationWarnings', () => {

    test('should warn about anticoagulants', () => {
      const medications = ['Warfarin 5mg', 'Metoprolol 50mg'];
      const warnings = checkMedicationWarnings(medications);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.category === 'anticoagulants')).toBe(true);
      expect(warnings[0].contraindications).toContain('HVLA');
    });

    test('should warn about aspirin', () => {
      const medications = ['Aspirin 75mg daglig'];
      const warnings = checkMedicationWarnings(medications);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.category === 'anticoagulants')).toBe(true);
    });

    test('should warn about steroids', () => {
      const medications = ['Prednisolon 10mg'];
      const warnings = checkMedicationWarnings(medications);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.category === 'steroids')).toBe(true);
    });

    test('should warn about bisphosphonates', () => {
      const medications = ['Fosamax 70mg weekly', 'Calcium 500mg'];
      const warnings = checkMedicationWarnings(medications);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.category === 'bisphosphonates')).toBe(true);
    });

    test('should return empty for safe medications', () => {
      const medications = ['Paracet 1g', 'Ibux 400mg'];
      const warnings = checkMedicationWarnings(medications);

      expect(warnings.length).toBe(0);
    });

    test('should handle empty medication list', () => {
      const warnings = checkMedicationWarnings([]);
      expect(warnings.length).toBe(0);
    });

  });

  describe('validateMedicalLogic', () => {

    test('should validate appropriate treatment for neck symptoms', () => {
      const result = validateMedicalLogic('L01', 'SMT_cervical', {});

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should flag contraindicated treatments', () => {
      const context = {
        patient: {
          contraindications: ['cervical myelopathy']
        }
      };
      const result = validateMedicalLogic('L01', 'HVLA_cervical', context);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'contraindication')).toBe(true);
    });

    test('should flag cauda equina contraindication', () => {
      const context = {
        patient: {
          red_flags: ['cauda equina suspected']
        }
      };
      const result = validateMedicalLogic('L03', 'SMT_lumbar', context);

      expect(result.valid).toBe(false);
    });

    test('should include recommendations', () => {
      const result = validateMedicalLogic('L03', 'exercise', {});

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].recommended).toContain('exercise');
    });

  });

  describe('checkAgeRelatedRisks', () => {

    test('should flag pediatric patients', () => {
      const warnings = checkAgeRelatedRisks(12, 'neck pain', {});

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.action === 'PEDIATRIC_PROTOCOL')).toBe(true);
    });

    test('should flag geriatric patients', () => {
      const warnings = checkAgeRelatedRisks(72, 'lower back pain', {});

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.message.includes('Geriatric'))).toBe(true);
    });

    test('should flag new onset in elderly', () => {
      const warnings = checkAgeRelatedRisks(68, 'new onset back pain, sudden start', {});

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.severity === 'MODERATE')).toBe(true);
    });

    test('should flag first episode after 50', () => {
      const warnings = checkAgeRelatedRisks(55, 'first episode of back pain', {});

      expect(warnings.some(w => w.action === 'RED_FLAG_SCREENING')).toBe(true);
    });

    test('should return empty for healthy middle-aged', () => {
      const warnings = checkAgeRelatedRisks(35, 'mild neck stiffness', {});

      expect(warnings.length).toBe(0);
    });

  });

  describe('validateClinicalContent (integration)', () => {

    test('should return valid for normal clinical content', async () => {
      const content = 'Pasient med mild nakkeømhet etter kontorarbeid. Normal ROM.';
      const result = await validateClinicalContent(content, {
        patient: { age: 35 }
      });

      expect(result.isValid).toBe(true);
      expect(result.hasRedFlags).toBe(false);
      expect(result.canProceed).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should flag critical content and require review', async () => {
      const content = 'Pasient med blæreforstyrrelser, sadel-nummenhet og bilateral svakhet i bena';
      const result = await validateClinicalContent(content, {
        patient: { age: 45 }
      });

      expect(result.hasRedFlags).toBe(true);
      expect(result.riskLevel).toBe('CRITICAL');
      expect(result.canProceed).toBe(false);
      expect(result.requiresReview).toBe(true);
      expect(result.confidence).toBeLessThan(0.5);
    });

    test('should combine patient context with content analysis', async () => {
      const content = 'Pasient med ryggsmerter';
      const result = await validateClinicalContent(content, {
        patient: {
          age: 60,
          current_medications: ['Warfarin 5mg'],
          red_flags: ['previous cancer']
        }
      });

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.requiresReview).toBe(true);
    });

    test('should handle missing context gracefully', async () => {
      const content = 'Normal examination findings';
      const result = await validateClinicalContent(content);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

  });

});
