/**
 * Spine Widget Component
 * Interactive vertebral segment selector for documenting spinal findings
 * Used for manipulation/adjustment documentation
 */

import { useState, useCallback, useMemo } from 'react';

// Vertebral segments configuration
const SPINE_SEGMENTS = {
  cervical: {
    label: 'Cervical',
    segments: [
      { id: 'C0', label: 'Occiput', fullName: 'Occipital condyles' },
      { id: 'C1', label: 'C1', fullName: 'Atlas' },
      { id: 'C2', label: 'C2', fullName: 'Axis' },
      { id: 'C3', label: 'C3', fullName: 'C3 vertebra' },
      { id: 'C4', label: 'C4', fullName: 'C4 vertebra' },
      { id: 'C5', label: 'C5', fullName: 'C5 vertebra' },
      { id: 'C6', label: 'C6', fullName: 'C6 vertebra' },
      { id: 'C7', label: 'C7', fullName: 'C7 vertebra' },
    ],
  },
  thoracic: {
    label: 'Thoracic',
    segments: Array.from({ length: 12 }, (_, i) => ({
      id: `T${i + 1}`,
      label: `T${i + 1}`,
      fullName: `T${i + 1} vertebra`,
    })),
  },
  lumbar: {
    label: 'Lumbar',
    segments: [
      { id: 'L1', label: 'L1', fullName: 'L1 vertebra' },
      { id: 'L2', label: 'L2', fullName: 'L2 vertebra' },
      { id: 'L3', label: 'L3', fullName: 'L3 vertebra' },
      { id: 'L4', label: 'L4', fullName: 'L4 vertebra' },
      { id: 'L5', label: 'L5', fullName: 'L5 vertebra' },
    ],
  },
  sacral: {
    label: 'Sacral',
    segments: [
      { id: 'S1', label: 'Sacrum', fullName: 'Sacral base' },
      { id: 'SI-R', label: 'SI-H', fullName: 'Sacroiliac joint right' },
      { id: 'SI-L', label: 'SI-V', fullName: 'Sacroiliac joint left' },
      { id: 'Coccyx', label: 'Coccyx', fullName: 'Coccyx' },
    ],
  },
};

// Finding types with colors
const FINDING_TYPES = [
  { id: 'restriction', label: 'Restriksjon', color: '#ef4444', abbrev: 'R' },
  { id: 'hypermobility', label: 'Hypermobilitet', color: '#f97316', abbrev: 'H' },
  { id: 'tenderness', label: 'Ømhet', color: '#eab308', abbrev: 'Ø' },
  { id: 'muscle_tension', label: 'Muskelstramhet', color: '#84cc16', abbrev: 'M' },
  { id: 'adjustment', label: 'Justert', color: '#22c55e', abbrev: '✓' },
  { id: 'mobilization', label: 'Mobilisert', color: '#06b6d4', abbrev: '~' },
];

// Direction/listing indicators
const DIRECTIONS = [
  { id: 'none', label: '-', description: 'Ingen retning' },
  { id: 'left', label: 'V', description: 'Venstre' },
  { id: 'right', label: 'H', description: 'Høyre' },
  { id: 'posterior', label: 'P', description: 'Posterior' },
  { id: 'anterior', label: 'A', description: 'Anterior' },
  { id: 'inferior', label: 'I', description: 'Inferior' },
  { id: 'superior', label: 'S', description: 'Superior' },
  { id: 'rotation_left', label: 'θV', description: 'Rotasjon venstre' },
  { id: 'rotation_right', label: 'θH', description: 'Rotasjon høyre' },
  { id: 'lateral_left', label: '←', description: 'Lateralfleksjon venstre' },
  { id: 'lateral_right', label: '→', description: 'Lateralfleksjon høyre' },
];

/**
 * Single Vertebra Button
 */
const VertebraButton = ({ segment, findings, isSelected, onClick, compact }) => {
  const hasFindings = findings && findings.length > 0;
  const primaryFinding = hasFindings ? FINDING_TYPES.find((f) => f.id === findings[0].type) : null;

  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center
        ${compact ? 'w-8 h-8 text-xs' : 'w-12 h-10 text-sm'}
        rounded-lg font-medium transition-all duration-150
        ${
          isSelected
            ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-100 text-blue-700'
            : hasFindings
              ? 'bg-gray-100 hover:bg-gray-200'
              : 'bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }
      `}
      title={segment.fullName}
      style={
        hasFindings && primaryFinding ? { borderLeft: `3px solid ${primaryFinding.color}` } : {}
      }
    >
      <span>{segment.label}</span>
      {hasFindings && (
        <span
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] text-white flex items-center justify-center"
          style={{ backgroundColor: primaryFinding?.color || '#6b7280' }}
        >
          {findings.length}
        </span>
      )}
    </button>
  );
};

/**
 * Spine Region Section
 */
const SpineRegion = ({
  region,
  segments,
  findingsMap,
  selectedSegment,
  onSegmentClick,
  compact,
}) => {
  return (
    <div className="mb-4">
      <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
        {region.label}
      </div>
      <div className={`flex flex-wrap gap-1 ${compact ? 'gap-0.5' : 'gap-2'}`}>
        {segments.map((segment) => (
          <VertebraButton
            key={segment.id}
            segment={segment}
            findings={findingsMap[segment.id]}
            isSelected={selectedSegment === segment.id}
            onClick={() => onSegmentClick(segment)}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Finding Editor Panel
 */
const FindingEditor = ({ segment, finding, onSave, onDelete, onCancel }) => {
  const [findingType, setFindingType] = useState(finding?.type || FINDING_TYPES[0].id);
  const [direction, setDirection] = useState(finding?.direction || 'none');
  const [notes, setNotes] = useState(finding?.notes || '');
  const [technique, setTechnique] = useState(finding?.technique || '');

  const handleSave = () => {
    onSave({
      id: finding?.id || `${Date.now()}`,
      segmentId: segment.id,
      segmentLabel: segment.label,
      type: findingType,
      direction,
      notes,
      technique,
      timestamp: new Date().toISOString(),
    });
  };

  const _selectedType = FINDING_TYPES.find((t) => t.id === findingType);

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">
          {segment.label} - {segment.fullName}
        </h4>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      {/* Finding type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Funn</label>
        <div className="flex flex-wrap gap-2">
          {FINDING_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setFindingType(type.id)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all border-2
                ${findingType === type.id ? 'ring-2 ring-offset-1' : ''}
              `}
              style={{
                borderColor: type.color,
                backgroundColor: findingType === type.id ? `${type.color}20` : 'white',
                color: type.color,
              }}
            >
              {type.abbrev} {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Direction */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Retning/Listing</label>
        <div className="flex flex-wrap gap-1">
          {DIRECTIONS.map((dir) => (
            <button
              key={dir.id}
              onClick={() => setDirection(dir.id)}
              className={`
                px-2 py-1 rounded text-sm transition-all
                ${
                  direction === dir.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }
              `}
              title={dir.description}
            >
              {dir.label}
            </button>
          ))}
        </div>
      </div>

      {/* Technique (for adjustments) */}
      {(findingType === 'adjustment' || findingType === 'mobilization') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Teknikk</label>
          <select
            value={technique}
            onChange={(e) => setTechnique(e.target.value)}
            className="w-full p-2 border rounded-lg text-sm"
          >
            <option value="">Velg teknikk...</option>
            <option value="diversified">Diversified</option>
            <option value="gonstead">Gonstead</option>
            <option value="activator">Activator</option>
            <option value="drop_table">Drop table</option>
            <option value="flexion_distraction">Fleksjon-distraksjon</option>
            <option value="soft_tissue">Bløtvevsbehandling</option>
            <option value="mobilization">Mobilisering</option>
            <option value="toggle_recoil">Toggle recoil</option>
            <option value="upper_cervical">Upper cervical</option>
            <option value="other">Annet</option>
          </select>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notater</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tilleggsnotater..."
          className="w-full p-2 border rounded-lg text-sm resize-y min-h-[60px]"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        {finding && (
          <button
            onClick={() => onDelete(finding.id)}
            className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm"
          >
            Slett
          </button>
        )}
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
        >
          Avbryt
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          Lagre
        </button>
      </div>
    </div>
  );
};

/**
 * Main Spine Widget Component
 */
export const SpineWidget = ({
  initialFindings = [],
  onChange,
  readOnly = false,
  compact = false,
  showSummary = true,
}) => {
  const [findings, setFindings] = useState(initialFindings);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [editingFinding, setEditingFinding] = useState(null);

  // Group findings by segment
  const findingsMap = useMemo(() => {
    const map = {};
    findings.forEach((f) => {
      if (!map[f.segmentId]) {
        map[f.segmentId] = [];
      }
      map[f.segmentId].push(f);
    });
    return map;
  }, [findings]);

  // Handle segment click
  const handleSegmentClick = useCallback(
    (segment) => {
      if (readOnly) {
        return;
      }

      setSelectedSegment(segment.id);

      // Check if segment already has findings
      const existingFindings = findingsMap[segment.id];
      if (existingFindings && existingFindings.length > 0) {
        setEditingFinding({ segment, finding: existingFindings[0] });
      } else {
        setEditingFinding({ segment, finding: null });
      }
    },
    [findingsMap, readOnly]
  );

  // Save finding
  const handleSaveFinding = useCallback(
    (finding) => {
      let newFindings;
      const existingIndex = findings.findIndex((f) => f.id === finding.id);

      if (existingIndex >= 0) {
        newFindings = [...findings];
        newFindings[existingIndex] = finding;
      } else {
        newFindings = [...findings, finding];
      }

      setFindings(newFindings);
      setEditingFinding(null);
      setSelectedSegment(null);

      if (onChange) {
        onChange(newFindings);
      }
    },
    [findings, onChange]
  );

  // Delete finding
  const handleDeleteFinding = useCallback(
    (findingId) => {
      const newFindings = findings.filter((f) => f.id !== findingId);
      setFindings(newFindings);
      setEditingFinding(null);
      setSelectedSegment(null);

      if (onChange) {
        onChange(newFindings);
      }
    },
    [findings, onChange]
  );

  // Generate text summary
  const generateSummary = useCallback(() => {
    if (findings.length === 0) {
      return '';
    }

    const groups = {
      adjustment: [],
      mobilization: [],
      restriction: [],
      other: [],
    };

    findings.forEach((f) => {
      const type = FINDING_TYPES.find((t) => t.id === f.type);
      const dirLabel =
        f.direction !== 'none'
          ? ` (${DIRECTIONS.find((d) => d.id === f.direction)?.description || f.direction})`
          : '';

      if (f.type === 'adjustment') {
        groups.adjustment.push(`${f.segmentLabel}${dirLabel}`);
      } else if (f.type === 'mobilization') {
        groups.mobilization.push(`${f.segmentLabel}${dirLabel}`);
      } else if (f.type === 'restriction') {
        groups.restriction.push(`${f.segmentLabel}${dirLabel}`);
      } else {
        groups.other.push(`${f.segmentLabel}: ${type?.label || f.type}${dirLabel}`);
      }
    });

    const parts = [];
    if (groups.adjustment.length > 0) {
      parts.push(`Justert: ${groups.adjustment.join(', ')}`);
    }
    if (groups.mobilization.length > 0) {
      parts.push(`Mobilisert: ${groups.mobilization.join(', ')}`);
    }
    if (groups.restriction.length > 0) {
      parts.push(`Restriksjon: ${groups.restriction.join(', ')}`);
    }
    if (groups.other.length > 0) {
      parts.push(groups.other.join('. '));
    }

    return `${parts.join('. ')}.`;
  }, [findings]);

  return (
    <div className="spine-widget bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Ryggfunn</h3>
        {!readOnly && findings.length > 0 && (
          <button
            onClick={() => {
              setFindings([]);
              if (onChange) {
                onChange([]);
              }
            }}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Nullstill
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spine segments */}
        <div>
          {Object.entries(SPINE_SEGMENTS).map(([key, region]) => (
            <SpineRegion
              key={key}
              region={region}
              segments={region.segments}
              findingsMap={findingsMap}
              selectedSegment={selectedSegment}
              onSegmentClick={handleSegmentClick}
              compact={compact}
            />
          ))}
        </div>

        {/* Editor or summary */}
        <div>
          {editingFinding ? (
            <FindingEditor
              segment={editingFinding.segment}
              finding={editingFinding.finding}
              onSave={handleSaveFinding}
              onDelete={handleDeleteFinding}
              onCancel={() => {
                setEditingFinding(null);
                setSelectedSegment(null);
              }}
            />
          ) : showSummary && findings.length > 0 ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">
                  Registrerte funn ({findings.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {findings.map((f) => {
                    const type = FINDING_TYPES.find((t) => t.id === f.type);
                    return (
                      <div
                        key={f.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          const segment = Object.values(SPINE_SEGMENTS)
                            .flatMap((r) => r.segments)
                            .find((s) => s.id === f.segmentId);
                          if (segment) {
                            setEditingFinding({ segment, finding: f });
                            setSelectedSegment(f.segmentId);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: type?.color }}
                          />
                          <span className="font-medium text-sm">{f.segmentLabel}</span>
                          <span className="text-xs text-gray-500">{type?.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Tekstsammendrag</h4>
                <div className="p-3 bg-blue-50 rounded-lg text-sm">{generateSummary()}</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm p-8">
              <p>Klikk på et segment for å legge til funn</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex flex-wrap gap-3 text-xs">
          {FINDING_TYPES.map((type) => (
            <div key={type.id} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: type.color }} />
              <span className="text-gray-600">{type.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpineWidget;
