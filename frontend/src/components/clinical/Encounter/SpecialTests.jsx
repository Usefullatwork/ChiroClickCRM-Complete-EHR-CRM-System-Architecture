/**
 * SpecialTests - Orthopedic exam, Neuro exam compact, Cluster tests,
 *                ROM table, Body diagram, Exam protocol, Regional exam panels
 * Extracted from ObjectiveSection.jsx
 */
import {
  Bone,
  Activity,
  Ruler,
  PersonStanding,
  ClipboardList,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useEncounter } from '../../../context/EncounterContext';
import { NeurologicalExamCompact } from '../../neuroexam';
import { OrthopedicExamCompact } from '../../orthoexam';
import {
  ExaminationProtocol,
  ClusterTestPanel,
  BodyDiagram,
  RegionalExamination,
  VisualROMSelector,
} from '../../examination';
import OutcomeMeasures, { OutcomeMeasureSelector } from '../../examination/OutcomeMeasures';

export default function SpecialTests({ handleOrthoExamChange, handleNeuroExamChange }) {
  const {
    encounterData,
    isSigned,
    updateField,
    patientId,
    encounterId,
    // UI Toggles
    showOrthoExam,
    setShowOrthoExam,
    showNeuroExam,
    setShowNeuroExam,
    showROMTable,
    setShowROMTable,
    showBodyDiagram,
    setShowBodyDiagram,
    showExamProtocol,
    setShowExamProtocol,
    showClusterTests,
    setShowClusterTests,
    showRegionalExam,
    setShowRegionalExam,
    showOutcomeMeasures,
    setShowOutcomeMeasures,
    // Data
    orthoExamData,
    neuroExamData,
    romTableData,
    setRomTableData,
    bodyDiagramMarkers,
    setBodyDiagramMarkers,
    examProtocolData,
    setExamProtocolData,
    clusterTestData,
    setClusterTestData,
    regionalExamData,
    setRegionalExamData,
    outcomeMeasureType,
    setOutcomeMeasureType,
    outcomeMeasureData,
    setOutcomeMeasureData,
  } = useEncounter();

  return (
    <>
      {/* Orthopedic Exam */}
      <div className="border border-blue-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowOrthoExam(!showOrthoExam)}
          className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors"
          aria-expanded={showOrthoExam}
        >
          <div className="flex items-center gap-2">
            <Bone className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Ortopedisk Undersøkelse</span>
            {orthoExamData?.clusterScores && (
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                {Object.keys(orthoExamData.clusterScores).length} tester
              </span>
            )}
          </div>
          {showOrthoExam ? (
            <ChevronUp className="w-5 h-5 text-blue-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-blue-600" />
          )}
        </button>
        {showOrthoExam && (
          <div className="p-4 bg-white">
            <OrthopedicExamCompact
              patientId={patientId}
              encounterId={encounterId}
              onExamChange={handleOrthoExamChange}
              initialData={orthoExamData}
            />
          </div>
        )}
      </div>

      {/* Neurological Exam Compact */}
      <div className="border border-purple-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowNeuroExam(!showNeuroExam)}
          className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 transition-colors"
          aria-expanded={showNeuroExam}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-900">Nevrologisk Undersøkelse (Kompakt)</span>
            {neuroExamData?.clusterScores && (
              <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                {Object.keys(neuroExamData.clusterScores).length} tester
              </span>
            )}
          </div>
          {showNeuroExam ? (
            <ChevronUp className="w-5 h-5 text-purple-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-purple-600" />
          )}
        </button>
        {showNeuroExam && (
          <div className="p-4 bg-white">
            <NeurologicalExamCompact
              patientId={patientId}
              encounterId={encounterId}
              onExamChange={handleNeuroExamChange}
              initialData={neuroExamData}
            />
          </div>
        )}
      </div>

      {/* ROM Table */}
      <div className="border border-teal-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowROMTable(!showROMTable)}
          className="w-full flex items-center justify-between px-4 py-3 bg-teal-50 hover:bg-teal-100 transition-colors"
          aria-expanded={showROMTable}
        >
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-teal-600" />
            <span className="font-medium text-teal-900">Leddutslag (ROM)</span>
            {Object.keys(romTableData).length > 0 && (
              <span className="text-xs bg-teal-200 text-teal-800 px-2 py-0.5 rounded-full">
                {Object.keys(romTableData).length} regioner
              </span>
            )}
          </div>
          {showROMTable ? (
            <ChevronUp className="w-5 h-5 text-teal-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-teal-600" />
          )}
        </button>
        {showROMTable && (
          <div className="p-4 bg-white">
            <VisualROMSelector
              values={romTableData}
              onChange={setRomTableData}
              readOnly={isSigned}
              onGenerateReport={(r) =>
                updateField(
                  'objective',
                  'rom',
                  (encounterData.objective.rom ? `${encounterData.objective.rom}\n\n` : '') + r
                )
              }
            />
          </div>
        )}
      </div>

      {/* Body Diagram */}
      <div className="border border-rose-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowBodyDiagram(!showBodyDiagram)}
          className="w-full flex items-center justify-between px-4 py-3 bg-rose-50 hover:bg-rose-100 transition-colors"
          aria-expanded={showBodyDiagram}
        >
          <div className="flex items-center gap-2">
            <PersonStanding className="w-5 h-5 text-rose-600" />
            <span className="font-medium text-rose-900">Smertekart & Vevsmarkering</span>
            {bodyDiagramMarkers.length > 0 && (
              <span className="text-xs bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">
                {bodyDiagramMarkers.length} markeringer
              </span>
            )}
          </div>
          {showBodyDiagram ? (
            <ChevronUp className="w-5 h-5 text-rose-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-rose-600" />
          )}
        </button>
        {showBodyDiagram && (
          <div className="p-4 bg-white">
            <BodyDiagram
              markers={bodyDiagramMarkers}
              onChange={setBodyDiagramMarkers}
              lang="no"
              view="posterior"
              readOnly={isSigned}
            />
          </div>
        )}
      </div>

      {/* Examination Protocol */}
      <div className="border border-orange-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowExamProtocol(!showExamProtocol)}
          className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 hover:bg-orange-100 transition-colors"
          aria-expanded={showExamProtocol}
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-orange-900">Undersøkelsesprotokoll</span>
            {Object.keys(examProtocolData).length > 0 && (
              <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                {Object.keys(examProtocolData).length} funn
              </span>
            )}
          </div>
          {showExamProtocol ? (
            <ChevronUp className="w-5 h-5 text-orange-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-orange-600" />
          )}
        </button>
        {showExamProtocol && (
          <div className="p-4 bg-white">
            <ExaminationProtocol
              values={examProtocolData}
              onChange={setExamProtocolData}
              lang="no"
              readOnly={isSigned}
              onGenerateNarrative={(n) =>
                updateField(
                  'objective',
                  'palpation',
                  (encounterData.objective.palpation
                    ? `${encounterData.objective.palpation}\n`
                    : '') + n
                )
              }
            />
          </div>
        )}
      </div>

      {/* Cluster Tests */}
      <div className="border border-red-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowClusterTests(!showClusterTests)}
          className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 transition-colors"
          aria-expanded={showClusterTests}
        >
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-900">Diagnostiske Klyngetester</span>
            {Object.keys(clusterTestData).length > 0 && (
              <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                {Object.keys(clusterTestData).length} tester
              </span>
            )}
          </div>
          {showClusterTests ? (
            <ChevronUp className="w-5 h-5 text-red-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-red-600" />
          )}
        </button>
        {showClusterTests && (
          <div className="p-4 bg-white">
            <ClusterTestPanel
              values={clusterTestData}
              onChange={setClusterTestData}
              lang="no"
              readOnly={isSigned}
              onGenerateReport={(r) =>
                updateField(
                  'objective',
                  'ortho_tests',
                  (encounterData.objective.ortho_tests
                    ? `${encounterData.objective.ortho_tests}\n\n`
                    : '') + r
                )
              }
            />
          </div>
        )}
      </div>

      {/* Regional Examination */}
      <div className="border border-teal-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowRegionalExam(!showRegionalExam)}
          className="w-full flex items-center justify-between px-4 py-3 bg-teal-50 hover:bg-teal-100 transition-colors"
          aria-expanded={showRegionalExam}
        >
          <div className="flex items-center gap-2">
            <PersonStanding className="w-5 h-5 text-teal-600" />
            <span className="font-medium text-teal-900">Regional undersøkelse</span>
            {Object.keys(regionalExamData).length > 0 && (
              <span className="text-xs bg-teal-200 text-teal-800 px-2 py-0.5 rounded-full">
                Data registrert
              </span>
            )}
          </div>
          {showRegionalExam ? (
            <ChevronUp className="w-5 h-5 text-teal-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-teal-600" />
          )}
        </button>
        {showRegionalExam && (
          <div className="p-4 bg-white">
            <RegionalExamination
              values={regionalExamData}
              onChange={setRegionalExamData}
              readOnly={isSigned}
              onGenerateReport={(r) =>
                updateField(
                  'objective',
                  'ortho_tests',
                  (encounterData.objective.ortho_tests
                    ? `${encounterData.objective.ortho_tests}\n\n`
                    : '') + r
                )
              }
            />
          </div>
        )}
      </div>

      {/* Outcome Measures */}
      <div className="border border-indigo-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowOutcomeMeasures(!showOutcomeMeasures)}
          className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 transition-colors"
          aria-expanded={showOutcomeMeasures}
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            <span className="font-medium text-indigo-900">Utfallsmål (NDI/ODI)</span>
            {Object.keys(outcomeMeasureData).length > 0 && (
              <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                {outcomeMeasureType.toUpperCase()} registrert
              </span>
            )}
          </div>
          {showOutcomeMeasures ? (
            <ChevronUp className="w-5 h-5 text-indigo-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-indigo-600" />
          )}
        </button>
        {showOutcomeMeasures && (
          <div className="p-4 bg-white space-y-4">
            <OutcomeMeasureSelector
              value={outcomeMeasureType}
              onChange={setOutcomeMeasureType}
              lang="no"
            />
            <OutcomeMeasures
              type={outcomeMeasureType}
              values={outcomeMeasureData[outcomeMeasureType] || {}}
              onChange={(v) =>
                setOutcomeMeasureData((prev) => ({ ...prev, [outcomeMeasureType]: v }))
              }
              lang="no"
              readOnly={isSigned}
              onComplete={(r) =>
                updateField(
                  'assessment',
                  'clinical_reasoning',
                  `${encounterData.assessment.clinical_reasoning ? `${encounterData.assessment.clinical_reasoning}\n\n` : ''}${r.type.toUpperCase()}: ${r.score} poeng (${r.percentage}%)`
                )
              }
            />
          </div>
        )}
      </div>
    </>
  );
}
