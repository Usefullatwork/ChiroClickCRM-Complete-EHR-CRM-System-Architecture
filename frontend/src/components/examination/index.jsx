/**
 * Examination Components Index
 * Exports all clinical examination components
 */

// Placeholder component factory
const createPlaceholder = (name) => {
  const Component = ({ className = '', ...props }) => (
    <div className={`p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg ${className}`} {...props}>
      <div className="text-sm text-gray-500 text-center">
        <span className="font-medium">{name}</span>
        <span className="block text-xs mt-1">Component under development</span>
      </div>
    </div>
  )
  Component.displayName = name
  return Component
}

// Main examination components
export const ExaminationProtocol = createPlaceholder('ExaminationProtocol')
export const ClusterTestPanel = createPlaceholder('ClusterTestPanel')
export const BodyDiagram = createPlaceholder('BodyDiagram')
export const ROMTable = createPlaceholder('ROMTable')
export const RegionalExamination = createPlaceholder('RegionalExamination')
export const VisualROMSelector = createPlaceholder('VisualROMSelector')
export const ManualMuscleTesting = createPlaceholder('ManualMuscleTesting')
export const CranialNervePanel = createPlaceholder('CranialNervePanel')
export const SensoryExamination = createPlaceholder('SensoryExamination')
export const PainAssessmentPanel = createPlaceholder('PainAssessmentPanel')
export const DeepTendonReflexPanel = createPlaceholder('DeepTendonReflexPanel')
export const CoordinationTestPanel = createPlaceholder('CoordinationTestPanel')
export const NerveTensionTests = createPlaceholder('NerveTensionTests')
export const HeadacheAssessment = createPlaceholder('HeadacheAssessment')
export const TissueAbnormalityMarkers = createPlaceholder('TissueAbnormalityMarkers')
export const BodyChartPanel = createPlaceholder('BodyChartPanel')
export const AnatomicalBodyChart = createPlaceholder('AnatomicalBodyChart')
export const ActivatorMethodPanel = createPlaceholder('ActivatorMethodPanel')
export const FacialLinesChart = createPlaceholder('FacialLinesChart')

// Bilateral body diagrams
export const LowerExtremityDiagram = createPlaceholder('LowerExtremityDiagram')
export const UpperExtremityDiagram = createPlaceholder('UpperExtremityDiagram')
export const RegionalBodyDiagram = createPlaceholder('RegionalBodyDiagram')
