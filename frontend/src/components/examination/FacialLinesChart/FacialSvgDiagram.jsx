/**
 * FacialSvgDiagram - SVG face diagram with layered anatomy rendering
 *
 * Renders nerve zones, face outline, fascial lines, trigger points, and markers.
 */

import { FASCIAL_LINES, FACIAL_MUSCLES, NERVE_ZONES } from './facialChartData';

export default function FacialSvgDiagram({
  showNerves,
  showOutline,
  showFascialLines,
  showTriggerPoints,
  selectedLine,
  selectedTriggerPoint,
  markers,
  onLineClick,
  onTriggerPointClick,
}) {
  return (
    <div className="flex-1 p-4">
      <div className="flex justify-center">
        <svg
          viewBox="0 0 200 250"
          className="w-full max-w-md h-auto"
          style={{ maxHeight: '500px' }}
        >
          {/* Nerve Zones Layer */}
          {showNerves &&
            Object.entries(NERVE_ZONES).map(([id, zone]) => (
              <path
                key={id}
                d={zone.path}
                fill={zone.color}
                stroke={zone.color.replace('0.3', '0.6')}
                strokeWidth="1"
                className="cursor-pointer transition-opacity hover:opacity-80"
              />
            ))}

          {/* Face Outline */}
          {showOutline && (
            <g className="face-outline" stroke="#94A3B8" strokeWidth="1.5" fill="none">
              <ellipse cx="100" cy="110" rx="60" ry="80" fill="#FEF3C7" fillOpacity="0.3" />
              <ellipse cx="40" cy="100" rx="8" ry="15" fill="#FEF3C7" fillOpacity="0.3" />
              <ellipse cx="160" cy="100" rx="8" ry="15" fill="#FEF3C7" fillOpacity="0.3" />
              <path d="M50,50 Q100,25 150,50" strokeDasharray="3,3" />
              <ellipse cx="75" cy="90" rx="12" ry="6" fill="white" stroke="#64748B" />
              <ellipse cx="125" cy="90" rx="12" ry="6" fill="white" stroke="#64748B" />
              <circle cx="75" cy="90" r="3" fill="#374151" />
              <circle cx="125" cy="90" r="3" fill="#374151" />
              <path d="M60,78 Q75,73 88,78" stroke="#64748B" strokeWidth="2" fill="none" />
              <path d="M112,78 Q125,73 140,78" stroke="#64748B" strokeWidth="2" fill="none" />
              <path d="M100,95 L100,130 M92,135 Q100,142 108,135" stroke="#64748B" />
              <path d="M85,160 Q100,170 115,160" stroke="#64748B" strokeWidth="1.5" />
              <path d="M85,160 Q100,155 115,160" stroke="#64748B" strokeWidth="0.5" />
              <path d="M45,130 Q50,180 100,195 Q150,180 155,130" stroke="#94A3B8" strokeWidth="1" />
              <path d="M75,190 L70,240 M125,190 L130,240" stroke="#94A3B8" strokeDasharray="2,2" />
            </g>
          )}

          {/* Fascial Lines Layer */}
          {showFascialLines &&
            Object.entries(FASCIAL_LINES).map(([id, line]) => (
              <g key={id} className="fascial-line">
                <path
                  d={line.path}
                  stroke={line.color}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  className="cursor-pointer transition-all hover:stroke-width-4"
                  style={{
                    filter: selectedLine?.id === id ? `drop-shadow(0 0 4px ${line.color})` : 'none',
                  }}
                  onClick={() => onLineClick(id, line)}
                />
                {line.points.map((point) => (
                  <circle
                    key={point.id}
                    cx={point.cx}
                    cy={point.cy}
                    r="4"
                    fill={line.color}
                    stroke="white"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => onLineClick(id, line)}
                  />
                ))}
              </g>
            ))}

          {/* Trigger Points Layer */}
          {showTriggerPoints &&
            Object.entries(FACIAL_MUSCLES).map(([muscleId, muscle]) => (
              <g key={muscleId} className="muscle-trigger-points">
                {muscle.triggerPoints.map((tp) => (
                  <g key={tp.id}>
                    {selectedTriggerPoint?.triggerPoint.id === tp.id && (
                      <circle
                        cx={tp.cx}
                        cy={tp.cy}
                        r="10"
                        fill="none"
                        stroke={muscle.color}
                        strokeWidth="2"
                        opacity="0.5"
                      />
                    )}
                    <circle
                      cx={tp.cx}
                      cy={tp.cy}
                      r="5"
                      fill={muscle.color}
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:r-6"
                      style={{
                        filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.3))`,
                        transform:
                          selectedTriggerPoint?.triggerPoint.id === tp.id
                            ? 'scale(1.2)'
                            : 'scale(1)',
                        transformOrigin: `${tp.cx}px ${tp.cy}px`,
                      }}
                      onClick={() => onTriggerPointClick(muscle, tp)}
                    />
                    <g
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      className="pointer-events-none"
                    >
                      <line x1={tp.cx - 2} y1={tp.cy - 2} x2={tp.cx + 2} y2={tp.cy + 2} />
                      <line x1={tp.cx + 2} y1={tp.cy - 2} x2={tp.cx - 2} y2={tp.cy + 2} />
                    </g>
                  </g>
                ))}
              </g>
            ))}

          {/* Markers from value */}
          {markers &&
            markers.map((marker, idx) => (
              <circle
                key={marker.id || idx}
                cx={marker.cx || 100}
                cy={marker.cy || 100}
                r="6"
                fill="#22C55E"
                stroke="white"
                strokeWidth="2"
                opacity="0.8"
              />
            ))}
        </svg>
      </div>
    </div>
  );
}
