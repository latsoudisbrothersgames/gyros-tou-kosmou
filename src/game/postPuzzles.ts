import { ALL_COUNTRIES, getCountryByIsoCode } from '../data/countries';
import { landNeighbors } from '../data/borders';
import { TRAVEL_LINKS, type TravelLink } from '../data/links';
import { shuffle } from './questionGenerator';
import type { Country } from '../types/country';
import type { DifficultyId } from '../types/game';

export type TicketKind = 'land' | TravelLink['kind'];
export type Tickets = Record<TicketKind, number>;
export interface PostPuzzle {
  sender: Country; receiver: Country; tickets: Tickets; shortest: string[];
  constraint: 'none' | 'no-air' | 'two-continents' | 'shortest';
}
const SKIP = new Set(['xk', 'ps', 'tw', 'ma', 'mr']);
export function travelOptions(a: string, b: string, special = true): TicketKind[] {
  const result: TicketKind[] = [];
  if (landNeighbors(a, special).includes(b)) result.push('land');
  for (const link of TRAVEL_LINKS) if (link.a === a && link.b === b || link.a === b && link.b === a) result.push(link.kind);
  return result;
}
/** BFS στην κατάσταση (χώρα, εισιτήρια). Οι ακμές έχουν κόστος ένα κουπόνι του τύπου τους. */
export function reachableRoutes(start: string, tickets: Tickets, special = true): Map<string, string[]> {
  const result = new Map<string, string[]>([[start, [start]]]);
  const queue: { at: string; left: Tickets; path: string[] }[] = [{ at: start, left: { ...tickets }, path: [start] }];
  const seen = new Set<string>();
  while (queue.length) {
    const node = queue.shift()!;
    const key = [node.at, node.left.land, node.left.sea, node.left.air].join(':');
    if (seen.has(key)) continue;
    seen.add(key);
    if (node.path.length - 1 >= 7) continue;
    const adjacent = new Map<string, TicketKind[]>();
    for (const b of landNeighbors(node.at, special)) adjacent.set(b, ['land']);
    for (const link of TRAVEL_LINKS) {
      const b = link.a === node.at ? link.b : link.b === node.at ? link.a : null;
      if (b) adjacent.set(b, [...(adjacent.get(b) ?? []), link.kind]);
    }
    for (const [b, options] of adjacent) {
      if (SKIP.has(b) || node.path.includes(b)) continue;
      for (const kind of options) {
        if (!node.left[kind]) continue;
        const left = { ...node.left, [kind]: node.left[kind] - 1 };
        const path = [...node.path, b];
        if (!result.has(b) || path.length < result.get(b)!.length) result.set(b, path);
        queue.push({ at: b, left, path });
      }
    }
  }
  return result;
}
export function makePostPuzzle(difficulty: DifficultyId, focus?: string, sequence = 0): PostPuzzle {
  const range = { easy: [2, 3], medium: [3, 5], hard: [4, 7] }[difficulty];
  const constraint: PostPuzzle['constraint'] = difficulty === 'easy' ? 'none'
    : (['no-air', 'two-continents', 'shortest'] as const)[sequence % 3];
  const tickets: Tickets = difficulty === 'easy' ? { land: 2, sea: 1, air: 0 }
    : difficulty === 'medium' ? { land: 3, sea: 2, air: constraint === 'no-air' ? 0 : 1 }
      : { land: 5, sea: 2, air: constraint === 'no-air' ? 0 : 1 };
  const pool = shuffle(ALL_COUNTRIES.filter(c => !SKIP.has(c.iso2)));
  if (focus) {
    const chosen = getCountryByIsoCode(focus);
    if (chosen && !SKIP.has(focus)) pool.unshift(chosen);
  }
  for (const sender of pool) {
    const routes = reachableRoutes(sender.iso2, tickets, difficulty !== 'easy');
    const candidates = shuffle(ALL_COUNTRIES.filter(c => {
      const path = routes.get(c.iso2);
      return path && path.length - 1 >= range[0] && path.length - 1 <= range[1]
        && (constraint !== 'two-continents' || c.continent !== sender.continent);
    }));
    if (candidates.length) {
      const receiver = candidates[0];
      return { sender, receiver, tickets, shortest: routes.get(receiver.iso2)!, constraint };
    }
  }
  throw new Error('Δεν βρέθηκε λύσιμη αποστολή.');
}
export function postConstraintMet(puzzle: PostPuzzle, route: string[], kinds: TicketKind[]): boolean {
  if (puzzle.constraint === 'no-air') return !kinds.includes('air');
  if (puzzle.constraint === 'two-continents') return new Set(route.map(id => getCountryByIsoCode(id)?.continent)).size >= 2;
  if (puzzle.constraint === 'shortest') return route.length === puzzle.shortest.length;
  return true;
}
