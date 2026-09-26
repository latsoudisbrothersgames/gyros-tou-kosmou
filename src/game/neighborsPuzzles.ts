import { ALL_COUNTRIES, getCountryByIsoCode } from '../data/countries';
import { BORDERS, landNeighbors } from '../data/borders';
import { TRAVEL_LINKS } from '../data/links';
import { CENTROIDS } from '../data/centroids';
import { shuffle } from './questionGenerator';
import type { Country } from '../types/country';
import type { DifficultyId } from '../types/game';

const SKIP = new Set(['xk', 'ps', 'tw', 'ma', 'mr']);
/** At least one Stage-2 host in each block of this many rounds. */
export const NEIGHBORHOOD_ROUND_INTERVAL = 3;
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
export function eligibleNeighborsHosts(difficulty: DifficultyId): Country[] {
  const includeSpecial = difficulty !== 'easy';
  return ALL_COUNTRIES.filter(c => {
    if (SKIP.has(c.iso2)) return false;
    const n = landNeighbors(c.iso2, includeSpecial).filter(id => !SKIP.has(id)).length;
    return difficulty === 'easy' ? c.tier === 1 && n >= 2 && n <= 5
      : difficulty === 'medium' ? c.tier <= 2 && n >= 1 && n <= 7 : true;
  });
}

/** Keep a session's host choices distinct until the relevant pool is exhausted. */
export function createNeighborsHostPicker(difficulty: DifficultyId, qualifies: ReadonlySet<string>,
  focus?: string, random: () => number = Math.random) {
  const eligible = eligibleNeighborsHosts(difficulty);
  const qualifying = eligible.filter(c => qualifies.has(c.iso2));
  const focused = eligible.find(c => c.iso2 === focus);
  const used = new Set<string>();
  const chosen = new Map<number, Country>();
  let previous: string | undefined;
  const pick = (index: number): Country => {
    const cached = chosen.get(index);
    if (cached) return cached;
    const mustQualify = qualifying.length > 0 && (index % NEIGHBORHOOD_ROUND_INTERVAL === 0 && !(index === 0 && focused)
      || index === 1 && focused !== undefined && !qualifies.has(focused.iso2));
    const pool = mustQualify ? qualifying : eligible.filter(c => !qualifies.has(c.iso2));
    let available = pool.filter(c => !used.has(c.iso2) && c.iso2 !== previous);
    if (!available.length && !mustQualify) available = eligible.filter(c => !used.has(c.iso2) && c.iso2 !== previous);
    if (!available.length) {
      used.clear();
      available = (pool.length ? pool : eligible).filter(c => c.iso2 !== previous);
    }
    const host = index === 0 && focused ? focused : available[Math.floor(random() * available.length)];
    used.add(host.iso2);
    previous = host.iso2;
    chosen.set(index, host);
    return host;
  };
  const reset = () => { used.clear(); chosen.clear(); previous = undefined; };
  return { pick, reset };
}

export function makeNeighborsPuzzle(difficulty: DifficultyId, focus?: string, hostOverride?: Country): NeighborsPuzzle {
  const eligible = hostOverride ? [] : eligibleNeighborsHosts(difficulty);
  const host = hostOverride ?? eligible.find(c => c.iso2 === focus) ?? shuffle(eligible)[0];
  const includeSpecial = difficulty !== 'easy';
  const real = landNeighbors(host.iso2, includeSpecial).filter(id => !SKIP.has(id));
  const slots = { easy: 6, medium: 7, hard: 8 }[difficulty];
  const correct = shuffle(real).slice(0, Math.min(real.length, difficulty === 'hard' ? 5 : slots - 2));
  const traps = rankedNeighborTraps(host.iso2);
  const guests = shuffle([...correct.map(id => getCountryByIsoCode(id)!), ...traps.slice(0, slots - correct.length)]);
  return { host, guests, correct, totalNeighbors: real.length };
}
