/**
 * JointDiagrams - SVG diagram components for joint regions
 *
 * Contains: ShoulderDiagram, KneeDiagram, HipDiagram, AnkleDiagram
 */

/**
 * Shoulder Diagram - Anterior view
 */
export function ShoulderDiagram({ width = 250, height = 200, side = 'both' }) {
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
          <circle cx={centerX - 85} cy={80} r={6} fill="none" stroke="#d1d5db" strokeWidth="1" />
          <text x={centerX - 100} y={75} fontSize="5" fill="#9ca3af">
            GT
          </text>
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
          <circle cx={centerX + 85} cy={80} r={6} fill="none" stroke="#d1d5db" strokeWidth="1" />
          <text x={centerX + 92} y={75} fontSize="5" fill="#9ca3af">
            GT
          </text>
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
export function KneeDiagram({ width = 200, height = 250, side = 'both' }) {
  const isLeft = side === 'left' || side === 'both';
  const isRight = side === 'right' || side === 'both';
  const leftX = width / 4;
  const rightX = (width * 3) / 4;

  const renderKnee = (x, label) => (
    <g>
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
      <ellipse cx={x} cy={125} rx={15} ry={18} fill="none" stroke="#9ca3af" strokeWidth="1.5" />
      <text x={x} y={128} fontSize="6" fill="#6b7280" textAnchor="middle">
        Patella
      </text>
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
      <circle cx={x + 28} cy={160} r={6} fill="none" stroke="#d1d5db" strokeWidth="1" />
      <text x={x + 38} y={163} fontSize="5" fill="#9ca3af">
        Fib
      </text>
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
      <line x1={x - 20} y1={120} x2={x - 22} y2={165} stroke="#3b82f6" strokeWidth="1.5" />
      <line x1={x + 20} y1={120} x2={x + 22} y2={165} stroke="#3b82f6" strokeWidth="1.5" />
      <text x={x - 32} y={145} fontSize="5" fill="#3b82f6">
        MCL
      </text>
      <text x={x + 26} y={145} fontSize="5" fill="#3b82f6">
        LCL
      </text>
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
 * Hip Diagram - Anterior view
 */
export function HipDiagram({ width = 250, height = 220, side = 'both' }) {
  const isLeft = side === 'left' || side === 'both';
  const isRight = side === 'right' || side === 'both';
  const centerX = width / 2;

  const renderHip = (x, label, mirror = false) => {
    const dir = mirror ? -1 : 1;
    return (
      <g>
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
        <circle cx={x + dir * 30} cy={100} r={22} fill="none" stroke="#9ca3af" strokeWidth="1.5" />
        <text x={x + dir * 30} y={103} fontSize="6" fill="#6b7280" textAnchor="middle">
          Acetab.
        </text>
        <circle
          cx={x + dir * 30}
          cy={100}
          r={18}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1"
          strokeDasharray="3,2"
        />
        <path
          d={`M ${x + dir * 42} 115
              L ${x + dir * 55} 140
              L ${x + dir * 45} 145
              L ${x + dir * 35} 118`}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.5"
        />
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
        <path
          d={`M ${x + dir * 45} 145
              L ${x + dir * 40} 210
              L ${x + dir * 55} 210
              L ${x + dir * 55} 145`}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.5"
        />
        <circle cx={x + dir * 15} cy={45} r={4} fill="none" stroke="#ef4444" strokeWidth="1" />
        <text x={x + dir * 5} y={38} fontSize="5" fill="#ef4444">
          ASIS
        </text>
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
export function AnkleDiagram({ width = 220, height = 200, side = 'both' }) {
  const isLeft = side === 'left' || side === 'both';
  const isRight = side === 'right' || side === 'both';
  const leftX = width / 4;
  const rightX = (width * 3) / 4;

  const renderAnkle = (x, label) => (
    <g>
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
      <ellipse cx={x - 18} cy={115} rx={8} ry={12} fill="none" stroke="#9ca3af" strokeWidth="1.5" />
      <text x={x - 30} y={118} fontSize="5" fill="#9ca3af">
        MM
      </text>
      <ellipse cx={x + 20} cy={118} rx={6} ry={14} fill="none" stroke="#9ca3af" strokeWidth="1.5" />
      <text x={x + 30} y={121} fontSize="5" fill="#9ca3af">
        LM
      </text>
      <ellipse cx={x} cy={125} rx={20} ry={12} fill="none" stroke="#d1d5db" strokeWidth="1" />
      <text x={x} y={128} fontSize="6" fill="#6b7280" textAnchor="middle">
        Talus
      </text>
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
      <line x1={x + 18} y1={110} x2={x + 25} y2={135} stroke="#3b82f6" strokeWidth="1.5" />
      <text x={x + 28} y={145} fontSize="5" fill="#3b82f6">
        ATFL
      </text>
      <line x1={x + 20} y1={120} x2={x + 10} y2={155} stroke="#3b82f6" strokeWidth="1.5" />
      <text x={x + 15} y={162} fontSize="5" fill="#3b82f6">
        CFL
      </text>
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
      <path
        d={`M ${x + 5} 165
            C ${x + 20} 168, ${x + 35} 175, ${x + 40} 185
            L ${x + 35} 190
            C ${x + 25} 182, ${x + 10} 178, ${x} 175`}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1"
      />
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
