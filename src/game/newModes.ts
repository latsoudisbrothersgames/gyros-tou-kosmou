import type { Country } from '../types/country';
import { CONTINENT_LABELS, formatPopulationGreek } from '../types/country';
import type { DifficultyId, GameConfig } from '../types/game';
import { generateCountryDistractors, getCountriesByDifficulty, shuffle } from './questionGenerator';

/** Η διάρκεια αφορά μία ολόκληρη διέλευση, με όριο διπλάσιας ταχύτητας. */
export function paradeSettings(difficulty: DifficultyId, correctAnswers: number) {
  const base = { easy: { count: 3, seconds: 9 }, medium: { count: 4, seconds: 7 }, hard: { count: 5, seconds: 5 } }[difficulty];
  const speed = Math.min(2, 1.1 ** Math.floor(correctAnswers / 3));
  return { count: base.count, durationMs: base.seconds * 1000 / speed, speed };
}

export type ComparisonMetric = 'population' | 'areaKm2';
export function comparisonRatio(difficulty: DifficultyId) {
  return { easy: 3, medium: 1.5, hard: 1.15 }[difficulty];
}
export function validComparison(a: Country, b: Country, metric: ComparisonMetric, difficulty: DifficultyId) {
  const x = a[metric], y = b[metric];
  return a.iso2 !== b.iso2 && x != null && y != null && Number.isFinite(x) && Number.isFinite(y)
    && x > 0 && y > 0 && Math.max(x, y) / Math.min(x, y) >= comparisonRatio(difficulty);
}

export interface ModeRound {
  id: string;
  country: Country;
  choices: Country[];
  metric?: ComparisonMetric;
}

/** Αγνοούμε τόνους και πτώσεις στις συνηθισμένες καταλήξεις των ονομάτων. */
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('el');
export function safeMysteryFact(country: Country): string {
  const names = [country.nameGreek, country.capitalGreek, country.nameEnglish, country.capitalEnglish ?? '',
    country.nameGreekAccusative, country.nameGreekGenitive];
  const words = names.flatMap(name => normalize(name).split(/[^a-zα-ω]+/)).filter(word => word.length >= 4);
  const stems = words.map(word => word.length > 4 ? word.slice(0, -1) : word);
  const safe = (text: string) => !stems.some(stem => normalize(text).includes(stem));
  const candidates = [...country.factsGreek,
    ...(country.currencyGreek ? [`Το νόμισμά μου είναι: ${country.currencyGreek}.`] : []),
    ...(country.languagesGreek?.length ? [`Μιλάμε: ${country.languagesGreek.join(', ')}.`] : [])];
  return candidates.find(safe) ?? 'Χρησιμοποιούμε χρήματα για τις καθημερινές μας αγορές.';
}
export function mysteryHints(country: Country): string[] {
  return [`Βρίσκομαι στην ήπειρο: ${CONTINENT_LABELS[country.continent]}.`,
    `Η πρωτεύουσά μου αρχίζει από «${Array.from(country.capitalGreek)[0]}». Πληθυσμός: ${formatPopulationGreek(country.population)}.`,
    safeMysteryFact(country)];
}

/** Ξεχωριστή ροή, ώστε να μην αλλάζει η συμπεριφορά των προηγούμενων modes. */
let roundCounter = 0;
export class NewModeStream {
  private queue: Country[] = [];
  private index = 0;
  private config: GameConfig;
  private pool: Country[];
  private focus?: Country;
  constructor(config: GameConfig) {
    this.config = config;
    this.pool = getCountriesByDifficulty(config.difficulty);
    this.focus = this.pool.find(country => country.iso2 === config.focusCountryId);
  }
  next(): ModeRound {
    if (this.config.mode === 'bigger') {
      const metric: ComparisonMetric = this.index++ % 2 === 0 ? 'population' : 'areaKm2';
      const candidates = shuffle(this.pool);
      if (this.focus) { candidates.unshift(this.focus); this.focus = undefined; }
      for (const first of candidates) {
        const second = shuffle(this.pool).find(other => validComparison(first, other, metric, this.config.difficulty));
        if (!second) continue;
        const country = first[metric]! > second[metric]! ? first : second;
        return { id: `new-${++roundCounter}`, country, choices: shuffle([first, second]), metric };
      }
      throw new Error('Δεν υπάρχουν συγκρίσιμες χώρες σε αυτό το επίπεδο.');
    }
    if (!this.queue.length) this.queue = shuffle(this.pool);
    const country = this.focus ?? this.queue.pop()!;
    if (this.focus) { this.queue = this.queue.filter(c => c !== this.focus); this.focus = undefined; }
    const count = this.config.mode === 'parade' ? paradeSettings(this.config.difficulty, 0).count : 4;
    return { id: `new-${++roundCounter}`, country,
      choices: shuffle([country, ...generateCountryDistractors(country, count - 1, this.config.difficulty, this.pool)]) };
  }
}
