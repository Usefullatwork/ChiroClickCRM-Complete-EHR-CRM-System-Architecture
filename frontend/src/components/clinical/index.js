/**
 * Clinical Components Index
 * Exports all clinical documentation components
 */

export { default as SoapNoteBuilder } from './SoapNoteBuilder'
export { default as DraggableSoapSections } from './DraggableSoapSections'
export { default as QuickPalpationSpine } from './QuickPalpationSpine';
export {
  default as EnhancedClinicalSidebar,
  SidebarModeBar,
  SIDEBAR_MODES
} from './EnhancedClinicalSidebar';

// Healthcare UX Components (2026-01)
export { default as SALTBanner } from './SALTBanner';
export { default as AIConfidenceBadge, AIConfidenceDot, calculateConfidence } from './AIConfidenceBadge';
export { default as AIDiagnosisSidebar } from './AIDiagnosisSidebar';
export { default as EnhancedClinicalTextarea, MACROS } from './EnhancedClinicalTextarea';
