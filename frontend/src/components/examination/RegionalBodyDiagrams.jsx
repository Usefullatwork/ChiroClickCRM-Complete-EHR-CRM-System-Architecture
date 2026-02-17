/**
 * RegionalBodyDiagrams Component
 *
 * Collection of regional body diagrams for clinical examination:
 * - Shoulder (anterior/posterior)
 * - Knee (anterior/posterior/lateral)
 * - Cervical spine
 * - Thoracic spine
 * - Lumbar spine
 * - Hip
 * - Head/TMJ
 *
 * Each diagram supports:
 * - Click to mark findings
 * - Left/Right differentiation
 * - Anatomical landmarks
 */

import { useState, useCallback, useRef } from 'react';
import { Trash2 } from 'lucide-react';

// Marker types for all diagrams
const MARKER_TYPES = {
  pain: { label: 'Smerte', labelEn: 'Pain', color: '#ef4444', symbol: '●' },
  tenderness: { label: 'Ømhet', labelEn: 'Tenderness', color: '#f97316', symbol: 'T' },
  swelling: { label: 'Hevelse', labelEn: 'Swelling', color: '#3b82f6', symbol: 'S' },
  restriction: { label: 'Restriksjon', labelEn: 'Restriction', color: '#8b5cf6', symbol: 'R' },
  crepitus: { label: 'Krepitasjon', labelEn: 'Crepitus', color: '#64748b', symbol: 'C' },
  instability: { label: 'Instabilitet', labelEn: 'Instability', color: '#ec4899', symbol: 'I' },
};

/**
 * Shoulder Diagram - Anterior view
 */
function ShoulderDiagram({ width = 250, height = 200, side = 'both' }) {
  const isLeft = side === 'left' || side === 'both';
  const isRight = side === 'right' || side === 'both';
  const centerX = width / 2;

  return (
    <g>
      {/* Clavicle */}
      <path
        d={`M ${centerX - 80} 50
            C ${centerX - 40} 40, ${centerX + 40} 40, ${centerX + 80} 50`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="3"
      />
      <text x={centerX} y={35} fontSize="8" fill="#6b7280" textAnchor="middle">
        Clavicula
      </text>

      {/* Acromion - Left */}
      {isLeft && (
        <g>
          <path
            d={`M ${centerX - 80} 50
                L ${centerX - 95} 55
                L ${centerX - 90} 70`}
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
          />
          <circle cx={centerX - 90} cy={62} r={4} fill="none" stroke="#d1d5db" strokeWidth="1" />
          <text x={centerX - 105} y={55} fontSize="6" fill="#9ca3af">
            AC
          </text>
        </g>
      )}

      {/* Acromion - Right */}
      {isRight && (
        <g>
          <path
            d={`M ${centerX + 80} 50
                L ${centerX + 95} 55
                L ${centerX + 90} 70`}
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
          />
          <circle cx={centerX + 90} cy={62} r={4} fill="none" stroke="#d1d5db" strokeWidth="1" />
          <text x={centerX + 98} y={55} fontSize="6" fill="#9ca3af">
            AC
          </text>
        </g>
      )}

      {/* Humeral head - Left */}
      {isLeft && (
        <g>
          <circle cx={centerX - 70} cy={90} r={25} fill="none" stroke="#9ca3af" strokeWidth="1.5" />
          <text x={centerX - 70} y={93} fontSize="7" fill="#6b7280" textAnchor="middle">
            Humerus
          </text>

          {/* Greater tuberosity */}
          <circle cx={centerX - 85} cy={80} r={6} fill="none" stroke="#d1d5db" strokeWidth="1" />
          <text x={centerX - 100} y={75} fontSize="5" fill="#9ca3af">
            GT
          </text>

          {/* Biceps groove */}
          <line
            x1={centerX - 70}
            y1={65}
            x2={centerX - 70}
            y2={80}
            stroke="#d1d5db"
            strokeWidth="1"
          />
        </g>
      )}

      {/* Humeral head - Right */}
      {isRight && (
        <g>
          <circle cx={centerX + 70} cy={90} r={25} fill="none" stroke="#9ca3af" strokeWidth="1.5" />
          <text x={centerX + 70} y={93} fontSize="7" fill="#6b7280" textAnchor="middle">
            Humerus
          </text>

          {/* Greater tuberosity */}
          <circle cx={centerX + 85} cy={80} r={6} fill="none" stroke="#d1d5db" strokeWidth="1" />
          <text x={centerX + 92} y={75} fontSize="5" fill="#9ca3af">
            GT
          </text>

          {/* Biceps groove */}
          <line
            x1={centerX + 70}
            y1={65}
            x2={centerX + 70}
            y2={80}
            stroke="#d1d5db"
            strokeWidth="1"
          />
        </g>
      )}

      {/* Scapula outline - Left */}
      {isLeft && (
        <path
          d={`M ${centerX - 60} 60
              L ${centerX - 40} 150
              L ${centerX - 80} 130
              L ${centerX - 95} 80
              Z`}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1"
          strokeDasharray="3,2"
        />
      )}

      {/* Scapula outline - Right */}
      {isRight && (
        <path
          d={`M ${centerX + 60} 60
              L ${centerX + 40} 150
              L ${centerX + 80} 130
              L ${centerX + 95} 80
              Z`}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1"
          strokeDasharray="3,2"
        />
      )}

      {/* Labels */}
      {isLeft && (
        <text
          x={centerX - 70}
          y={height - 10}
          fontSize="10"
          fill="#6b7280"
          textAnchor="middle"
          fontWeight="bold"
        >
          V / L
        </text>
      )}
      {isRight && (
        <text
          x={centerX + 70}
          y={height - 10}
          fontSize="10"
          fill="#6b7280"
          textAnchor="middle"
          fontWeight="bold"
        >
          H / R
        </text>
      )}
    </g>
  );
}

/**
 * Knee Diagram - Anterior view
 */
function KneeDiagram({ width = 200, height = 250, side = 'both' }) {
  const isLeft = side === 'left' || side === 'both';
  const isRight = side === 'right' || side === 'both';
  const leftX = width / 4;
  const rightX = (width * 3) / 4;

  const renderKnee = (x, label) => (
    <g>
      {/* Femur */}
      <path
        d={`M ${x - 15} 20
            L ${x - 20} 80
            C ${x - 25} 95, ${x - 20} 110, ${x - 15} 115
            L ${x + 15} 115
            C ${x + 20} 110, ${x + 25} 95, ${x + 20} 80
            L ${x + 15} 20`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <text x={x} y={50} fontSize="7" fill="#6b7280" textAnchor="middle">
        Femur
      </text>

      {/* Patella */}
      <ellipse cx={x} cy={125} rx={15} ry={18} fill="none" stroke="#9ca3af" strokeWidth="1.5" />
      <text x={x} y={128} fontSize="6" fill="#6b7280" textAnchor="middle">
        Patella
      </text>

      {/* Joint line */}
      <line
        x1={x - 25}
        y1={145}
        x2={x + 25}
        y2={145}
        stroke="#d1d5db"
        strokeWidth="1"
        strokeDasharray="4,2"
      />
      <text x={x + 30} y={148} fontSize="5" fill="#9ca3af">
        Leddlinje
      </text>

      {/* Tibia */}
      <path
        d={`M ${x - 20} 150
            C ${x - 25} 155, ${x - 22} 160, ${x - 18} 165
            L ${x - 15} 230
            L ${x + 15} 230
            L ${x + 18} 165
            C ${x + 22} 160, ${x + 25} 155, ${x + 20} 150`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <text x={x} y={200} fontSize="7" fill="#6b7280" textAnchor="middle">
        Tibia
      </text>

      {/* Fibula head */}
      <circle cx={x + 28} cy={160} r={6} fill="none" stroke="#d1d5db" strokeWidth="1" />
      <text x={x + 38} y={163} fontSize="5" fill="#9ca3af">
        Fib
      </text>

      {/* Medial/Lateral meniscus indicators */}
      <path
        d={`M ${x - 18} 140 Q ${x - 10} 148, ${x - 2} 140`}
        fill="none"
        stroke="#10b981"
        strokeWidth="1.5"
      />
      <path
        d={`M ${x + 18} 140 Q ${x + 10} 148, ${x + 2} 140`}
        fill="none"
        stroke="#10b981"
        strokeWidth="1.5"
      />
      <text x={x - 25} y={135} fontSize="5" fill="#10b981">
        MM
      </text>
      <text x={x + 22} y={135} fontSize="5" fill="#10b981">
        LM
      </text>

      {/* MCL/LCL */}
      <line x1={x - 20} y1={120} x2={x - 22} y2={165} stroke="#3b82f6" strokeWidth="1.5" />
      <line x1={x + 20} y1={120} x2={x + 22} y2={165} stroke="#3b82f6" strokeWidth="1.5" />
      <text x={x - 32} y={145} fontSize="5" fill="#3b82f6">
        MCL
      </text>
      <text x={x + 26} y={145} fontSize="5" fill="#3b82f6">
        LCL
      </text>

      {/* Label */}
      <text x={x} y={height - 5} fontSize="10" fill="#6b7280" textAnchor="middle" fontWeight="bold">
        {label}
      </text>
    </g>
  );

  return (
    <g>
      {isLeft && renderKnee(side === 'both' ? leftX : width / 2, 'V / L')}
      {isRight && renderKnee(side === 'both' ? rightX : width / 2, 'H / R')}
    </g>
  );
}

/**
 * Cervical Spine Diagram - Lateral view
 */
function CervicalSpineDiagram({ width = 200, _height = 250 }) {
  const centerX = width / 2;
  const vertebrae = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'];

  return (
    <g>
      {/* Skull base */}
      <ellipse
        cx={centerX}
        cy={30}
        rx={40}
        ry={25}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <text x={centerX} y={25} fontSize="7" fill="#6b7280" textAnchor="middle">
        Occiput
      </text>

      {/* Vertebrae */}
      {vertebrae.map((v, i) => {
        const y = 60 + i * 25;
        return (
          <g key={v}>
            {/* Vertebral body */}
            <rect
              x={centerX - 15}
              y={y}
              width={30}
              height={18}
              rx={3}
              fill="none"
              stroke="#9ca3af"
              strokeWidth="1.5"
            />

            {/* Spinous process */}
            <path
              d={`M ${centerX + 15} ${y + 9}
                  L ${centerX + 35} ${y + 12}
                  L ${centerX + 15} ${y + 15}`}
              fill="none"
              stroke="#d1d5db"
              strokeWidth="1"
            />

            {/* Disc (except after C7) */}
            {i < 6 && (
              <ellipse
                cx={centerX}
                cy={y + 21}
                rx={12}
                ry={3}
                fill="#dbeafe"
                stroke="#93c5fd"
                strokeWidth="0.5"
              />
            )}

            {/* Label */}
            <text x={centerX - 25} y={y + 13} fontSize="8" fill="#6b7280" fontWeight="bold">
              {v}
            </text>

            {/* Nerve root */}
            <path
              d={`M ${centerX + 12} ${y + 5}
                  C ${centerX + 25} ${y + 5}, ${centerX + 35} ${y - 5}, ${centerX + 45} ${y - 10}`}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />
          </g>
        );
      })}

      {/* T1 reference */}
      <rect
        x={centerX - 18}
        y={235}
        width={36}
        height={12}
        rx={2}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1"
      />
      <text x={centerX - 28} y={244} fontSize="7" fill="#9ca3af">
        T1
      </text>
    </g>
  );
}

/**
 * Lumbar Spine Diagram - Posterior view
 */
function LumbarSpineDiagram({ width = 200, _height = 250 }) {
  const centerX = width / 2;
  const vertebrae = ['L1', 'L2', 'L3', 'L4', 'L5'];

  return (
    <g>
      {/* T12 reference */}
      <rect
        x={centerX - 20}
        y={15}
        width={40}
        height={15}
        rx={3}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1"
      />
      <text x={centerX - 30} y={26} fontSize="7" fill="#9ca3af">
        T12
      </text>

      {/* Lumbar vertebrae */}
      {vertebrae.map((v, i) => {
        const y = 40 + i * 35;
        return (
          <g key={v}>
            {/* Vertebral body */}
            <rect
              x={centerX - 22}
              y={y}
              width={44}
              height={25}
              rx={4}
              fill="none"
              stroke="#9ca3af"
              strokeWidth="1.5"
            />

            {/* Spinous process */}
            <rect
              x={centerX - 4}
              y={y - 8}
              width={8}
              height={12}
              rx={2}
              fill="none"
              stroke="#d1d5db"
              strokeWidth="1"
            />

            {/* Transverse processes */}
            <line
              x1={centerX - 22}
              y1={y + 12}
              x2={centerX - 40}
              y2={y + 8}
              stroke="#d1d5db"
              strokeWidth="1.5"
            />
            <line
              x1={centerX + 22}
              y1={y + 12}
              x2={centerX + 40}
              y2={y + 8}
              stroke="#d1d5db"
              strokeWidth="1.5"
            />

            {/* Disc */}
            {i < 4 && (
              <ellipse
                cx={centerX}
                cy={y + 30}
                rx={18}
                ry={4}
                fill="#dbeafe"
                stroke="#93c5fd"
                strokeWidth="0.5"
              />
            )}

            {/* Label */}
            <text
              x={centerX}
              y={y + 16}
              fontSize="9"
              fill="#6b7280"
              textAnchor="middle"
              fontWeight="bold"
            >
              {v}
            </text>

            {/* Nerve roots */}
            <path
              d={`M ${centerX - 18} ${y + 20}
                  C ${centerX - 30} ${y + 25}, ${centerX - 45} ${y + 35}, ${centerX - 55} ${y + 45}`}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />
            <path
              d={`M ${centerX + 18} ${y + 20}
                  C ${centerX + 30} ${y + 25}, ${centerX + 45} ${y + 35}, ${centerX + 55} ${y + 45}`}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />
          </g>
        );
      })}

      {/* Sacrum */}
      <path
        d={`M ${centerX - 25} 215
            L ${centerX - 20} 245
            L ${centerX} 250
            L ${centerX + 20} 245
            L ${centerX + 25} 215
            Z`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <text x={centerX} y={235} fontSize="8" fill="#6b7280" textAnchor="middle">
        Sacrum
      </text>
    </g>
  );
}

/**
 * Hip Diagram - Anterior view
 */
function HipDiagram({ width = 250, height = 220, side = 'both' }) {
  const isLeft = side === 'left' || side === 'both';
  const isRight = side === 'right' || side === 'both';
  const centerX = width / 2;

  const renderHip = (x, label, mirror = false) => {
    const dir = mirror ? -1 : 1;
    return (
      <g>
        {/* Pelvis/Ilium */}
        <path
          d={`M ${x} 30
              C ${x + dir * 50} 25, ${x + dir * 70} 50, ${x + dir * 60} 80
              L ${x + dir * 40} 100
              L ${x + dir * 20} 90
              L ${x} 60
              Z`}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.5"
        />
        <text x={x + dir * 35} y={55} fontSize="7" fill="#6b7280">
          Ilium
        </text>

        {/* Acetabulum */}
        <circle cx={x + dir * 30} cy={100} r={22} fill="none" stroke="#9ca3af" strokeWidth="1.5" />
        <text x={x + dir * 30} y={103} fontSize="6" fill="#6b7280" textAnchor="middle">
          Acetab.
        </text>

        {/* Femoral head */}
        <circle
          cx={x + dir * 30}
          cy={100}
          r={18}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1"
          strokeDasharray="3,2"
        />

        {/* Femoral neck */}
        <path
          d={`M ${x + dir * 42} 115
              L ${x + dir * 55} 140
              L ${x + dir * 45} 145
              L ${x + dir * 35} 118`}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.5"
        />

        {/* Greater trochanter */}
        <ellipse
          cx={x + dir * 60}
          cy={130}
          rx={10}
          ry={15}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1"
        />
        <text x={x + dir * 75} y={133} fontSize="5" fill="#9ca3af">
          GT
        </text>

        {/* Femoral shaft */}
        <path
          d={`M ${x + dir * 45} 145
              L ${x + dir * 40} 210
              L ${x + dir * 55} 210
              L ${x + dir * 55} 145`}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.5"
        />

        {/* ASIS */}
        <circle cx={x + dir * 15} cy={45} r={4} fill="none" stroke="#ef4444" strokeWidth="1" />
        <text x={x + dir * 5} y={38} fontSize="5" fill="#ef4444">
          ASIS
        </text>

        {/* Label */}
        <text
          x={x + dir * 30}
          y={height - 5}
          fontSize="10"
          fill="#6b7280"
          textAnchor="middle"
          fontWeight="bold"
        >
          {label}
        </text>
      </g>
    );
  };

  return (
    <g>
      {/* Pubic symphysis */}
      <rect
        x={centerX - 8}
        y={85}
        width={16}
        height={25}
        rx={3}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1"
      />
      <text x={centerX} y={120} fontSize="6" fill="#9ca3af" textAnchor="middle">
        Symphysis
      </text>

      {isLeft && renderHip(centerX - 10, 'V / L', true)}
      {isRight && renderHip(centerX + 10, 'H / R', false)}
    </g>
  );
}

/**
 * Ankle Diagram - Lateral/Medial views
 */
function AnkleDiagram({ width = 220, height = 200, side = 'both' }) {
  const isLeft = side === 'left' || side === 'both';
  const isRight = side === 'right' || side === 'both';
  const leftX = width / 4;
  const rightX = (width * 3) / 4;

  const renderAnkle = (x, label) => (
    <g>
      {/* Tibia */}
      <path
        d={`M ${x - 12} 20
            L ${x - 15} 80
            C ${x - 18} 95, ${x - 15} 105, ${x - 10} 110
            L ${x + 10} 110
            C ${x + 15} 105, ${x + 18} 95, ${x + 15} 80
            L ${x + 12} 20`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <text x={x} y={50} fontSize="7" fill="#6b7280" textAnchor="middle">
        Tibia
      </text>

      {/* Medial malleolus */}
      <ellipse cx={x - 18} cy={115} rx={8} ry={12} fill="none" stroke="#9ca3af" strokeWidth="1.5" />
      <text x={x - 30} y={118} fontSize="5" fill="#9ca3af">
        MM
      </text>

      {/* Lateral malleolus (fibula) */}
      <ellipse cx={x + 20} cy={118} rx={6} ry={14} fill="none" stroke="#9ca3af" strokeWidth="1.5" />
      <text x={x + 30} y={121} fontSize="5" fill="#9ca3af">
        LM
      </text>

      {/* Talus */}
      <ellipse cx={x} cy={125} rx={20} ry={12} fill="none" stroke="#d1d5db" strokeWidth="1" />
      <text x={x} y={128} fontSize="6" fill="#6b7280" textAnchor="middle">
        Talus
      </text>

      {/* Calcaneus */}
      <path
        d={`M ${x - 25} 135
            C ${x - 30} 145, ${x - 28} 165, ${x - 15} 170
            L ${x + 5} 168
            C ${x + 15} 155, ${x + 12} 140, ${x + 5} 135
            Z`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <text x={x - 12} y={155} fontSize="6" fill="#6b7280">
        Calc.
      </text>

      {/* Achilles tendon */}
      <path
        d={`M ${x - 5} 80 L ${x - 8} 140`}
        fill="none"
        stroke="#f97316"
        strokeWidth="2"
        strokeOpacity="0.7"
      />
      <text x={x - 18} y={105} fontSize="5" fill="#f97316">
        AT
      </text>

      {/* ATFL */}
      <line x1={x + 18} y1={110} x2={x + 25} y2={135} stroke="#3b82f6" strokeWidth="1.5" />
      <text x={x + 28} y={145} fontSize="5" fill="#3b82f6">
        ATFL
      </text>

      {/* CFL */}
      <line x1={x + 20} y1={120} x2={x + 10} y2={155} stroke="#3b82f6" strokeWidth="1.5" />
      <text x={x + 15} y={162} fontSize="5" fill="#3b82f6">
        CFL
      </text>

      {/* Deltoid ligament (medial) */}
      <path
        d={`M ${x - 18} 115
            C ${x - 25} 130, ${x - 20} 145, ${x - 10} 155`}
        fill="none"
        stroke="#10b981"
        strokeWidth="1.5"
      />
      <text x={x - 35} y={140} fontSize="5" fill="#10b981">
        Delt.
      </text>

      {/* Metatarsals outline */}
      <path
        d={`M ${x + 5} 165
            C ${x + 20} 168, ${x + 35} 175, ${x + 40} 185
            L ${x + 35} 190
            C ${x + 25} 182, ${x + 10} 178, ${x} 175`}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1"
      />

      {/* Label */}
      <text x={x} y={height - 5} fontSize="10" fill="#6b7280" textAnchor="middle" fontWeight="bold">
        {label}
      </text>
    </g>
  );

  return (
    <g>
      {isLeft && renderAnkle(side === 'both' ? leftX : width / 2, 'V / L')}
      {isRight && renderAnkle(side === 'both' ? rightX : width / 2, 'H / R')}
    </g>
  );
}

/**
 * Wrist/Hand Diagram - Dorsal view
 */
function WristDiagram({ width = 220, height = 220, side = 'both' }) {
  const isLeft = side === 'left' || side === 'both';
  const isRight = side === 'right' || side === 'both';
  const leftX = width / 4;
  const rightX = (width * 3) / 4;

  const renderWrist = (x, label) => (
    <g>
      {/* Radius */}
      <path
        d={`M ${x - 18} 15
            L ${x - 20} 60
            C ${x - 22} 70, ${x - 18} 78, ${x - 12} 80
            L ${x - 5} 80
            C ${x} 78, ${x + 2} 70, ${x} 60
            L ${x - 2} 15`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <text x={x - 12} y={40} fontSize="6" fill="#6b7280">
        Radius
      </text>

      {/* Ulna */}
      <path
        d={`M ${x + 5} 15
            L ${x + 5} 55
            C ${x + 5} 65, ${x + 10} 72, ${x + 15} 75
            L ${x + 20} 72
            C ${x + 22} 65, ${x + 20} 55, ${x + 18} 15`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <text x={x + 12} y={40} fontSize="6" fill="#6b7280">
        Ulna
      </text>

      {/* Ulnar styloid */}
      <circle cx={x + 18} cy={72} r={4} fill="none" stroke="#d1d5db" strokeWidth="1" />
      <text x={x + 25} y={75} fontSize="5" fill="#9ca3af">
        US
      </text>

      {/* Radial styloid */}
      <circle cx={x - 18} cy={78} r={4} fill="none" stroke="#d1d5db" strokeWidth="1" />
      <text x={x - 28} y={81} fontSize="5" fill="#9ca3af">
        RS
      </text>

      {/* Carpals */}
      <rect
        x={x - 22}
        y={82}
        width={44}
        height={25}
        rx={5}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <text x={x} y={97} fontSize="6" fill="#6b7280" textAnchor="middle">
        Carpalia
      </text>

      {/* Scaphoid */}
      <ellipse cx={x - 12} cy={90} rx={8} ry={6} fill="none" stroke="#d1d5db" strokeWidth="0.8" />
      <text x={x - 12} y={92} fontSize="4" fill="#9ca3af" textAnchor="middle">
        Sc
      </text>

      {/* Lunate */}
      <ellipse cx={x + 2} cy={88} rx={7} ry={5} fill="none" stroke="#d1d5db" strokeWidth="0.8" />
      <text x={x + 2} y={90} fontSize="4" fill="#9ca3af" textAnchor="middle">
        Lu
      </text>

      {/* Triquetrum */}
      <ellipse cx={x + 14} cy={90} rx={6} ry={5} fill="none" stroke="#d1d5db" strokeWidth="0.8" />
      <text x={x + 14} y={92} fontSize="4" fill="#9ca3af" textAnchor="middle">
        Tri
      </text>

      {/* Metacarpals */}
      {[...Array(5)].map((_, i) => {
        const mcX = x - 18 + i * 10;
        return (
          <g key={i}>
            <rect
              x={mcX - 3}
              y={108}
              width={7}
              height={30}
              rx={2}
              fill="none"
              stroke="#d1d5db"
              strokeWidth="1"
            />
            <text x={mcX} y={125} fontSize="5" fill="#9ca3af" textAnchor="middle">
              M{i + 1}
            </text>
          </g>
        );
      })}

      {/* Fingers */}
      {[...Array(5)].map((_, i) => {
        const fX = x - 18 + i * 10;
        const fLen = i === 0 ? 25 : i === 2 ? 40 : 35;
        return (
          <line
            key={i}
            x1={fX}
            y1={140}
            x2={fX}
            y2={140 + fLen}
            stroke="#d1d5db"
            strokeWidth="4"
            strokeLinecap="round"
          />
        );
      })}

      {/* TFCC */}
      <ellipse
        cx={x + 10}
        cy={80}
        rx={8}
        ry={4}
        fill="#dbeafe"
        stroke="#93c5fd"
        strokeWidth="0.5"
      />
      <text x={x + 22} y={82} fontSize="5" fill="#3b82f6">
        TFCC
      </text>

      {/* Label */}
      <text x={x} y={height - 5} fontSize="10" fill="#6b7280" textAnchor="middle" fontWeight="bold">
        {label}
      </text>
    </g>
  );

  return (
    <g>
      {isLeft && renderWrist(side === 'both' ? leftX : width / 2, 'V / L')}
      {isRight && renderWrist(side === 'both' ? rightX : width / 2, 'H / R')}
    </g>
  );
}

/**
 * Elbow Diagram
 */
function ElbowDiagram({ width = 200, height = 220, side = 'both' }) {
  const isLeft = side === 'left' || side === 'both';
  const isRight = side === 'right' || side === 'both';
  const leftX = width / 4;
  const rightX = (width * 3) / 4;

  const renderElbow = (x, label) => (
    <g>
      {/* Humerus */}
      <path
        d={`M ${x - 12} 15
            L ${x - 15} 70
            C ${x - 18} 85, ${x - 20} 95, ${x - 15} 105
            L ${x + 15} 105
            C ${x + 20} 95, ${x + 18} 85, ${x + 15} 70
            L ${x + 12} 15`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <text x={x} y={45} fontSize="7" fill="#6b7280" textAnchor="middle">
        Humerus
      </text>

      {/* Lateral epicondyle */}
      <circle cx={x + 18} cy={95} r={6} fill="none" stroke="#ef4444" strokeWidth="1.5" />
      <text x={x + 28} y={98} fontSize="5" fill="#ef4444">
        LE
      </text>

      {/* Medial epicondyle */}
      <circle cx={x - 18} cy={95} r={6} fill="none" stroke="#ef4444" strokeWidth="1.5" />
      <text x={x - 30} y={98} fontSize="5" fill="#ef4444">
        ME
      </text>

      {/* Olecranon */}
      <ellipse cx={x} cy={115} rx={12} ry={8} fill="none" stroke="#9ca3af" strokeWidth="1.5" />
      <text x={x} y={118} fontSize="5" fill="#6b7280" textAnchor="middle">
        Olec.
      </text>

      {/* Radius */}
      <path
        d={`M ${x + 8} 115
            L ${x + 12} 200`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <text x={x + 22} y={160} fontSize="6" fill="#6b7280">
        Radius
      </text>

      {/* Radial head */}
      <circle cx={x + 10} cy={118} r={7} fill="none" stroke="#d1d5db" strokeWidth="1" />

      {/* Ulna */}
      <path
        d={`M ${x - 5} 120
            L ${x - 8} 200`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <text x={x - 18} y={160} fontSize="6" fill="#6b7280">
        Ulna
      </text>

      {/* Common extensor origin */}
      <path
        d={`M ${x + 18} 95
            C ${x + 25} 105, ${x + 22} 130, ${x + 15} 150`}
        fill="none"
        stroke="#f97316"
        strokeWidth="1.5"
        strokeDasharray="3,2"
      />
      <text x={x + 28} y={125} fontSize="5" fill="#f97316">
        CEO
      </text>

      {/* Label */}
      <text x={x} y={height - 5} fontSize="10" fill="#6b7280" textAnchor="middle" fontWeight="bold">
        {label}
      </text>
    </g>
  );

  return (
    <g>
      {isLeft && renderElbow(side === 'both' ? leftX : width / 2, 'V / L')}
      {isRight && renderElbow(side === 'both' ? rightX : width / 2, 'H / R')}
    </g>
  );
}

/**
 * Head/TMJ Diagram
 */
function HeadTMJDiagram({ width = 200, height = 200 }) {
  const centerX = width / 2;

  return (
    <g>
      {/* Head outline - lateral view */}
      <ellipse
        cx={centerX}
        cy={80}
        rx={60}
        ry={70}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />

      {/* TMJ - Left */}
      <circle cx={centerX - 55} cy={85} r={8} fill="none" stroke="#ef4444" strokeWidth="1.5" />
      <text x={centerX - 75} y={88} fontSize="6" fill="#ef4444">
        TMJ
      </text>

      {/* TMJ - Right */}
      <circle cx={centerX + 55} cy={85} r={8} fill="none" stroke="#ef4444" strokeWidth="1.5" />
      <text x={centerX + 65} y={88} fontSize="6" fill="#ef4444">
        TMJ
      </text>

      {/* Mandible */}
      <path
        d={`M ${centerX - 50} 95
            C ${centerX - 40} 130, ${centerX - 20} 145, ${centerX} 148
            C ${centerX + 20} 145, ${centerX + 40} 130, ${centerX + 50} 95`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <text x={centerX} y={135} fontSize="7" fill="#6b7280" textAnchor="middle">
        Mandibula
      </text>

      {/* Mastoid processes */}
      <ellipse
        cx={centerX - 60}
        cy={105}
        rx={5}
        ry={8}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1"
      />
      <ellipse
        cx={centerX + 60}
        cy={105}
        rx={5}
        ry={8}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1"
      />

      {/* Temporal regions */}
      <path
        d={`M ${centerX - 45} 40 C ${centerX - 55} 50, ${centerX - 58} 70, ${centerX - 55} 85`}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1"
        strokeDasharray="3,2"
      />
      <path
        d={`M ${centerX + 45} 40 C ${centerX + 55} 50, ${centerX + 58} 70, ${centerX + 55} 85`}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1"
        strokeDasharray="3,2"
      />
      <text x={centerX - 35} y={55} fontSize="6" fill="#9ca3af">
        Temporal
      </text>
      <text x={centerX + 20} y={55} fontSize="6" fill="#9ca3af">
        Temporal
      </text>

      {/* Suboccipital region */}
      <path
        d={`M ${centerX - 30} 15 C ${centerX} 5, ${centerX} 5, ${centerX + 30} 15`}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1"
      />
      <text x={centerX} y={8} fontSize="6" fill="#9ca3af" textAnchor="middle">
        Suboccipital
      </text>

      {/* Labels */}
      <text x={centerX - 50} y={height - 5} fontSize="9" fill="#6b7280" fontWeight="bold">
        V / L
      </text>
      <text x={centerX + 35} y={height - 5} fontSize="9" fill="#6b7280" fontWeight="bold">
        H / R
      </text>
    </g>
  );
}

/**
 * Marker component
 */
function DiagramMarker({ marker, onRemove, selected, onSelect }) {
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

/**
 * Generic Regional Diagram Wrapper
 */
export default function RegionalBodyDiagram({
  region = 'shoulder', // shoulder, knee, cervical, lumbar, hip, head
  markers = [],
  onChange,
  lang = 'no',
  side = 'both',
  readOnly = false,
  compact = false,
}) {
  const [selectedType, setSelectedType] = useState('pain');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const svgRef = useRef(null);

  const configs = {
    shoulder: {
      width: 250,
      height: 200,
      Component: ShoulderDiagram,
      title: 'Skulder',
      titleEn: 'Shoulder',
    },
    knee: { width: 200, height: 250, Component: KneeDiagram, title: 'Kne', titleEn: 'Knee' },
    ankle: { width: 220, height: 200, Component: AnkleDiagram, title: 'Ankel', titleEn: 'Ankle' },
    wrist: {
      width: 220,
      height: 220,
      Component: WristDiagram,
      title: 'Håndledd',
      titleEn: 'Wrist',
    },
    elbow: { width: 200, height: 220, Component: ElbowDiagram, title: 'Albue', titleEn: 'Elbow' },
    cervical: {
      width: 200,
      height: 250,
      Component: CervicalSpineDiagram,
      title: 'Cervikalkolumna',
      titleEn: 'Cervical Spine',
    },
    lumbar: {
      width: 200,
      height: 250,
      Component: LumbarSpineDiagram,
      title: 'Lumbalkolumna',
      titleEn: 'Lumbar Spine',
    },
    hip: { width: 250, height: 220, Component: HipDiagram, title: 'Hofte', titleEn: 'Hip' },
    head: {
      width: 200,
      height: 200,
      Component: HeadTMJDiagram,
      title: 'Hode/TMJ',
      titleEn: 'Head/TMJ',
    },
  };

  const config = configs[region] || configs.shoulder;
  const { width, height, Component, title, titleEn } = config;

  const handleSvgClick = useCallback(
    (e) => {
      if (readOnly) {
        return;
      }
      const svg = svgRef.current;
      if (!svg) {
        return;
      }

      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * width;
      const y = ((e.clientY - rect.top) / rect.height) * height;

      const markerSide = x < width / 2 ? 'left' : 'right';

      onChange([
        ...markers,
        {
          id: `marker_${Date.now()}`,
          type: selectedType,
          x: Math.round(x),
          y: Math.round(y),
          side: markerSide,
          region,
        },
      ]);
      setSelectedMarker(null);
    },
    [markers, onChange, selectedType, width, height, readOnly, region]
  );

  const handleRemoveMarker = useCallback(
    (markerId) => {
      onChange(markers.filter((m) => m.id !== markerId));
      setSelectedMarker(null);
    },
    [markers, onChange]
  );

  return (
    <div className={`flex ${compact ? 'gap-2' : 'gap-4 flex-col md:flex-row'}`}>
      {/* Controls */}
      <div className={compact ? 'w-24 space-y-2' : 'w-full md:w-40 space-y-3'}>
        <h4 className={`font-semibold text-gray-700 ${compact ? 'text-xs' : 'text-sm'}`}>
          {lang === 'no' ? title : titleEn}
        </h4>

        <div className="space-y-1">
          {Object.entries(MARKER_TYPES).map(([key, type]) => (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              disabled={readOnly}
              className={`w-full text-left px-2 py-1 text-xs rounded flex items-center gap-2
                         ${selectedType === key ? 'bg-gray-100 ring-1 ring-gray-300' : 'hover:bg-gray-50'}`}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px]"
                style={{ backgroundColor: type.color }}
              >
                {type.symbol}
              </span>
              <span className="text-gray-700 truncate">
                {lang === 'no' ? type.label : type.labelEn}
              </span>
            </button>
          ))}
        </div>

        {markers.length > 0 && !readOnly && (
          <button
            onClick={() => {
              onChange([]);
              setSelectedMarker(null);
            }}
            className="w-full flex items-center justify-center gap-1 px-2 py-1 text-xs
                      text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            {lang === 'no' ? 'Fjern' : 'Clear'}
          </button>
        )}
      </div>

      {/* Diagram */}
      <div className="flex-1 border border-gray-200 rounded-lg bg-white p-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full cursor-crosshair"
          style={{ maxHeight: compact ? '180px' : '400px', minHeight: compact ? '150px' : '280px' }}
          onClick={handleSvgClick}
        >
          <Component width={width} height={height} side={side} />
          {markers.map((marker) => (
            <DiagramMarker
              key={marker.id}
              marker={marker}
              selected={selectedMarker === marker.id}
              onSelect={setSelectedMarker}
              onRemove={handleRemoveMarker}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

export {
  ShoulderDiagram,
  KneeDiagram,
  AnkleDiagram,
  WristDiagram,
  ElbowDiagram,
  CervicalSpineDiagram,
  LumbarSpineDiagram,
  HipDiagram,
  HeadTMJDiagram,
  MARKER_TYPES,
};
