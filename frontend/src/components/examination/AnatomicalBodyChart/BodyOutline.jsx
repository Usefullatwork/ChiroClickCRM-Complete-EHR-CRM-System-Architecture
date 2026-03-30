/**
 * BodyOutline - SVG body outline rendering for anterior/posterior views
 *
 * Renders anatomical paths (outline, clavicle, pectoralis, abdominals,
 * spine, scapulae, sacrum) based on current view.
 */

import { ANATOMICAL_PATHS } from './bodyChartData';

export default function BodyOutline({ view }) {
  return (
    <g className="body-outline">
      <path
        d={ANATOMICAL_PATHS[view]?.outline}
        fill="none"
        stroke="#374151"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {view === 'front' && (
        <>
          <path d={ANATOMICAL_PATHS.front.clavicle} fill="none" stroke="#9CA3AF" strokeWidth="1" />
          <path
            d={ANATOMICAL_PATHS.front.pectoralis}
            fill="none"
            stroke="#D1D5DB"
            strokeWidth="0.5"
          />
          <path
            d={ANATOMICAL_PATHS.front.abdominals}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
        </>
      )}
      {view === 'back' && (
        <>
          <path
            d={ANATOMICAL_PATHS.back.spine}
            fill="none"
            stroke="#9CA3AF"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          <path d={ANATOMICAL_PATHS.back.scapulae} fill="none" stroke="#D1D5DB" strokeWidth="0.5" />
          <path
            d={ANATOMICAL_PATHS.back.sacrum}
            fill="#F3F4F6"
            stroke="#D1D5DB"
            strokeWidth="0.5"
          />
        </>
      )}
    </g>
  );
}
