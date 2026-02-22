/**
 * PainAndTissue - Pain assessment, headache assessment, tissue markers
 * Extracted from ObjectiveSection.jsx
 */
import { Brain, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { useEncounter } from '../../../context/EncounterContext';
import {
  PainAssessmentPanel,
  HeadacheAssessment,
  TissueAbnormalityMarkers,
} from '../../examination';

export default function PainAndTissue() {
  const {
    encounterData,
    isSigned,
    updateField,
    // UI Toggles
    showPainAssessment,
    setShowPainAssessment,
    showHeadacheAssessment,
    setShowHeadacheAssessment,
    showTissueMarkers,
    setShowTissueMarkers,
    // Data
    painAssessmentData,
    setPainAssessmentData,
    headacheData,
    setHeadacheData,
    tissueMarkerData,
    setTissueMarkerData,
  } = useEncounter();

  return (
    <>
      {/* Pain Assessment */}
      <div className="border border-red-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowPainAssessment(!showPainAssessment)}
          className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 transition-colors"
          aria-expanded={showPainAssessment}
        >
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-900">Smertevurdering</span>
            {Object.keys(painAssessmentData).length > 0 && (
              <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                Data registrert
              </span>
            )}
          </div>
          {showPainAssessment ? (
            <ChevronUp className="w-5 h-5 text-red-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-red-600" />
          )}
        </button>
        {showPainAssessment && (
          <div className="p-4 bg-white">
            <PainAssessmentPanel
              values={painAssessmentData}
              onChange={setPainAssessmentData}
              lang="no"
              readOnly={isSigned}
              onGenerateNarrative={(n) =>
                updateField(
                  'subjective',
                  'pain_description',
                  (encounterData.subjective.pain_description
                    ? `${encounterData.subjective.pain_description}\n\n`
                    : '') + n
                )
              }
            />
          </div>
        )}
      </div>

      {/* Headache Assessment */}
      <div className="border border-pink-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowHeadacheAssessment(!showHeadacheAssessment)}
          className="w-full flex items-center justify-between px-4 py-3 bg-pink-50 hover:bg-pink-100 transition-colors"
          aria-expanded={showHeadacheAssessment}
        >
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-pink-600" />
            <span className="font-medium text-pink-900">Hodepineutredning</span>
            {Object.keys(headacheData).length > 0 && (
              <span className="text-xs bg-pink-200 text-pink-800 px-2 py-0.5 rounded-full">
                Data registrert
              </span>
            )}
          </div>
          {showHeadacheAssessment ? (
            <ChevronUp className="w-5 h-5 text-pink-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-pink-600" />
          )}
        </button>
        {showHeadacheAssessment && (
          <div className="p-4 bg-white">
            <HeadacheAssessment
              values={headacheData}
              onChange={setHeadacheData}
              lang="no"
              readOnly={isSigned}
              onGenerateNarrative={(n) =>
                updateField(
                  'subjective',
                  'chief_complaint',
                  (encounterData.subjective.chief_complaint
                    ? `${encounterData.subjective.chief_complaint}\n\n`
                    : '') + n
                )
              }
            />
          </div>
        )}
      </div>

      {/* Tissue Abnormality Markers */}
      <div className="border border-cyan-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowTissueMarkers(!showTissueMarkers)}
          className="w-full flex items-center justify-between px-4 py-3 bg-cyan-50 hover:bg-cyan-100 transition-colors"
          aria-expanded={showTissueMarkers}
        >
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-600" />
            <span className="font-medium text-cyan-900">Vevsabnormaliteter</span>
            {Object.keys(tissueMarkerData).length > 0 && (
              <span className="text-xs bg-cyan-200 text-cyan-800 px-2 py-0.5 rounded-full">
                Data registrert
              </span>
            )}
          </div>
          {showTissueMarkers ? (
            <ChevronUp className="w-5 h-5 text-cyan-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-cyan-600" />
          )}
        </button>
        {showTissueMarkers && (
          <div className="p-4 bg-white">
            <TissueAbnormalityMarkers
              values={tissueMarkerData}
              onChange={setTissueMarkerData}
              lang="no"
              readOnly={isSigned}
              onGenerateNarrative={(n) =>
                updateField(
                  'objective',
                  'palpation',
                  (encounterData.objective.palpation
                    ? `${encounterData.objective.palpation}\n\n`
                    : '') + n
                )
              }
            />
          </div>
        )}
      </div>
    </>
  );
}
