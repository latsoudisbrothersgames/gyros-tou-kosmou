import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { mesh } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import { parseGameConfig } from './QuizGamePage';
import { useGeoSession } from '../hooks/useGeoSession';
import { puzzleForRound } from '../data/puzzles';
import { getCountryByIsoCode, getCountryByIsoNumeric } from '../data/countries';
import { BORDERS } from '../data/borders';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useWorldTopology } from '../components/WorldMap/useWorldTopology';
import { CountryBall } from '../components/CountryBall/CountryBall';
import { GeoModeLayout } from './GeoModeLayout';
import { scorePuzzle } from '../game/scoring';
import { useReactions } from '../reactions/ReactionsProvider';
import { pickGeoLine } from '../data/ballLines';
import { playSound } from '../audio/soundManager';

interface Piece { id: string; d: string; x: number; y: number; width: number; height: number; scale: number; tiny: boolean }
type Position = { x: number; y: number; scale: number };
export function PuzzleGamePage() {
  const [params] = useSearchParams();
  return <PuzzleSession key={params.toString()} config={parseGameConfig('puzzle', params)!} />;
}
function PuzzleSession({ config }: { config: NonNullable<ReturnType<typeof parseGameConfig>> }) {
  const total = config.length === 'endless' ? null : config.length === 10 ? 5 : 10;
  const session = useGeoSession(config, index => puzzleForRound(index, index === 0 ? config.focusCountryId : undefined), total);
  return <GeoModeLayout {...session}><PuzzleRound key={session.state.questionIndex} session={session} /></GeoModeLayout>;
}
function PuzzleRound({ session: s }: { session: ReturnType<typeof useGeoSession<ReturnType<typeof puzzleForRound>>> }) {
  const { topology } = useWorldTopology();
  const reactions = useReactions();
  const reduced = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const started = useRef(performance.now());
  const drag = useRef<{ id: string } | null>(null);
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [placed, setPlaced] = useState<string[]>(s.state.config.difficulty === 'hard' ? [s.round.countries[0]] : []);
  const [misdrops, setMisdrops] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const [lastSnap, setLastSnap] = useState<string | null>(null);
  const [joined, setJoined] = useState<string[]>(s.state.config.difficulty === 'hard' ? [s.round.countries[0]] : []);
  const geom = useMemo(() => {
    if (!topology) return null;
    const chosen = s.round.countries.map(id => topology.countries.find(c => c.iso2 === id)).filter(c => !!c);
    if (chosen.length !== s.round.countries.length) return null;
    const collection: FeatureCollection<Geometry> = { type: 'FeatureCollection', features: chosen.map(c => c.feature) };
    const projection = geoNaturalEarth1().fitExtent([[18, 18], [342, 238]], collection);
    const path = geoPath(projection);
    const pieces: Piece[] = chosen.map(c => {
      const [[x0, y0], [x1, y1]] = path.bounds(c.feature);
      const localProjection = geoNaturalEarth1().scale(projection.scale()).rotate(projection.rotate()).translate([projection.translate()[0] - x0, projection.translate()[1] - y0]);
      const width = Math.max(1, x1 - x0), height = Math.max(1, y1 - y0);
      return { id: c.iso2!, d: geoPath(localProjection)(c.feature)!, x: x0, y: y0, width, height,
        scale: width < 44 || height < 44 ? Math.min(80 / width, 60 / height, Math.max(1, 44 / Math.min(width, height))) : Math.min(1, 90 / width, 65 / height), tiny: width < 44 || height < 44 };
    });
    const geometries = topology.raw.objects.countries.geometries.filter(g => s.round.countries.some(id => getCountryByIsoNumeric(String(g.id))?.iso2 === id));
    const subset = { type: 'GeometryCollection' as const, geometries };
    const exterior = path(mesh(topology.raw, subset, (a, b) => a === b));
    const selectedNumeric = new Set(chosen.map(c => c.isoNumeric));
    const coast = path(mesh(topology.raw, topology.raw.objects.countries, (a, b) => a === b && selectedNumeric.has(String(a.id))));
    const borders = new Map<string, string>();
    for (const a of s.round.countries) for (const b of BORDERS[a] ?? []) {
      if (!s.round.countries.includes(b) || a > b) continue;
      const line = path(mesh(topology.raw, topology.raw.objects.countries, (g1, g2) => {
        const x = getCountryByIsoNumeric(String(g1.id))?.iso2, y = getCountryByIsoNumeric(String(g2.id))?.iso2;
        return x === a && y === b || x === b && y === a;
      }));
      if (line) borders.set(`${a}-${b}`, line);
    }
    return { pieces, exterior, coast, borders };
  }, [topology, s.round]);
  const traySlot = (piece: Piece) => geom ? (geom.pieces.indexOf(piece) + Math.ceil(geom.pieces.length / 2)) % geom.pieces.length : 0;
  useEffect(() => {
    if (!geom) return;
    const start: Record<string, Position> = {};
    geom.pieces.forEach((p, i) => {
      const slot = (i + Math.ceil(geom.pieces.length / 2)) % geom.pieces.length;
      const col = slot % 3, row = Math.floor(slot / 3);
      start[p.id] = { x: 12 + col * 116 + (96 - p.width * p.scale) / 2,
        y: 286 + row * 105 + (70 - p.height * p.scale) / 2, scale: p.scale };
    });
    setPositions(start);
    started.current = performance.now();
  }, [geom]);
  const localPoint = (e: PointerEvent<SVGSVGElement>) => {
    const pt = svgRef.current!.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svgRef.current!.getScreenCTM()!.inverse());
  };
  const begin = (e: PointerEvent<SVGGElement>, piece: Piece) => {
    if (placed.includes(piece.id) || s.answered) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const here = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    drag.current = { id: piece.id }; setActive(piece.id);
    setPositions(v => ({ ...v, [piece.id]: { x: here.x - piece.width / 2, y: here.y - piece.height / 2, scale: 1 } }));
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    const id = drag.current?.id;
    if (!id || !geom) return;
    const piece = geom.pieces.find(p => p.id === id)!;
    const here = localPoint(e);
    setPositions(v => ({ ...v, [id]: { x: here.x - piece.width / 2, y: here.y - piece.height / 2, scale: 1 } }));
  };
  const end = (e: PointerEvent<SVGSVGElement>) => {
    const id = drag.current?.id;
    if (!id || !geom) return;
    const piece = geom.pieces.find(p => p.id === id)!;
    const here = localPoint(e);
    const x = here.x - piece.width / 2, y = here.y - piece.height / 2;
    const tolerance = { easy: 72, medium: 48, hard: 36 }[s.state.config.difficulty];
    const distance = Math.hypot(x - piece.x, y - piece.y);
    drag.current = null; setActive(null);
    if (distance <= tolerance) {
      const next = [...placed, id];
      setPositions(v => ({ ...v, [id]: { x: piece.x, y: piece.y, scale: 1 } }));
      setPlaced(next); setJoined(next); setLastSnap(id);
      playSound('snap'); reactions?.emit({ type: 'puzzle:snap', iso2: id, neighbors: next.filter(other => BORDERS[id]?.includes(other)) });
      if (next.length === geom.pieces.length) {
        s.complete(s.round.countries[0], true,
          scorePuzzle(geom.pieces.length, misdrops, (performance.now() - started.current) / 1000, s.state.streak),
          [...s.round.countries]);
      }
    } else {
      setMisdrops(v => v + 1);
      const slot = traySlot(piece);
      setPositions(v => ({ ...v, [id]: { x: 12 + (slot % 3) * 116 + (96 - piece.width * piece.scale) / 2,
        y: 286 + Math.floor(slot / 3) * 105 + (70 - piece.height * piece.scale) / 2,
        scale: piece.scale } }));
    }
  };
  if (!geom || !Object.keys(positions).length) return <p role="status">Ετοιμάζουμε τα κομμάτια…</p>;
  return <>
    <h1>Ο άτλαντας έγινε κομμάτια</h1>
    <p>{s.round.title} · Σύρε τις χώρες στη σωστή θέση.</p>
    <svg ref={svgRef} className={`puzzle__stage ${reduced ? 'puzzle__stage--still' : ''}`} viewBox="0 0 360 550" onPointerMove={move} onPointerUp={end} onPointerCancel={end}
      role="img" aria-label="Παζλ χωρών με δίσκο κομματιών">
      <rect x="3" y="3" width="354" height="260" rx="16" fill="#e6f5fa" stroke="#9ccbd7" />
      {s.state.config.difficulty === 'easy' && geom.exterior && <path d={geom.exterior} fill="none" stroke="#a2aaa3" strokeWidth="2" opacity=".65" />}
      {s.state.config.difficulty === 'medium' && geom.coast && <path d={geom.coast} fill="none" stroke="#a2aaa3" strokeWidth="1" opacity=".6" />}
      <rect x="3" y="274" width="354" height="270" rx="16" fill="#fff3d6" stroke="#dfc98c" />
      {[...geom.borders].filter(([pair]) => pair.split('-').every(id => joined.includes(id))).map(([pair, d]) =>
        <path key={pair} d={d} fill="none" stroke="#ffb233" strokeWidth="4" className="puzzle__joined" />)}
      {geom.pieces.map(piece => {
        const pos = placed.includes(piece.id) ? { x: piece.x, y: piece.y, scale: 1 } : positions[piece.id];
        const country = getCountryByIsoCode(piece.id)!;
        return <g key={piece.id} transform={`translate(${pos.x} ${pos.y}) scale(${pos.scale})`}
          className={`puzzle__piece ${placed.includes(piece.id) ? 'puzzle__piece--placed' : ''} ${active === piece.id ? 'puzzle__piece--active' : ''}`}
          onPointerDown={e => begin(e, piece)} aria-label={country.nameGreek}>
          <path d={piece.d} fill="#ffcc7a" stroke="#a76d36" strokeWidth="1.5" />
          <rect x={piece.width / 2 - Math.max(piece.width, 52 / pos.scale) / 2}
            y={piece.height / 2 - Math.max(piece.height, 52 / pos.scale) / 2}
            width={Math.max(piece.width, 52 / pos.scale)} height={Math.max(piece.height, 52 / pos.scale)} fill="transparent" />
          <g transform={`translate(${piece.width / 2} ${piece.height / 2}) scale(${1 / pos.scale})`} pointerEvents="none">
            <foreignObject x="-19" y="-20" width="38" height="42">
              <CountryBall country={country} size={34} reactive={false} speechEnabled={false}
                mood={s.answered ? 'celebrate' : active === piece.id ? 'nervous' : lastSnap && placed.includes(piece.id) && (piece.id === lastSnap || BORDERS[lastSnap]?.includes(piece.id)) ? 'wave' : placed.includes(piece.id) ? 'proud' : 'idle'} />
            </foreignObject>
          </g>
          {piece.tiny && !placed.includes(piece.id) && <text x={2 / pos.scale} y={-4 / pos.scale}
            fontSize={11 / pos.scale} fill="#21405a">🔍 {country.nameGreek}</text>}
        </g>;
      })}
      {s.answered && geom.pieces.map(piece => <text key={piece.id} x={piece.x} y={Math.min(258, piece.y + piece.height + 14)}
        fontSize="10" fill="#17344a">{getCountryByIsoCode(piece.id)?.nameGreek}</text>)}
    </svg>
    {lastSnap && !s.answered && <p role="status">{pickGeoLine('puzzleSnap', placed.length)}</p>}
    <p>Κομμάτια: {placed.length}/{geom.pieces.length} · Λάθος αποθέσεις: {misdrops}</p>
    {s.answered && <p>Μπράβο! Όλες οι χώρες βρήκαν τη θέση τους.</p>}
  </>;
}
