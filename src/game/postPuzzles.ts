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
export const POST_SKIP = new Set(['xk', 'ps', 'tw', 'ma', 'mr']);
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
      if (POST_SKIP.has(b) || node.path.includes(b)) continue;
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
export function longerPostRoute(start: string, end: string, tickets: Tickets, minSteps: number, special = true):
  { path: string[]; kinds: TicketKind[] } | null {
  const max = Math.min(7, tickets.land + tickets.sea + tickets.air);
  const search = (at: string, path: string[], kinds: TicketKind[], used: Tickets): { path: string[]; kinds: TicketKind[] } | null => {
    if (at === end) return path.length - 1 > minSteps ? { path, kinds } : null;
    if (path.length - 1 >= max) return null;
    const adjacent = new Set([...landNeighbors(at, special),
      ...TRAVEL_LINKS.filter(l => l.a === at || l.b === at).map(l => l.a === at ? l.b : l.a)]);
    for (const next of adjacent) {
      if (POST_SKIP.has(next) || path.includes(next)) continue;
      for (const kind of travelOptions(at, next, special)) {
        if (used[kind] >= tickets[kind]) continue;
        const found = search(next, [...path, next], [...kinds, kind], { ...used, [kind]: used[kind] + 1 });
        if (found) return found;
      }
    }
    return null;
  };
  return search(start, [start], [], { land: 0, sea: 0, air: 0 });
}
export function makePostPuzzle(difficulty: DifficultyId, focus?: string, sequence = 0): PostPuzzle {
  const range = { easy: [2, 3], medium: [3, 5], hard: [4, 7] }[difficulty];
  const constraint: PostPuzzle['constraint'] = difficulty === 'easy' ? 'none'
    : (['no-air', 'two-continents', 'shortest'] as const)[sequence % 3];
  const tickets: Tickets = difficulty === 'easy' ? { land: 2, sea: 1, air: 0 }
    : difficulty === 'medium' ? { land: 3, sea: 2, air: 1 }
      : { land: 5, sea: 2, air: 1 };
  const pool = shuffle(ALL_COUNTRIES.filter(c => !POST_SKIP.has(c.iso2)));
  if (focus) {
    const chosen = getCountryByIsoCode(focus);
    if (chosen && !POST_SKIP.has(focus)) pool.unshift(chosen);
  }
  for (const sender of pool) {
    const routes = reachableRoutes(sender.iso2, constraint === 'no-air' ? { ...tickets, air: 0 } : tickets, difficulty !== 'easy');
    const unrestricted = constraint === 'no-air' ? reachableRoutes(sender.iso2, tickets, true) : routes;
    const candidates = shuffle(ALL_COUNTRIES.filter(c => {
      const path = routes.get(c.iso2);
      return path && path.length - 1 >= range[0] && path.length - 1 <= range[1]
        && (constraint !== 'no-air' || unrestricted.get(c.iso2)?.length === path.length)
        && (constraint !== 'two-continents' || c.continent !== sender.continent)
        && (constraint !== 'shortest' || !!longerPostRoute(sender.iso2, c.iso2, tickets, path.length - 1, difficulty !== 'easy'));
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
