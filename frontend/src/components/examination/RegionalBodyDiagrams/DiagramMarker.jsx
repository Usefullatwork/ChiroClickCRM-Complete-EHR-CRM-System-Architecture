/**
 * DiagramMarker - SVG marker component for regional body diagrams
 *
 * Renders a clickable, selectable marker with type-based color and symbol.
 * Shows a remove button when selected.
 */

import { MARKER_TYPES } from './diagramData';

export default function DiagramMarker({ marker, onRemove, selected, onSelect }) {
  const type = MARKER_TYPES[marker.type] || MARKER_TYPES.pain;
  const size = selected ? 12 : 10;

  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(marker.id);
      }}
    >
      <circle
        cx={marker.x}
        cy={marker.y}
        r={size}
        fill={type.color}
        fillOpacity={0.3}
        stroke={type.color}
        strokeWidth={selected ? 2 : 1}
      />
      <text
        x={marker.x}
        y={marker.y + 4}
        fontSize="10"
        fontWeight="bold"
        fill={type.color}
        textAnchor="middle"
      >
        {type.symbol}
      </text>
      {selected && (
        <g
          onClick={(e) => {
            e.stopPropagation();
            onRemove(marker.id);
          }}
        >
          <circle cx={marker.x + 10} cy={marker.y - 10} r={6} fill="#ef4444" />
          <text x={marker.x + 10} y={marker.y - 7} fontSize="8" fill="white" textAnchor="middle">
            ×
          </text>
        </g>
      )}
    </g>
  );
}
