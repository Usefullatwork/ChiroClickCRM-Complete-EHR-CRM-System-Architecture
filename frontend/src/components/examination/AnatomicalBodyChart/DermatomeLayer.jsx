/**
 * DermatomeLayer - Renders clickable dermatome regions on the body SVG
 *
 * Shows color-coded nerve root distribution zones that can be selected
 * for clinical documentation.
 */

import { DERMATOMES, DERMATOME_REGIONS } from './bodyChartData';

export default function DermatomeLayer({ view, selectedDermatome, onDermatomeClick }) {
  const regions = DERMATOME_REGIONS[view] || {};

  return (
    <g className="dermatomes-layer">
      {Object.entries(regions).map(([id, region]) => {
        const dermatome = DERMATOMES[id];
        if (!dermatome) {
          return null;
        }

        const isSelected = selectedDermatome === id;

        return (
          <g key={id}>
            <path
              d={region.path}
              fill={dermatome.color}
              fillOpacity={isSelected ? 0.6 : 0.3}
              stroke={isSelected ? '#000' : dermatome.color}
              strokeWidth={isSelected ? 2 : 1}
              className="cursor-pointer transition-all hover:fill-opacity-50"
              onClick={() => onDermatomeClick(id)}
            />
            <text
              x={region.cx}
              y={region.cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8"
              fontWeight="bold"
              fill="#333"
              className="pointer-events-none"
            >
              {id}
            </text>
          </g>
        );
      })}
    </g>
  );
}
