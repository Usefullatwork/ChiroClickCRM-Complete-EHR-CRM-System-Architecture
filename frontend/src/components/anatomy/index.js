/**
 * ChiroClick CRM - Anatomy Visualization Module
 *
 * Provides 2D SVG and 3D WebGL anatomical visualization components
 * for spine examination, body pain mapping, and treatment documentation.
 *
 * Usage:
 *
 * // Full-featured viewer with mode switching
 * import { AnatomyViewer, VIEW_MODES } from '@/components/anatomy';
 *
 * <AnatomyViewer
 *   spineFindings={findings}
 *   onSpineFindingsChange={setFindings}
 *   onInsertText={handleInsert}
 * />
 *
 * // Individual components
 * import { EnhancedSpineDiagram, Spine3DViewer, EnhancedBodyDiagram } from '@/components/anatomy';
 *
 * // Simple 2D components
 * import { MuscleMap, AnatomicalSpine } from '@/components/anatomy';
 *
 * // Context provider for shared state
 * import { AnatomyProvider, useAnatomy } from '@/components/anatomy';
 */

// ============================================================================
// SIMPLE 2D COMPONENTS (Quick documentation)
// ============================================================================

export { default as MuscleMap, MUSCLE_GROUPS, MUSCLE_GROUP_LABELS, FINDING_TYPES as MUSCLE_FINDING_TYPES } from './MuscleMap';
export { default as AnatomicalSpine, VERTEBRAE, FINDING_TYPES as SPINE_FINDING_TYPES, LISTINGS, REGION_COLORS } from './AnatomicalSpine';

// Re-export existing body chart components for convenience
export { default as BodyChart } from '../BodyChart';
export { default as SpineWidget } from '../SpineWidget';

// ============================================================================
// ENHANCED 2D/3D COMPONENTS (Advanced visualization)
// ============================================================================

// Main combined viewer
export {
  default as AnatomyViewer,
  VIEW_MODES,
  ExaminationAnatomyViewer,
  TreatmentAnatomyViewer,
  QuickPalpationViewer
} from './AnatomyViewer';

// Context provider
export {
  default as AnatomyProvider,
  useAnatomy
} from './AnatomyProvider';

// Spine components
export {
  EnhancedSpineDiagram,
  CompactSpineDiagram,
  Spine3DViewer,
  CompactSpine3D
} from './spine';

// Body components
export {
  EnhancedBodyDiagram,
  CompactBodyDiagram
} from './body';

// Shared components
export {
  DirectionPopup,
  InlineDirectionSelect
} from './shared';

// Hooks
export {
  useAnatomyClick,
  STANDARD_DIRECTIONS,
  SI_DIRECTIONS,
  FINDING_TYPES,
  getDirectionsForSegment
} from './hooks';
