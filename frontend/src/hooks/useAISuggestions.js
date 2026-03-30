/**
 * AI suggestion handler hook: fetches diagnosis suggestions and red-flag analysis
 * from the AI API, with a keyword-based mock fallback.
 */
import { aiAPI } from '../services/api';
import { useTranslation } from '../i18n';

function generateMockSuggestions(subjective, t) {
  const suggestions = { diagnosis: [], treatment: [], followUp: [], clinicalReasoning: '' };
  const combined = `${subjective.chief_complaint || ''} ${subjective.history || ''}`.toLowerCase();
  if (combined.includes('rygg') || combined.includes('back')) {
    suggestions.diagnosis.push('L03 - Korsryggsmerter', 'L84 - Ryggsyndrom uten utstråling');
    suggestions.treatment.push('HVLA manipulasjon lumbal', 'Bl\u00F8tvevsbehandling');
    suggestions.clinicalReasoning =
      'Basert p\u00E5 lumbal smertepresentasjon, vurder mekanisk korsryggsmerte. Utelukk r\u00F8de flagg.';
  }
  if (combined.includes('nakke') || combined.includes('neck')) {
    suggestions.diagnosis.push('L01 - Nakkesmerter', 'L83 - Nakkesyndrom');
    suggestions.treatment.push('Cervical mobilisering');
    suggestions.clinicalReasoning =
      'Nakkesmertepresentasjon tyder p\u00E5 cervikal facettdysfunksjon eller muskelspenning.';
  }
  if (suggestions.diagnosis.length === 0) {
    suggestions.clinicalReasoning = t('fillSoapForAI');
  }
  return suggestions;
}

export function useAISuggestions({ encounterData, patient, setAiSuggestions, setAiLoading }) {
  const { t } = useTranslation('clinical');

  const getAISuggestions = async () => {
    setAiLoading(true);
    try {
      const soapData = {
        subjective: encounterData.subjective,
        objective: encounterData.objective,
        assessment: encounterData.assessment,
        icpc_codes: encounterData.icpc_codes,
      };
      const patientContext = {
        age: patient?.data?.date_of_birth
          ? Math.floor((new Date() - new Date(patient.data.date_of_birth)) / 31557600000)
          : null,
        gender: patient?.data?.gender,
        medical_history: patient?.data?.medical_history,
        current_medications: patient?.data?.current_medications,
        red_flags: patient?.data?.red_flags,
        contraindications: patient?.data?.contraindications,
      };
      const [diagnosisResponse, redFlagResponse] = await Promise.allSettled([
        aiAPI.suggestDiagnosis(soapData),
        aiAPI.analyzeRedFlags(patientContext, soapData),
      ]);
      const suggestions = { diagnosis: [], treatment: [], followUp: [], clinicalReasoning: '' };
      if (diagnosisResponse.status === 'fulfilled' && diagnosisResponse.value?.data) {
        const diagData = diagnosisResponse.value.data;
        suggestions.diagnosis = diagData.codes || [];
        suggestions.clinicalReasoning = diagData.reasoning || diagData.suggestion || '';
      }
      if (redFlagResponse.status === 'fulfilled' && redFlagResponse.value?.data) {
        const redFlagData = redFlagResponse.value.data;
        if (redFlagData.recommendReferral) {
          suggestions.followUp.push(`\u26A0\uFE0F ${redFlagData.analysis}`);
        }
        if (redFlagData.riskLevel && redFlagData.riskLevel !== 'LOW') {
          suggestions.clinicalReasoning += `\n\n${t('riskLevel')}: ${redFlagData.riskLevel}`;
        }
      }
      if (suggestions.diagnosis.length === 0 && !suggestions.clinicalReasoning) {
        Object.assign(suggestions, generateMockSuggestions(encounterData.subjective, t));
      }
      setAiSuggestions(suggestions);
    } catch {
      setAiSuggestions(generateMockSuggestions(encounterData.subjective, t));
    } finally {
      setAiLoading(false);
    }
  };

  return { getAISuggestions };
}
