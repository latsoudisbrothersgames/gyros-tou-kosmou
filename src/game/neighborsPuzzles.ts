import { ALL_COUNTRIES, getCountryByIsoCode } from '../data/countries';
import { BORDERS, landNeighbors } from '../data/borders';
import { TRAVEL_LINKS } from '../data/links';
import { CENTROIDS } from '../data/centroids';
import { shuffle } from './questionGenerator';
import type { Country } from '../types/country';
import type { DifficultyId } from '../types/game';

const SKIP = new Set(['xk', 'ps', 'tw', 'ma', 'mr']);
export interface NeighborsPuzzle {
  host: Country; guests: Country[]; correct: string[]; totalNeighbors: number;
}
function centroidDistance(a: string, b: string): number {
  const [lon1, lat1] = CENTROIDS[a], [lon2, lat2] = CENTROIDS[b];
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(s)));
}
/** Local candidates first; distance breaks ties and supplies only the needed fallback. */
export function rankedNeighborTraps(hostId: string): Country[] {
  const real = BORDERS[hostId] ?? [];
  const near = new Set([
    ...real.flatMap(id => BORDERS[id] ?? []),
    ...TRAVEL_LINKS.filter(l => l.kind === 'sea' && (l.a === hostId || l.b === hostId))
      .map(l => l.a === hostId ? l.b : l.a),
  ]);
  return ALL_COUNTRIES.filter(c => c.iso2 !== hostId && !SKIP.has(c.iso2) && !real.includes(c.iso2))
    .sort((a, b) => Number(near.has(b.iso2)) - Number(near.has(a.iso2))
      || centroidDistance(hostId, a.iso2) - centroidDistance(hostId, b.iso2)
      || a.iso2.localeCompare(b.iso2));
}
export function makeNeighborsPuzzle(difficulty: DifficultyId, focus?: string): NeighborsPuzzle {
  const includeSpecial = difficulty !== 'easy';
  const eligible = ALL_COUNTRIES.filter(c => {
    if (SKIP.has(c.iso2)) return false;
    const n = landNeighbors(c.iso2, includeSpecial).filter(id => !SKIP.has(id)).length;
    return difficulty === 'easy' ? c.tier === 1 && n >= 2 && n <= 5
      : difficulty === 'medium' ? c.tier <= 2 && n >= 1 && n <= 7 : true;
  });
  const host = eligible.find(c => c.iso2 === focus) ?? shuffle(eligible)[0];
  const real = landNeighbors(host.iso2, includeSpecial).filter(id => !SKIP.has(id));
  const slots = { easy: 6, medium: 7, hard: 8 }[difficulty];
  const correct = shuffle(real).slice(0, Math.min(real.length, difficulty === 'hard' ? 5 : slots - 2));
  const traps = rankedNeighborTraps(host.iso2);
  const guests = shuffle([...correct.map(id => getCountryByIsoCode(id)!), ...traps.slice(0, slots - correct.length)]);
  return { host, guests, correct, totalNeighbors: real.length };
}
