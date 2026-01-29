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
 * // Context provider for shared state
 * import { AnatomyProvider, useAnatomy } from '@/components/anatomy';
 */

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
