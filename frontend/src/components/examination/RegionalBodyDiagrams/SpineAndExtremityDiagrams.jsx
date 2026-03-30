/**
 * SpineAndExtremityDiagrams - SVG diagram components for spine, extremity, and head regions
 *
 * Contains: CervicalSpineDiagram, LumbarSpineDiagram, WristDiagram, ElbowDiagram, HeadTMJDiagram
 */

/**
 * Cervical Spine Diagram - Lateral view
 */
export function CervicalSpineDiagram({ width = 200, _height = 250 }) {
  const centerX = width / 2;
  const vertebrae = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'];

  return (
    <g>
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
      {vertebrae.map((v, i) => {
        const y = 60 + i * 25;
        return (
          <g key={v}>
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
            <path
              d={`M ${centerX + 15} ${y + 9}
                  L ${centerX + 35} ${y + 12}
                  L ${centerX + 15} ${y + 15}`}
              fill="none"
              stroke="#d1d5db"
              strokeWidth="1"
            />
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
            <text x={centerX - 25} y={y + 13} fontSize="8" fill="#6b7280" fontWeight="bold">
              {v}
            </text>
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
export function LumbarSpineDiagram({ width = 200, _height = 250 }) {
  const centerX = width / 2;
  const vertebrae = ['L1', 'L2', 'L3', 'L4', 'L5'];

  return (
    <g>
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
      {vertebrae.map((v, i) => {
        const y = 40 + i * 35;
        return (
          <g key={v}>
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
 * Wrist/Hand Diagram - Dorsal view
 */
export function WristDiagram({ width = 220, height = 220, side = 'both' }) {
  const isLeft = side === 'left' || side === 'both';
  const isRight = side === 'right' || side === 'both';
  const leftX = width / 4;
  const rightX = (width * 3) / 4;

  const renderWrist = (x, label) => (
    <g>
      <path
        d={`M ${x - 18} 15 L ${x - 20} 60 C ${x - 22} 70, ${x - 18} 78, ${x - 12} 80
            L ${x - 5} 80 C ${x} 78, ${x + 2} 70, ${x} 60 L ${x - 2} 15`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <text x={x - 12} y={40} fontSize="6" fill="#6b7280">
        Radius
      </text>
      <path
        d={`M ${x + 5} 15 L ${x + 5} 55 C ${x + 5} 65, ${x + 10} 72, ${x + 15} 75
            L ${x + 20} 72 C ${x + 22} 65, ${x + 20} 55, ${x + 18} 15`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <text x={x + 12} y={40} fontSize="6" fill="#6b7280">
        Ulna
      </text>
      <circle cx={x + 18} cy={72} r={4} fill="none" stroke="#d1d5db" strokeWidth="1" />
      <text x={x + 25} y={75} fontSize="5" fill="#9ca3af">
        US
      </text>
      <circle cx={x - 18} cy={78} r={4} fill="none" stroke="#d1d5db" strokeWidth="1" />
      <text x={x - 28} y={81} fontSize="5" fill="#9ca3af">
        RS
      </text>
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
      <ellipse cx={x - 12} cy={90} rx={8} ry={6} fill="none" stroke="#d1d5db" strokeWidth="0.8" />
      <text x={x - 12} y={92} fontSize="4" fill="#9ca3af" textAnchor="middle">
        Sc
      </text>
      <ellipse cx={x + 2} cy={88} rx={7} ry={5} fill="none" stroke="#d1d5db" strokeWidth="0.8" />
      <text x={x + 2} y={90} fontSize="4" fill="#9ca3af" textAnchor="middle">
        Lu
      </text>
      <ellipse cx={x + 14} cy={90} rx={6} ry={5} fill="none" stroke="#d1d5db" strokeWidth="0.8" />
      <text x={x + 14} y={92} fontSize="4" fill="#9ca3af" textAnchor="middle">
        Tri
      </text>
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
export function ElbowDiagram({ width = 200, height = 220, side = 'both' }) {
  const isLeft = side === 'left' || side === 'both';
  const isRight = side === 'right' || side === 'both';
  const leftX = width / 4;
  const rightX = (width * 3) / 4;

  const renderElbow = (x, label) => (
    <g>
      <path
        d={`M ${x - 12} 15 L ${x - 15} 70 C ${x - 18} 85, ${x - 20} 95, ${x - 15} 105
            L ${x + 15} 105 C ${x + 20} 95, ${x + 18} 85, ${x + 15} 70 L ${x + 12} 15`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <text x={x} y={45} fontSize="7" fill="#6b7280" textAnchor="middle">
        Humerus
      </text>
      <circle cx={x + 18} cy={95} r={6} fill="none" stroke="#ef4444" strokeWidth="1.5" />
      <text x={x + 28} y={98} fontSize="5" fill="#ef4444">
        LE
      </text>
      <circle cx={x - 18} cy={95} r={6} fill="none" stroke="#ef4444" strokeWidth="1.5" />
      <text x={x - 30} y={98} fontSize="5" fill="#ef4444">
        ME
      </text>
      <ellipse cx={x} cy={115} rx={12} ry={8} fill="none" stroke="#9ca3af" strokeWidth="1.5" />
      <text x={x} y={118} fontSize="5" fill="#6b7280" textAnchor="middle">
        Olec.
      </text>
      <path
        d={`M ${x + 8} 115 L ${x + 12} 200`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <text x={x + 22} y={160} fontSize="6" fill="#6b7280">
        Radius
      </text>
      <circle cx={x + 10} cy={118} r={7} fill="none" stroke="#d1d5db" strokeWidth="1" />
      <path
        d={`M ${x - 5} 120 L ${x - 8} 200`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <text x={x - 18} y={160} fontSize="6" fill="#6b7280">
        Ulna
      </text>
      <path
        d={`M ${x + 18} 95 C ${x + 25} 105, ${x + 22} 130, ${x + 15} 150`}
        fill="none"
        stroke="#f97316"
        strokeWidth="1.5"
        strokeDasharray="3,2"
      />
      <text x={x + 28} y={125} fontSize="5" fill="#f97316">
        CEO
      </text>
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
export function HeadTMJDiagram({ width = 200, height = 200 }) {
  const centerX = width / 2;

  return (
    <g>
      <ellipse
        cx={centerX}
        cy={80}
        rx={60}
        ry={70}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <circle cx={centerX - 55} cy={85} r={8} fill="none" stroke="#ef4444" strokeWidth="1.5" />
      <text x={centerX - 75} y={88} fontSize="6" fill="#ef4444">
        TMJ
      </text>
      <circle cx={centerX + 55} cy={85} r={8} fill="none" stroke="#ef4444" strokeWidth="1.5" />
      <text x={centerX + 65} y={88} fontSize="6" fill="#ef4444">
        TMJ
      </text>
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
      <path
        d={`M ${centerX - 30} 15 C ${centerX} 5, ${centerX} 5, ${centerX + 30} 15`}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1"
      />
      <text x={centerX} y={8} fontSize="6" fill="#9ca3af" textAnchor="middle">
        Suboccipital
      </text>
      <text x={centerX - 50} y={height - 5} fontSize="9" fill="#6b7280" fontWeight="bold">
        V / L
      </text>
      <text x={centerX + 35} y={height - 5} fontSize="9" fill="#6b7280" fontWeight="bold">
        H / R
      </text>
    </g>
  );
}
