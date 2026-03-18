import { useExamPanelContext } from '../../../context/ExamPanelContext';
import { Activity, Brain } from 'lucide-react';
import ExamToggle from './ExamToggle';

import ManualMuscleTesting from '../../examination/ManualMuscleTesting';
import DeepTendonReflexPanel from '../../examination/DeepTendonReflexPanel';
import SensoryExamination from '../../examination/SensoryExamination';
import CranialNervePanel from '../../examination/CranialNervePanel';
import CoordinationTestPanel from '../../examination/CoordinationTestPanel';
import NerveTensionTests from '../../examination/NerveTensionTests';

export default function NeuroDetailPanels({ isSigned, updateField, encounterData }) {
  const { panels, examData } = useExamPanelContext();

  const {
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
  } = panels;

  const {
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
  } = examData;

  const appendNeuroNarrative = (narrative) => {
    updateField(
      'objective',
      'neuro_tests',
      encounterData.objective.neuro_tests +
        (encounterData.objective.neuro_tests ? '\n\n' : '') +
        narrative
    );
  };

  return (
    <>
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
          onGenerateNarrative={appendNeuroNarrative}
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
          onGenerateNarrative={appendNeuroNarrative}
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
          onGenerateNarrative={appendNeuroNarrative}
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
          onGenerateNarrative={appendNeuroNarrative}
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
          onGenerateNarrative={appendNeuroNarrative}
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
          onGenerateNarrative={appendNeuroNarrative}
        />
      </ExamToggle>
    </>
  );
}
