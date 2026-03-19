import { useExamPanelContext } from '../../../context/ExamPanelContext';
import { Activity, Target, Brain } from 'lucide-react';
import ExamToggle from './ExamToggle';

import RegionalBodyDiagram from '../../examination/RegionalBodyDiagrams';
import PainAssessmentPanel from '../../examination/PainAssessmentPanel';
import HeadacheAssessment from '../../examination/HeadacheAssessment';
import TissueAbnormalityMarkers from '../../examination/TissueAbnormalityMarkers';

export default function RegionalPanels({ isSigned, updateField, encounterData }) {
  const { panels, examData } = useExamPanelContext();

  const {
    showRegionalDiagrams,
    setShowRegionalDiagrams,
    showPainAssessment,
    setShowPainAssessment,
    showHeadacheAssessment,
    setShowHeadacheAssessment,
    showTissueMarkers,
    setShowTissueMarkers,
  } = panels;

  const {
    regionalDiagramData,
    setRegionalDiagramData,
    selectedRegion,
    setSelectedRegion,
    painAssessmentData,
    setPainAssessmentData,
    headacheData,
    setHeadacheData,
    tissueMarkerData,
    setTissueMarkerData,
  } = examData;

  return (
    <>
      {/* Regional Body Diagrams */}
      <ExamToggle
        show={showRegionalDiagrams}
        onToggle={() => setShowRegionalDiagrams(!showRegionalDiagrams)}
        icon={Activity}
        label="Leddunders\u00F8kelse (Bilateral)"
        color="amber"
        badgeText={
          Object.keys(regionalDiagramData).length > 0
            ? `${Object.keys(regionalDiagramData).length} markering(er)`
            : null
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Velg region og marker funn p\u00E5 venstre og h\u00F8yre side.
        </p>

        {/* Region selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['shoulder', 'knee', 'ankle', 'wrist', 'elbow', 'cervical', 'lumbar', 'hip', 'head'].map(
            (region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors
                ${
                  selectedRegion === region
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-amber-100'
                }`}
              >
                {region === 'shoulder'
                  ? 'Skulder'
                  : region === 'knee'
                    ? 'Kne'
                    : region === 'ankle'
                      ? 'Ankel'
                      : region === 'wrist'
                        ? 'H\u00E5ndledd'
                        : region === 'elbow'
                          ? 'Albue'
                          : region === 'cervical'
                            ? 'Nakke'
                            : region === 'lumbar'
                              ? 'Korsrygg'
                              : region === 'hip'
                                ? 'Hofte'
                                : 'Hode/TMJ'}
              </button>
            )
          )}
        </div>

        {/* Selected region diagram */}
        <RegionalBodyDiagram
          region={selectedRegion}
          side="bilateral"
          markers={regionalDiagramData[selectedRegion] || []}
          onChange={(markers) =>
            setRegionalDiagramData((prev) => ({
              ...prev,
              [selectedRegion]: markers,
            }))
          }
          lang="no"
          readOnly={isSigned}
          compact={false}
        />
      </ExamToggle>

      {/* Pain Assessment */}
      <ExamToggle
        show={showPainAssessment}
        onToggle={() => setShowPainAssessment(!showPainAssessment)}
        icon={Target}
        label="Smertevurdering"
        color="red"
        badgeText={Object.keys(painAssessmentData).length > 0 ? 'Data registrert' : null}
      >
        <PainAssessmentPanel
          values={painAssessmentData}
          onChange={setPainAssessmentData}
          lang="no"
          readOnly={isSigned}
          onGenerateNarrative={(narrative) => {
            updateField(
              'subjective',
              'pain_description',
              encounterData.subjective.pain_description +
                (encounterData.subjective.pain_description ? '\n\n' : '') +
                narrative
            );
          }}
        />
      </ExamToggle>

      {/* Headache Assessment */}
      <ExamToggle
        show={showHeadacheAssessment}
        onToggle={() => setShowHeadacheAssessment(!showHeadacheAssessment)}
        icon={Brain}
        label="Hodepineutredning"
        color="pink"
        badgeText={Object.keys(headacheData).length > 0 ? 'Data registrert' : null}
      >
        <HeadacheAssessment
          values={headacheData}
          onChange={setHeadacheData}
          lang="no"
          readOnly={isSigned}
          onGenerateNarrative={(narrative) => {
            updateField(
              'subjective',
              'chief_complaint',
              encounterData.subjective.chief_complaint +
                (encounterData.subjective.chief_complaint ? '\n\n' : '') +
                narrative
            );
          }}
        />
      </ExamToggle>

      {/* Tissue Abnormality Markers */}
      <ExamToggle
        show={showTissueMarkers}
        onToggle={() => setShowTissueMarkers(!showTissueMarkers)}
        icon={Target}
        label="Vevsabnormaliteter"
        color="cyan"
        badgeText={Object.keys(tissueMarkerData).length > 0 ? 'Data registrert' : null}
      >
        <TissueAbnormalityMarkers
          values={tissueMarkerData}
          onChange={setTissueMarkerData}
          lang="no"
          readOnly={isSigned}
          onGenerateNarrative={(narrative) => {
            updateField(
              'objective',
              'palpation',
              encounterData.objective.palpation +
                (encounterData.objective.palpation ? '\n\n' : '') +
                narrative
            );
          }}
        />
      </ExamToggle>
    </>
  );
}
