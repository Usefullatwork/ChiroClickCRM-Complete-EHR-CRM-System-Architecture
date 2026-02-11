import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Bone,
  Activity,
  Ruler,
  PersonStanding,
  ClipboardList,
  Target,
  Brain,
} from 'lucide-react';
import { NeurologicalExamCompact } from '../neuroexam';
import { OrthopedicExamCompact } from '../orthoexam';
import {
  ExaminationProtocol,
  ClusterTestPanel,
  BodyDiagram,
  VisualROMSelector,
  RegionalExamination,
  ManualMuscleTesting,
  CranialNervePanel,
  SensoryExamination,
  PainAssessmentPanel,
  DeepTendonReflexPanel,
  CoordinationTestPanel,
  NerveTensionTests,
  HeadacheAssessment,
  TissueAbnormalityMarkers,
  RegionalBodyDiagram,
} from '../examination';
import NeurologicalExam from '../examination/NeurologicalExam';
import OutcomeMeasures, { OutcomeMeasureSelector } from '../examination/OutcomeMeasures';

/**
 * Collapsible panel item wrapper for exam panels.
 */
function ExamToggle({ show, onToggle, icon: Icon, label, color, badgeText, children }) {
  return (
    <div className={`border border-${color}-200 rounded-lg overflow-hidden`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 bg-${color}-50 hover:bg-${color}-100 transition-colors`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 text-${color}-600`} />
          <span className={`font-medium text-${color}-900`}>{label}</span>
          {badgeText && (
            <span className={`text-xs bg-${color}-200 text-${color}-800 px-2 py-0.5 rounded-full`}>
              {badgeText}
            </span>
          )}
        </div>
        {show ? (
          <ChevronUp className={`w-5 h-5 text-${color}-600`} />
        ) : (
          <ChevronDown className={`w-5 h-5 text-${color}-600`} />
        )}
      </button>
      {show && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
}

/**
 * Manages the visibility and rendering of all examination panels in the Objective section.
 * Each panel is collapsible and independently toggleable.
 */
export function ExamPanelManager({
  // IDs
  patientId,
  encounterId,
  isSigned,
  // Ortho
  showOrthoExam,
  setShowOrthoExam,
  orthoExamData,
  onOrthoExamChange,
  // Neuro compact
  showNeuroExam,
  setShowNeuroExam,
  neuroExamData,
  onNeuroExamChange,
  // ROM
  showROMTable,
  setShowROMTable,
  romTableData,
  setRomTableData,
  // Body Diagram
  showBodyDiagram,
  setShowBodyDiagram,
  bodyDiagramMarkers,
  setBodyDiagramMarkers,
  // Exam Protocol
  showExamProtocol,
  setShowExamProtocol,
  examProtocolData,
  setExamProtocolData,
  // Cluster Tests
  showClusterTests,
  setShowClusterTests,
  clusterTestData,
  setClusterTestData,
  // Regional Exam
  showRegionalExam,
  setShowRegionalExam,
  regionalExamData,
  setRegionalExamData,
  // Neurological Exam (full)
  showNeurologicalExam,
  setShowNeurologicalExam,
  neurologicalExamData,
  setNeurologicalExamData,
  // Outcome Measures
  showOutcomeMeasures,
  setShowOutcomeMeasures,
  outcomeMeasureType,
  setOutcomeMeasureType,
  outcomeMeasureData,
  setOutcomeMeasureData,
  // MMT
  showMMT,
  setShowMMT,
  mmtData,
  setMmtData,
  // DTR
  showDTR,
  setShowDTR,
  dtrData,
  setDtrData,
  // Sensory
  showSensoryExam,
  setShowSensoryExam,
  sensoryExamData,
  setSensoryExamData,
  // Cranial
  showCranialNerves,
  setShowCranialNerves,
  cranialNerveData,
  setCranialNerveData,
  // Coordination
  showCoordination,
  setShowCoordination,
  coordinationData,
  setCoordinationData,
  // Nerve Tension
  showNerveTension,
  setShowNerveTension,
  nerveTensionData,
  setNerveTensionData,
  // Regional Diagrams
  showRegionalDiagrams,
  setShowRegionalDiagrams,
  regionalDiagramData,
  setRegionalDiagramData,
  selectedRegion,
  setSelectedRegion,
  // Pain Assessment
  showPainAssessment,
  setShowPainAssessment,
  painAssessmentData,
  setPainAssessmentData,
  // Headache
  showHeadacheAssessment,
  setShowHeadacheAssessment,
  headacheData,
  setHeadacheData,
  // Tissue Markers
  showTissueMarkers,
  setShowTissueMarkers,
  tissueMarkerData,
  setTissueMarkerData,
  // Updater
  updateField,
  encounterData,
}) {
  return (
    <>
      {/* Orthopedic Exam */}
      <ExamToggle
        show={showOrthoExam}
        onToggle={() => setShowOrthoExam(!showOrthoExam)}
        icon={Bone}
        label="Ortopedisk Unders\u00F8kelse"
        color="blue"
        badgeText={
          orthoExamData?.clusterScores
            ? `${Object.keys(orthoExamData.clusterScores).length} tester`
            : null
        }
      >
        <OrthopedicExamCompact
          patientId={patientId}
          encounterId={encounterId}
          onExamChange={onOrthoExamChange}
          initialData={orthoExamData}
        />
      </ExamToggle>

      {/* Neurological Exam (Compact) */}
      <ExamToggle
        show={showNeuroExam}
        onToggle={() => setShowNeuroExam(!showNeuroExam)}
        icon={Activity}
        label="Nevrologisk Unders\u00F8kelse"
        color="purple"
        badgeText={
          neuroExamData?.clusterScores
            ? `${Object.keys(neuroExamData.clusterScores).length} tester`
            : null
        }
      >
        <NeurologicalExamCompact
          patientId={patientId}
          encounterId={encounterId}
          onExamChange={onNeuroExamChange}
          initialData={neuroExamData}
        />
      </ExamToggle>

      {/* ROM Table */}
      <ExamToggle
        show={showROMTable}
        onToggle={() => setShowROMTable(!showROMTable)}
        icon={Ruler}
        label="Leddutslag (ROM)"
        color="teal"
        badgeText={
          Object.keys(romTableData).length > 0
            ? `${Object.keys(romTableData).length} regioner`
            : null
        }
      >
        <VisualROMSelector
          values={romTableData}
          onChange={setRomTableData}
          readOnly={isSigned}
          onGenerateReport={(report) => {
            updateField(
              'objective',
              'rom',
              encounterData.objective.rom + (encounterData.objective.rom ? '\n\n' : '') + report
            );
          }}
        />
      </ExamToggle>

      {/* Body Diagram */}
      <ExamToggle
        show={showBodyDiagram}
        onToggle={() => setShowBodyDiagram(!showBodyDiagram)}
        icon={PersonStanding}
        label="Smertekart & Vevsmarkering"
        color="rose"
        badgeText={
          bodyDiagramMarkers.length > 0 ? `${bodyDiagramMarkers.length} markeringer` : null
        }
      >
        <BodyDiagram
          markers={bodyDiagramMarkers}
          onChange={setBodyDiagramMarkers}
          lang="no"
          view="posterior"
          readOnly={isSigned}
        />
      </ExamToggle>

      {/* Examination Protocol */}
      <ExamToggle
        show={showExamProtocol}
        onToggle={() => setShowExamProtocol(!showExamProtocol)}
        icon={ClipboardList}
        label="Unders\u00F8kelsesprotokoll"
        color="orange"
        badgeText={
          Object.keys(examProtocolData).length > 0
            ? `${Object.keys(examProtocolData).length} funn`
            : null
        }
      >
        <ExaminationProtocol
          values={examProtocolData}
          onChange={setExamProtocolData}
          lang="no"
          readOnly={isSigned}
          onGenerateNarrative={(narrative) => {
            updateField(
              'objective',
              'palpation',
              encounterData.objective.palpation +
                (encounterData.objective.palpation ? '\n' : '') +
                narrative
            );
          }}
        />
      </ExamToggle>

      {/* Cluster Tests */}
      <ExamToggle
        show={showClusterTests}
        onToggle={() => setShowClusterTests(!showClusterTests)}
        icon={Target}
        label="Diagnostiske Klyngetester"
        color="red"
        badgeText={
          Object.keys(clusterTestData).length > 0
            ? `${Object.keys(clusterTestData).length} tester`
            : null
        }
      >
        <ClusterTestPanel
          values={clusterTestData}
          onChange={setClusterTestData}
          lang="no"
          readOnly={isSigned}
          onGenerateReport={(report) => {
            updateField(
              'objective',
              'ortho_tests',
              encounterData.objective.ortho_tests +
                (encounterData.objective.ortho_tests ? '\n\n' : '') +
                report
            );
          }}
        />
      </ExamToggle>

      {/* Regional Examination */}
      <ExamToggle
        show={showRegionalExam}
        onToggle={() => setShowRegionalExam(!showRegionalExam)}
        icon={PersonStanding}
        label="Regional unders\u00F8kelse"
        color="teal"
        badgeText={Object.keys(regionalExamData).length > 0 ? 'Data registrert' : null}
      >
        <RegionalExamination
          values={regionalExamData}
          onChange={setRegionalExamData}
          readOnly={isSigned}
          onGenerateReport={(report) => {
            updateField(
              'objective',
              'ortho_tests',
              encounterData.objective.ortho_tests +
                (encounterData.objective.ortho_tests ? '\n\n' : '') +
                report
            );
          }}
        />
      </ExamToggle>

      {/* Neurological Exam (Full) */}
      <ExamToggle
        show={showNeurologicalExam}
        onToggle={() => setShowNeurologicalExam(!showNeurologicalExam)}
        icon={Brain}
        label="Nevrologisk unders\u00F8kelse"
        color="purple"
        badgeText={Object.keys(neurologicalExamData).length > 0 ? 'Data registrert' : null}
      >
        <NeurologicalExam
          values={neurologicalExamData}
          onChange={setNeurologicalExamData}
          lang="no"
          readOnly={isSigned}
          onGenerateReport={(report) => {
            updateField(
              'objective',
              'neuro_tests',
              encounterData.objective.neuro_tests +
                (encounterData.objective.neuro_tests ? '\n\n' : '') +
                report
            );
          }}
        />
      </ExamToggle>

      {/* Outcome Measures */}
      <ExamToggle
        show={showOutcomeMeasures}
        onToggle={() => setShowOutcomeMeasures(!showOutcomeMeasures)}
        icon={ClipboardList}
        label="Utfallsm\u00E5l (NDI/ODI)"
        color="indigo"
        badgeText={
          Object.keys(outcomeMeasureData).length > 0
            ? `${outcomeMeasureType.toUpperCase()} registrert`
            : null
        }
      >
        <div className="space-y-4">
          <OutcomeMeasureSelector
            value={outcomeMeasureType}
            onChange={setOutcomeMeasureType}
            lang="no"
          />
          <OutcomeMeasures
            type={outcomeMeasureType}
            values={outcomeMeasureData[outcomeMeasureType] || {}}
            onChange={(values) =>
              setOutcomeMeasureData((prev) => ({
                ...prev,
                [outcomeMeasureType]: values,
              }))
            }
            lang="no"
            readOnly={isSigned}
            onComplete={(result) => {
              updateField(
                'assessment',
                'clinical_reasoning',
                encounterData.assessment.clinical_reasoning +
                  (encounterData.assessment.clinical_reasoning ? '\n\n' : '') +
                  `${result.type.toUpperCase()}: ${result.score} poeng (${result.percentage}%)`
              );
            }}
          />
        </div>
      </ExamToggle>

      {/* Manual Muscle Testing */}
      <ExamToggle
        show={showMMT}
        onToggle={() => setShowMMT(!showMMT)}
        icon={Activity}
        label="Manuell Muskeltesting (MMT)"
        color="blue"
        badgeText={Object.keys(mmtData).length > 0 ? 'Data registrert' : null}
      >
        <ManualMuscleTesting
          values={mmtData}
          onChange={setMmtData}
          lang="no"
          readOnly={isSigned}
          onGenerateNarrative={(narrative) => {
            updateField(
              'objective',
              'neuro_tests',
              encounterData.objective.neuro_tests +
                (encounterData.objective.neuro_tests ? '\n\n' : '') +
                narrative
            );
          }}
        />
      </ExamToggle>

      {/* Deep Tendon Reflexes */}
      <ExamToggle
        show={showDTR}
        onToggle={() => setShowDTR(!showDTR)}
        icon={Activity}
        label="Dype Senereflekser (DTR)"
        color="green"
        badgeText={Object.keys(dtrData).length > 0 ? 'Data registrert' : null}
      >
        <DeepTendonReflexPanel
          values={dtrData}
          onChange={setDtrData}
          lang="no"
          readOnly={isSigned}
          onGenerateNarrative={(narrative) => {
            updateField(
              'objective',
              'neuro_tests',
              encounterData.objective.neuro_tests +
                (encounterData.objective.neuro_tests ? '\n\n' : '') +
                narrative
            );
          }}
        />
      </ExamToggle>

      {/* Sensory Examination */}
      <ExamToggle
        show={showSensoryExam}
        onToggle={() => setShowSensoryExam(!showSensoryExam)}
        icon={Activity}
        label="Sensibilitetsunders\u00F8kelse"
        color="amber"
        badgeText={Object.keys(sensoryExamData).length > 0 ? 'Data registrert' : null}
      >
        <SensoryExamination
          values={sensoryExamData}
          onChange={setSensoryExamData}
          lang="no"
          readOnly={isSigned}
          onGenerateNarrative={(narrative) => {
            updateField(
              'objective',
              'neuro_tests',
              encounterData.objective.neuro_tests +
                (encounterData.objective.neuro_tests ? '\n\n' : '') +
                narrative
            );
          }}
        />
      </ExamToggle>

      {/* Cranial Nerves */}
      <ExamToggle
        show={showCranialNerves}
        onToggle={() => setShowCranialNerves(!showCranialNerves)}
        icon={Brain}
        label="Hjernenerver (CN I-XII)"
        color="violet"
        badgeText={Object.keys(cranialNerveData).length > 0 ? 'Data registrert' : null}
      >
        <CranialNervePanel
          values={cranialNerveData}
          onChange={setCranialNerveData}
          lang="no"
          readOnly={isSigned}
          onGenerateNarrative={(narrative) => {
            updateField(
              'objective',
              'neuro_tests',
              encounterData.objective.neuro_tests +
                (encounterData.objective.neuro_tests ? '\n\n' : '') +
                narrative
            );
          }}
        />
      </ExamToggle>

      {/* Coordination Tests */}
      <ExamToggle
        show={showCoordination}
        onToggle={() => setShowCoordination(!showCoordination)}
        icon={Activity}
        label="Koordinasjonstester"
        color="indigo"
        badgeText={Object.keys(coordinationData).length > 0 ? 'Data registrert' : null}
      >
        <CoordinationTestPanel
          values={coordinationData}
          onChange={setCoordinationData}
          lang="no"
          readOnly={isSigned}
          onGenerateNarrative={(narrative) => {
            updateField(
              'objective',
              'neuro_tests',
              encounterData.objective.neuro_tests +
                (encounterData.objective.neuro_tests ? '\n\n' : '') +
                narrative
            );
          }}
        />
      </ExamToggle>

      {/* Nerve Tension Tests */}
      <ExamToggle
        show={showNerveTension}
        onToggle={() => setShowNerveTension(!showNerveTension)}
        icon={Activity}
        label="Nervestrekkstester"
        color="orange"
        badgeText={Object.keys(nerveTensionData).length > 0 ? 'Data registrert' : null}
      >
        <NerveTensionTests
          values={nerveTensionData}
          onChange={setNerveTensionData}
          lang="no"
          readOnly={isSigned}
          onGenerateNarrative={(narrative) => {
            updateField(
              'objective',
              'neuro_tests',
              encounterData.objective.neuro_tests +
                (encounterData.objective.neuro_tests ? '\n\n' : '') +
                narrative
            );
          }}
        />
      </ExamToggle>

      {/* Regional Body Diagrams - Bilateral Joint Examination */}
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
        <p className="text-sm text-gray-600 mb-3">
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
