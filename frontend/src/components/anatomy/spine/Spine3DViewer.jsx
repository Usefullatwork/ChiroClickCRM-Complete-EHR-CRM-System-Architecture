/**
 * Spine3DViewer - Interactive 3D spine visualization using react-three-fiber
 *
 * Features:
 * - Rotatable 3D spine model
 * - Click individual vertebrae
 * - Color-coded findings
 * - Smooth camera controls
 * - GLTF model support (when available)
 * - Fallback to procedural geometry
 */
import _React, { useState, useRef, useCallback, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, _Text, Html, _PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Rotate3D, _ZoomIn, _ZoomOut, Move } from 'lucide-react';

// Vertebra configuration for 3D positioning
const VERTEBRA_CONFIG = {
  cervical: {
    color: '#3B82F6',
    segments: [
      { id: 'C1', y: 8.5, scale: 0.35, special: 'atlas' },
      { id: 'C2', y: 7.8, scale: 0.38, special: 'axis' },
      { id: 'C3', y: 7.1, scale: 0.4 },
      { id: 'C4', y: 6.4, scale: 0.42 },
      { id: 'C5', y: 5.7, scale: 0.44 },
      { id: 'C6', y: 5.0, scale: 0.46 },
      { id: 'C7', y: 4.3, scale: 0.5 },
    ],
  },
  thoracic: {
    color: '#10B981',
    segments: [
      { id: 'T1', y: 3.5, scale: 0.52 },
      { id: 'T2', y: 2.8, scale: 0.54 },
      { id: 'T3', y: 2.1, scale: 0.55 },
      { id: 'T4', y: 1.4, scale: 0.56 },
      { id: 'T5', y: 0.7, scale: 0.57 },
      { id: 'T6', y: 0.0, scale: 0.58 },
      { id: 'T7', y: -0.7, scale: 0.59 },
      { id: 'T8', y: -1.4, scale: 0.6 },
      { id: 'T9', y: -2.1, scale: 0.61 },
      { id: 'T10', y: -2.8, scale: 0.63 },
      { id: 'T11', y: -3.5, scale: 0.65 },
      { id: 'T12', y: -4.2, scale: 0.68 },
    ],
  },
  lumbar: {
    color: '#F59E0B',
    segments: [
      { id: 'L1', y: -5.0, scale: 0.72 },
      { id: 'L2', y: -5.9, scale: 0.76 },
      { id: 'L3', y: -6.8, scale: 0.8 },
      { id: 'L4', y: -7.7, scale: 0.84 },
      { id: 'L5', y: -8.6, scale: 0.88 },
    ],
  },
  sacral: {
    color: '#EF4444',
    segments: [
      { id: 'Sacrum', y: -9.8, scale: 1.0, special: 'sacrum' },
      { id: 'Coccyx', y: -11.2, scale: 0.3, special: 'coccyx' },
    ],
  },
};

// Finding colors
const FINDING_COLORS = {
  subluxation: '#EF4444',
  fixation: '#F97316',
  restriction: '#EAB308',
  tenderness: '#A855F7',
  spasm: '#3B82F6',
  default: '#9CA3AF',
};

// Procedural vertebra geometry
function createVertebraGeometry(scale, special) {
  const _geometry = new THREE.BufferGeometry();

  if (special === 'sacrum') {
    // Triangular sacrum shape
    const shape = new THREE.Shape();
    shape.moveTo(-0.5 * scale, 0.3);
    shape.lineTo(0.5 * scale, 0.3);
    shape.lineTo(0.3 * scale, -0.5);
    shape.lineTo(-0.3 * scale, -0.5);
    shape.closePath();

    const extrudeSettings = { depth: 0.3 * scale, bevelEnabled: false };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  if (special === 'coccyx') {
    // Small pointed coccyx
    return new THREE.ConeGeometry(0.15 * scale, 0.4 * scale, 6);
  }

  // Standard vertebra - body + transverse processes
  const bodyRadius = 0.25 * scale;
  const bodyHeight = 0.15 * scale;

  // Create vertebral body (cylinder)
  const bodyGeometry = new THREE.CylinderGeometry(bodyRadius, bodyRadius * 1.1, bodyHeight, 16);

  return bodyGeometry;
}

// Single vertebra component
function Vertebra({
  id,
  position,
  scale,
  special,
  regionColor,
  hasFinding,
  findingColor,
  isSelected,
  _isHovered,
  onClick,
  onHover,
}) {
  const meshRef = useRef();
  const [localHovered, setLocalHovered] = useState(false);

  // Animate on hover
  useFrame(() => {
    if (meshRef.current) {
      const targetScale = localHovered || isSelected ? 1.15 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  const geometry = useMemo(() => createVertebraGeometry(scale, special), [scale, special]);

  const color = useMemo(() => {
    if (hasFinding && findingColor) {
      return findingColor;
    }
    if (isSelected) {
      return '#1F2937';
    }
    if (localHovered) {
      return regionColor;
    }
    return new THREE.Color(regionColor).lerp(new THREE.Color('#FFFFFF'), 0.4).getHexString();
  }, [hasFinding, findingColor, isSelected, localHovered, regionColor]);

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={(e) => {
          e.stopPropagation();
          onClick(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setLocalHovered(true);
          onHover(id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setLocalHovered(false);
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <meshStandardMaterial
          color={color}
          roughness={0.6}
          metalness={0.1}
          emissive={hasFinding ? findingColor : '#000000'}
          emissiveIntensity={hasFinding ? 0.3 : 0}
        />
      </mesh>

      {/* Transverse processes for standard vertebrae */}
      {!special && (
        <>
          <mesh position={[-0.4 * scale, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03 * scale, 0.05 * scale, 0.2 * scale, 8]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh position={[0.4 * scale, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03 * scale, 0.05 * scale, 0.2 * scale, 8]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          {/* Spinous process */}
          <mesh position={[0, 0, -0.2 * scale]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02 * scale, 0.04 * scale, 0.15 * scale, 6]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </>
      )}

      {/* Label */}
      {(localHovered || isSelected) && (
        <Html position={[0.6, 0, 0]} center>
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {id}
          </div>
        </Html>
      )}
    </group>
  );
}

// Spinal column group
function SpineModel({ findings, onVertebraClick, selectedVertebra, hoveredVertebra, onHover }) {
  const groupRef = useRef();

  // Subtle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  // Get finding color for vertebra
  const getFindingColor = useCallback(
    (vertebraId) => {
      const vFindings = Object.values(findings).filter((f) => f.vertebra === vertebraId);
      if (vFindings.length === 0) {
        return null;
      }

      const priority = ['subluxation', 'fixation', 'restriction', 'tenderness', 'spasm'];
      for (const type of priority) {
        if (vFindings.some((f) => f.type === type)) {
          return FINDING_COLORS[type];
        }
      }
      return FINDING_COLORS.default;
    },
    [findings]
  );

  const hasFinding = useCallback(
    (vertebraId) => {
      return Object.values(findings).some((f) => f.vertebra === vertebraId);
    },
    [findings]
  );

  return (
    <group ref={groupRef}>
      {/* Spinal canal visualization */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 20, 16]} />
        <meshStandardMaterial color="#E5E7EB" transparent opacity={0.3} />
      </mesh>

      {/* Render all vertebrae */}
      {Object.entries(VERTEBRA_CONFIG).map(([_regionKey, region]) =>
        region.segments.map((seg) => (
          <Vertebra
            key={seg.id}
            id={seg.id}
            position={[0, seg.y, 0]}
            scale={seg.scale}
            special={seg.special}
            regionColor={region.color}
            hasFinding={hasFinding(seg.id)}
            findingColor={getFindingColor(seg.id)}
            isSelected={selectedVertebra === seg.id}
            isHovered={hoveredVertebra === seg.id}
            onClick={onVertebraClick}
            onHover={onHover}
          />
        ))
      )}

      {/* SI Joints */}
      <mesh position={[-0.6, -10, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={hasFinding('SI-L') ? getFindingColor('SI-L') : '#FCA5A5'}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[0.6, -10, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={hasFinding('SI-R') ? getFindingColor('SI-R') : '#FCA5A5'}
          roughness={0.6}
        />
      </mesh>

      {/* Ilium outlines */}
      <mesh position={[-0.8, -10, 0]} rotation={[0, 0, -0.3]}>
        <torusGeometry args={[0.4, 0.03, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#FCA5A5" />
      </mesh>
      <mesh position={[0.8, -10, 0]} rotation={[0, 0, 0.3]}>
        <torusGeometry args={[0.4, 0.03, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#FCA5A5" />
      </mesh>
    </group>
  );
}

// Camera controller
function CameraController({ position, target }) {
  const { camera } = useThree();

  useFrame(() => {
    camera.position.lerp(new THREE.Vector3(...position), 0.05);
    camera.lookAt(new THREE.Vector3(...target));
  });

  return null;
}

// Loading fallback
function LoadingSpine() {
  return (
    <mesh>
      <boxGeometry args={[1, 10, 1]} />
      <meshStandardMaterial color="#E5E7EB" wireframe />
    </mesh>
  );
}

// Main component
export default function Spine3DViewer({
  findings = {},
  _onChange,
  onInsertText,
  templates = {},
  className = '',
}) {
  const [selectedVertebra, setSelectedVertebra] = useState(null);
  const [hoveredVertebra, setHoveredVertebra] = useState(null);
  const [cameraPreset, setCameraPreset] = useState('front'); // front, back, left, right
  const controlsRef = useRef();

  // Camera presets
  const cameraPositions = {
    front: [0, 0, 8],
    back: [0, 0, -8],
    left: [-8, 0, 0],
    right: [8, 0, 0],
    top: [0, 12, 0],
  };

  // Handle vertebra click
  const handleVertebraClick = useCallback(
    (vertebraId) => {
      setSelectedVertebra((prev) => (prev === vertebraId ? null : vertebraId));

      if (onInsertText && templates) {
        // Get default template text
        const segmentTemplates = templates[vertebraId] || [];
        if (segmentTemplates.length > 0) {
          // For now, insert first template - could show popup for direction selection
          onInsertText(segmentTemplates[0].text_template);
        } else {
          onInsertText(`${vertebraId} `);
        }
      }
    },
    [onInsertText, templates]
  );

  // Reset camera
  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    setCameraPreset('front');
  }, []);

  const totalFindings = Object.keys(findings).length;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-white border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Rotate3D className="w-4 h-4 text-purple-600" />
          <h3 className="font-medium text-gray-900">3D Ryggrad</h3>
          {totalFindings > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              {totalFindings} funn
            </span>
          )}
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5">
            {['front', 'back', 'left', 'right'].map((preset) => (
              <button
                key={preset}
                onClick={() => setCameraPreset(preset)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  cameraPreset === preset
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {preset === 'front'
                  ? 'Foran'
                  : preset === 'back'
                    ? 'Bak'
                    : preset === 'left'
                      ? 'V'
                      : 'H'}
              </button>
            ))}
          </div>

          <button
            onClick={resetCamera}
            className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded"
            title="Nullstill kamera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="relative" style={{ height: '400px' }}>
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 50 }}>
          <Suspense fallback={<LoadingSpine />}>
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
            <directionalLight position={[-5, 5, -5]} intensity={0.3} />

            {/* Environment for reflections */}
            <Environment preset="studio" />

            {/* Camera position controller */}
            <CameraController position={cameraPositions[cameraPreset]} target={[0, -1, 0]} />

            {/* Spine model */}
            <SpineModel
              findings={findings}
              onVertebraClick={handleVertebraClick}
              selectedVertebra={selectedVertebra}
              hoveredVertebra={hoveredVertebra}
              onHover={setHoveredVertebra}
            />

            {/* Controls */}
            <OrbitControls
              ref={controlsRef}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={3}
              maxDistance={15}
              target={[0, -1, 0]}
            />
          </Suspense>
        </Canvas>

        {/* Instructions overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-gray-500 pointer-events-none">
          <span className="flex items-center gap-1">
            <Move className="w-3 h-3" /> Dra for å rotere
          </span>
          <span>Klikk vertebra for å velge</span>
        </div>

        {/* Hovered vertebra info */}
        {hoveredVertebra && (
          <div className="absolute top-2 left-2 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg">
            {hoveredVertebra}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-gray-500 font-medium">Regioner:</span>
          {Object.entries(VERTEBRA_CONFIG).map(([key, region]) => (
            <div key={key} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: region.color }} />
              <span className="text-gray-600">
                {key === 'cervical'
                  ? 'Cervical'
                  : key === 'thoracic'
                    ? 'Thoracal'
                    : key === 'lumbar'
                      ? 'Lumbal'
                      : 'Sacral'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Compact version
export function CompactSpine3D({ findings, onInsertText, templates }) {
  return (
    <Spine3DViewer
      findings={findings}
      onInsertText={onInsertText}
      templates={templates}
      className="border-0"
    />
  );
}
