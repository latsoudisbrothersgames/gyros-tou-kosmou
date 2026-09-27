import {
  useCallback,
  useId,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import './LandmarkArt.css';

interface LandmarkArtProps {
  landmarkId: string;
  className?: string;
  /** Περιγραφή για πρόσβαση — κενή όσο το μνημείο είναι «ερώτηση» */
  ariaLabel?: string;
  /** Σύντομη «ζωντάνια» μετά από σωστή απάντηση (~1s) */
  celebrate?: boolean;
  /** Τόνος ηπείρου στο πλαίσιο (μετά την αποκάλυψη) */
  frameAccent?: boolean;
  style?: CSSProperties;
}

interface Scene {
  skyTop: string;
  skyBottom: string;
  ground: string;
  /** Στρώση βάθους: ουρανός, ήλιος, μακρινοί λόφοι */
  back?: ReactNode;
  /** Το μνημείο — πάντα το οπτικό κέντρο */
  mid: ReactNode;
  /** Προσκήνιο: έδαφος, βλάστηση, νερό, κοντινά στοιχεία */
  front?: ReactNode;
}

const GROUND_Y = 112;

/** Σειρά από αψίδες (για Κολοσσαίο, ναούς κ.λπ.) */
function Arches({
  y,
  count,
  x0,
  gap,
  w,
  h,
  fill,
}: {
  y: number;
  count: number;
  x0: number;
  gap: number;
  w: number;
  h: number;
  fill: string;
}) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <path
          key={i}
          d={`M${x0 + i * gap} ${y + h} v${-h + w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 v${h - w / 2} Z`}
          fill={fill}
        />
      ))}
    </g>
  );
}

/** Απαλά συννεφάκια για τα φόντα — κοινό στυλ σε όλα τα διοράματα */
function Clouds({ variant = 0 }: { variant?: 0 | 1 | 2 }) {
  const sets: [number, number, number][][] = [
    [
      [42, 26, 1],
      [168, 40, 0.75],
    ],
    [
      [60, 38, 0.8],
      [180, 24, 1],
    ],
    [
      [30, 42, 0.7],
      [120, 22, 0.9],
      [196, 46, 0.6],
    ],
  ];
  return (
    <g opacity="0.85">
      {sets[variant].map(([cx, cy, s], i) => (
        <g key={i} transform={`translate(${cx} ${cy}) scale(${s})`} fill="#ffffff">
          <ellipse cx="0" cy="0" rx="16" ry="6.5" />
          <ellipse cx="-11" cy="2.5" rx="9" ry="4.5" />
          <ellipse cx="11" cy="2.5" rx="10" ry="5" />
        </g>
      ))}
    </g>
  );
}

/** Θάμνοι προσκηνίου */
function Bushes({ xs, fill = '#5f9b4f' }: { xs: number[]; fill?: string }) {
  return (
    <g>
      {xs.map((x, i) => (
        <g key={i} transform={`translate(${x} 112)`} fill={fill}>
          <ellipse cx="0" cy="-3" rx="10" ry="6" />
          <ellipse cx="-8" cy="-1" rx="7" ry="4.5" opacity="0.85" />
          <ellipse cx="8" cy="-1" rx="7" ry="4.5" opacity="0.85" />
        </g>
      ))}
    </g>
  );
}

// Repeated masonry and vegetation stay as small paths: no filters, images or new gradients.
const repeatPath = (count: number, draw: (i: number) => string) =>
  Array.from({ length: count }, (_, i) => draw(i)).join(' ');

function Columns({ x, y, count, gap, h, w = 5, fill = '#ece5d2', shade = '#cbbf9f' }: {
  x: number; y: number; count: number; gap: number; h: number; w?: number; fill?: string; shade?: string;
}) {
  return <g>{Array.from({ length: count }, (_, i) => <g key={i} transform={`translate(${x + i * gap} ${y})`}>
    <path d={`M0 0 h${w} l1 ${h} h${-w - 2} Z M-2 -2 h${w + 4} v3 h${-w - 4} Z M-2 ${h} h${w + 4} v2 h${-w - 4} Z`} fill={fill} />
    <path d={`M1 3 v${h - 5} M${w - 1} 3 v${h - 5}`} stroke={shade} strokeWidth="0.6" />
  </g>)}</g>;
}

function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-2 0 Q2 -13 0 -25 h3 Q6 -10 2 0 Z" fill="#9e8055" />
    <path d="M2 -24 Q-9 -36 -16 -25 Q-5 -29 2 -22 Q-11 -26 -15 -15 Q-5 -23 2 -22 Q8 -36 17 -28 Q9 -29 2 -22 Q15 -27 19 -17 Q8 -22 2 -22 Q2 -36 -4 -34 Z" fill="#618c57" />
  </g>;
}

function Pines({ xs, y = 113, s = 1 }: { xs: number[]; y?: number; s?: number }) {
  return <g>{xs.map((x, i) => <g key={x} transform={`translate(${x} ${y}) scale(${s * (i % 2 ? 0.8 : 1)})`}>
    <path d="M-1 0 v-12 h2 V0" fill="#8a6a4f" />
    <path d="M0 -24 L-6 -12 h3 l-6 9 H9 l-6 -9 h3 Z" fill="#54815b" />
    <path d="M0 -24 V-3 H9 l-6 -9 h3 Z" fill="#6b9866" />
  </g>)}</g>;
}

function Ripples({ y = 123, fill = '#dcebf0' }: { y?: number; fill?: string }) {
  return <path d={`M14 ${y} h23 m9 5 h14 m12 -9 h21 m38 5 h25 m13 -4 h26 M24 ${y + 10} h30 m104 0 h20`} stroke={fill} strokeWidth="1" opacity="0.6" />;
}

function Skyline({ fill = '#9db8cc' }: { fill?: string }) {
  return <g fill={fill} opacity="0.65">
    <path d="M6 112 V95 h10 V85 h8 v27 h7 V80 h7 V69 h3 v11 h7 v32 h8 V94 h13 v18 h81 V93 h10 V82 h9 v30 h6 V74 h8 V62 h2 v12 h8 v38 h7 V89 h13 v23 Z" />
    <path d="M10 98 v9 m26 -20 v21 m8 -22 v21 m114 -11 v11 m23 -24 v24 m7 -27 v27 m15 -12 v12" stroke="#dfe8ee" strokeWidth="2" />
  </g>;
}

function CypressRows() {
  return <g>{[0, 1, 2, 3].flatMap(i => [0, 1].map(side => {
    const x = side ? 148 + i * 9 : 72 - i * 9;
    return <g key={`${i}-${side}`} transform={`translate(${x} ${110 + i * 7})`}>
      <path d="M-3 0 Q-6 -7 0 -18 Q6 -7 3 0 Z" fill="#5c8757" />
      <path d="M0 -15 V0 H3 Q5 -6 0 -15" fill="#719964" />
    </g>;
  }))}</g>;
}

const SCENES: Record<string, Scene> = {
  eiffel: {
    skyTop: '#ffd9a0', skyBottom: '#ffeed9', ground: '#9fc776',
    back: <g>
      <circle cx="40" cy="34" r="13" fill="#ffb703" opacity="0.9" /><Clouds variant={1} />
      <path d="M9 112 V97 h22 V91 h16 v21 h117 V94 h17 v-5 h15 v23 h17 V98 h12 v14 Z" fill="#c9a97f" opacity="0.5" />
      <path d="M8 97 l12 -7 13 7 M160 94 l13 -8 12 8 M180 89 l8 -6 9 6" fill="#ab9482" />
      <path d="M14 102 h3 m7 0 h3 m13 -5 h3 m126 4 h3 m14 -6 h3 m7 8 h3" stroke="#f8e2bb" strokeWidth="3" />
    </g>,
    mid: <g>
      {/* The rear pair remains visible inside the four open lattice legs. */}
      <path d="M108 64 L91 112 h6 l14 -36 13 36 h7 L113 64 Z" fill="#9c8066" />
      <path d="M108 17 C106 53 94 88 73 112 h12 Q105 84 110 53 Q115 84 135 112 h12 C126 88 114 53 112 17 Z" fill="#6f5846" />
      <path d="M109 28 L111 28 L117 60 H103 Z M103 65 L117 65 L127 86 H93 Z" fill="#aa8965" />
      <path d="M110 28 v31 M106 36 l7 8 -10 8 13 7 M113 36 l-7 8 10 8 -13 7 M102 65 l18 10 -27 11 M118 65 l-18 10 27 11 M89 93 l7 5 -15 7 5 5 M131 93 l-7 5 15 7 -5 5" fill="none" stroke="#5b4a3f" strokeWidth="1.3" />
      <path d="M85 111 Q110 69 135 111 L131 110 Q110 81 89 111 Z" fill="#7e614a" />
      <path d="M91 86 h38 v5 H91 Z M101 59 h18 v4 h-18 Z M106 19 h8 v4 h-8 Z" fill="#5b4a3f" />
      <path d="M90 85 h40 M100 58 h20 M107 24 h6" stroke="#cfad80" strokeWidth="1.5" />
      <path d="M110 7 v12" stroke="#5b4a3f" strokeWidth="2" strokeLinecap="round" />
      <path d="M94 84 v-3 m5 3 v-3 m5 3 v-3 m5 3 v-3 m5 3 v-3 m5 3 v-3 m5 3 v-3" stroke="#6f5846" />
    </g>,
    front: <g>
      <path d="M99 112 h22 l17 28 H82 Z" fill="#d9cb9a" />
      <path d="M101 114 h18 m-21 7 h24 m-28 10 h32" stroke="#eadbb0" strokeWidth="1.5" />
      {[24, 43, 62, 158, 177, 196].map((x, i) => <g key={x} transform={`translate(${x} ${i % 3 === 1 ? 121 : 113})`}>
        <path d="M0 0 v-12" stroke="#907851" strokeWidth="2" />
        <ellipse cy="-13" rx="7" ry="10" fill={i % 2 ? '#709e52' : '#5f914b'} />
      </g>)}
    </g>,
  },
  colosseum: {
    skyTop: '#aee1ff', skyBottom: '#eaf7ff', ground: '#d8c48f',
    back: <Clouds variant={0} />,
    mid: <g transform="translate(0 -3) scale(1 .95)">
      {/* Far inner ring and stepped break precede the curved outer wall. */}
      <ellipse cx="109" cy="59" rx="78" ry="25" fill="#aa8659" />
      <ellipse cx="109" cy="59" rx="62" ry="17" fill="#806549" />
      <path d="M47 58 Q109 24 174 55 v42 H47 Z" fill="#c5a575" />
      <Arches x0={58} y={49} count={9} gap={12} w={6} h={13} fill="#947249" />
      <path d="M43 69 Q111 44 180 68 M41 80 Q110 55 184 78" fill="none" stroke="#e1c795" strokeWidth="3" />
      <path d="M28 59 Q28 38 83 33 Q115 30 140 37 V50 h15 v14 h14 v13 h17 v14 h10 v19 Q112 130 28 107 Z" fill="#e0be85" />
      <path d="M28 59 Q32 43 50 42 V113 Q36 111 28 107 Z" fill="#c7a36c" />
      {[0, 1, 2].map(tier => <g key={tier}>
        {Array.from({ length: tier === 0 ? 8 : tier === 1 ? 10 : 12 }, (_, i) => {
          const x = 34 + i * 13;
          const y = 52 + tier * 20 + Math.round(6 * (1 - ((x - 112) / 80) ** 2));
          return <g key={i}>
            <Arches x0={x} y={y} count={1} gap={0} w={i === 0 ? 5 : 8} h={13} fill="#947249" />
            <path d={`M${x + 10} ${y - 1} v15 m-1 -15 h3 m-3 15 h3`} stroke="#f0d7a8" strokeWidth="1.6" />
          </g>;
        })}
      </g>)}
      <path d="M28 72 Q77 86 157 72 M28 92 Q91 107 185 91 M28 109 Q110 130 196 109 M29 51 Q72 64 141 50 M30 43 Q76 30 140 39" stroke="#f0d7a8" strokeWidth="2.5" fill="none" />
      <path d={repeatPath(8, i => `M${38 + i * 13} ${43 + Math.round(4 * Math.sin(i / 3))} h5 v5 h-5 Z`)} fill="#a17e51" />
      <path d="M141 39 v11 h14 v14 h14 v13 h17 v14 h10" fill="none" stroke="#b59160" strokeWidth="3" />
    </g>,
    front: <g fill="#c2ab77"><ellipse cx="31" cy="122" rx="12" ry="3" /><ellipse cx="184" cy="124" rx="18" ry="4" />
      <path d="M58 119 h10 v4 H58 Z M155 118 h8 v5 h-8 Z" fill="#dfc594" />
      <path d="M74 131 q30 -5 62 0" stroke="#ecd8ad" strokeWidth="2" fill="none" />
    </g>,
  },
  acropolis: {
    skyTop: '#bfe4ff', skyBottom: '#fff3dd', ground: '#b9a06c',
    back: <g><circle cx="186" cy="28" r="11" fill="#ffb703" opacity="0.85" /><Clouds variant={2} />
      <path d="M0 100 q40 -22 80 -10 v22 H0 M150 102 q40 -18 70 -8 v18 h-70" fill="#c3b087" opacity="0.5" />
    </g>,
    mid: <g>
      <path d="M15 112 L32 94 52 88 63 79 160 79 185 89 205 112 Z" fill="#b59b6b" />
      <path d="M24 112 l28 -21 10 5 17 -10 -6 26 M105 112 l7 -22 23 -9 -11 31 M157 112 l-7 -21 17 -4 19 25" fill="#9f865b" />
      <path d="M37 97 l13 -3 m27 -4 20 -3 m39 9 18 -4 m10 12 14 1" stroke="#d1b984" strokeWidth="2" />
      <path d="M70 73 h91 v5 H70 Z M72 69 h86 v4 H72 Z" fill="#d9d0b8" />
      <path d="M80 44 h72 v26 H80 Z" fill="#c9bb99" />
      <Columns x={77} y={45} count={8} gap={10.7} h={24} w={4} />
      <path d="M71 39 h91 v7 H71 Z" fill="#e2d9c2" />
      <path d={repeatPath(15, i => `M${75 + i * 5.8} 40 v5`)} stroke="#bfb18e" strokeWidth="1.4" />
      <path d="M69 38 L87 32 87 29 95 29 96 27 102 28 106 24 116 22 139 30 143 29 149 34 164 38 Z" fill="#ece5d2" />
      <path d="M81 36 L116 26 151 36 Z" fill="#d5c9ad" />
      <path d="M69 38 h95 v2 H69 Z" fill="#ece5d2" />
      {/* Propylaea and the smaller caryatid porch on opposite ends of the rock. */}
      <path d="M30 80 h34 v4 H30 Z M31 61 h34 v5 H31 Z M28 61 l18 -9 20 9 Z" fill="#ded3b8" />
      <Columns x={34} y={66} count={4} gap={8} h={13} w={3} />
      <path d="M166 66 h24 v17 h-24 Z" fill="#d8ccb0" />
      <path d="M162 65 h31 v4 h-31 Z M167 59 h20 v6 h-20 Z M161 83 h34 v3 h-34 Z" fill="#ece5d2" />
      {[166, 174, 182, 190].map(x => <g key={x} fill="#efe7d2"><circle cx={x} cy="72" r="1.5" /><path d={`M${x - 1} 74 h2 l1 8 h-4 Z`} /></g>)}
    </g>,
    front: <g>
      <path d="M0 124 l24 -10 22 7 25 -6 44 12 45 -9 35 -4 25 14 v12 H0" fill="#c5ae7c" />
      {[17, 40, 68, 148, 172, 190].map((x, i) => <g key={x} transform={`translate(${x} ${119 + i % 2 * 7})`}>
        <path d="M0 0 h12 v9 H0 Z M2 -2 h8 v2 H2" fill="#f2ecdf" /><path d="M3 3 h2 v3 H3 m5 -3 h2 v3 H8" fill="#a1afab" />
      </g>)}
      <g stroke="#8b754f" strokeWidth="2"><path d="M7 119 v-13 m-3 6 3 -4 5 1 M211 119 v-14 m-4 7 4 -3 4 1" /></g>
      <g fill="#7d9450"><ellipse cx="8" cy="104" rx="10" ry="5" /><ellipse cx="208" cy="105" rx="10" ry="5" /></g>
    </g>,
  },
  greatwall: {
    skyTop: '#ffe3b3', skyBottom: '#fff6e6', ground: '#7fb069',
    back: <g><circle cx="34" cy="30" r="12" fill="#ff9f1c" opacity="0.85" /><Clouds variant={1} />
      <path d="M0 92 L38 60 61 70 109 39 142 68 181 33 220 55 V112 H0 Z" fill="#c0cfa4" />
      <path d="M0 106 L50 75 83 86 128 57 158 76 205 44 220 58 V112 H0 Z" fill="#a4bd86" />
      <path d="M0 112 Q40 70 74 98 Q117 71 140 83 Q181 48 220 73 V112 Z" fill="#8fbf76" />
    </g>,
    mid: <g>
      <path d="M25 116 Q50 69 88 81 T146 77 Q157 68 166 60 L190 55 199 44 207 46 194 61 170 68 Q160 92 141 93 Q110 87 88 95 Q55 89 48 116 Z" fill="#9e8c66" />
      <path d="M25 107 Q50 61 88 75 T146 72 Q157 64 166 56 L188 52 199 42 204 43 190 56 169 62 Q158 84 141 85 Q111 79 88 87 Q55 81 43 112 Z" fill="#d7c497" />
      <path d="M27 107 Q54 65 88 78 T145 75 Q159 67 167 59 L189 54 202 43" fill="none" stroke="#b49f77" strokeWidth="4" strokeDasharray="4 3" />
      <path d="M45 105 l8 3 m-4 -10 9 3 m-5 -10 10 3 m-5 -9 10 3 M92 81 l1 6 m8 -5 1 5 m8 -4 v4 m8 -4 v4 m8 -5 v4 m8 -4 v4" stroke="#a68d64" strokeWidth="1.2" />
      <path d="M50 105 q16 -22 40 -13 M99 93 q24 -5 38 0 M164 78 l6 -9 14 -5" fill="none" stroke="#bdab80" strokeWidth="1" />
      {[[58, 72, 1], [139, 65, 0.7], [189, 44, 0.45]].map(([x, y, s]) => <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
        <path d="M-11 0 h22 l2 23 h-26 Z" fill="#b9a27c" /><path d="M4 0 h7 l2 23 H4 Z" fill="#a08662" />
        <path d="M-13 0 v-7 h5 v3 h5 v-3 h6 v3 h5 v-3 h5 V0 Z" fill="#d7c497" />
        <path d="M-7 6 h4 v6 h-4 Z M3 6 h4 v6 H3 Z" fill="#79684e" />
        <path d="M-11 16 h22 M-7 17 v5 M2 13 v4" stroke="#937e58" strokeWidth="0.8" />
      </g>)}
    </g>,
    front: <g><path d="M0 128 l24 -23 28 7 32 28 H0 M128 140 q40 -41 92 -27 v27" fill="#6c9e5f" /><Bushes xs={[16, 182]} fill="#568a46" /></g>,
  },
  liberty: {
    skyTop: '#bfe4ff', skyBottom: '#e8f6ff', ground: '#7fa8c9',
    back: <g><Clouds variant={0} /><Skyline /></g>,
    mid: <g transform="translate(220 0) scale(-1 1)">
      <path d="M71 112 l9 -7 -4 -5 18 -3 16 -9 15 9 20 3 -5 6 10 6 Z" fill="#a99572" />
      <path d="M89 108 V91 h42 v17 Z M94 91 V81 h32 v10 Z" fill="#c9b18a" />
      <path d="M91 92 h38 M96 84 h28 M94 106 h32" stroke="#e1cba4" strokeWidth="2" />
      <path d="M102 96 h16 v10 h-16 Z" fill="#a58c69" />
      <path d="M95 81 l8 -28 -3 -13 9 -8 10 6 5 18 4 25 Z" fill="#7fc8a9" />
      <path d="M108 45 l-6 32 7 -8 4 -26 7 38 h7 l-8 -37 Z" fill="#5eaa91" />
      <path d="M112 49 l-2 27 M105 49 l-5 25 M117 53 l5 24" stroke="#a4dcc0" strokeWidth="1.4" />
      <path d="M102 42 l-10 12 6 10 6 -8 M118 40 l10 -8 8 -18 5 2 -8 24 -13 9" fill="#7fc8a9" />
      <path d="M92 48 l13 -3 4 18 -13 3 Z" fill="#509a86" /><path d="M94 49 l9 -2 2 13" fill="none" stroke="#a4dcc0" strokeWidth="1" />
      <path d="M103 27 q0 -8 7 -8 q8 0 7 9 l-3 9 h-8 Z" fill="#7fc8a9" />
      <path d="M112 24 l-1 6 h3 m-7 2 h5" fill="none" stroke="#519780" strokeWidth="1" />
      {Array.from({ length: 7 }, (_, i) => <path key={i} d="M-1 -8 L0 -18 1 -8 Z" fill="#70b89c" transform={`translate(110 26) rotate(${-75 + i * 25})`} />)}
      <path d="M102 23 q8 -6 16 0" fill="none" stroke="#529d86" strokeWidth="2" />
      <path d="M134 15 h9 l-2 5 h-5 Z M137 14 v-4 h3 v4" fill="#ad9158" />
      <path d="M138 12 Q132 7 139 2 Q138 7 142 7 Q145 13 138 12" fill="#ffbd38" />
    </g>,
    front: <g><path d="M0 112 h220 v28 H0" fill="#5f8fb4" /><Ripples />
      <path d="M68 112 l16 -7 24 4 16 -4 26 7 -12 5 H83 Z" fill="#8d9c69" />
      <g transform="translate(162 121)"><path d="M-18 0 h38 l-5 5 h-29 Z" fill="#f2ecdf" /><path d="M-12 -7 h24 v7 h-24 Z" fill="#e1d7bd" /><path d="M-10 -5 h5 m3 0 h5 m3 0 h5" stroke="#6391aa" strokeWidth="2" /><path d="M5 -7 v-4 h3 v4" fill="#b98863" /></g>
    </g>,
  },
  pyramids: {
    skyTop: '#ffd9a0', skyBottom: '#fff1d6', ground: '#e8c988',
    back: <g><circle cx="184" cy="30" r="14" fill="#ff9f1c" /><path d="M0 100 Q48 81 102 95 T220 91 V112 H0" fill="#edd19b" /></g>,
    mid: <g>
      {[[164, 80, 28], [132, 43, 53], [66, 34, 65]].map(([x, top, w], i) => <g key={x}>
        <path d={`M${x - w} 112 L${x} ${top} L${x + w} 112 Z`} fill="#dfae6a" />
        <path d={`M${x} ${top} L${x + w * 0.33} 112 H${x + w} Z`} fill="#c08e4d" />
        <path d={repeatPath(8, n => { const y = top + (112 - top) * (n + 1) / 9; const dx = w * (n + 1) / 9; return `M${(x - dx).toFixed(1)} ${y.toFixed(1)} h${(dx * 2).toFixed(1)}`; })} stroke="#b88c50" strokeWidth="0.7" opacity="0.7" />
        {i === 1 && <path d="M132 43 l-12 16 16 1 8 -1 Z" fill="#f1d7a2" />}
        <path d={`M${x - 10} 96 v5 m-14 1 v5 m40 -12 v6 m-3 -20 v5`} stroke="#b88c50" strokeWidth="0.7" />
      </g>)}
    </g>,
    front: <g>
      <path d="M0 117 Q50 108 99 116 T220 115 V140 H0" fill="#dfba78" />
      {[22, 44, 65].map((x, i) => <g key={x}><path d={`M${x - 13} 119 l13 ${-17 + i * 3} 13 ${17 - i * 3} Z`} fill="#e8c988" /><path d={`M${x} ${102 + i * 3} l4 ${17 - i * 3} h9 Z`} fill="#c49b5b" /></g>)}
      {/* Recumbent lion, projecting paws and human head of the Sphinx. */}
      <g transform="translate(122 111)">
        <path d="M-9 14 q-6 -15 9 -15 h19 q9 0 12 8 h17 v5 H17 l-7 4 Z" fill="#be9459" />
        <path d="M-9 13 h41 m-4 -4 h16" fill="none" stroke="#efd09a" strokeWidth="2" />
        <path d="M17 4 l-3 -14 3 -9 h13 l5 10 -5 13 Z" fill="#dfb577" />
        <path d="M20 -16 h8 v12 l-4 4 -4 -4 Z" fill="#ecc68a" />
        <path d="M21 -12 h2 m3 0 h2 M24 -11 v5 h3 M22 -3 h5 M16 -8 l4 2 m10 -2 4 -2" stroke="#aa814f" strokeWidth="1" fill="none" />
      </g>
      <Palm x={202} y={126} s={0.8} />
      <path d="M10 134 Q57 126 93 134 M147 136 h41" fill="none" stroke="#f1d6a1" strokeWidth="1.5" />
    </g>,
  },
  bigben: {
    skyTop: '#c9d9f2', skyBottom: '#f0e9f7', ground: '#9aa86e',
    back: <Clouds variant={2} />,
    mid: <g>
      <path d="M19 108 V79 h91 v29 Z M26 79 v-9 h13 v9 M90 79 v-12 h11 v12" fill="#b8a27c" />
      <path d="M19 78 h91 M21 94 h87 M21 104 h87" stroke="#dec796" strokeWidth="2" />
      <Arches x0={25} y={84} count={11} gap={7.5} w={3.5} h={15} fill="#8a7657" />
      <path d={repeatPath(12, i => `M${22 + i * 8} 104 V76 l2 -7 2 7`)} fill="#c9b183" />
      <path d="M121 110 V38 h29 v72 Z" fill="#c9b183" />
      <path d="M143 38 h7 v72 h-7 Z" fill="#b39a6b" />
      <path d="M120 37 h31 v5 h-31 Z M123 29 h25 v8 h-25 Z" fill="#b39a6b" />
      <path d="M123 29 l12 -22 13 22 Z" fill="#8a7657" />
      <path d="M126 26 l9 -16 9 16 Z" fill="#aa9474" />
      <path d="M120 38 V26 l2 -6 2 6 v12 M147 38 V26 l2 -6 2 6 v12" fill="#c9b183" />
      <Arches x0={126} y={30} count={3} gap={6} w={3} h={7} fill="#74644d" />
      <path d="M120 64 h31 v4 h-31 Z M120 108 h31 v4 h-31 Z" fill="#dec796" />
      <path d="M124 72 v29 m7 -29 v29 m8 -29 v29 m7 -29 v29" stroke="#9d865e" strokeWidth="3" />
      <path d="M122 70 h27 M122 104 h27 M123 42 v20 M148 42 v20" stroke="#eed8a9" strokeWidth="1.4" />
      <circle cx="135" cy="53" r="10" fill="#8a7657" /><circle cx="135" cy="53" r="8" fill="#fffbe8" />
      <path d="M135 47 v6 l5 3" fill="none" stroke="#5b4a3f" strokeWidth="1.6" strokeLinecap="round" /><circle cx="135" cy="53" r="1.1" fill="#5b4a3f" />
      <path d="M157 111 h63 V98 h-63" fill="#91b7c3" />
    </g>,
    front: <g><path d="M0 117 Q100 113 220 115 V140 H0" fill="#83aaba" />
      <path d="M0 112 H220 V117 H0 Z" fill="#8eac98" />
      <path d="M10 127 v-9 h210 v9 h-7 q-9 -17 -18 0 h-9 q-9 -17 -18 0 h-9 q-9 -17 -18 0 h-9 q-9 -17 -18 0 h-9 q-9 -17 -18 0 h-9 q-9 -17 -18 0 h-9 q-9 -17 -18 0 Z" fill="#799584" />
      <path d="M7 117 h213 M8 113 h212" stroke="#bac3a0" strokeWidth="1.4" />
      <path d={repeatPath(26, i => `M${10 + i * 8} 114 v3`)} stroke="#799584" />
      <g transform="translate(67 107)"><rect x="-15" y="-9" width="29" height="15" rx="2" fill="#c94f4f" /><path d="M-12 -6 h6 m2 0 h6 m2 0 h6 M-12 0 h6 m2 0 h6 m2 0 h6" stroke="#bdd2d8" strokeWidth="3" /><circle cx="-8" cy="6" r="2" fill="#5b4a3f" /><circle cx="8" cy="6" r="2" fill="#5b4a3f" /></g>
      <Ripples y={132} />
    </g>,
  },
  tajmahal: {
    skyTop: '#ffd3e0', skyBottom: '#fff3ea', ground: '#a9c9a0',
    back: <g><Clouds variant={1} /><path d="M26 30 q4 -4 8 0 q4 -4 8 0 M180 46 q4 -4 8 0 q4 -4 8 0" stroke="#c98a9c" strokeWidth="1.6" fill="none" opacity="0.8" /></g>,
    mid: <TajPalace />,
    front: <g>
      <path d="M95 112 h30 l26 28 H69 Z" fill="#e1d9c0" />
      <PoolReflection outline="M100 112 h20 l18 28 H82 Z" transform="translate(66 144) scale(.4 -.3)"><TajPalace /></PoolReflection>
      <path d="M96 123 h28 M90 132 h40" stroke="#d3e4dc" strokeWidth="1.2" /><CypressRows />
    </g>,
  },
  redeemer: {
    skyTop: '#ffd9a0', skyBottom: '#ffeedd', ground: '#6fae7f',
    back: <g><circle cx="180" cy="28" r="11" fill="#ffb703" opacity="0.85" /><Clouds variant={0} />
      <path d="M0 85 Q45 76 96 91 Q158 78 220 86 V112 H0" fill="#86b7bd" />
      <path d="M139 95 Q158 88 165 74 Q174 48 183 61 Q195 76 196 92 L220 101 V112 H138" fill="#8aa88d" />
      <path d="M0 107 q24 -33 55 -19 l16 20 55 4 H0" fill="#8db18a" />
      <path d="M145 100 q33 -11 59 0 M12 101 h28 M199 107 h16" fill="none" stroke="#e0dec0" strokeWidth="1.5" />
    </g>,
    mid: <g>
      <path d="M63 112 Q75 82 92 69 L108 65 Q125 70 136 87 L155 112 Z" fill="#7c9a6d" />
      <path d="M83 112 l18 -39 10 -6 8 5 -6 40 Z" fill="#9aa482" />
      <path d="M100 78 l-7 23 M117 83 l13 19" stroke="#607f61" strokeWidth="2" />
      <path d="M99 62 h22 v7 H99 Z M102 57 h16 v6 h-16 Z" fill="#cfcbb7" />
      {/* Broad sleeves taper into hands, shoulders and a separate human head. */}
      <path d="M105 23 q5 -4 10 0 l5 4 23 1 1 5 -24 3 -2 -1 5 22 H98 l5 -22 -3 1 -24 -3 1 -5 23 -1 Z" fill="#f2ecdf" />
      <path d="M77 28 l-7 -2 -2 2 2 3 7 1 M143 28 l7 -2 2 2 -2 3 -7 1" fill="#e8e2d0" />
      <path d="M106 22 l-1 -8 q5 -7 10 0 l-1 8 Z" fill="#f2ecdf" />
      <path d="M106 14 q4 -4 9 0 l-1 -5 -7 1 Z" fill="#c8c8b6" />
      <path d="M110 16 v4 h3 M105 29 l-3 23 6 -8 3 -18 3 29 5 2 -5 -29 M80 31 l21 2 m19 0 21 -2" fill="none" stroke="#c8c8b6" strokeWidth="1.2" />
      <path d="M110 47 v8" stroke="#dedaca" strokeWidth="2" />
    </g>,
    front: <g><path d="M0 126 Q40 108 75 121 T147 118 T220 121 V140 H0" fill="#639c71" /><Bushes xs={[33, 183]} fill="#4c8a5c" /><path d="M91 129 q21 -7 37 -1" stroke="#8bb583" strokeWidth="2" fill="none" /></g>,
  },
  opera: {
    skyTop: '#ffdf9e', skyBottom: '#fff3d9', ground: '#4f89b8',
    back: <g><circle cx="34" cy="30" r="11" fill="#ffb703" opacity="0.85" /><Clouds variant={0} />
      <path d="M7 85 Q52 32 107 81 M7 85 Q52 45 107 81" stroke="#8f9e9a" strokeWidth="3" fill="none" />
      <path d="M9 84 h107 M14 83 V62 M100 83 V63" stroke="#8f9e9a" strokeWidth="4" />
      <path d="M23 82 V67 M33 82 V58 M43 82 V54 M53 82 V53 M63 82 V55 M73 82 V61 M83 82 V67 M93 82 V75" stroke="#a4ada2" strokeWidth="1" />
      <path d="M0 98 h220 v14 H0" fill="#95b7be" />
    </g>,
    mid: <g>
      <path d="M31 104 l17 -9 125 1 19 9 v7 H31 Z" fill="#c5b08a" />
      <path d="M42 105 h137 M38 108 h148 M33 111 h157" stroke="#e1d0ab" strokeWidth="1.5" />
      <path d="M52 97 Q47 66 37 60 Q70 58 88 98 Z M102 98 Q103 57 90 43 Q124 47 141 98 Z M141 99 Q150 77 152 62 Q177 69 186 99 Z" fill="#d9d0ba" />
      {[[48, 99, 94, 44, 76], [81, 99, 135, 34, 113], [119, 99, 161, 59, 148], [152, 100, 189, 76, 177]].map(([x, y, tip, top, end]) => <g key={x}>
        <path d={`M${x} ${y} Q${x + 12} ${top + 2} ${tip} ${top} Q${end - 4} ${top + 22} ${end} ${y} Z`} fill="#fdfaf1" />
        <path d={`M${x + 5} ${y - 1} Q${x + 14} ${top + 14} ${tip} ${top} M${x + 14} ${y - 1} Q${x + 22} ${top + 12} ${tip} ${top} M${x + 22} ${y - 1} Q${tip - 15} ${top + 11} ${tip} ${top}`} fill="none" stroke="#d9d0ba" strokeWidth="0.8" />
      </g>)}
      <path d="M49 99 h128 v4 H49 Z" fill="#8d988c" /><path d={repeatPath(20, i => `M${52 + i * 6} 99 v4`)} stroke="#d8cdb4" />
    </g>,
    front: <g><path d="M0 112 h220 v28 H0" fill="#3f7aa8" /><Ripples />
      <g transform="translate(35 125)"><path d="M-11 0 h23 l-5 4 H-7 Z" fill="#d6baa0" /><path d="M0 -22 V0 h-10 Z M2 -17 V-2 h9 Z" fill="#fdfaf1" /><path d="M0 -23 V1" stroke="#b6a889" /></g>
    </g>,
  },
  stbasil: {
    skyTop: '#cfe3ff', skyBottom: '#f2ecff', ground: '#b0575c',
    back: <Clouds variant={2} />,
    mid: <g>
      {/* Eight patterned side chapels surround the ninth, tall tent chapel. */}
      <BasilChapel x={64} y={38} s={0.65} color="#d99443" pattern={0} />
      <BasilChapel x={149} y={36} s={0.65} color="#528e78" pattern={2} />
      <BasilChapel x={86} y={30} s={0.72} color="#739e75" pattern={1} />
      <BasilChapel x={129} y={27} s={0.72} color="#dba84d" pattern={0} />
      <path d="M97 99 V49 h26 v50 Z" fill="#b95e4e" />
      <path d="M94 52 L110 16 126 52 Z" fill="#dfaa73" /><path d="M110 19 v31 h12 Z" fill="#c17c50" />
      <path d="M102 40 h16 m-19 6 h22 M98 54 h24 M99 62 h22 M99 70 h22" stroke="#f1ddbe" strokeWidth="2" />
      <path d="M110 18 q-7 -4 0 -11 q7 7 0 11" fill="#dba84d" /><path d="M110 7 V3" stroke="#b99142" strokeWidth="1.5" />
      <path d="M106 75 V59 q4 -8 8 0 v16 Z" fill="#754f43" />
      <path d="M42 109 V86 Q110 69 178 86 v23 Z" fill="#b95e4e" />
      <BasilChapel x={46} y={52} s={0.85} color="#6b9e72" pattern={0} />
      <BasilChapel x={173} y={49} s={0.9} color="#cf6855" pattern={1} />
      <BasilChapel x={75} y={47} s={1} color="#c95454" pattern={0} />
      <BasilChapel x={141} y={45} s={1} color="#568e82" pattern={2} />
      <path d="M91 112 V97 Q110 75 128 97 v15 Z" fill="#e6c9a4" />
      <path d="M98 112 V99 Q110 83 121 99 v13 Z" fill="#b95e4e" /><path d="M105 112 V100 q5 -8 10 0 v12 Z" fill="#754f43" />
      <path d="M34 111 h152 v3 H34 Z M98 107 h24 m-26 4 h28" stroke="#efd9b9" strokeWidth="1.6" />
    </g>,
    front: <g><path d="M0 119 Q110 110 220 119 M0 129 Q110 116 220 129 M0 139 Q110 126 220 139" fill="none" stroke="#ca8580" strokeWidth="1" />
      <path d={repeatPath(14, i => `M${i * 17} 120 l-4 7 m12 0 3 9`)} stroke="#ca8580" strokeWidth="1" />
    </g>,
  },
  fuji: {
    skyTop: '#cfe8ff', skyBottom: '#ffe8ef', ground: '#8fbf8f',
    back: <Clouds variant={1} />,
    mid: <g>
      <path d="M30 110 Q67 74 119 25 Q166 74 212 110 Z" fill="#7d94b8" />
      <path d="M119 25 L115 110 H212 Q166 74 119 25" fill="#91a4c4" />
      <path d="M84 61 L119 25 154 60 144 58 146 68 133 57 135 78 123 56 118 66 113 53 100 68 103 56 91 67 94 57 Z" fill="#fffaf2" />
      <path d="M106 76 l-17 28 M126 73 l12 33 M152 79 l23 27" stroke="#acbad0" strokeWidth="1.6" />
      <path d="M0 109 l14 -10 9 4 10 -9 9 6 10 -7 10 9 12 -5 11 6 15 -4 16 7 17 -5 12 4 9 -5 16 6 20 -6 19 9 15 -7 v13 H0" fill="#679278" />
    </g>,
    front: <g>
      <path d="M69 113 h151 v27 H51 Z" fill="#99bfc8" />
      <path d="M87 113 h89 l-53 25 Z" fill="#7d94b8" opacity="0.4" /><path d="M111 127 l12 11 11 -11 -10 3 Z" fill="#edf0e5" opacity="0.7" /><Ripples y={120} />
      <path d="M0 113 q35 -9 69 2 l13 25 H0" fill="#799b70" />
      <g transform="translate(43 53)">
        <path d="M-6 0 h12 v61 h-12 Z" fill="#c94f4f" />
        {[0, 1, 2, 3, 4].map(i => <g key={i} transform={`translate(0 ${i * 11})`}>
          <path d={`M${-10 - i} 1 h${20 + i * 2} v8 h${-20 - i * 2} Z`} fill="#c94f4f" />
          <path d={`M${-16 - i * 2} 2 Q-7 0 0 -5 Q7 0 ${16 + i * 2} 2 Z`} fill="#5c6f70" />
          <path d={`M${-12 - i} 8 h${24 + i * 2} M-7 3 v5 M0 3 v5 M7 3 v5`} stroke="#f1d7bf" strokeWidth="1" />
        </g>)}
        <path d="M0 -6 V-22 M-3 -10 h6 m-6 -4 h6 m-5 -4 h4" stroke="#a58c62" strokeWidth="1.3" />
        <path d="M-23 59 h46 v4 h-46" fill="#c4bca3" />
      </g>
      <path d="M5 133 Q17 94 6 73 M11 101 l20 -17 M7 86 l-7 -9 M213 137 q-13 -22 -7 -38 l-15 -12" fill="none" stroke="#987767" strokeWidth="3" />
      {[[8, 75], [25, 84], [8, 94], [198, 94], [210, 107], [187, 88]].map(([x, y]) => <g key={`${x}-${y}`} fill="#e8a8bb"><circle cx={x} cy={y} r="7" /><circle cx={x - 6} cy={y + 2} r="5" /><circle cx={x + 5} cy={y - 3} r="5" /><circle cx={x + 2} cy={y + 2} r="3" fill="#f6cbd3" /></g>)}
    </g>,
  },
  windmill: {
    skyTop: '#bfe4ff', skyBottom: '#eef8ff', ground: '#79ab5e',
    back: <g><circle cx="188" cy="26" r="11" fill="#ffb703" opacity="0.85" /><Clouds variant={0} /><path d="M0 106 Q50 99 103 107 T220 104 V112 H0" fill="#9dbd83" /></g>,
    mid: <g><SmockMill x={167} y={94} s={0.42} /><SmockMill x={131} y={103} s={0.6} /><SmockMill x={63} y={113} s={1.05} /></g>,
    front: <g>
      <path d="M106 112 h16 l76 28 H57 Z" fill="#8fb7bf" /><path d="M106 113 L58 140 M123 113 l76 27" stroke="#c4ce94" strokeWidth="3" />
      <path d="M117 126 Q141 110 166 129" fill="none" stroke="#957c5d" strokeWidth="4" /><path d="M116 122 Q140 105 167 125 M119 121 v6 m8 -10 v6 m9 -9 v6 m9 -6 v6 m9 -4 v7 m9 -3 v6" fill="none" stroke="#bca077" strokeWidth="1.2" />
      {[0, 1, 2].map(row => <g key={row} transform={`translate(${-row * 6} ${118 + row * 7})`}>
        <path d="M8 4 h63" stroke="#608e51" strokeWidth="1" />
        {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${12 + i * 8} 4 v-3 m-2 -4 q2 3 4 0 v3 q-2 3 -4 0 Z`} fill={['#e85555', '#ffbf43', '#e692b4'][row]} />)}
      </g>)}
      <path d="M107 128 h17 M89 135 h28 M160 137 h12" stroke="#dcebf0" strokeWidth="1" />
    </g>,
  },
  chichen: {
    skyTop: '#aee1ff', skyBottom: '#eafff2', ground: '#7fb069',
    back: <g><Clouds variant={2} /><path d="M0 106 l9 -11 10 4 9 -12 10 9 10 -6 12 14 h99 l12 -13 10 8 11 -11 12 13 16 -9 v20 H0" fill="#6e9f67" /></g>,
    mid: <g>
      {/* Exactly nine terraces, the temple is separate from the stepped pyramid. */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = 34 + i * 6, y = 104 - i * 7;
        return <g key={i}>
          <path d={`M${x} ${y} h${152 - i * 12} v8 H${x} Z`} fill="#d3bb8b" />
          <path d={`M${x} ${y} h${152 - i * 12} v2 H${x} Z`} fill="#e4cea2" />
          <path d={`M${x + 6} ${y + 3} h${58 - i * 6} v3 H${x + 6} Z M122 ${y + 3} h${58 - i * 6} v3 H122 Z`} fill="#b79b6d" />
          <path d={`M${179 - i * 6} ${y + 2} h7 v6 h-7 Z`} fill="#bca173" />
        </g>;
      })}
      <path d="M91 48 V31 h38 v17 Z M88 30 h44 v4 H88 Z M93 26 h34 v4 H93 Z" fill="#d3bb8b" />
      <path d="M96 35 h8 v13 h-8 Z M110 35 h8 v13 h-8 Z M123 36 h3 v11 h-3 Z" fill="#7a6244" />
      <path d="M104 48 h12 l12 64 H92 Z" fill="#af9467" />
      <path d="M103 48 L89 112 h5 l13 -64 M117 48 l14 64 h-5 l-13 -64" fill="#ead3a4" />
      <path d={repeatPath(18, i => { const y = 50 + i * 3.4; const w = 8 + i; return `M${110 - w / 2} ${y.toFixed(1)} h${w}`; })} stroke="#e3cba0" strokeWidth="1" />
    </g>,
    front: <g><Bushes xs={[15, 204]} fill="#4c8a4a" />
      {[91, 129].map((x, i) => <g key={x} transform={`translate(${x} 112) scale(${i ? -1 : 1} 1)`}>
        <path d="M-4 -2 h7 l3 5 -2 5 H-8 V3 Z" fill="#c8ad7b" /><path d="M-8 4 H4 v2 H-8 Z" fill="#88704d" /><circle cx="-2" cy="1" r="1.2" fill="#796245" /><path d="M-10 8 h16 v2 h-16" fill="#dfc99b" />
      </g>)}
      <path d="M67 128 h17 m42 0 h15 m-41 6 h18" stroke="#9cba76" strokeWidth="2" />
    </g>,
  },
  machu: {
    skyTop: '#cfe8e0', skyBottom: '#f2fff6', ground: '#5f9b6f',
    back: <g>
      <path d="M0 104 L42 52 66 72 99 35 128 69 167 37 220 87 V112 H0" fill="#a4c6ab" />
      <path d="M113 112 Q130 46 154 23 L166 17 Q182 28 194 112 Z" fill="#6fae7f" />
      <path d="M136 96 Q149 50 163 24 L156 68 170 94 Z" fill="#88c295" /><path d="M166 22 l9 41 -8 27 11 22 h16 Q182 28 166 22" fill="#5d9873" />
      <Clouds variant={0} /><g fill="#e3efe0" opacity="0.8"><ellipse cx="39" cy="97" rx="34" ry="7" /><ellipse cx="193" cy="95" rx="28" ry="6" /></g>
    </g>,
    mid: <g>
      <path d="M14 112 L40 87 78 70 98 62 124 70 146 112 Z" fill="#7fb977" />
      {Array.from({ length: 6 }, (_, i) => <g key={i}>
        <path d={`M${22 + i * 7} ${111 - i * 6} l${53 - i * 5} -17 ${62 - i * 7} 15`} stroke="#a5a17e" strokeWidth="4" fill="none" />
        <path d={`M${22 + i * 7} ${109 - i * 6} l${53 - i * 5} -17 ${62 - i * 7} 15`} stroke="#a7c785" strokeWidth="2" fill="none" />
      </g>)}
      {[[57, 75], [83, 69], [105, 77], [77, 90], [109, 99], [39, 95]].map(([x, y]) => <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
        <path d="M-9 0 l14 -3 11 5 v10 L5 8 -9 11 Z" fill="#cfc5ad" /><path d="M5 -3 l11 5 v10 L5 8 Z" fill="#a99f85" />
        <path d="M-6 8 l1 -6 h4 l1 5 Z M8 7 l1 -5 3 1 1 6 Z" fill="#6f7760" />
        <path d="M-9 5 l14 -3 M-5 0 v4 M1 7 v2 M7 0 l8 3" fill="none" stroke="#b4aa90" strokeWidth="0.7" />
      </g>)}
    </g>,
    front: <g><path d="M0 132 l36 -14 74 9 56 -16 54 14 v15 H0" fill="#729d70" />
      <path d="M26 124 l35 -12 43 9 M36 134 l28 -10 36 7" fill="none" stroke="#a5a17e" strokeWidth="3" />
      <g transform="translate(172 117)"><path d="M-10 -6 q9 -5 17 0 l3 -13 5 -1 1 5 -4 2 -1 14 H7 L4 -2 H-4 L-6 4 h-3 v-9 l-5 -2 Z" fill="#e6dcc4" /><path d="M11 -19 l-1 -6 3 2 2 -3 1 7" fill="#e6dcc4" /><circle cx="14" cy="-17" r="0.8" fill="#706852" /><path d="M-6 2 v6 M7 0 v8" stroke="#bcae94" strokeWidth="2" /></g>
      <path d="M13 124 v-6 m4 7 v-8 m189 8 v-6 m4 8 v-8" stroke="#48744a" strokeWidth="2" />
    </g>,
  },
  petra: {
    skyTop: '#ffd9a0', skyBottom: '#ffe9cf', ground: '#c98a5e',
    back: <g><path d="M39 0 h148 l-3 112 H36 Z" fill="#d69b78" /><path d="M51 10 l26 13 78 -9 22 7 M43 42 l27 -7 85 9 25 -10 M47 92 l22 4 100 -5" stroke="#e3b18a" strokeWidth="2" fill="none" /></g>,
    mid: <g>
      <path d="M67 112 V25 h88 v87 Z" fill="#c98563" /><path d="M76 109 V71 h68 v38 Z M80 56 V40 h60 v16 Z" fill="#a96449" />
      <path d="M66 108 h91 v4 H66 Z M69 104 h85 v4 H69 Z M69 65 h84 v6 H69 Z" fill="#e6aa81" />
      <path d="M72 64 L109 51 150 64 Z" fill="#e1a078" /><path d="M82 62 l27 -8 29 8 Z" fill="#bc7857" />
      <Columns x={75} y={73} count={6} gap={13} h={29} w={4} fill="#e1a078" shade="#b57556" />
      <path d="M103 104 V79 h15 v25 Z" fill="#834e3b" /><path d="M100 78 h21 v3 h-21" fill="#c58a68" />
      <path d="M75 52 V33 h20 v19 M128 52 V33 h19 v19" fill="#bc7857" />
      <Columns x={77} y={34} count={2} gap={13} h={18} w={3} fill="#e1a078" shade="#b57556" /><Columns x={129} y={34} count={2} gap={13} h={18} w={3} fill="#e1a078" shade="#b57556" />
      <path d="M72 31 L99 20 v5 L79 33 Z M150 31 L123 20 v5 l20 8 Z" fill="#efb88e" />
      {/* Round tholos, conical roof and urn, framed by broken half-pediments. */}
      <ellipse cx="111" cy="51" rx="12" ry="3" fill="#e6aa81" /><path d="M100 31 h22 v20 h-22 Z" fill="#ba7354" />
      <Columns x={101} y={32} count={3} gap={8} h={17} w={3} fill="#e6aa81" shade="#b57556" />
      <ellipse cx="111" cy="31" rx="13" ry="2.5" fill="#e6aa81" /><path d="M98 29 l13 -13 13 13 Z" fill="#e1a078" />
      <path d="M108 16 v-3 q-5 -7 3 -8 q8 1 3 8 v3 Z" fill="#b57556" /><path d="M108 5 h6 M107 16 h8" stroke="#efb88e" strokeWidth="1.5" />
      <path d="M73 57 h77 M69 68 h84" stroke="#b57556" strokeWidth="1" />
    </g>,
    front: <g>
      <path d="M0 0 h45 l9 29 -7 25 10 25 -8 30 7 31 H0 Z M220 0 h-43 l-6 30 5 28 -10 23 3 28 -7 31 h58 Z" fill="#a35f43" />
      <path d="M36 0 l7 30 -7 25 11 24 -10 36 -1 25 H22 l6 -45 -7 -20 5 -44 -7 -31 M186 0 l-4 39 6 24 -11 33 2 44 h15 l-3 -35 9 -42 -7 -28 6 -35" fill="#b57556" />
      <path d="M8 37 l19 8 M1 78 l18 -6 M190 30 l21 -6 M192 92 l28 -7 M65 121 l43 -5 47 3" fill="none" stroke="#c38a65" strokeWidth="2" />
      <path d="M76 130 q34 -11 67 -5" fill="none" stroke="#e3ab7b" strokeWidth="2" />
    </g>,
  },
  burj: {
    skyTop: '#ffe3b3', skyBottom: '#d9f2ff', ground: '#d8c48f',
    back: <g><Clouds variant={1} /><Skyline fill="#9fb8c9" /><path d="M0 108 q38 -14 77 4 h68 q39 -15 75 -4 v4 H0" fill="#dfc697" /></g>,
    mid: <g>
      {/* Staggered wings around a narrow core suggest the spiralling Y-plan setbacks. */}
      <path d="M108 112 V26 h6 v86 Z" fill="#cde3f2" />
      <path d="M91 112 V91 h5 V72 h5 V54 h5 V36 h5 v76 Z" fill="#aac8dd" />
      <path d="M113 112 V42 h5 V61 h5 V82 h5 v30 Z" fill="#8baec5" />
      <path d="M103 112 V67 h5 V47 h4 v65 Z" fill="#cde3f2" />
      <path d="M113 25 V9 h-2 v17 M112 9 V3" stroke="#8aa8bd" strokeWidth="1.5" />
      <path d={repeatPath(25, i => { const y = 36 + i * 3; const left = y < 54 ? 106 : y < 72 ? 101 : y < 91 ? 96 : 91; const right = y < 42 ? 114 : y < 61 ? 118 : y < 82 ? 123 : 128; return `M${left} ${y} H${right}`; })} stroke="#769bb6" strokeWidth="0.65" />
      <path d="M109 30 v78 M104 58 v50 M98 77 v31 M119 67 v41" stroke="#e1eef3" strokeWidth="1.2" />
      <path d="M94 106 l6 -12 v9 l-6 5 M108 62 l5 -7 v17 l-5 9 M117 83 l5 -7 v9 l-5 7" fill="#edf5f6" opacity="0.7" />
      <path d="M87 112 h45 v-3 H87 Z" fill="#bcd6e8" />
    </g>,
    front: <g><path d="M0 124 q55 -8 109 0 t111 -1 v17 H0" fill="#e5cfa0" /><path d="M55 118 q51 -5 99 0 l-11 8 H68 Z" fill="#9ac3cf" /><path d="M69 121 h65" stroke="#d8e4d8" /><Palm x={32} y={126} s={0.95} /><Palm x={191} y={118} s={0.65} /></g>,
  },
  hagia: {
    skyTop: '#cfe3ff', skyBottom: '#ffeede', ground: '#a9917a',
    back: <g><Clouds variant={0} /><path d="M0 102 q40 -9 83 0 h137 v10 H0" fill="#a4bdc4" /><path d="M7 105 h22 m147 2 h31" stroke="#e7e7d3" /></g>,
    mid: <g>
      {[[48, 41, 0.8], [169, 39, 0.8], [30, 30, 1], [190, 30, 1]].map(([x, y, s]) => <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
        <path d="M-3 8 h6 v74 h-6 Z" fill="#e0c8b0" /><path d="M1 8 h2 v74 H1" fill="#c6ac91" />
        <path d="M-5 8 L0 -10 5 8 Z" fill="#8a6a52" /><path d="M-5 34 h10 v3 H-5 Z M-5 54 h10 v3 H-5 Z" fill="#bda48a" />
        <path d="M-5 32 h10 M-5 52 h10" stroke="#f0ddbe" strokeWidth="1" />
      </g>)}
      <path d="M57 112 V84 h106 v28 Z M75 85 V67 h70 v18 Z" fill="#d9a08a" />
      <path d="M72 72 a38 30 0 0 1 76 0 Z" fill="#b98a78" />
      <path d="M78 67 Q83 47 110 42 Q137 47 142 67 M91 66 Q96 45 110 42 Q124 45 130 66 M106 66 l4 -24 5 24" fill="none" stroke="#d4ad93" strokeWidth="1.1" />
      <path d="M74 68 h72 v9 H74" fill="#d9a08a" /><Arches x0={78} y={69} count={10} gap={6.5} w={3} h={6} fill="#87634f" />
      <path d="M48 92 a25 19 0 0 1 50 0 Z M122 92 a25 19 0 0 1 50 0 Z" fill="#c98a74" />
      <path d="M54 89 q18 -24 38 0 M61 89 q13 -24 23 0 M128 89 q18 -24 38 0 M135 89 q13 -24 23 0" fill="none" stroke="#dda68a" strokeWidth="1" />
      <Arches x0={67} y={95} count={6} gap={16} w={6} h={13} fill="#8a5a48" />
      {[56, 87, 126, 157].map(x => <path key={x} d={`M${x} 112 V84 h7 l4 28 Z`} fill="#c39178" />)}
      <path d="M95 112 V88 h30 v24 Z" fill="#d9a08a" /><Arches x0={106} y={95} count={1} gap={0} w={9} h={17} fill="#8a5a48" />
      <path d="M55 110 h110 M95 88 h30 M75 78 h70 M110 42 V35" stroke="#edbea1" strokeWidth="2" />
    </g>,
    front: <g><path d="M86 112 h48 l24 28 H62 Z" fill="#c7b499" /><path d="M84 122 h53 m-60 9 h69" stroke="#d6c8ad" strokeWidth="1.5" /><Bushes xs={[18, 203]} fill="#7d9450" /></g>,
  },
  brandenburg: {
    skyTop: '#cfe3ff', skyBottom: '#fff3dd', ground: '#9aa86e',
    back: <Clouds variant={2} />,
    mid: <g>
      <path d="M16 111 V76 h29 v35 M176 111 V76 h29 v35" fill="#dbd2b3" />
      <path d="M12 73 h37 v5 H12 Z M172 73 h37 v5 h-37 Z" fill="#c2b892" />
      <Columns x={21} y={81} count={3} gap={9} h={29} w={4} /><Columns x={179} y={81} count={3} gap={9} h={29} w={4} />
      {/* Six offset rear columns plus six front columns form the twelve Doric columns. */}
      <Columns x={51} y={64} count={6} gap={24} h={44} w={6} fill="#b4ab89" shade="#a09777" />
      <Columns x={47} y={63} count={6} gap={24} h={47} w={7} fill="#dbd2b3" shade="#bcb18f" />
      <path d="M40 53 h142 v11 H40 Z M45 43 h132 v11 H45 Z M40 39 h142 v5 H40 Z" fill="#dbd2b3" />
      <path d="M40 54 h142 v3 H40 Z M40 62 h142 v3 H40 Z" fill="#bfb58f" />
      <path d={repeatPath(23, i => `M${44 + i * 6} 57 v5`)} stroke="#aaa080" strokeWidth="1.5" />
      <path d="M52 47 h116 v4 H52 Z" fill="#c6bd9c" />
      <path d={repeatPath(14, i => `M${56 + i * 8} 50 l3 -3 3 3`)} fill="none" stroke="#e9dfbe" strokeWidth="1" />
      <path d="M92 37 h39 v3 H92 Z" fill="#a79d7b" />
      <g fill="#668777" stroke="#668777" strokeWidth="1" strokeLinecap="round">
        {/* Four discrete horse bodies, arched necks, heads and legs; central chariot. */}
        {[95, 104, 118, 127].map((x, i) => <g key={x} transform={`translate(${x} ${i % 2 ? 0 : 2})`}>
          <path d="M-3 31 q-3 -9 1 -13 l4 1 1 6 -2 4 1 6 h-2 l-1 -5 -2 5 h-2 Z M-2 19 l-1 -4 3 2 2 -1 2 2 -1 3 Z" stroke="none" />
          <path d="M-2 27 l-4 -2 -1 5" fill="none" />
        </g>)}
        <path d="M106 29 h10 l-2 6 h-7 Z" /><circle cx="108" cy="35" r="2.5" fill="none" /><circle cx="115" cy="35" r="2.5" fill="none" />
        <path d="M109 28 l1 -9 h3 l2 9 Z" stroke="none" /><circle cx="111" cy="16" r="2.3" stroke="none" />
        <path d="M114 22 l7 -6 M121 16 V7 M117 8 l4 -3 4 3 -4 1 Z M108 23 l-9 2 M114 24 l13 1" fill="none" />
      </g>
      <path d="M39 111 h144" stroke="#ede3c3" strokeWidth="3" />
    </g>,
    front: <g><path d="M20 112 h180 l20 28 H0 Z" fill="#c6c3a1" /><path d="M12 123 h196 M0 136 h220 M60 112 l-7 28 M110 112 v28 M160 112 l7 28" stroke="#ddd6b8" strokeWidth="1" /><Bushes xs={[8, 212]} fill="#728246" /></g>,
  },
  sagrada: {
    skyTop: '#ffd9c9', skyBottom: '#fff0e0', ground: '#b9a06c',
    back: <g><circle cx="34" cy="28" r="11" fill="#ffb703" opacity="0.8" /><Clouds variant={1} />
      <path d="M172 109 V22 h3 v87 M144 23 h61 M173 14 v9 M145 23 l28 -9 28 9 M199 23 v31 l-2 3" fill="none" stroke="#a99b80" strokeWidth="1.2" /><path d="M171 30 h6 m-6 9 h6 m-6 9 h6 m-6 9 h6 m-6 9 h6" stroke="#a99b80" />
    </g>,
    mid: <g>
      {[[97, 24, 0.7], [127, 21, 0.7], [70, 39, 1], [91, 23, 1], [122, 18, 1], [145, 35, 1]].map(([x, top, s]) => <g key={`${x}-${top}`}>
        <path d={`M${x - 7 * s} 100 L${x - 5 * s} ${top + 17} Q${x - 4} ${top + 7} ${x} ${top} Q${x + 4} ${top + 7} ${x + 5 * s} ${top + 17} L${x + 7 * s} 100 Z`} fill={s < 1 ? '#d9b98a' : '#c9a06c'} />
        <path d={repeatPath(8, i => `M${x - 2} ${top + 16 + i * (80 - top) / 8} h4 v3 h-4 Z`)} fill="#8e744e" />
        <path d={`M${x - 4} ${top + 13} L${x - 5} 95 M${x + 4} ${top + 13} L${x + 5} 95`} stroke="#ebc99a" strokeWidth="1" />
        <g fill={x % 2 ? '#d78b63' : '#a1ab66'}><circle cx={x} cy={top - 3} r="3" /><circle cx={x - 2} cy={top - 6} r="2" /><circle cx={x + 2} cy={top - 6} r="2" /><circle cx={x} cy={top - 9} r="2" /></g>
      </g>)}
      <path d="M58 112 V93 l9 -10 10 5 11 -16 12 9 10 -23 12 23 11 -9 9 16 10 -5 10 10 v19 Z" fill="#b98d5c" />
      <path d="M65 110 V97 l10 -8 10 8 v13 M92 110 V93 l18 -22 17 22 v17 M134 110 V97 l10 -8 11 8 v13" fill="#d4af7d" />
      <path d="M69 112 V101 q6 -16 12 0 v11 M100 112 V99 q10 -23 20 0 v13 M138 112 V101 q6 -16 12 0 v11" fill="#7a5c3a" />
      <path d="M64 96 l10 -12 11 8 13 -18 M125 77 l10 15 10 -8 12 12 M87 111 l3 -21 M131 111 l-2 -21" stroke="#e3bd89" strokeWidth="1.5" fill="none" />
      <path d={repeatPath(7, i => `M${66 + i * 13} ${96 - i % 3 * 7} l2 -3 2 3 -2 4 Z`)} fill="#edc998" />
      <path d="M109 88 l-3 5 3 5 3 -5 Z M93 102 l-3 4 3 4 M126 102 l3 4 -3 4" fill="#b98d5c" />
    </g>,
    front: <g><path d="M75 112 h75 l20 28 H55 Z" fill="#d0b78a" /><Pines xs={[26, 42, 180, 197]} y={119} s={0.85} /><path d="M82 122 h60 m-66 8 h72" stroke="#e3cba2" /></g>,
  },
  cntower: {
    skyTop: '#cfe8ff', skyBottom: '#eef8ff', ground: '#7fa8c9',
    back: <g><Clouds variant={0} /><Skyline /></g>,
    mid: <g>
      <path d="M22 108 a35 21 0 0 1 70 0 Z" fill="#dfe8ee" /><ellipse cx="57" cy="108" rx="35" ry="4" fill="#aebfcb" />
      <path d="M28 104 Q57 81 85 104 M39 103 Q57 79 75 103 M51 102 Q57 82 63 102" fill="none" stroke="#bdcbd3" strokeWidth="1" />
      <path d="M101 112 L108 48 h5 l7 64 Z" fill="#c9d2d9" /><path d="M110 49 h3 l7 63 h-9 Z" fill="#aebfcb" /><path d="M108 58 l-3 51" stroke="#eef2f1" strokeWidth="1.5" />
      <path d="M106 45 V18 h8 v27 Z" fill="#c9d2d9" />
      <ellipse cx="110" cy="44" rx="17" ry="7" fill="#aebfcb" /><path d="M93 39 h34 v6 q-17 7 -34 0 Z" fill="#84a5ba" />
      <ellipse cx="110" cy="39" rx="17" ry="5" fill="#dfe8ee" />
      <path d="M97 42 v4 m5 -3 v5 m5 -4 v5 m6 -5 v5 m5 -6 v5 m5 -6 v4" stroke="#dfe8ee" strokeWidth="0.7" />
      <ellipse cx="110" cy="23" rx="6" ry="2.5" fill="#91aaba" /><ellipse cx="110" cy="21" rx="6" ry="2" fill="#dfe8ee" />
      <path d="M109 20 V6 h3 v14 Z" fill="#b6c7d0" /><path d="M110 6 V1" stroke="#91aaba" strokeWidth="1.5" /><path d="M109 9 h3 m-3 4 h3" stroke="#d0a095" />
      <path d="M136 112 V100 h22 v12 M165 112 V92 h18 v20" fill="#9fb8c9" />
    </g>,
    front: <g><path d="M0 112 h220 v6 H0" fill="#c3c4a8" /><path d="M0 118 h220 v22 H0" fill="#7fa8c9" /><Ripples /><path d="M26 126 h19 l-5 4 H30 Z M182 132 h15 l-4 3 h-7 Z" fill="#e8734a" /><path d="M33 125 v-4 h5 v4" fill="#eee6cd" /></g>,
  },
  moai: {
    skyTop: '#ffd9a0', skyBottom: '#ffeedd', ground: '#6fae7f',
    back: <g><circle cx="40" cy="30" r="12" fill="#ff9f1c" opacity="0.85" /><Clouds variant={1} /><path d="M0 77 h220 v35 H0" fill="#7bafb9" /><path d="M0 89 q22 -5 43 0 t44 0 t44 0 t44 0 t45 0 M0 99 q22 -5 43 0 t44 0 t44 0 t44 0 t45 0" fill="none" stroke="#e1eddf" strokeWidth="2" /></g>,
    mid: <g>
      {[ [32, 0.6, 0], [68, 0.86, 1], [111, 1, 0], [156, 0.86, 1], [190, 0.6, 0] ].map(([x, s, hat]) => <g key={x} transform={`translate(${x} 105) scale(${s})`}>
        <path d="M-15 0 l2 -23 3 -3 V-57 q0 -10 13 -10 q13 0 13 10 v29 l4 5 1 23 Z" fill="#8a8d87" />
        <path d="M5 -66 q11 1 11 9 v29 l4 5 1 23 H7 l-2 -29 Z" fill="#747b75" />
        <path d="M-11 -50 l10 -4 14 4 -1 5 -10 -2 -10 3 Z" fill="#656d66" />
        <path d="M-1 -47 l-4 20 h10 l-2 -20 Z" fill="#a2a396" />
        <path d="M-7 -21 l13 -1 -1 3 -11 1 Z M-8 -14 l12 1 -1 3 -8 -1 Z" fill="#656d66" />
        <path d="M-10 -37 v-9 M14 -37 v-9 M-10 -20 l-2 14 8 2 M14 -20 l2 14 -8 2" stroke="#a2a396" strokeWidth="1.5" fill="none" />
        {hat === 1 && <g><path d="M-13 -64 v-14 q13 -5 27 0 v14 Z" fill="#aa6651" /><ellipse cx="0.5" cy="-78" rx="13.5" ry="3" fill="#c38264" /><path d="M-2 -78 v-5 h7 v5" fill="#aa6651" /></g>}
      </g>)}
      <path d="M15 105 h190 l8 7 H8 Z" fill="#aaa38a" />
    </g>,
    front: <g><path d="M8 112 h205 v8 H8 Z" fill="#868875" /><path d="M10 116 h201 M28 112 v4 m24 0 v4 m25 -8 v4 m25 0 v4 m25 -8 v4 m25 0 v4 m25 -8 v4 m25 0 v4" stroke="#b7b099" strokeWidth="1" />
      <path d="M0 132 Q50 121 110 128 T220 126 V140 H0" fill="#83b17c" /><path d="M25 130 v-6 m4 6 v-4 m149 8 v-6 m4 6 v-4" stroke="#48744a" strokeWidth="2" /></g>,
  },
  angkor: {
    skyTop: '#ffd9a0', skyBottom: '#ffeccf', ground: '#6fae7f',
    back: <g><circle cx="110" cy="40" r="24" fill="#ffcf8a" opacity="0.55" /><Clouds variant={2} /><path d="M0 104 q32 -20 65 -4 h95 q34 -16 60 2 v10 H0" fill="#91b384" /></g>,
    mid: <g><AngkorTemple /><Palm x={22} y={111} s={0.85} /><Palm x={196} y={111} s={0.95} /></g>,
    front: <g><PoolReflection outline="M30 114 h160 l23 26 H7 Z" transform="translate(33 146) scale(.7 -.29)"><AngkorTemple /></PoolReflection>
      <path d="M102 112 h16 l12 28 H90 Z" fill="#c3ad80" /><path d="M102 114 l-12 26 M118 114 l12 26" stroke="#e0c797" strokeWidth="2" /><path d="M100 124 h20 m-22 8 h24" stroke="#a99169" />
      <path d="M28 126 h40 m77 4 h42 M43 135 h37 m63 1 h25" stroke="#c6e0d7" strokeWidth="1" /><Bushes xs={[7, 213]} fill="#4c8a4a" /></g>,
  },
  matterhorn: {
    skyTop: '#bfe4ff', skyBottom: '#eef8ff', ground: '#7fb069',
    back: <g><Clouds variant={0} /><path d="M127 112 L169 62 209 112 Z" fill="#a4b6ce" /><path d="M158 76 l11 -14 14 18 -11 -4 -6 4 Z" fill="#eef3f2" /></g>,
    mid: <g>
      <path d="M30 112 L72 68 105 22 122 51 136 65 146 92 166 112 Z" fill="#7d94b8" />
      <path d="M105 22 L111 63 98 112 H30 L72 68 Z" fill="#a1b2c9" />
      <path d="M105 22 L122 51 136 65 146 92 166 112 H119 L111 63 Z" fill="#6e86a7" />
      <path d="M105 22 L122 51 114 46 119 62 109 51 103 72 97 59 77 78 94 53 89 56 Z" fill="#f8faf4" />
      <path d="M104 65 l-15 27 -17 12 14 -24 M119 70 l7 20 14 10 -12 -5 M70 82 l-9 19 -15 9" fill="#e0e9ed" />
      <path d="M108 67 l-5 26 -5 16 M125 61 l6 20 14 20 M81 74 l-12 15 M70 96 l-13 13" fill="none" stroke="#576f90" strokeWidth="1.2" />
      <path d="M0 111 q48 -13 90 0 t130 -3 v4 H0" fill="#83a67a" />
    </g>,
    front: <g><path d="M0 127 q43 -15 86 -5 t134 2 v16 H0" fill="#93b879" />
      {[[43, 117, 1], [83, 124, 0.7], [143, 118, 0.75]].map(([x, y, s]) => <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
        <path d="M-13 -17 h26 V0 h-26 Z" fill="#ab825c" /><path d="M-17 -17 L0 -29 17 -17 Z" fill="#6d5948" /><path d="M-17 -17 L0 -29 17 -17 l-5 -1 -12 -7 -12 7 Z" fill="#ede7d5" />
        <path d="M-13 -7 h26 M-10 -4 h20 M-10 -8 v5 m5 -5 v5 m5 -5 v5 m5 -5 v5 m5 -5 v5" stroke="#765e46" strokeWidth="1" />
        <path d="M-8 -14 h4 v4 h-4 Z M4 -14 h4 v4 H4 Z M-2 -5 h4 v5 h-4 Z" fill="#e8d8a5" /><path d="M7 -25 v-7 h4 v10" fill="#977456" />
      </g>)}
      <Pines xs={[12, 24, 181, 201]} y={123} s={0.9} /><path d="M70 140 l33 -13 13 -1" fill="none" stroke="#d8c89b" strokeWidth="3" />
      <path d="M30 131 h2 m12 4 h2 m79 -3 h2 m27 4 h2 m18 -9 h2" stroke="#f4d078" strokeWidth="2" />
    </g>,
  },
};

/** Local IDs keep reflections clipped to water, even with multiple instances in a quiz/sheet. */
function PoolReflection({ outline, transform, children }: { outline: string; transform: string; children: ReactNode }) {
  const id = `lm-water-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return <g>
    <defs><clipPath id={id}><path d={outline} /></clipPath></defs>
    <path d={outline} fill="#8fc4d0" />
    <g clipPath={`url(#${id})`}><g transform={transform} opacity="0.32">{children}</g></g>
  </g>;
}

/** Shared silhouette also renders as a compressed, translucent pool reflection. */
function TajPalace() {
  return <g>
    {[60, 160, 37, 183].map((x, i) => <g key={x} transform={`translate(${x} ${i < 2 ? 12 : 0})`}>
      <path d="M-3 48 h6 l1 56 h-8 Z" fill="#f2ecdf" /><path d="M1 49 h2 l1 55 H1 Z" fill="#dcd2bd" />
      <path d="M-5 66 h10 v2 H-5 Z M-5 86 h10 v2 H-5 Z M-5 49 h10 v2 H-5 Z" fill="#d3c8b0" />
      <path d="M-4 47 v-6 q4 -10 8 0 v6 Z" fill="#f6f1e7" /><path d="M-1 41 h2 v6 h-2 Z" fill="#b9af99" /><path d="M0 36 v-5" stroke="#c9b183" strokeWidth="1" />
    </g>)}
    <path d="M48 103 h124 v8 H48 Z M63 73 h94 v30 H63 Z" fill="#f6f1e7" />
    <path d="M64 76 h20 v27 H64 Z M136 76 h20 v27 h-20 Z" fill="#efe8da" />
    <path d="M94 66 V56 h32 v10 Z" fill="#e6ddc8" />
    <path d="M110 22 C104 34 88 35 90 48 Q90 59 110 59 Q130 59 130 48 C132 35 116 34 110 22 Z" fill="#f6f1e7" />
    <path d="M110 25 Q127 44 122 52 l-7 6 Q130 58 130 48 Q130 35 110 25" fill="#e6ddc8" />
    <path d="M110 22 V14 m-3 4 h6" stroke="#c9b183" strokeWidth="1.2" />
    <path d="M88 103 V65 h44 v38 Z" fill="#f6f1e7" /><path d="M95 103 V80 Q98 74 110 68 Q122 74 125 80 V103 Z" fill="#d8ccb4" />
    <path d="M101 103 V84 Q104 78 110 75 Q116 78 119 84 V103 Z" fill="#b9ad94" />
    <path d="M91 67 h38 v36 M91 67 v36" stroke="#d8ccb4" strokeWidth="1" fill="none" />
    {[73, 147].map(x => <g key={x}><path d={`M${x - 8} 73 V63 h16 v10 Z`} fill="#f6f1e7" /><path d={`M${x - 9} 62 Q${x - 8} 54 ${x} 51 Q${x + 8} 54 ${x + 9} 62 Z`} fill="#f6f1e7" /><path d={`M${x - 4} 65 v7 m8 -7 v7`} stroke="#cbbf9f" strokeWidth="2" /><path d={`M${x} 52 v-5`} stroke="#c9b183" /></g>)}
    {[69, 79, 139, 149].map(x => <g key={x}><path d={`M${x} 87 v-6 l3 -4 3 4 v6 Z M${x} 99 v-6 l3 -4 3 4 v6 Z`} fill="#d8ccb4" /></g>)}
    <path d="M49 106 h122 M94 62 h32" stroke="#d8ccb4" strokeWidth="1.5" />
  </g>;
}

function BasilChapel({ x, y, s, color, pattern }: { x: number; y: number; s: number; color: string; pattern: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-9 24 h18 v33 H-9 Z" fill="#b95e4e" /><path d="M-7 29 h14 v5 H-7 Z M-8 48 h16 v3 H-8 Z M-10 55 h20 v3 h-20 Z" fill="#efd9b9" />
    <path d="M-8 29 q1 -7 8 -10 q7 3 8 10 M-5 28 q0 -5 5 -7 q5 2 5 7" fill="none" stroke="#efd9b9" strokeWidth="1.5" />
    <path d="M-3 45 V37 q3 -5 6 0 v8 Z" fill="#754f43" />
    <path d="M0 0 C-3 6 -13 8 -11 17 Q-10 25 0 25 Q10 25 11 17 C13 8 3 6 0 0 Z" fill={color} />
    {pattern === 0 ? <path d="M0 2 Q7 10 -8 21 M5 7 Q13 14 -1 25 M-5 7 Q2 10 -10 16" stroke="#f1d99f" strokeWidth="2.5" fill="none" /> : pattern === 1 ? <path d="M-8 9 l5 4 4 -5 5 5 3 -3 M-10 17 l5 4 5 -5 5 5 5 -4" stroke="#f1d99f" strokeWidth="2" fill="none" /> : <path d="M0 5 l3 4 -3 4 -3 -4 Z M-6 12 l3 4 -3 4 -3 -4 Z M6 12 l3 4 -3 4 -3 -4 Z M0 18 l3 4 -3 3 -3 -3 Z" fill="#f1d99f" />}
    <path d="M0 0 V-5" stroke="#b99142" strokeWidth="1.5" /><circle cy="-5" r="1.2" fill="#dba84d" />
    <path d="M-7 53 h3 m8 -19 h3 m-12 13 h3 m8 6 h3" stroke="#d78768" strokeWidth="1" />
  </g>;
}

function SmockMill({ x, y, s }: { x: number; y: number; s: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-12 -54 h24 L21 0 H-21 Z" fill="#a1865e" /><path d="M3 -54 h9 L21 0 H6 Z" fill="#806a4f" />
    <path d="M-15 -54 Q0 -77 15 -54 Z" fill="#655644" />
    <path d="M-11 -49 l-7 41 M-6 -48 l-5 40 M0 -48 v40 M8 -48 l5 39" stroke="#c0a37a" strokeWidth="1" />
    <path d="M-24 -18 h48 v4 h-48 Z M-23 -26 h46 M-22 -26 v8 m7 -8 v8 m7 -8 v8 m8 -8 v8 m8 -8 v8 m7 -8 v8 m7 -8 v8" fill="#e5d9bd" stroke="#e5d9bd" strokeWidth="1" />
    <path d="M-4 0 v-11 q4 -6 8 0 V0 Z M-4 -38 h8 v8 h-8 Z" fill="#5b4a3f" />
    {[45, 135, 225, 315].map(a => <g key={a} transform={`translate(0 -52) rotate(${a})`}>
      <path d="M0 0 V-37" stroke="#e8e2d0" strokeWidth="2" /><path d="M1 -35 h7 v27 H1 Z" fill="#ddcfab" fillOpacity="0.4" stroke="#e8e2d0" strokeWidth="1" /><path d="M4 -35 v27 M1 -30 h7 m-7 5 h7 m-7 5 h7 m-7 5 h7" stroke="#e8e2d0" strokeWidth="0.8" />
    </g>)}
    <circle cy="-52" r="3.5" fill="#b56f51" />
  </g>;
}

function AngkorTemple() {
  return <g>
    {/* Rear pair, central sanctuary, front pair: five towers in depth. */}
    {[[87, 44, 0.7], [135, 44, 0.7], [110, 24, 1], [60, 61, 0.8], [160, 61, 0.8]].map(([x, y, s]) => <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-14 66 l2 -19 3 -5 V30 l3 -3 V17 l3 -3 L0 0 3 14 l3 3 v10 l3 3 v12 l3 5 2 19 Z" fill="#7a6244" />
      <path d="M0 5 l3 13 v12 l3 3 v14 l3 4 v15 H0 Z" fill="#a28a61" />
      <path d="M-5 19 H5 M-7 28 H7 M-9 38 H9 M-11 47 h22 M-12 56 h24 M-14 64 h28" stroke="#c0a276" strokeWidth="1.8" />
      <path d="M-3 60 V51 q3 -6 6 0 v9 Z M-3 37 v-5 h6 v5 Z" fill="#5f503a" />
      <path d="M-4 41 h2 m4 0 h2 m-11 11 h2 m8 0 h2" stroke="#c0a276" />
    </g>)}
    <path d="M36 98 h148 v14 H36 Z M43 91 h134 l8 7 H35 Z" fill="#8a7050" />
    <path d="M38 100 h144 M36 109 h148" stroke="#b79a6f" strokeWidth="1.5" />
    <path d={repeatPath(18, i => `M${43 + i * 7.5} 102 h3 v6 h-3 Z`)} fill="#5f503a" />
    <path d="M99 112 V90 l11 -9 11 9 v22 Z" fill="#a28a61" /><path d="M105 112 V96 l5 -5 5 5 v16 Z" fill="#5f503a" />
    <path d="M95 112 h30 M97 108 h26 M99 104 h22" stroke="#c0a276" strokeWidth="1.3" />
  </g>;
}

/**
 * Μικρό διόραμα μνημείου: τρεις στρώσεις βάθους (φόντο / μνημείο /
 * προσκήνιο) με διακριτικό parallax. Στο desktop ακολουθεί απαλά τον
 * δείκτη· στην αφή αποκρίνεται όσο ακουμπάς· αλλιώς «ανασαίνει» μόνο
 * του με πολύ αργή περιήγηση. Σέβεται το prefers-reduced-motion.
 */
export function LandmarkArt({
  landmarkId,
  className = '',
  ariaLabel,
  celebrate = false,
  frameAccent = false,
  style,
}: LandmarkArtProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const wrapRef = useRef<HTMLDivElement>(null);
  const scene = SCENES[landmarkId];
  const skyId = `lm-sky-${uid}`;

  const setParallax = useCallback((clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width - 0.5) * 2));
    const ny = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height - 0.5) * 2));
    el.style.setProperty('--dx', nx.toFixed(3));
    el.style.setProperty('--dy', ny.toFixed(3));
  }, []);

  const resetParallax = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.style.setProperty('--dx', '0');
    el.style.setProperty('--dy', '0');
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Ποντίκι: πάντα· αφή: μόνο όσο το δάχτυλο ακουμπά
      if (e.pointerType === 'mouse' || e.buttons > 0) setParallax(e.clientX, e.clientY);
    },
    [setParallax],
  );

  if (!scene) return null;

  return (
    <div
      ref={wrapRef}
      className={`diorama ${frameAccent ? 'diorama--accent' : ''} ${celebrate ? 'diorama--celebrate' : ''} ${className}`}
      style={style}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      onPointerMove={handlePointerMove}
      onPointerDown={(e) => setParallax(e.clientX, e.clientY)}
      onPointerLeave={resetParallax}
      onPointerUp={resetParallax}
      onPointerCancel={resetParallax}
    >
      <svg className="diorama__svg" viewBox="0 0 220 140">
        <defs>
          <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={scene.skyTop} />
            <stop offset="100%" stopColor={scene.skyBottom} />
          </linearGradient>
          <clipPath id={`lm-clip-${uid}`}>
            <rect x="0" y="0" width="220" height="140" rx="12" />
          </clipPath>
        </defs>
        <g clipPath={`url(#lm-clip-${uid})`}>
          {/* Ο ουρανός βγαίνει λίγο έξω από το καρέ ώστε το parallax
              να μην αποκαλύπτει κενά στις άκρες */}
          <g className="dio-layer dio-layer--back">
            <g className="dio-drift dio-drift--back">
              <rect x="-8" y="-8" width="236" height="156" fill={`url(#${skyId})`} />
              {scene.back}
            </g>
          </g>
          <g className="dio-layer dio-layer--mid">
            <g className="dio-drift dio-drift--mid">{scene.mid}</g>
          </g>
          <g className="dio-layer dio-layer--front">
            <g className="dio-drift dio-drift--front">
              <path
                d={`M-8 ${GROUND_Y} h236 v36 h-236 Z`}
                fill={scene.ground}
              />
              {scene.front}
            </g>
          </g>
          {/* Αναλαμπή εορτασμού μετά από σωστή απάντηση */}
          <g className="dio-light" aria-hidden="true">
            <rect x="-80" y="-10" width="70" height="160" fill="#ffffff" opacity="0.35" transform="skewX(-18)" />
          </g>
        </g>
        <rect x="0.75" y="0.75" width="218.5" height="138.5" rx="11.5" fill="none" stroke="rgba(8,33,56,0.25)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export function hasLandmarkArt(landmarkId: string): boolean {
  return landmarkId in SCENES;
}
