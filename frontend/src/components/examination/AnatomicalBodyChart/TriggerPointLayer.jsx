/**
 * TriggerPointLayer - Renders clickable muscle trigger points on the body SVG
 *
 * Shows color-coded trigger points from the muscle data. Points that have been
 * marked with a symptom show an 'X' indicator.
 */

import { MUSCLES, SYMPTOM_COLORS } from './bodyChartData';

export default function TriggerPointLayer({
  selectedSymptom,
  selectedTriggerPoint,
  currentMarkers,
  onTriggerPointClick,
}) {
  return (
    <g className="trigger-points-layer">
      {Object.entries(MUSCLES).map(([muscleId, muscle]) => {
        return muscle.triggerPoints.map((tp) => {
          const isSelected = selectedTriggerPoint?.triggerPoint?.id === tp.id;
          const hasMarker = currentMarkers.some((m) => m.regionId === `tp_${tp.id}`);

          return (
            <g key={tp.id}>
              <circle
                cx={tp.cx}
                cy={tp.cy}
                r={isSelected ? 8 : 6}
                fill={hasMarker ? SYMPTOM_COLORS[selectedSymptom] : muscle.color}
                fillOpacity={hasMarker ? 0.9 : 0.7}
                stroke={isSelected ? '#000' : '#fff'}
                strokeWidth={isSelected ? 2 : 1}
                className="cursor-pointer transition-all hover:r-8"
                onClick={() => onTriggerPointClick(muscleId, tp)}
              />
              {hasMarker && (
                <text
                  x={tp.cx}
                  y={tp.cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fontWeight="bold"
                  fill="#fff"
                  className="pointer-events-none"
                >
                  X
                </text>
              )}
            </g>
          );
        });
      })}
    </g>
  );
}
