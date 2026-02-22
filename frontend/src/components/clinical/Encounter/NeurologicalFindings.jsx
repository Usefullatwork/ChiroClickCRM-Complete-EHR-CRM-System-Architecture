/**
 * NeurologicalFindings - Full neuro exam, DTR, sensory, cranial nerves,
 *                        coordination, nerve tension, MMT, regional diagrams
 * Extracted from ObjectiveSection.jsx
 */
import { Activity, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { useEncounter } from '../../../context/EncounterContext';
import {
  ManualMuscleTesting,
  CranialNervePanel,
  SensoryExamination,
  DeepTendonReflexPanel,
  CoordinationTestPanel,
  NerveTensionTests,
  RegionalBodyDiagram,
} from '../../examination';
import NeurologicalExam from '../../examination/NeurologicalExam';

export default function NeurologicalFindings() {
  const {
    encounterData,
    isSigned,
    updateField,
    // UI Toggles
    showNeurologicalExam,
    setShowNeurologicalExam,
    showMMT,
    setShowMMT,
    showDTR,
    setShowDTR,
    showSensoryExam,
    setShowSensoryExam,
    showCranialNerves,
    setShowCranialNerves,
    showCoordination,
    setShowCoordination,
    showNerveTension,
    setShowNerveTension,
    showRegionalDiagrams,
    setShowRegionalDiagrams,
    // Data
    neurologicalExamData,
    setNeurologicalExamData,
    mmtData,
    setMmtData,
    dtrData,
    setDtrData,
    sensoryExamData,
    setSensoryExamData,
    cranialNerveData,
    setCranialNerveData,
    coordinationData,
    setCoordinationData,
    nerveTensionData,
    setNerveTensionData,
    regionalDiagramData,
    setRegionalDiagramData,
    selectedRegion,
    setSelectedRegion,
  } = useEncounter();

  const regionLabels = {
    shoulder: 'Skulder',
    knee: 'Kne',
    ankle: 'Ankel',
    wrist: 'Håndledd',
    elbow: 'Albue',
    cervical: 'Nakke',
    lumbar: 'Korsrygg',
    hip: 'Hofte',
    head: 'Hode/TMJ',
  };

  return (
    <>
      {/* Neurological Exam (Full) */}
      <div className="border border-purple-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowNeurologicalExam(!showNeurologicalExam)}
          className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 transition-colors"
          aria-expanded={showNeurologicalExam}
        >
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-900">
              Nevrologisk undersøkelse (Detaljert)
            </span>
            {Object.keys(neurologicalExamData).length > 0 && (
              <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                Data registrert
              </span>
            )}
          </div>
          {showNeurologicalExam ? (
            <ChevronUp className="w-5 h-5 text-purple-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-purple-600" />
          )}
        </button>
        {showNeurologicalExam && (
          <div className="p-4 bg-white">
            <NeurologicalExam
              values={neurologicalExamData}
              onChange={setNeurologicalExamData}
              lang="no"
              readOnly={isSigned}
              onGenerateReport={(r) =>
                updateField(
                  'objective',
                  'neuro_tests',
                  (encounterData.objective.neuro_tests
                    ? `${encounterData.objective.neuro_tests}\n\n`
                    : '') + r
                )
              }
            />
          </div>
        )}
      </div>

      {/* Manual Muscle Testing */}
      <div className="border border-blue-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowMMT(!showMMT)}
          className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors"
          aria-expanded={showMMT}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Manuell Muskeltesting (MMT)</span>
            {Object.keys(mmtData).length > 0 && (
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                Data registrert
              </span>
            )}
          </div>
          {showMMT ? (
            <ChevronUp className="w-5 h-5 text-blue-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-blue-600" />
          )}
        </button>
        {showMMT && (
          <div className="p-4 bg-white">
            <ManualMuscleTesting
              values={mmtData}
              onChange={setMmtData}
              lang="no"
              readOnly={isSigned}
              onGenerateNarrative={(n) =>
                updateField(
                  'objective',
                  'neuro_tests',
                  (encounterData.objective.neuro_tests
                    ? `${encounterData.objective.neuro_tests}\n\n`
                    : '') + n
                )
              }
            />
          </div>
        )}
      </div>

      {/* Deep Tendon Reflexes */}
      <div className="border border-green-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowDTR(!showDTR)}
          className="w-full flex items-center justify-between px-4 py-3 bg-green-50 hover:bg-green-100 transition-colors"
          aria-expanded={showDTR}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">Dype Senereflekser (DTR)</span>
            {Object.keys(dtrData).length > 0 && (
              <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                Data registrert
              </span>
            )}
          </div>
          {showDTR ? (
            <ChevronUp className="w-5 h-5 text-green-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-green-600" />
          )}
        </button>
        {showDTR && (
          <div className="p-4 bg-white">
            <DeepTendonReflexPanel
              values={dtrData}
              onChange={setDtrData}
              lang="no"
              readOnly={isSigned}
              onGenerateNarrative={(n) =>
                updateField(
                  'objective',
                  'neuro_tests',
                  (encounterData.objective.neuro_tests
                    ? `${encounterData.objective.neuro_tests}\n\n`
                    : '') + n
                )
              }
            />
          </div>
        )}
      </div>

      {/* Sensory Examination */}
      <div className="border border-amber-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowSensoryExam(!showSensoryExam)}
          className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors"
          aria-expanded={showSensoryExam}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-600" />
            <span className="font-medium text-amber-900">Sensibilitetsundersøkelse</span>
            {Object.keys(sensoryExamData).length > 0 && (
              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                Data registrert
              </span>
            )}
          </div>
          {showSensoryExam ? (
            <ChevronUp className="w-5 h-5 text-amber-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-amber-600" />
          )}
        </button>
        {showSensoryExam && (
          <div className="p-4 bg-white">
            <SensoryExamination
              values={sensoryExamData}
              onChange={setSensoryExamData}
              lang="no"
              readOnly={isSigned}
              onGenerateNarrative={(n) =>
                updateField(
                  'objective',
                  'neuro_tests',
                  (encounterData.objective.neuro_tests
                    ? `${encounterData.objective.neuro_tests}\n\n`
                    : '') + n
                )
              }
            />
          </div>
        )}
      </div>

      {/* Cranial Nerves */}
      <div className="border border-violet-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowCranialNerves(!showCranialNerves)}
          className="w-full flex items-center justify-between px-4 py-3 bg-violet-50 hover:bg-violet-100 transition-colors"
          aria-expanded={showCranialNerves}
        >
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-600" />
            <span className="font-medium text-violet-900">Hjernenerver (CN I-XII)</span>
            {Object.keys(cranialNerveData).length > 0 && (
              <span className="text-xs bg-violet-200 text-violet-800 px-2 py-0.5 rounded-full">
                Data registrert
              </span>
            )}
          </div>
          {showCranialNerves ? (
            <ChevronUp className="w-5 h-5 text-violet-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-violet-600" />
          )}
        </button>
        {showCranialNerves && (
          <div className="p-4 bg-white">
            <CranialNervePanel
              values={cranialNerveData}
              onChange={setCranialNerveData}
              lang="no"
              readOnly={isSigned}
              onGenerateNarrative={(n) =>
                updateField(
                  'objective',
                  'neuro_tests',
                  (encounterData.objective.neuro_tests
                    ? `${encounterData.objective.neuro_tests}\n\n`
                    : '') + n
                )
              }
            />
          </div>
        )}
      </div>

      {/* Coordination Tests */}
      <div className="border border-indigo-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowCoordination(!showCoordination)}
          className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 transition-colors"
          aria-expanded={showCoordination}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <span className="font-medium text-indigo-900">Koordinasjonstester</span>
            {Object.keys(coordinationData).length > 0 && (
              <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                Data registrert
              </span>
            )}
          </div>
          {showCoordination ? (
            <ChevronUp className="w-5 h-5 text-indigo-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-indigo-600" />
          )}
        </button>
        {showCoordination && (
          <div className="p-4 bg-white">
            <CoordinationTestPanel
              values={coordinationData}
              onChange={setCoordinationData}
              lang="no"
              readOnly={isSigned}
              onGenerateNarrative={(n) =>
                updateField(
                  'objective',
                  'neuro_tests',
                  (encounterData.objective.neuro_tests
                    ? `${encounterData.objective.neuro_tests}\n\n`
                    : '') + n
                )
              }
            />
          </div>
        )}
      </div>

      {/* Nerve Tension Tests */}
      <div className="border border-orange-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowNerveTension(!showNerveTension)}
          className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 hover:bg-orange-100 transition-colors"
          aria-expanded={showNerveTension}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-orange-900">Nervestrekkstester</span>
            {Object.keys(nerveTensionData).length > 0 && (
              <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                Data registrert
              </span>
            )}
          </div>
          {showNerveTension ? (
            <ChevronUp className="w-5 h-5 text-orange-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-orange-600" />
          )}
        </button>
        {showNerveTension && (
          <div className="p-4 bg-white">
            <NerveTensionTests
              values={nerveTensionData}
              onChange={setNerveTensionData}
              lang="no"
              readOnly={isSigned}
              onGenerateNarrative={(n) =>
                updateField(
                  'objective',
                  'neuro_tests',
                  (encounterData.objective.neuro_tests
                    ? `${encounterData.objective.neuro_tests}\n\n`
                    : '') + n
                )
              }
            />
          </div>
        )}
      </div>

      {/* Regional Body Diagrams */}
      <div className="border border-amber-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowRegionalDiagrams(!showRegionalDiagrams)}
          className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors"
          aria-expanded={showRegionalDiagrams}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-600" />
            <span className="font-medium text-amber-900">Leddundersøkelse (Bilateral)</span>
            {Object.keys(regionalDiagramData).length > 0 && (
              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                {Object.keys(regionalDiagramData).length} markering(er)
              </span>
            )}
          </div>
          {showRegionalDiagrams ? (
            <ChevronUp className="w-5 h-5 text-amber-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-amber-600" />
          )}
        </button>
        {showRegionalDiagrams && (
          <div className="p-4 bg-white">
            <p className="text-sm text-gray-600 mb-3">
              Velg region og marker funn på venstre og høyre side.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(regionLabels).map(([region, label]) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedRegion === region ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-amber-100'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-lg p-3 bg-blue-50/30">
                <h5 className="text-xs font-semibold text-blue-700 mb-2 text-center uppercase">
                  Venstre
                </h5>
                <RegionalBodyDiagram
                  region={selectedRegion}
                  side="left"
                  findings={regionalDiagramData.left?.[selectedRegion] || {}}
                  onFindingsChange={(f) =>
                    setRegionalDiagramData((prev) => ({
                      ...prev,
                      left: { ...(prev.left || {}), [selectedRegion]: f },
                    }))
                  }
                  compact={true}
                />
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-red-50/30">
                <h5 className="text-xs font-semibold text-red-700 mb-2 text-center uppercase">
                  Høyre
                </h5>
                <RegionalBodyDiagram
                  region={selectedRegion}
                  side="right"
                  findings={regionalDiagramData.right?.[selectedRegion] || {}}
                  onFindingsChange={(f) =>
                    setRegionalDiagramData((prev) => ({
                      ...prev,
                      right: { ...(prev.right || {}), [selectedRegion]: f },
                    }))
                  }
                  compact={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
