import { useState } from 'react';

/**
 * Exam findings data for all examination panels.
 * Separated from visibility so data persists even when panels close.
 */
export function useExamData() {
  // Core exam data
  const [neuroExamData, setNeuroExamData] = useState(null);
  const [orthoExamData, setOrthoExamData] = useState(null);
  const [examProtocolData, setExamProtocolData] = useState({});
  const [clusterTestData, setClusterTestData] = useState({});
  const [bodyDiagramMarkers, setBodyDiagramMarkers] = useState([]);
  const [romTableData, setRomTableData] = useState({});
  const [neurologicalExamData, setNeurologicalExamData] = useState({});
  const [outcomeMeasureType, setOutcomeMeasureType] = useState('ndi');
  const [outcomeMeasureData, setOutcomeMeasureData] = useState({});
  const [regionalExamData, setRegionalExamData] = useState({});

  // Specialized exam data
  const [mmtData, setMmtData] = useState({});
  const [cranialNerveData, setCranialNerveData] = useState({});
  const [sensoryExamData, setSensoryExamData] = useState({});
  const [painAssessmentData, setPainAssessmentData] = useState({});
  const [dtrData, setDtrData] = useState({});
  const [coordinationData, setCoordinationData] = useState({});
  const [nerveTensionData, setNerveTensionData] = useState({});
  const [regionalDiagramData, setRegionalDiagramData] = useState({});
  const [selectedRegion, setSelectedRegion] = useState('shoulder');
  const [headacheData, setHeadacheData] = useState({});
  const [tissueMarkerData, setTissueMarkerData] = useState({});

  // Anatomy panel data
  const [anatomySpineFindings, setAnatomySpineFindings] = useState({});
  const [anatomyBodyRegions, setAnatomyBodyRegions] = useState([]);

  // Notation
  const [notationData, setNotationData] = useState({ markers: [], selectedPoints: [] });
  const [notationNarrative, setNotationNarrative] = useState('');

  return {
    neuroExamData,
    setNeuroExamData,
    orthoExamData,
    setOrthoExamData,
    examProtocolData,
    setExamProtocolData,
    clusterTestData,
    setClusterTestData,
    bodyDiagramMarkers,
    setBodyDiagramMarkers,
    romTableData,
    setRomTableData,
    neurologicalExamData,
    setNeurologicalExamData,
    outcomeMeasureType,
    setOutcomeMeasureType,
    outcomeMeasureData,
    setOutcomeMeasureData,
    regionalExamData,
    setRegionalExamData,
    mmtData,
    setMmtData,
    cranialNerveData,
    setCranialNerveData,
    sensoryExamData,
    setSensoryExamData,
    painAssessmentData,
    setPainAssessmentData,
    dtrData,
    setDtrData,
    coordinationData,
    setCoordinationData,
    nerveTensionData,
    setNerveTensionData,
    regionalDiagramData,
    setRegionalDiagramData,
    selectedRegion,
    setSelectedRegion,
    headacheData,
    setHeadacheData,
    tissueMarkerData,
    setTissueMarkerData,
    anatomySpineFindings,
    setAnatomySpineFindings,
    anatomyBodyRegions,
    setAnatomyBodyRegions,
    notationData,
    setNotationData,
    notationNarrative,
    setNotationNarrative,
  };
}
