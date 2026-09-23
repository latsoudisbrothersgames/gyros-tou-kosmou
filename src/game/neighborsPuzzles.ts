import { ALL_COUNTRIES, getCountryByIsoCode } from '../data/countries';
import { BORDERS, landNeighbors } from '../data/borders';
import { TRAVEL_LINKS } from '../data/links';
import { shuffle } from './questionGenerator';
import type { Country } from '../types/country';
import type { DifficultyId } from '../types/game';

const SKIP = new Set(['xk', 'ps', 'tw', 'ma', 'mr']);
export interface NeighborsPuzzle {
  host: Country; guests: Country[]; correct: string[]; totalNeighbors: number;
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
  const near = new Set([
    ...real.flatMap(id => BORDERS[id] ?? []),
    ...TRAVEL_LINKS.filter(l => l.a === host.iso2 || l.b === host.iso2).map(l => l.a === host.iso2 ? l.b : l.a),
  ]);
  const traps = shuffle(ALL_COUNTRIES.filter(c => c.iso2 !== host.iso2 && !SKIP.has(c.iso2)
    && !real.includes(c.iso2) && (near.has(c.iso2) || c.continent === host.continent)));
  const guests = shuffle([...correct.map(id => getCountryByIsoCode(id)!), ...traps.slice(0, slots - correct.length)]);
  return { host, guests, correct, totalNeighbors: real.length };
}
