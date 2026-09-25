import { useRef, useState, type PointerEvent } from 'react';
import { BOARD, STAGE_H, TRAY_TOP } from '../game/puzzleGeometry';
import type { NeighborhoodPiece, NeighborhoodPuzzle } from '../game/neighborhoodPuzzles';
import type { Country } from '../types/country';
import type { DifficultyId } from '../types/game';
import { getCountryByIsoCode } from '../data/countries';
import { CountryBall } from '../components/CountryBall/CountryBall';
import { SpeechBubble } from '../components/SpeechBubble/SpeechBubble';
import { Button } from '../components/Button/Button';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { playSound } from '../audio/soundManager';
import { useReactions } from '../reactions/ReactionsProvider';

type Position = { x: number; y: number; scale: number };
const slotPosition = (piece: NeighborhoodPiece, slot: number): Position => ({
  x: 10 + (slot % 3) * 116 + (104 - piece.width * piece.trayScale) / 2,
  y: TRAY_TOP + 14 + Math.floor(slot / 3) * 124 + (96 - piece.height * piece.trayScale) / 2,
  scale: piece.trayScale,
});
function initialPositions(puzzle: NeighborhoodPuzzle): Record<string, Position> {
  return Object.fromEntries(puzzle.pieces.map(p => [p.id, slotPosition(p, puzzle.trayOrder.indexOf(p.id))]));
}

export function NeighborhoodStage({ puzzle, host, difficulty, onSkip, onComplete }: {
  puzzle: NeighborhoodPuzzle; host: Country; difficulty: DifficultyId;
  onSkip: () => void; onComplete: (withoutHint: number, total: number) => { bonus: number; count: number };
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; pointerId: number } | null>(null);
  const [positions, setPositions] = useState(() => initialPositions(puzzle));
  const [placed, setPlaced] = useState<string[]>([]);
  const [misses, setMisses] = useState<Record<string, number>>({});
  const [hinted, setHinted] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [lastSnap, setLastSnap] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [finished, setFinished] = useState(false);
  const [reward, setReward] = useState<{ bonus: number; count: number } | null>(null);
  const reduced = useReducedMotion();
  const reactions = useReactions();
  const localPoint = (event: PointerEvent<SVGElement>) => {
    const svg = svgRef.current!;
    const point = svg.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM()!.inverse());
  };
  const begin = (event: PointerEvent<SVGGElement>, piece: NeighborhoodPiece) => {
    if (placed.includes(piece.id) || finished) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: piece.id, pointerId: event.pointerId };
    const here = localPoint(event);
    setActive(piece.id);
    setMessage('');
    setPositions(v => ({ ...v, [piece.id]: { x: here.x - piece.width / 2, y: here.y - piece.height / 2, scale: 1 } }));
  };
  const move = (event: PointerEvent<SVGSVGElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const piece = puzzle.pieces.find(p => p.id === drag.current!.id)!;
    const here = localPoint(event);
    setPositions(v => ({ ...v, [piece.id]: { x: here.x - piece.width / 2, y: here.y - piece.height / 2, scale: 1 } }));
  };
  const end = (event: PointerEvent<SVGSVGElement>, cancelled = false) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const piece = puzzle.pieces.find(p => p.id === drag.current!.id)!;
    const here = localPoint(event);
    drag.current = null;
    setActive(null);
    const targetDistance = Math.hypot(here.x - piece.width / 2 - piece.x, here.y - piece.height / 2 - piece.y);
    if (!cancelled && targetDistance <= { easy: 72, medium: 48, hard: 36 }[difficulty]) {
      const next = [...placed, piece.id];
      setPositions(v => ({ ...v, [piece.id]: { x: piece.x, y: piece.y, scale: 1 } }));
      setPlaced(next);
      setLastSnap(piece.id);
      setMessage('Γεια σου γείτονα!');
      playSound('snap');
      reactions?.emit({ type: 'puzzle:snap', iso2: piece.id, neighbors: [host.iso2] });
      if (next.length === puzzle.pieces.length) {
        const clean = next.filter(id => !hinted.includes(id)).length;
        setFinished(true);
        setReward(onComplete(clean, next.length));
        if (clean === next.length) playSound('magic');
      }
    } else {
      setPositions(v => ({ ...v, [piece.id]: slotPosition(piece, puzzle.trayOrder.indexOf(piece.id)) }));
      if (cancelled) return;
      const count = (misses[piece.id] ?? 0) + 1;
      setMisses(v => ({ ...v, [piece.id]: count }));
      if (count >= 3) {
        if (!hinted.includes(piece.id)) setHinted(v => [...v, piece.id]);
        setMessage(`${getCountryByIsoCode(piece.id)!.nameGreek} είναι ${piece.direction} ${host.nameGreekGenitive}.`);
      } else setMessage('Δοκίμασε ξανά να βρεις τη θέση του γείτονα.');
    }
  };
  return <div className="neighborhood" aria-label="Στάδιο 2: Φτιάξε τη γειτονιά">
    <h1>Φτιάξε τη γειτονιά</h1>
    <p>Σύρε τους γείτονες στη σωστή θέση γύρω από {host.nameGreekAccusative}.</p>
    <div className="neighborhood__wrap">
      <svg ref={svgRef} className={`neighborhood__stage ${reduced ? 'neighborhood__stage--still' : ''}`}
        viewBox={`0 0 360 ${STAGE_H}`} role="img" aria-label="Χάρτης γειτονιάς και δίσκος κομματιών"
        onPointerMove={move} onPointerUp={end} onPointerCancel={event => end(event, true)}>
        <rect x="3" y="3" width="354" height={BOARD.y1 + 4} rx="16" fill="#e6f5fa" stroke="#9ccbd7" />
        {difficulty === 'easy' && <path d={puzzle.exterior} fill="none" stroke="#829c9e" strokeWidth="2" />}
        <path d={puzzle.anchor} fill="#b2dfc6" stroke="#42856c" strokeWidth={difficulty === 'medium' ? 2 : 1.5} />
        <rect x="3" y={TRAY_TOP} width="354" height="270" rx="16" fill="#fff3d6" stroke="#dfc98c" />
        {lastSnap && !reduced && puzzle.borders.get(lastSnap) && <path key={lastSnap} d={puzzle.borders.get(lastSnap)}
          className="neighborhood__glow" fill="none" stroke="#ffb233" strokeWidth="4" />}
        {puzzle.pieces.map(piece => {
          const done = placed.includes(piece.id);
          const pos = positions[piece.id];
          return <g key={piece.id} className={`neighborhood__piece ${done ? 'neighborhood__piece--placed' : ''}`}
            transform={`translate(${pos.x} ${pos.y}) scale(${pos.scale})`}
            onPointerDown={event => begin(event, piece)} aria-label={getCountryByIsoCode(piece.id)!.nameGreek}>
            <path d={piece.d} fill={done ? '#ffcf85' : '#ffc675'} stroke="#a76d36" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <rect x={piece.width / 2 - Math.max(piece.width, 52 / pos.scale) / 2}
              y={piece.height / 2 - Math.max(piece.height, 52 / pos.scale) / 2}
              width={Math.max(piece.width, 52 / pos.scale)} height={Math.max(piece.height, 52 / pos.scale)} fill="transparent" />
            {piece.tiny && !done && <text x={2 / pos.scale} y={-4 / pos.scale} fontSize={11 / pos.scale} fill="#21405a">
              🔍 {getCountryByIsoCode(piece.id)!.nameGreek}
            </text>}
          </g>;
        })}
      </svg>
      <div className="neighborhood__balls" aria-hidden="true">
        <div className="neighborhood__ball" style={{ left: `${puzzle.anchorCenter[0] / 360 * 100}%`,
          top: `${puzzle.anchorCenter[1] / STAGE_H * 100}%` }}>
          <CountryBall country={host} size={42} identityVisible reactive={false} speechEnabled={false}
            mood={finished ? hinted.length === 0 ? 'celebrate' : 'happy' : lastSnap ? 'wave' : 'proud'} />
        </div>
        {puzzle.pieces.map(piece => {
          const done = placed.includes(piece.id), pos = positions[piece.id];
          const cx = done ? pos.x + piece.width / 2 : Math.min(342, pos.x + piece.width * pos.scale + 4);
          const cy = done ? pos.y + piece.height / 2 : pos.y + piece.height * pos.scale;
          return <div key={piece.id} className="neighborhood__ball" style={{ left: `${cx / 360 * 100}%`, top: `${cy / STAGE_H * 100}%` }}>
            <CountryBall country={getCountryByIsoCode(piece.id)!} size={done ? 34 : 26} identityVisible reactive={false}
              speechEnabled={false} mood={finished ? hinted.length === 0 ? 'celebrate' : 'happy' : piece.id === lastSnap ? 'wave' : active === piece.id ? 'nervous' : 'idle'} />
          </div>;
        })}
      </div>
    </div>
    <p>Κομμάτια: {placed.length}/{puzzle.pieces.length}</p>
    {message && <div className="neighborhood__bubble"><SpeechBubble key={message + placed.length + (misses[active ?? ''] ?? 0)} lines={[message]} /></div>}
    {finished && <p role="status">Μπράβο! Έφτιαξες όλη τη γειτονιά.</p>}
    {reward && <p role="status">⭐ +{reward.bonus} πόντοι μπόνους · Γειτονιές που έφτιαξες: {reward.count}</p>}
    {!finished && <Button variant="secondary" onClick={onSkip}>Παράλειψη</Button>}
  </div>;
}
