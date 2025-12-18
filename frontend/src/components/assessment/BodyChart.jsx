import React, { useState, useRef, useCallback, useEffect } from 'react';

// =============================================================================
// BODY CHART WITH DRAWING TOOLS
// Jane App-inspired interactive body chart with annotation capabilities
// =============================================================================

// Body view images (SVG paths for different views)
const BODY_VIEWS = {
  front: {
    name: 'Front',
    icon: '👤',
    viewBox: '0 0 200 400',
    outline: `
      M100,20
      C120,20 135,35 135,55 C135,75 120,90 100,90 C80,90 65,75 65,55 C65,35 80,20 100,20
      M100,90 L100,100
      M70,105 L50,170 L45,175
      M130,105 L150,170 L155,175
      M100,100 C120,100 140,115 140,130 L140,200 C140,210 135,220 100,220 C65,220 60,210 60,200 L60,130 C60,115 80,100 100,100
      M60,220 L55,320 L50,380 L45,395 L70,395 L75,380 L80,320 L85,250
      M140,220 L145,320 L150,380 L155,395 L130,395 L125,380 L120,320 L115,250
    `
  },
  back: {
    name: 'Back',
    icon: '🔙',
    viewBox: '0 0 200 400',
    outline: `
      M100,20
      C120,20 135,35 135,55 C135,75 120,90 100,90 C80,90 65,75 65,55 C65,35 80,20 100,20
      M100,90 L100,100
      M70,105 L50,170 L45,175
      M130,105 L150,170 L155,175
      M100,100 C120,100 140,115 140,130 L140,200 C140,210 135,220 100,220 C65,220 60,210 60,200 L60,130 C60,115 80,100 100,100
      M85,100 L85,200 M115,100 L115,200
      M100,130 L100,200
      M60,220 L55,320 L50,380 L45,395 L70,395 L75,380 L80,320 L85,250
      M140,220 L145,320 L150,380 L155,395 L130,395 L125,380 L120,320 L115,250
    `
  },
  leftSide: {
    name: 'Left Side',
    icon: '⬅️',
    viewBox: '0 0 150 400',
    outline: `
      M75,20
      C95,20 105,35 105,55 C105,75 95,90 75,90 C55,90 45,75 45,55 C45,35 55,20 75,20
      M75,90 L75,100
      M55,105 L30,170 L25,175
      M75,100 C95,100 110,115 110,130 L110,200 C110,210 100,220 75,220 C50,220 40,210 40,200 L40,130 C40,115 55,100 75,100
      M40,220 L35,320 L30,380 L25,395 L50,395 L55,380 L60,320 L65,250
      M110,220 L115,320 L120,380 L125,395 L100,395 L95,380 L90,320 L85,250
    `
  },
  rightSide: {
    name: 'Right Side',
    icon: '➡️',
    viewBox: '0 0 150 400',
    outline: `
      M75,20
      C95,20 105,35 105,55 C105,75 95,90 75,90 C55,90 45,75 45,55 C45,35 55,20 75,20
      M75,90 L75,100
      M95,105 L120,170 L125,175
      M75,100 C95,100 110,115 110,130 L110,200 C110,210 100,220 75,220 C50,220 40,210 40,200 L40,130 C40,115 55,100 75,100
      M40,220 L35,320 L30,380 L25,395 L50,395 L55,380 L60,320 L65,250
      M110,220 L115,320 L120,380 L125,395 L100,395 L95,380 L90,320 L85,250
    `
  },
  head: {
    name: 'Head/Neck',
    icon: '🗣️',
    viewBox: '0 0 200 250',
    outline: `
      M100,30
      C140,30 170,60 170,100 C170,140 140,180 100,180 C60,180 30,140 30,100 C30,60 60,30 100,30
      M70,80 L85,80 M115,80 L130,80
      M100,100 L100,120 L95,130 L105,130 L100,120
      M80,150 Q100,170 120,150
      M85,180 L80,220 L70,240 M115,180 L120,220 L130,240
      M100,180 L100,240
    `
  },
  hands: {
    name: 'Hands',
    icon: '🤚',
    viewBox: '0 0 300 200',
    outline: `
      M50,100 L50,50 L60,30 L70,50 L70,40 L80,20 L90,40 L90,35 L100,15 L110,35 L110,40 L120,25 L130,45 L130,100 L120,120 L110,110 L100,115 L90,110 L80,115 L70,110 L60,120 L50,100
      M50,100 L40,140 L50,160 L130,160 L140,140 L130,100
      M170,100 L170,50 L180,30 L190,50 L190,40 L200,20 L210,40 L210,35 L220,15 L230,35 L230,40 L240,25 L250,45 L250,100 L240,120 L230,110 L220,115 L210,110 L200,115 L190,110 L180,120 L170,100
      M170,100 L160,140 L170,160 L250,160 L260,140 L250,100
    `
  },
  feet: {
    name: 'Feet',
    icon: '🦶',
    viewBox: '0 0 300 200',
    outline: `
      M30,50 L40,30 L50,35 L55,25 L65,30 L70,20 L80,30 L85,25 L95,35 L100,50 L95,100 L90,150 L30,150 L25,100 L30,50
      M200,50 L210,30 L220,35 L225,25 L235,30 L240,20 L250,30 L255,25 L265,35 L270,50 L265,100 L260,150 L200,150 L195,100 L200,50
    `
  }
};

// Drawing tools
const TOOLS = {
  pointer: { name: 'Pointer', icon: '👆', cursor: 'default' },
  pencil: { name: 'Pencil', icon: '✏️', cursor: 'crosshair' },
  marker: { name: 'Marker', icon: '📍', cursor: 'crosshair' },
  eraser: { name: 'Eraser', icon: '🧹', cursor: 'not-allowed' },
  text: { name: 'Text', icon: '📝', cursor: 'text' }
};

// Color palette
const COLORS = [
  '#FF0000', // Red
  '#FF6B00', // Orange
  '#FFD700', // Yellow
  '#00FF00', // Green
  '#00BFFF', // Light Blue
  '#0000FF', // Blue
  '#8B00FF', // Purple
  '#FF1493', // Pink
  '#000000', // Black
  '#808080'  // Gray
];

// Brush sizes
const BRUSH_SIZES = [
  { name: 'Fine', size: 2 },
  { name: 'Small', size: 4 },
  { name: 'Medium', size: 8 },
  { name: 'Large', size: 12 },
  { name: 'Extra Large', size: 20 }
];

// Main Body Chart Component
export default function BodyChart({
  initialView = 'front',
  initialAnnotations = [],
  initialMarkers = [],
  onSave,
  showToolbar = true,
  height = 500,
  className = ''
}) {
  const [currentView, setCurrentView] = useState(initialView);
  const [currentTool, setCurrentTool] = useState('pointer');
  const [currentColor, setCurrentColor] = useState('#FF0000');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [annotations, setAnnotations] = useState(initialAnnotations);
  const [markers, setMarkers] = useState(initialMarkers);
  const [currentPath, setCurrentPath] = useState(null);
  const [textInput, setTextInput] = useState({ show: false, x: 0, y: 0, value: '' });
  const [selectedItem, setSelectedItem] = useState(null);
  const [imageSize, setImageSize] = useState(100); // percentage

  const svgRef = useRef(null);
  const nextMarkerId = useRef(markers.length > 0 ? Math.max(...markers.map(m => m.id)) + 1 : 1);

  // Get SVG coordinates from mouse event
  const getSvgCoordinates = useCallback((event) => {
    if (!svgRef.current) return { x: 0, y: 0 };

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const viewBox = BODY_VIEWS[currentView].viewBox.split(' ').map(Number);

    const x = ((event.clientX - rect.left) / rect.width) * viewBox[2];
    const y = ((event.clientY - rect.top) / rect.height) * viewBox[3];

    return { x, y };
  }, [currentView]);

  // Handle mouse down
  const handleMouseDown = useCallback((event) => {
    if (currentTool === 'pointer') return;

    const coords = getSvgCoordinates(event);

    if (currentTool === 'pencil') {
      setIsDrawing(true);
      setCurrentPath({
        id: Date.now(),
        view: currentView,
        type: 'path',
        color: currentColor,
        size: brushSize,
        points: [coords]
      });
    } else if (currentTool === 'marker') {
      const newMarker = {
        id: nextMarkerId.current++,
        view: currentView,
        x: coords.x,
        y: coords.y,
        color: currentColor,
        label: nextMarkerId.current - 1
      };
      setMarkers(prev => [...prev, newMarker]);
    } else if (currentTool === 'text') {
      setTextInput({ show: true, x: coords.x, y: coords.y, value: '' });
    } else if (currentTool === 'eraser') {
      // Find and remove item at coordinates
      const threshold = 15;

      // Check markers
      const markerIndex = markers.findIndex(m =>
        m.view === currentView &&
        Math.abs(m.x - coords.x) < threshold &&
        Math.abs(m.y - coords.y) < threshold
      );

      if (markerIndex !== -1) {
        setMarkers(prev => prev.filter((_, i) => i !== markerIndex));
        return;
      }

      // Check annotations
      const annotationIndex = annotations.findIndex(a => {
        if (a.view !== currentView) return false;
        if (a.type === 'text') {
          return Math.abs(a.x - coords.x) < threshold && Math.abs(a.y - coords.y) < threshold;
        }
        if (a.type === 'path' && a.points) {
          return a.points.some(p =>
            Math.abs(p.x - coords.x) < threshold && Math.abs(p.y - coords.y) < threshold
          );
        }
        return false;
      });

      if (annotationIndex !== -1) {
        setAnnotations(prev => prev.filter((_, i) => i !== annotationIndex));
      }
    }
  }, [currentTool, currentView, currentColor, brushSize, getSvgCoordinates, markers, annotations]);

  // Handle mouse move
  const handleMouseMove = useCallback((event) => {
    if (!isDrawing || currentTool !== 'pencil' || !currentPath) return;

    const coords = getSvgCoordinates(event);
    setCurrentPath(prev => ({
      ...prev,
      points: [...prev.points, coords]
    }));
  }, [isDrawing, currentTool, currentPath, getSvgCoordinates]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentPath) {
      setAnnotations(prev => [...prev, currentPath]);
      setCurrentPath(null);
    }
    setIsDrawing(false);
  }, [isDrawing, currentPath]);

  // Handle text input submit
  const handleTextSubmit = useCallback(() => {
    if (textInput.value.trim()) {
      const newAnnotation = {
        id: Date.now(),
        view: currentView,
        type: 'text',
        x: textInput.x,
        y: textInput.y,
        text: textInput.value,
        color: currentColor,
        size: brushSize
      };
      setAnnotations(prev => [...prev, newAnnotation]);
    }
    setTextInput({ show: false, x: 0, y: 0, value: '' });
  }, [textInput, currentView, currentColor, brushSize]);

  // Generate path d attribute from points
  const getPathD = (points) => {
    if (!points || points.length < 2) return '';
    return points.reduce((d, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      return `${d} L ${point.x} ${point.y}`;
    }, '');
  };

  // Clear all annotations for current view
  const clearCurrentView = () => {
    setAnnotations(prev => prev.filter(a => a.view !== currentView));
    setMarkers(prev => prev.filter(m => m.view !== currentView));
  };

  // Clear all annotations
  const clearAll = () => {
    setAnnotations([]);
    setMarkers([]);
    nextMarkerId.current = 1;
  };

  // Save annotations
  const handleSave = () => {
    if (onSave) {
      onSave({ annotations, markers });
    }
  };

  // Get current view data
  const viewData = BODY_VIEWS[currentView];
  const viewAnnotations = annotations.filter(a => a.view === currentView);
  const viewMarkers = markers.filter(m => m.view === currentView);

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header with view selector */}
      <div className="p-3 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Body Chart</h3>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Size:</label>
            <input
              type="range"
              min="50"
              max="150"
              value={imageSize}
              onChange={(e) => setImageSize(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-500">{imageSize}%</span>
          </div>
        </div>

        {/* View selector */}
        <div className="flex flex-wrap gap-1">
          {Object.entries(BODY_VIEWS).map(([key, view]) => (
            <button
              key={key}
              onClick={() => setCurrentView(key)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                currentView === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border hover:bg-gray-50'
              }`}
            >
              {view.icon} {view.name}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      {showToolbar && (
        <div className="p-2 border-b bg-gray-50 space-y-2">
          {/* Tools */}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-500 mr-2">Tools:</span>
            {Object.entries(TOOLS).map(([key, tool]) => (
              <button
                key={key}
                onClick={() => setCurrentTool(key)}
                className={`p-1.5 rounded text-sm transition-colors ${
                  currentTool === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border hover:bg-gray-100'
                }`}
                title={tool.name}
              >
                {tool.icon}
              </button>
            ))}

            <div className="border-l mx-2 h-6" />

            {/* Brush size */}
            <span className="text-xs text-gray-500 mr-1">Size:</span>
            {BRUSH_SIZES.map((bs) => (
              <button
                key={bs.size}
                onClick={() => setBrushSize(bs.size)}
                className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                  brushSize === bs.size
                    ? 'bg-blue-600'
                    : 'bg-white border hover:bg-gray-100'
                }`}
                title={bs.name}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: Math.min(bs.size, 16),
                    height: Math.min(bs.size, 16),
                    backgroundColor: brushSize === bs.size ? 'white' : currentColor
                  }}
                />
              </button>
            ))}
          </div>

          {/* Colors */}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-500 mr-2">Color:</span>
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                className={`w-6 h-6 rounded border-2 transition-transform ${
                  currentColor === color
                    ? 'border-blue-600 scale-110'
                    : 'border-gray-300 hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={clearCurrentView}
              className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
            >
              Clear View
            </button>
            <button
              onClick={clearAll}
              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Clear All
            </button>
            {onSave && (
              <button
                onClick={handleSave}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save Chart
              </button>
            )}
          </div>
        </div>
      )}

      {/* Drawing canvas */}
      <div
        className="relative flex items-center justify-center bg-gray-100 overflow-hidden"
        style={{ height }}
      >
        <svg
          ref={svgRef}
          viewBox={viewData.viewBox}
          className="bg-white shadow-inner"
          style={{
            height: `${(imageSize / 100) * (height - 20)}px`,
            cursor: TOOLS[currentTool]?.cursor || 'default'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Body outline */}
          <path
            d={viewData.outline}
            fill="none"
            stroke="#999"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Drawn paths */}
          {viewAnnotations.filter(a => a.type === 'path').map((annotation) => (
            <path
              key={annotation.id}
              d={getPathD(annotation.points)}
              fill="none"
              stroke={annotation.color}
              strokeWidth={annotation.size}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Current drawing path */}
          {currentPath && (
            <path
              d={getPathD(currentPath.points)}
              fill="none"
              stroke={currentPath.color}
              strokeWidth={currentPath.size}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Text annotations */}
          {viewAnnotations.filter(a => a.type === 'text').map((annotation) => (
            <text
              key={annotation.id}
              x={annotation.x}
              y={annotation.y}
              fill={annotation.color}
              fontSize={annotation.size * 2}
              fontWeight="bold"
            >
              {annotation.text}
            </text>
          ))}

          {/* Numbered markers */}
          {viewMarkers.map((marker) => (
            <g key={marker.id}>
              <circle
                cx={marker.x}
                cy={marker.y}
                r="10"
                fill={marker.color}
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={marker.x}
                y={marker.y + 4}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
              >
                {marker.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Text input overlay */}
        {textInput.show && (
          <div
            className="absolute bg-white border rounded shadow-lg p-2"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <input
              type="text"
              value={textInput.value}
              onChange={(e) => setTextInput(prev => ({ ...prev, value: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
              placeholder="Enter text..."
              className="px-2 py-1 border rounded text-sm"
              autoFocus
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button
                onClick={() => setTextInput({ show: false, x: 0, y: 0, value: '' })}
                className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleTextSubmit}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Marker legend */}
      {markers.length > 0 && (
        <div className="p-3 border-t bg-gray-50">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Marker Legend</h4>
          <div className="space-y-1">
            {markers.map((marker) => (
              <div key={marker.id} className="flex items-center text-sm">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2"
                  style={{ backgroundColor: marker.color }}
                >
                  {marker.label}
                </span>
                <input
                  type="text"
                  placeholder={`Description for marker ${marker.label}...`}
                  className="flex-1 px-2 py-1 text-xs border rounded"
                  onChange={(e) => {
                    setMarkers(prev => prev.map(m =>
                      m.id === marker.id ? { ...m, description: e.target.value } : m
                    ));
                  }}
                  value={marker.description || ''}
                />
                <button
                  onClick={() => setMarkers(prev => prev.filter(m => m.id !== marker.id))}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPACT BODY CHART (for sidebar use)
// =============================================================================

export function BodyChartCompact({
  markers = [],
  view = 'front',
  onClick
}) {
  const viewData = BODY_VIEWS[view];
  const viewMarkers = markers.filter(m => m.view === view);

  return (
    <div
      className="bg-white rounded border p-2 cursor-pointer hover:border-blue-400"
      onClick={onClick}
    >
      <svg
        viewBox={viewData.viewBox}
        className="w-full h-32"
      >
        <path
          d={viewData.outline}
          fill="none"
          stroke="#ccc"
          strokeWidth="1.5"
        />
        {viewMarkers.map((marker) => (
          <g key={marker.id}>
            <circle
              cx={marker.x}
              cy={marker.y}
              r="8"
              fill={marker.color}
            />
            <text
              x={marker.x}
              y={marker.y + 3}
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontWeight="bold"
            >
              {marker.label}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-xs text-center text-gray-500 mt-1">{viewData.name} View</p>
    </div>
  );
}

// =============================================================================
// BODY CHART GALLERY (show all views)
// =============================================================================

export function BodyChartGallery({
  markers = [],
  annotations = [],
  onViewSelect
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.entries(BODY_VIEWS).map(([key, view]) => {
        const viewMarkers = markers.filter(m => m.view === key);
        const hasContent = viewMarkers.length > 0 || annotations.some(a => a.view === key);

        return (
          <div
            key={key}
            onClick={() => onViewSelect && onViewSelect(key)}
            className={`bg-white rounded border p-2 cursor-pointer transition-all ${
              hasContent
                ? 'border-blue-400 bg-blue-50'
                : 'hover:border-gray-400'
            }`}
          >
            <svg viewBox={view.viewBox} className="w-full h-20">
              <path
                d={view.outline}
                fill="none"
                stroke={hasContent ? '#3B82F6' : '#ccc'}
                strokeWidth="1.5"
              />
              {viewMarkers.slice(0, 3).map((marker) => (
                <circle
                  key={marker.id}
                  cx={marker.x}
                  cy={marker.y}
                  r="6"
                  fill={marker.color}
                />
              ))}
            </svg>
            <p className="text-xs text-center mt-1">
              {view.icon} {view.name}
              {hasContent && (
                <span className="ml-1 text-blue-600">
                  ({viewMarkers.length})
                </span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// Export body views for external use
export { BODY_VIEWS, COLORS as CHART_COLORS };
