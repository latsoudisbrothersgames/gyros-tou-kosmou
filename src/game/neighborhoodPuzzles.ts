import { geoLength, geoNaturalEarth1, geoPath } from 'd3-geo';
import { mesh } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import { BOARD, trimRemote } from './puzzleGeometry';
import { BORDERS, borderKind } from '../data/borders';
import { getCountryByIsoCode, getCountryByIsoNumeric } from '../data/countries';
import type { WorldTopology } from '../components/WorldMap/useWorldTopology';
import type { DifficultyId } from '../types/game';

const OMIT = new Set(['xk', 'ps', 'tw', 'ma', 'mr']);
const sharedBorders = new WeakMap<WorldTopology, Map<string, Set<string>>>();

/** Shared TopoJSON arcs are the cheap, exact land-border precheck for Stage 2. */
function topologyBorders(topology: WorldTopology): Map<string, Set<string>> {
  const cached = sharedBorders.get(topology);
  if (cached) return cached;
  const owners = new Map<number, string[]>();
  const collect = (arcs: number | readonly unknown[], found: Set<number>): void => {
    if (typeof arcs === 'number') found.add(arcs < 0 ? ~arcs : arcs);
    else for (const arc of arcs) collect(arc as number | readonly unknown[], found);
  };
  for (const geometry of topology.raw.objects.countries.geometries) {
    const id = getCountryByIsoNumeric(String(geometry.id))?.iso2;
    if (!id || !('arcs' in geometry) || !geometry.arcs) continue;
    const arcs = new Set<number>();
    collect(geometry.arcs, arcs);
    for (const arc of arcs) {
      const countries = owners.get(arc) ?? [];
      countries.push(id);
      owners.set(arc, countries);
    }
  }
  const borders = new Map<string, Set<string>>();
  for (const countries of owners.values()) for (const a of countries) for (const b of countries) {
    if (a === b) continue;
    const neighbors = borders.get(a) ?? new Set<string>();
    neighbors.add(b);
    borders.set(a, neighbors);
  }
  sharedBorders.set(topology, borders);
  return borders;
}

export function qualifiesForNeighborhood(hostId: string, difficulty: DifficultyId, topology: WorldTopology): boolean {
  if (OMIT.has(hostId) || !topology.availableIso2.has(hostId)) return false;
  const shared = topologyBorders(topology).get(hostId);
  const minimum = difficulty === 'medium' ? 4 : 3;
  return (BORDERS[hostId] ?? []).filter(id => !OMIT.has(id) && !borderKind(hostId, id)
    && topology.availableIso2.has(id) && getCountryByIsoCode(id) && shared?.has(id)).length >= minimum;
}
export interface NeighborhoodPiece {
  id: string;
  /** Path in piece-local coordinates. No board position belongs in the tray markup. */
  d: string;
  x: number;
  y: number;
  width: number;
  height: number;
  trayScale: number;
  tiny: boolean;
  direction: 'βόρεια' | 'νότια' | 'ανατολικά' | 'δυτικά';
}
export interface NeighborhoodPuzzle {
  hostId: string;
  anchor: string;
  anchorCenter: [number, number];
  exterior: string;
  pieces: NeighborhoodPiece[];
  trayOrder: string[];
  borders: Map<string, string>;
}

function hash(value: string): number {
  let h = 2166136261;
  for (const c of value) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
function direction(dx: number, dy: number): NeighborhoodPiece['direction'] {
  return Math.abs(dx) >= Math.abs(dy) ? dx >= 0 ? 'ανατολικά' : 'δυτικά' : dy >= 0 ? 'νότια' : 'βόρεια';
}

/** A pure round builder. Call only after Stage 1 reveals the neighbors used for Stage 2. */
export function makeNeighborhoodPuzzle(hostId: string, difficulty: DifficultyId,
  revealed: readonly string[], topology: WorldTopology, seed: number): NeighborhoodPuzzle | null {
  if (OMIT.has(hostId)) return null;
  const host = topology.countries.find(c => c.iso2 === hostId);
  if (!host) return null;
  const candidates = [...new Set(revealed)].filter(id => !OMIT.has(id)
    && BORDERS[hostId]?.includes(id) && !borderKind(hostId, id)
    && topology.availableIso2.has(id) && getCountryByIsoCode(id));
  const minimum = difficulty === 'medium' ? 4 : 3;
  if (candidates.length < minimum) return null;
  const features = new Map([hostId, ...candidates].map(id => {
    const item = topology.countries.find(c => c.iso2 === id)!;
    return [id, trimRemote(item.feature)] as const;
  }));
  const projection = geoNaturalEarth1().fitExtent([[BOARD.x0, BOARD.y0], [BOARD.x1, BOARD.y1]],
    { type: 'FeatureCollection', features: [...features.values()] } as FeatureCollection<Geometry>);
  const path = geoPath(projection);
  const anchor = path(features.get(hostId)!) ?? '';
  const [[hx0, hy0], [hx1, hy1]] = path.bounds(features.get(hostId)!);
  const hostCenter = [(hx0 + hx1) / 2, (hy0 + hy1) / 2];
  const numeric = new Map([hostId, ...candidates].map(id => [id, getCountryByIsoCode(id)!.isoNumeric]));
  const borderGeometry = (a: string, b: string) => mesh(topology.raw, topology.raw.objects.countries, (g1, g2) => {
    const x = getCountryByIsoNumeric(String(g1.id))?.iso2;
    const y = getCountryByIsoNumeric(String(g2.id))?.iso2;
    return x === a && y === b || x === b && y === a;
  });
  const entries = candidates.map(id => {
    const feature = features.get(id)!;
    const [[x0, y0], [x1, y1]] = path.bounds(feature);
    const line = borderGeometry(hostId, id);
    return { id, direction: direction((x0 + x1) / 2 - hostCenter[0], (y0 + y1) / 2 - hostCenter[1]),
      length: geoLength(line), line, x0, y0, x1, y1 };
  }).filter(item => item.length > 0.00001);
  if (entries.length < minimum) return null;
  const count = Math.min({ easy: 3, medium: 5, hard: 6 }[difficulty], entries.length);
  const selected: typeof entries = [];
  const unused = [...entries];
  const maxLength = Math.max(...entries.map(e => e.length));
  while (selected.length < count) {
    unused.sort((a, b) => {
      const value = (e: typeof a) => e.length / maxLength
        + (selected.some(s => s.direction === e.direction) ? 0 : 0.65);
      return value(b) - value(a) || hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`);
    });
    selected.push(unused.shift()!);
  }
  const pieces = selected.map(e => {
    const feature = features.get(e.id)!;
    const width = Math.max(1, e.x1 - e.x0), height = Math.max(1, e.y1 - e.y0);
    const local = geoNaturalEarth1().scale(projection.scale()).rotate(projection.rotate())
      .translate([projection.translate()[0] - e.x0, projection.translate()[1] - e.y0]);
    const tiny = width < 44 || height < 44;
    return { id: e.id, d: geoPath(local)(feature) ?? '', x: e.x0, y: e.y0, width, height,
      trayScale: tiny ? Math.min(80 / width, 60 / height, Math.max(1, 44 / Math.min(width, height))) : 1,
      tiny, direction: e.direction };
  });
  const regularScale = Math.min(1, ...pieces.filter(p => !p.tiny).map(p => Math.min(104 / p.width, 92 / p.height)));
  for (const piece of pieces) if (!piece.tiny) piece.trayScale = regularScale;
  const boardPath = geoPath(geoNaturalEarth1().scale(projection.scale()).rotate(projection.rotate())
    .translate(projection.translate()).clipExtent([[3, 3], [357, BOARD.y1 + 6]]));
  const chosen = new Set([hostId, ...pieces.map(p => p.id)]);
  const subset = { type: 'GeometryCollection' as const, geometries: topology.raw.objects.countries.geometries
    .filter(g => [...numeric.values()].includes(String(g.id)) && chosen.has(getCountryByIsoNumeric(String(g.id))?.iso2 ?? '')) };
  const exterior = boardPath(mesh(topology.raw, subset, (a, b) => a === b)) ?? '';
  const borders = new Map(pieces.map(p => [p.id, boardPath(borderGeometry(hostId, p.id)) ?? '']));
  const trayOrder = pieces.map(p => p.id).sort((a, b) => hash(`${seed}:tray:${a}`) - hash(`${seed}:tray:${b}`));
  return { hostId, anchor, anchorCenter: [hostCenter[0], hostCenter[1]], exterior, pieces, trayOrder, borders };
}
