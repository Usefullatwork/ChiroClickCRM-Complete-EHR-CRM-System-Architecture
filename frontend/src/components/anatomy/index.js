/**
 * Anatomy Components Index
 * Enhanced anatomical visualization components for clinical documentation
 */

export { default as MuscleMap, MUSCLE_GROUPS, MUSCLE_GROUP_LABELS, FINDING_TYPES as MUSCLE_FINDING_TYPES } from './MuscleMap';
export { default as AnatomicalSpine, VERTEBRAE, FINDING_TYPES as SPINE_FINDING_TYPES, LISTINGS, REGION_COLORS } from './AnatomicalSpine';

// Enhanced anatomy components
export { EnhancedSpineDiagram, CompactSpineDiagram } from './spine';
export { Spine3DViewer, CompactSpine3D } from './spine';
export { EnhancedBodyDiagram, CompactBodyDiagram } from './body';
export { default as AnatomyViewer, VIEW_MODES } from './AnatomyViewer';
export { default as AnatomyProvider } from './AnatomyProvider';

// Re-export existing body chart components for convenience
export { default as BodyChart } from '../BodyChart';
export { default as SpineWidget } from '../SpineWidget';
