import { useExamPanelContext } from '../../../context/ExamPanelContext';
import { ClipboardList, Target, PersonStanding, Brain } from 'lucide-react';
import ExamToggle from './ExamToggle';

import ExaminationProtocol from '../../examination/ExaminationProtocol';
import ClusterTestPanel from '../../examination/ClusterTestPanel';
import RegionalExamination from '../../examination/RegionalExamination';
import NeurologicalExam from '../../examination/NeurologicalExam';
import OutcomeMeasures, { OutcomeMeasureSelector } from '../../examination/OutcomeMeasures';

export default function ProtocolExamPanels({ isSigned, updateField, encounterData }) {
  const { panels, examData } = useExamPanelContext();

  const {
    showExamProtocol,
    setShowExamProtocol,
    showClusterTests,
    setShowClusterTests,
    showRegionalExam,
    setShowRegionalExam,
    showNeurologicalExam,
    setShowNeurologicalExam,
    showOutcomeMeasures,
    setShowOutcomeMeasures,
  } = panels;

  const {
    examProtocolData,
    setExamProtocolData,
    clusterTestData,
    setClusterTestData,
    regionalExamData,
    setRegionalExamData,
    neurologicalExamData,
    setNeurologicalExamData,
    outcomeMeasureType,
    setOutcomeMeasureType,
    outcomeMeasureData,
    setOutcomeMeasureData,
  } = examData;

  return (
    <>
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
                `${
                  encounterData.assessment.clinical_reasoning +
                  (encounterData.assessment.clinical_reasoning ? '\n\n' : '')
                }${result.type.toUpperCase()}: ${result.score} poeng (${result.percentage}%)`
              );
            }}
          />
        </div>
      </ExamToggle>
    </>
  );
}
