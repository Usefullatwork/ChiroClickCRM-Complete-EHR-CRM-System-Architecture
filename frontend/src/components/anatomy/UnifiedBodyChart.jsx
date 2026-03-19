import { lazy, Suspense } from 'react';

/**
 * UnifiedBodyChart — Facade component that provides a single entry point
 * for body chart visualization with simple/detailed mode toggle.
 *
 * Usage:
 *   <UnifiedBodyChart mode="simple" markers={markers} onMarkerAdd={fn} />
 *   <UnifiedBodyChart mode="detailed" markers={markers} onMarkerAdd={fn} />
 *
 * Props:
 * - mode: 'simple' | 'detailed' (default: 'simple')
 * - All other props are forwarded to the underlying component
 *
 * Simple mode: assessment/BodyChart (717 lines) — SVG drawing tool for EasyAssessment
 * Detailed mode: examination/AnatomicalBodyChart (3,641 lines) — full anatomical chart
 */

const SimpleBodyChart = lazy(() => import('../assessment/BodyChart'));
const DetailedBodyChart = lazy(() => import('../examination/AnatomicalBodyChart'));

const LoadingFallback = (
  <div className="flex items-center justify-center p-8 text-gray-400">
    <div className="animate-pulse">Laster kroppskart...</div>
  </div>
);

export default function UnifiedBodyChart({ mode = 'simple', ...props }) {
  const Component = mode === 'detailed' ? DetailedBodyChart : SimpleBodyChart;

  return (
    <Suspense fallback={LoadingFallback}>
      <Component {...props} />
    </Suspense>
  );
}

export { UnifiedBodyChart };
