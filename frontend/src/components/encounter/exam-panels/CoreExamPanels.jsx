import { lazy, Suspense } from 'react';
import { useExamPanelContext } from '../../../context/ExamPanelContext';
import { Bone, Activity, Ruler, PersonStanding, Stethoscope } from 'lucide-react';
import ExamToggle from './ExamToggle';

const AnatomyViewer = lazy(() => import('../../anatomy/AnatomyViewer'));
import { NeurologicalExamCompact } from '../../neuroexam';
import { OrthopedicExamCompact } from '../../orthoexam';
import VisualROMSelector from '../../examination/VisualROMSelector';
import BodyDiagram from '../../examination/BodyDiagram';

export default function CoreExamPanels({
  patientId,
  encounterId,
  isSigned,
  onOrthoExamChange,
  onNeuroExamChange,
  onAnatomyInsertText,
  updateField,
  encounterData,
}) {
  const { panels, examData } = useExamPanelContext();

  const {
    showAnatomyPanel,
    setShowAnatomyPanel,
    showOrthoExam,
    setShowOrthoExam,
    showNeuroExam,
    setShowNeuroExam,
    showROMTable,
    setShowROMTable,
    showBodyDiagram,
    setShowBodyDiagram,
  } = panels;

  const {
    orthoExamData,
    neuroExamData,
    romTableData,
    setRomTableData,
    bodyDiagramMarkers,
    setBodyDiagramMarkers,
    anatomySpineFindings,
    setAnatomySpineFindings,
    anatomyBodyRegions,
    setAnatomyBodyRegions,
  } = examData;

  return (
    <>
      {/* Anatomy Viewer */}
      <ExamToggle
        show={showAnatomyPanel}
        onToggle={() => setShowAnatomyPanel(!showAnatomyPanel)}
        icon={Stethoscope}
        label="Anatomi \u2013 Klikk for \u00E5 notere"
        color="violet"
        badgeText={
          Object.keys(anatomySpineFindings).length + anatomyBodyRegions.length > 0
            ? `${Object.keys(anatomySpineFindings).length + anatomyBodyRegions.length} funn`
            : null
        }
      >
        <Suspense fallback={<div className="animate-pulse bg-violet-50 rounded-lg h-64" />}>
          <AnatomyViewer
            spineFindings={anatomySpineFindings}
            onSpineFindingsChange={setAnatomySpineFindings}
            bodyRegions={anatomyBodyRegions}
            onBodyRegionsChange={setAnatomyBodyRegions}
            onInsertText={onAnatomyInsertText}
            language="NO"
            compact={false}
          />
        </Suspense>
      </ExamToggle>

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
    </>
  );
}
