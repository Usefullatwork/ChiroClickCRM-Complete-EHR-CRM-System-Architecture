import React from 'react';
import {
  Bone,
  Activity,
  Ruler,
  PersonStanding,
  ClipboardList,
  Target,
  Brain,
  ChevronDown,
  ChevronUp
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
  ManualMuscleTesting,
  CranialNervePanel,
  SensoryExamination,
  PainAssessmentPanel,
  DeepTendonReflexPanel,
  CoordinationTestPanel,
  NerveTensionTests,
  HeadacheAssessment,
  TissueAbnormalityMarkers,
  RegionalBodyDiagram
} from '../../examination';
import NeurologicalExam from '../../examination/NeurologicalExam';
import OutcomeMeasures, { OutcomeMeasureSelector } from '../../examination/OutcomeMeasures';

export default function ObjectiveSection({ onTextInputWithMacros, onSetActiveField, quickPhrases }) {
  const {
    encounterData, isSigned, updateField,
    patientId, encounterId,
    // UI Toggles
    showOrthoExam, setShowOrthoExam,
    showNeuroExam, setShowNeuroExam,
    showROMTable, setShowROMTable,
    showBodyDiagram, setShowBodyDiagram,
    showExamProtocol, setShowExamProtocol,
    showClusterTests, setShowClusterTests,
    showRegionalExam, setShowRegionalExam,
    showNeurologicalExam, setShowNeurologicalExam,
    showOutcomeMeasures, setShowOutcomeMeasures,
    showMMT, setShowMMT,
    showDTR, setShowDTR,
    showSensoryExam, setShowSensoryExam,
    showCranialNerves, setShowCranialNerves,
    showCoordination, setShowCoordination,
    showNerveTension, setShowNerveTension,
    showRegionalDiagrams, setShowRegionalDiagrams,
    showPainAssessment, setShowPainAssessment,
    showHeadacheAssessment, setShowHeadacheAssessment,
    showTissueMarkers, setShowTissueMarkers,
    // Data
    orthoExamData, setOrthoExamData,
    neuroExamData, setNeuroExamData,
    romTableData, setRomTableData,
    bodyDiagramMarkers, setBodyDiagramMarkers,
    examProtocolData, setExamProtocolData,
    clusterTestData, setClusterTestData,
    regionalExamData, setRegionalExamData,
    neurologicalExamData, setNeurologicalExamData,
    outcomeMeasureType, setOutcomeMeasureType,
    outcomeMeasureData, setOutcomeMeasureData,
    mmtData, setMmtData,
    dtrData, setDtrData,
    sensoryExamData, setSensoryExamData,
    cranialNerveData, setCranialNerveData,
    coordinationData, setCoordinationData,
    nerveTensionData, setNerveTensionData,
    regionalDiagramData, setRegionalDiagramData,
    painAssessmentData, setPainAssessmentData,
    headacheData, setHeadacheData,
    tissueMarkerData, setTissueMarkerData,
    selectedRegion, setSelectedRegion,
    setRedFlagAlerts
  } = useEncounter();

  // Handlers re-implemented for Context usage
  const handleNeuroExamChange = (examData) => {
    setNeuroExamData(examData);
    if (examData?.narrative) {
      updateField('objective', 'neuro_tests', examData.narrative);
    }
    if (examData?.redFlags?.length > 0) {
      const neuroRedFlags = examData.redFlags.map(rf => `NEURO: ${rf.description} - ${rf.action}`);
      setRedFlagAlerts(prev => [...prev.filter(a => !a.startsWith('NEURO:')), ...neuroRedFlags]);
    }
  };

  const handleOrthoExamChange = (examData) => {
    setOrthoExamData(examData);
    if (examData?.narrative) {
      updateField('objective', 'ortho_tests', examData.narrative);
    }
    if (examData?.redFlags?.length > 0) {
      const orthoRedFlags = examData.redFlags.map(rf => `ORTHO: ${rf.testName?.no || rf.clusterName?.no} - ${rf.action}`);
      setRedFlagAlerts(prev => [...prev.filter(a => !a.startsWith('ORTHO:')), ...orthoRedFlags]);
    }
  };

  const handleQuickPhrase = (phrase, field) => {
    const currentValue = encounterData.objective[field] || '';
    const newValue = currentValue + (currentValue ? "\n" : "") + "• " + phrase;
    updateField('objective', field, newValue);
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-white border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <span className="bg-emerald-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">O</span>
          Objektivt
        </h3>
      </div>
      <div className="p-4 space-y-4">

        {/* Observation & Palpation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <textarea
            placeholder="Observasjon (holdning, gange)..."
            value={encounterData.objective.observation}
            onChange={(e) => {
              if (!onTextInputWithMacros(e, 'objective', 'observation')) {
                updateField('objective', 'observation', e.target.value);
              }
            }}
            disabled={isSigned}
            className="min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
          <textarea
            placeholder="Palpasjon (ømhet, spenninger)... (bruk .palp for makro)"
            value={encounterData.objective.palpation}
            onChange={(e) => {
              if (!onTextInputWithMacros(e, 'objective', 'palpation')) {
                updateField('objective', 'palpation', e.target.value);
              }
            }}
            disabled={isSigned}
            className="min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>

        {/* ROM */}
        <textarea
          placeholder="Range of Motion (ROM)..."
          value={encounterData.objective.rom}
          onChange={(e) => updateField('objective', 'rom', e.target.value)}
          disabled={isSigned}
          className="w-full min-h-[60px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
        />

        {/* --- ACCORDION PANELS START --- */}
        <div className="space-y-2">
          
          {/* Orthopedic Exam */}
          <div className="border border-blue-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowOrthoExam(!showOrthoExam)} className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors">
              <div className="flex items-center gap-2"><Bone className="w-5 h-5 text-blue-600" /><span className="font-medium text-blue-900">Ortopedisk Undersøkelse</span>
              {orthoExamData?.clusterScores && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">{Object.keys(orthoExamData.clusterScores).length} tester</span>}
              </div>
              {showOrthoExam ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5 text-blue-600" />}
            </button>
            {showOrthoExam && (
              <div className="p-4 bg-white">
                <OrthopedicExamCompact patientId={patientId} encounterId={encounterId} onExamChange={handleOrthoExamChange} initialData={orthoExamData} />
              </div>
            )}
          </div>

          {/* Neurological Exam Compact */}
          <div className="border border-purple-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowNeuroExam(!showNeuroExam)} className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 transition-colors">
              <div className="flex items-center gap-2"><Activity className="w-5 h-5 text-purple-600" /><span className="font-medium text-purple-900">Nevrologisk Undersøkelse (Kompakt)</span>
              {neuroExamData?.clusterScores && <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">{Object.keys(neuroExamData.clusterScores).length} tester</span>}
              </div>
              {showNeuroExam ? <ChevronUp className="w-5 h-5 text-purple-600" /> : <ChevronDown className="w-5 h-5 text-purple-600" />}
            </button>
            {showNeuroExam && (
              <div className="p-4 bg-white">
                <NeurologicalExamCompact patientId={patientId} encounterId={encounterId} onExamChange={handleNeuroExamChange} initialData={neuroExamData} />
              </div>
            )}
          </div>

          {/* ROM Table */}
          <div className="border border-teal-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowROMTable(!showROMTable)} className="w-full flex items-center justify-between px-4 py-3 bg-teal-50 hover:bg-teal-100 transition-colors">
              <div className="flex items-center gap-2"><Ruler className="w-5 h-5 text-teal-600" /><span className="font-medium text-teal-900">Leddutslag (ROM)</span>
              {Object.keys(romTableData).length > 0 && <span className="text-xs bg-teal-200 text-teal-800 px-2 py-0.5 rounded-full">{Object.keys(romTableData).length} regioner</span>}
              </div>
              {showROMTable ? <ChevronUp className="w-5 h-5 text-teal-600" /> : <ChevronDown className="w-5 h-5 text-teal-600" />}
            </button>
            {showROMTable && (
              <div className="p-4 bg-white">
                <VisualROMSelector values={romTableData} onChange={setRomTableData} readOnly={isSigned} onGenerateReport={(r) => updateField('objective', 'rom', (encounterData.objective.rom ? encounterData.objective.rom + '\n\n' : '') + r)} />
              </div>
            )}
          </div>

          {/* Body Diagram */}
          <div className="border border-rose-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowBodyDiagram(!showBodyDiagram)} className="w-full flex items-center justify-between px-4 py-3 bg-rose-50 hover:bg-rose-100 transition-colors">
              <div className="flex items-center gap-2"><PersonStanding className="w-5 h-5 text-rose-600" /><span className="font-medium text-rose-900">Smertekart & Vevsmarkering</span>
              {bodyDiagramMarkers.length > 0 && <span className="text-xs bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">{bodyDiagramMarkers.length} markeringer</span>}
              </div>
              {showBodyDiagram ? <ChevronUp className="w-5 h-5 text-rose-600" /> : <ChevronDown className="w-5 h-5 text-rose-600" />}
            </button>
            {showBodyDiagram && (
              <div className="p-4 bg-white">
                <BodyDiagram markers={bodyDiagramMarkers} onChange={setBodyDiagramMarkers} lang="no" view="posterior" readOnly={isSigned} />
              </div>
            )}
          </div>

          {/* Examination Protocol */}
          <div className="border border-orange-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowExamProtocol(!showExamProtocol)} className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 hover:bg-orange-100 transition-colors">
              <div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-orange-600" /><span className="font-medium text-orange-900">Undersøkelsesprotokoll</span>
              {Object.keys(examProtocolData).length > 0 && <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">{Object.keys(examProtocolData).length} funn</span>}
              </div>
              {showExamProtocol ? <ChevronUp className="w-5 h-5 text-orange-600" /> : <ChevronDown className="w-5 h-5 text-orange-600" />}
            </button>
            {showExamProtocol && (
              <div className="p-4 bg-white">
                <ExaminationProtocol values={examProtocolData} onChange={setExamProtocolData} lang="no" readOnly={isSigned} onGenerateNarrative={(n) => updateField('objective', 'palpation', (encounterData.objective.palpation ? encounterData.objective.palpation + '\n' : '') + n)} />
              </div>
            )}
          </div>

          {/* Cluster Tests */}
          <div className="border border-red-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowClusterTests(!showClusterTests)} className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 transition-colors">
              <div className="flex items-center gap-2"><Target className="w-5 h-5 text-red-600" /><span className="font-medium text-red-900">Diagnostiske Klyngetester</span>
              {Object.keys(clusterTestData).length > 0 && <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">{Object.keys(clusterTestData).length} tester</span>}
              </div>
              {showClusterTests ? <ChevronUp className="w-5 h-5 text-red-600" /> : <ChevronDown className="w-5 h-5 text-red-600" />}
            </button>
            {showClusterTests && (
              <div className="p-4 bg-white">
                <ClusterTestPanel values={clusterTestData} onChange={setClusterTestData} lang="no" readOnly={isSigned} onGenerateReport={(r) => updateField('objective', 'ortho_tests', (encounterData.objective.ortho_tests ? encounterData.objective.ortho_tests + '\n\n' : '') + r)} />
              </div>
            )}
          </div>

          {/* Regional Examination */}
          <div className="border border-teal-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowRegionalExam(!showRegionalExam)} className="w-full flex items-center justify-between px-4 py-3 bg-teal-50 hover:bg-teal-100 transition-colors">
              <div className="flex items-center gap-2"><PersonStanding className="w-5 h-5 text-teal-600" /><span className="font-medium text-teal-900">Regional undersøkelse</span>
              {Object.keys(regionalExamData).length > 0 && <span className="text-xs bg-teal-200 text-teal-800 px-2 py-0.5 rounded-full">Data registrert</span>}
              </div>
              {showRegionalExam ? <ChevronUp className="w-5 h-5 text-teal-600" /> : <ChevronDown className="w-5 h-5 text-teal-600" />}
            </button>
            {showRegionalExam && (
              <div className="p-4 bg-white">
                <RegionalExamination values={regionalExamData} onChange={setRegionalExamData} readOnly={isSigned} onGenerateReport={(r) => updateField('objective', 'ortho_tests', (encounterData.objective.ortho_tests ? encounterData.objective.ortho_tests + '\n\n' : '') + r)} />
              </div>
            )}
          </div>

          {/* Neurological Exam (Full) */}
          <div className="border border-purple-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowNeurologicalExam(!showNeurologicalExam)} className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 transition-colors">
              <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-purple-600" /><span className="font-medium text-purple-900">Nevrologisk undersøkelse (Detaljert)</span>
              {Object.keys(neurologicalExamData).length > 0 && <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">Data registrert</span>}
              </div>
              {showNeurologicalExam ? <ChevronUp className="w-5 h-5 text-purple-600" /> : <ChevronDown className="w-5 h-5 text-purple-600" />}
            </button>
            {showNeurologicalExam && (
              <div className="p-4 bg-white">
                <NeurologicalExam values={neurologicalExamData} onChange={setNeurologicalExamData} lang="no" readOnly={isSigned} onGenerateReport={(r) => updateField('objective', 'neuro_tests', (encounterData.objective.neuro_tests ? encounterData.objective.neuro_tests + '\n\n' : '') + r)} />
              </div>
            )}
          </div>

          {/* Outcome Measures */}
          <div className="border border-indigo-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowOutcomeMeasures(!showOutcomeMeasures)} className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-indigo-600" /><span className="font-medium text-indigo-900">Utfallsmål (NDI/ODI)</span>
              {Object.keys(outcomeMeasureData).length > 0 && <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">{outcomeMeasureType.toUpperCase()} registrert</span>}
              </div>
              {showOutcomeMeasures ? <ChevronUp className="w-5 h-5 text-indigo-600" /> : <ChevronDown className="w-5 h-5 text-indigo-600" />}
            </button>
            {showOutcomeMeasures && (
              <div className="p-4 bg-white space-y-4">
                <OutcomeMeasureSelector value={outcomeMeasureType} onChange={setOutcomeMeasureType} lang="no" />
                <OutcomeMeasures type={outcomeMeasureType} values={outcomeMeasureData[outcomeMeasureType] || {}} onChange={(v) => setOutcomeMeasureData(prev => ({ ...prev, [outcomeMeasureType]: v }))} lang="no" readOnly={isSigned} onComplete={(r) => updateField('assessment', 'clinical_reasoning', (encounterData.assessment.clinical_reasoning ? encounterData.assessment.clinical_reasoning + '\n\n' : '') + `${r.type.toUpperCase()}: ${r.score} poeng (${r.percentage}%)`)} />
              </div>
            )}
          </div>

          {/* Manual Muscle Testing */}
          <div className="border border-blue-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowMMT(!showMMT)} className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors">
              <div className="flex items-center gap-2"><Activity className="w-5 h-5 text-blue-600" /><span className="font-medium text-blue-900">Manuell Muskeltesting (MMT)</span>
              {Object.keys(mmtData).length > 0 && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Data registrert</span>}
              </div>
              {showMMT ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5 text-blue-600" />}
            </button>
            {showMMT && (
              <div className="p-4 bg-white">
                <ManualMuscleTesting values={mmtData} onChange={setMmtData} lang="no" readOnly={isSigned} onGenerateNarrative={(n) => updateField('objective', 'neuro_tests', (encounterData.objective.neuro_tests ? encounterData.objective.neuro_tests + '\n\n' : '') + n)} />
              </div>
            )}
          </div>

          {/* Deep Tendon Reflexes */}
          <div className="border border-green-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowDTR(!showDTR)} className="w-full flex items-center justify-between px-4 py-3 bg-green-50 hover:bg-green-100 transition-colors">
              <div className="flex items-center gap-2"><Activity className="w-5 h-5 text-green-600" /><span className="font-medium text-green-900">Dype Senereflekser (DTR)</span>
              {Object.keys(dtrData).length > 0 && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Data registrert</span>}
              </div>
              {showDTR ? <ChevronUp className="w-5 h-5 text-green-600" /> : <ChevronDown className="w-5 h-5 text-green-600" />}
            </button>
            {showDTR && (
              <div className="p-4 bg-white">
                <DeepTendonReflexPanel values={dtrData} onChange={setDtrData} lang="no" readOnly={isSigned} onGenerateNarrative={(n) => updateField('objective', 'neuro_tests', (encounterData.objective.neuro_tests ? encounterData.objective.neuro_tests + '\n\n' : '') + n)} />
              </div>
            )}
          </div>

          {/* Sensory Examination */}
          <div className="border border-amber-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowSensoryExam(!showSensoryExam)} className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors">
              <div className="flex items-center gap-2"><Activity className="w-5 h-5 text-amber-600" /><span className="font-medium text-amber-900">Sensibilitetsundersøkelse</span>
              {Object.keys(sensoryExamData).length > 0 && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Data registrert</span>}
              </div>
              {showSensoryExam ? <ChevronUp className="w-5 h-5 text-amber-600" /> : <ChevronDown className="w-5 h-5 text-amber-600" />}
            </button>
            {showSensoryExam && (
              <div className="p-4 bg-white">
                <SensoryExamination values={sensoryExamData} onChange={setSensoryExamData} lang="no" readOnly={isSigned} onGenerateNarrative={(n) => updateField('objective', 'neuro_tests', (encounterData.objective.neuro_tests ? encounterData.objective.neuro_tests + '\n\n' : '') + n)} />
              </div>
            )}
          </div>

          {/* Cranial Nerves */}
          <div className="border border-violet-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowCranialNerves(!showCranialNerves)} className="w-full flex items-center justify-between px-4 py-3 bg-violet-50 hover:bg-violet-100 transition-colors">
              <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-violet-600" /><span className="font-medium text-violet-900">Hjernenerver (CN I-XII)</span>
              {Object.keys(cranialNerveData).length > 0 && <span className="text-xs bg-violet-200 text-violet-800 px-2 py-0.5 rounded-full">Data registrert</span>}
              </div>
              {showCranialNerves ? <ChevronUp className="w-5 h-5 text-violet-600" /> : <ChevronDown className="w-5 h-5 text-violet-600" />}
            </button>
            {showCranialNerves && (
              <div className="p-4 bg-white">
                <CranialNervePanel values={cranialNerveData} onChange={setCranialNerveData} lang="no" readOnly={isSigned} onGenerateNarrative={(n) => updateField('objective', 'neuro_tests', (encounterData.objective.neuro_tests ? encounterData.objective.neuro_tests + '\n\n' : '') + n)} />
              </div>
            )}
          </div>

          {/* Coordination Tests */}
          <div className="border border-indigo-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowCoordination(!showCoordination)} className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <div className="flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-600" /><span className="font-medium text-indigo-900">Koordinasjonstester</span>
              {Object.keys(coordinationData).length > 0 && <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">Data registrert</span>}
              </div>
              {showCoordination ? <ChevronUp className="w-5 h-5 text-indigo-600" /> : <ChevronDown className="w-5 h-5 text-indigo-600" />}
            </button>
            {showCoordination && (
              <div className="p-4 bg-white">
                <CoordinationTestPanel values={coordinationData} onChange={setCoordinationData} lang="no" readOnly={isSigned} onGenerateNarrative={(n) => updateField('objective', 'neuro_tests', (encounterData.objective.neuro_tests ? encounterData.objective.neuro_tests + '\n\n' : '') + n)} />
              </div>
            )}
          </div>

          {/* Nerve Tension Tests */}
          <div className="border border-orange-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowNerveTension(!showNerveTension)} className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 hover:bg-orange-100 transition-colors">
              <div className="flex items-center gap-2"><Activity className="w-5 h-5 text-orange-600" /><span className="font-medium text-orange-900">Nervestrekkstester</span>
              {Object.keys(nerveTensionData).length > 0 && <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">Data registrert</span>}
              </div>
              {showNerveTension ? <ChevronUp className="w-5 h-5 text-orange-600" /> : <ChevronDown className="w-5 h-5 text-orange-600" />}
            </button>
            {showNerveTension && (
              <div className="p-4 bg-white">
                <NerveTensionTests values={nerveTensionData} onChange={setNerveTensionData} lang="no" readOnly={isSigned} onGenerateNarrative={(n) => updateField('objective', 'neuro_tests', (encounterData.objective.neuro_tests ? encounterData.objective.neuro_tests + '\n\n' : '') + n)} />
              </div>
            )}
          </div>

          {/* Regional Body Diagrams */}
          <div className="border border-amber-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowRegionalDiagrams(!showRegionalDiagrams)} className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors">
              <div className="flex items-center gap-2"><Activity className="w-5 h-5 text-amber-600" /><span className="font-medium text-amber-900">Leddundersøkelse (Bilateral)</span>
              {Object.keys(regionalDiagramData).length > 0 && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">{Object.keys(regionalDiagramData).length} markering(er)</span>}
              </div>
              {showRegionalDiagrams ? <ChevronUp className="w-5 h-5 text-amber-600" /> : <ChevronDown className="w-5 h-5 text-amber-600" />}
            </button>
            {showRegionalDiagrams && (
              <div className="p-4 bg-white">
                <p className="text-sm text-gray-600 mb-3">Velg region og marker funn på venstre og høyre side.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['shoulder', 'knee', 'ankle', 'wrist', 'elbow', 'cervical', 'lumbar', 'hip', 'head'].map(region => (
                    <button key={region} onClick={() => setSelectedRegion(region)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedRegion === region ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-amber-100'}`}>
                      {region === 'shoulder' ? 'Skulder' : region === 'knee' ? 'Kne' : region === 'ankle' ? 'Ankel' : region === 'wrist' ? 'Håndledd' : region === 'elbow' ? 'Albue' : region === 'cervical' ? 'Nakke' : region === 'lumbar' ? 'Korsrygg' : region === 'hip' ? 'Hofte' : 'Hode/TMJ'}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-lg p-3 bg-blue-50/30">
                    <h5 className="text-xs font-semibold text-blue-700 mb-2 text-center uppercase">Venstre</h5>
                    <RegionalBodyDiagram region={selectedRegion} side="left" findings={regionalDiagramData.left?.[selectedRegion] || {}} onFindingsChange={(f) => setRegionalDiagramData(prev => ({ ...prev, left: { ...(prev.left || {}), [selectedRegion]: f } }))} compact={true} />
                  </div>
                  <div className="border border-slate-200 rounded-lg p-3 bg-red-50/30">
                    <h5 className="text-xs font-semibold text-red-700 mb-2 text-center uppercase">Høyre</h5>
                    <RegionalBodyDiagram region={selectedRegion} side="right" findings={regionalDiagramData.right?.[selectedRegion] || {}} onFindingsChange={(f) => setRegionalDiagramData(prev => ({ ...prev, right: { ...(prev.right || {}), [selectedRegion]: f } }))} compact={true} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pain Assessment */}
          <div className="border border-red-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowPainAssessment(!showPainAssessment)} className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 transition-colors">
              <div className="flex items-center gap-2"><Target className="w-5 h-5 text-red-600" /><span className="font-medium text-red-900">Smertevurdering</span>
              {Object.keys(painAssessmentData).length > 0 && <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">Data registrert</span>}
              </div>
              {showPainAssessment ? <ChevronUp className="w-5 h-5 text-red-600" /> : <ChevronDown className="w-5 h-5 text-red-600" />}
            </button>
            {showPainAssessment && (
              <div className="p-4 bg-white">
                <PainAssessmentPanel values={painAssessmentData} onChange={setPainAssessmentData} lang="no" readOnly={isSigned} onGenerateNarrative={(n) => updateField('subjective', 'pain_description', (encounterData.subjective.pain_description ? encounterData.subjective.pain_description + '\n\n' : '') + n)} />
              </div>
            )}
          </div>

          {/* Headache Assessment */}
          <div className="border border-pink-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowHeadacheAssessment(!showHeadacheAssessment)} className="w-full flex items-center justify-between px-4 py-3 bg-pink-50 hover:bg-pink-100 transition-colors">
              <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-pink-600" /><span className="font-medium text-pink-900">Hodepineutredning</span>
              {Object.keys(headacheData).length > 0 && <span className="text-xs bg-pink-200 text-pink-800 px-2 py-0.5 rounded-full">Data registrert</span>}
              </div>
              {showHeadacheAssessment ? <ChevronUp className="w-5 h-5 text-pink-600" /> : <ChevronDown className="w-5 h-5 text-pink-600" />}
            </button>
            {showHeadacheAssessment && (
              <div className="p-4 bg-white">
                <HeadacheAssessment values={headacheData} onChange={setHeadacheData} lang="no" readOnly={isSigned} onGenerateNarrative={(n) => updateField('subjective', 'chief_complaint', (encounterData.subjective.chief_complaint ? encounterData.subjective.chief_complaint + '\n\n' : '') + n)} />
              </div>
            )}
          </div>

          {/* Tissue Abnormality Markers */}
          <div className="border border-cyan-200 rounded-lg overflow-hidden">
            <button onClick={() => setShowTissueMarkers(!showTissueMarkers)} className="w-full flex items-center justify-between px-4 py-3 bg-cyan-50 hover:bg-cyan-100 transition-colors">
              <div className="flex items-center gap-2"><Target className="w-5 h-5 text-cyan-600" /><span className="font-medium text-cyan-900">Vevsabnormaliteter</span>
              {Object.keys(tissueMarkerData).length > 0 && <span className="text-xs bg-cyan-200 text-cyan-800 px-2 py-0.5 rounded-full">Data registrert</span>}
              </div>
              {showTissueMarkers ? <ChevronUp className="w-5 h-5 text-cyan-600" /> : <ChevronDown className="w-5 h-5 text-cyan-600" />}
            </button>
            {showTissueMarkers && (
              <div className="p-4 bg-white">
                <TissueAbnormalityMarkers values={tissueMarkerData} onChange={setTissueMarkerData} lang="no" readOnly={isSigned} onGenerateNarrative={(n) => updateField('objective', 'palpation', (encounterData.objective.palpation ? encounterData.objective.palpation + '\n\n' : '') + n)} />
              </div>
            )}
          </div>

        </div>
        {/* --- ACCORDION PANELS END --- */}

        {quickPhrases && !isSigned && (
          <div className="flex flex-wrap gap-1.5">
            {quickPhrases.objective?.map(phrase => (
              <button
                key={phrase}
                onClick={() => handleQuickPhrase(phrase, 'ortho_tests')}
                className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
              >
                + {phrase}
              </button>
            ))}
          </div>
        )}

        <textarea
          placeholder="Ytterligere objektive funn..."
          value={encounterData.objective.neuro_tests}
          onChange={(e) => {
            if (!onTextInputWithMacros(e, 'objective', 'neuro_tests')) {
              updateField('objective', 'neuro_tests', e.target.value);
            }
          }}
          onFocus={() => onSetActiveField('objective.neuro_tests')}
          disabled={isSigned}
          className="w-full min-h-[60px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
        />
      </div>
    </section>
  );
}