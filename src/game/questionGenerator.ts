import type { Country } from '../types/country';
import type {
  AnswerChoice,
  DifficultyId,
  GameConfig,
  Question,
  QuestionType,
} from '../types/game';
import { tiersForDifficulty } from '../types/game';
import { ALL_COUNTRIES } from '../data/countries';
import { LANDMARKS_BY_ISO2, getRandomLandmarkForCountry } from '../data/landmarks';

let questionCounter = 0;

/**
 * Ομάδες «παρόμοιων σημαιών» για πιο δύσκολους αντιπερισπασμούς
 * σε μεσαίο/δύσκολο επίπεδο (κάθε ομάδα = iso2 κωδικοί).
 */
const SIMILAR_FLAG_GROUPS: string[][] = [
  ['nl', 'lu', 'ru', 'rs', 'sk', 'si', 'hr'],
  ['ro', 'td', 'ad', 'md'],
  ['id', 'mc', 'pl', 'sg'],
  ['gr', 'uy', 'il'],
  ['ie', 'ci', 'it', 'mx'],
  ['no', 'is', 'dk', 'se', 'fi'],
  ['au', 'nz', 'fj', 'tv'],
  ['co', 've', 'ec'],
  ['eg', 'iq', 'sy', 'ye'],
  ['jo', 'ps', 'sd', 'kw', 'ae'],
  ['ml', 'sn', 'gn', 'cm', 'gh', 'bj'],
  ['ar', 'hn', 'sv', 'ni', 'gt'],
  ['bg', 'hu', 'ta'],
  ['cz', 'ph', 'cr', 'th', 'kp'],
  ['us', 'lr', 'my'],
  ['tr', 'tn', 'pk', 'dz', 'mr'],
  ['gb', 'ge', 'ch', 'dk'],
  ['lt', 'bo', 'gh', 'et'],
  ['ba', 'ks', 'eu'],
  ['qa', 'bh'],
  ['in', 'ne', 'mw'],
  ['cl', 'tx', 'cu', 'pr'],
  ['vn', 'cn', 'ma', 'tw'],
  ['at', 'lv', 'lb', 'pe', 'ca'],
];

const similarByIso2 = new Map<string, Set<string>>();
for (const group of SIMILAR_FLAG_GROUPS) {
  for (const iso of group) {
    const set = similarByIso2.get(iso) ?? new Set<string>();
    for (const other of group) if (other !== iso) set.add(other);
    similarByIso2.set(iso, set);
  }
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getCountriesByDifficulty(
  difficulty: DifficultyId,
  pool: Country[] = ALL_COUNTRIES,
): Country[] {
  const tiers = new Set(tiersForDifficulty(difficulty));
  return pool.filter((c) => tiers.has(c.tier));
}

export function getRandomCountry(pool: Country[] = ALL_COUNTRIES): Country {
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Αντιπερισπασμοί-χώρες: προτεραιότητα σε παρόμοιες σημαίες (δύσκολο),
 * μετά ίδια ήπειρο, μετά τυχαίες από το επίπεδο δυσκολίας.
 */
export function generateCountryDistractors(
  correct: Country,
  count: number,
  difficulty: DifficultyId,
  pool: Country[],
): Country[] {
  const result: Country[] = [];
  const used = new Set<string>([correct.iso2]);
  const take = (candidates: Country[]) => {
    for (const c of shuffle(candidates)) {
      if (result.length >= count) break;
      if (!used.has(c.iso2)) {
        used.add(c.iso2);
        result.push(c);
      }
    }
  };

  if (difficulty !== 'easy') {
    const similar = similarByIso2.get(correct.iso2);
    if (similar) take(pool.filter((c) => similar.has(c.iso2)));
  }
  take(pool.filter((c) => c.continent === correct.continent));
  take(pool);
  take(ALL_COUNTRIES);
  return result.slice(0, count);
}

/** Αντιπερισπασμοί-πρωτεύουσες: πρωτεύουσες χωρών της ίδιας ηπείρου κατά προτίμηση. */
export function generateCapitalDistractors(
  correct: Country,
  count: number,
  pool: Country[],
): string[] {
  const result: string[] = [];
  const used = new Set<string>([correct.capitalGreek]);
  const take = (candidates: Country[]) => {
    for (const c of shuffle(candidates)) {
      if (result.length >= count) break;
      if (!used.has(c.capitalGreek)) {
        used.add(c.capitalGreek);
        result.push(c.capitalGreek);
      }
    }
  };
  take(pool.filter((c) => c.continent === correct.continent));
  take(pool);
  take(ALL_COUNTRIES);
  return result.slice(0, count);
}

function nextQuestionId(): string {
  questionCounter += 1;
  return `q-${questionCounter}`;
}

export function buildQuestion(
  type: QuestionType,
  country: Country,
  difficulty: DifficultyId,
  pool: Country[],
): Question {
  const id = nextQuestionId();
  switch (type) {
    case 'FLAG_TO_COUNTRY': {
      const distractors = generateCountryDistractors(country, 3, difficulty, pool);
      const choices: AnswerChoice[] = shuffle([
        { id: country.iso2, label: country.nameGreek },
        ...distractors.map((c) => ({ id: c.iso2, label: c.nameGreek })),
      ]);
      return {
        id,
        type,
        countryId: country.iso2,
        prompt: 'Ποια χώρα έχει αυτή τη σημαία;',
        choices,
        correctAnswerId: country.iso2,
      };
    }
    case 'COUNTRY_TO_FLAG': {
      const distractors = generateCountryDistractors(country, 3, difficulty, pool);
      const choices: AnswerChoice[] = shuffle([
        { id: country.iso2, label: country.nameGreek, flagIso2: country.iso2 },
        ...distractors.map((c) => ({ id: c.iso2, label: c.nameGreek, flagIso2: c.iso2 })),
      ]);
      return {
        id,
        type,
        countryId: country.iso2,
        prompt: `Ποια είναι η σημαία ${country.nameGreekGenitive};`,
        choices,
        correctAnswerId: country.iso2,
      };
    }
    case 'COUNTRY_TO_CAPITAL': {
      const distractors = generateCapitalDistractors(country, 3, pool);
      const choices: AnswerChoice[] = shuffle([
        { id: `cap-${country.iso2}`, label: country.capitalGreek },
        ...distractors.map((cap, i) => ({ id: `cap-x${i}`, label: cap })),
      ]);
      return {
        id,
        type,
        countryId: country.iso2,
        prompt: `Ποια είναι η πρωτεύουσα ${country.nameGreekGenitive};`,
        choices,
        correctAnswerId: `cap-${country.iso2}`,
      };
    }
    case 'FIND_ON_MAP': {
      return {
        id,
        type,
        countryId: country.iso2,
        prompt: `Βρες ${country.nameGreekAccusative} στον χάρτη`,
        choices: [],
        correctAnswerId: country.iso2,
      };
    }
    case 'LANDMARK_TO_COUNTRY': {
      const landmark = getRandomLandmarkForCountry(country.iso2);
      const distractors = generateCountryDistractors(country, 3, difficulty, pool);
      const choices: AnswerChoice[] = shuffle([
        { id: country.iso2, label: country.nameGreek },
        ...distractors.map((c) => ({ id: c.iso2, label: c.nameGreek })),
      ]);
      return {
        id,
        type,
        countryId: country.iso2,
        prompt: 'Σε ποια χώρα βρίσκεται αυτό το μνημείο;',
        choices,
        correctAnswerId: country.iso2,
        landmarkId: landmark?.id,
      };
    }
  }
}

function questionTypesForMode(config: GameConfig): QuestionType[] {
  switch (config.mode) {
    case 'country':
      return ['FLAG_TO_COUNTRY'];
    case 'capital':
      return ['COUNTRY_TO_CAPITAL'];
    case 'flags':
      switch (config.flagVariant ?? 'mixed') {
        case 'flag-to-country':
          return ['FLAG_TO_COUNTRY'];
        case 'country-to-flag':
          return ['COUNTRY_TO_FLAG'];
        case 'mixed':
          return ['FLAG_TO_COUNTRY', 'COUNTRY_TO_FLAG'];
      }
    case 'map':
      return ['FIND_ON_MAP'];
    case 'landmark':
      return ['LANDMARK_TO_COUNTRY'];
    case 'bigger':
    case 'parade':
    case 'whoami':
    case 'neighbors':
    case 'post':
    case 'puzzle':
      throw new Error('Το νέο mode έχει δική του ροή ερωτήσεων.');
    case 'scratch':
      // Η σελίδα «Ξύσε τη Σημαία» χρειάζεται επιλογές τύπου σημαία → χώρα
      return ['FLAG_TO_COUNTRY'];
  }
}

/**
 * Ροή ερωτήσεων χωρίς κοντινές επαναλήψεις: ανακατεμένη ουρά χωρών
 * που ξαναγεμίζει όταν εξαντληθεί.
 */
export class QuestionStream {
  private queue: Country[] = [];
  private readonly pool: Country[];
  private readonly config: GameConfig;
  private pendingFocus?: Country;

  constructor(config: GameConfig, restrictToIso2?: Set<string>) {
    this.config = config;
    let pool = getCountriesByDifficulty(config.difficulty);
    if (restrictToIso2) {
      pool = pool.filter((c) => restrictToIso2.has(c.iso2));
    }
    if (config.mode === 'landmark') {
      // Μόνο χώρες με διαθέσιμο μνημείο· αν το επίπεδο δυσκολίας τις
      // περιορίζει πολύ, άνοιξε σε όλες τις χώρες με μνημεία.
      let landmarkPool = pool.filter((c) => LANDMARKS_BY_ISO2.has(c.iso2));
      if (landmarkPool.length < 4) {
        landmarkPool = ALL_COUNTRIES.filter((c) => LANDMARKS_BY_ISO2.has(c.iso2));
      }
      pool = landmarkPool;
    }
    if (pool.length < 4) {
      pool = restrictToIso2
        ? ALL_COUNTRIES.filter((c) => restrictToIso2.has(c.iso2))
        : ALL_COUNTRIES;
    }
    this.pool = pool;
    if (config.focusCountryId) {
      this.pendingFocus = this.pool.find((c) => c.iso2 === config.focusCountryId)
        ?? ALL_COUNTRIES.find((c) => c.iso2 === config.focusCountryId);
    }
  }

  next(): Question {
    let country: Country;
    if (this.pendingFocus) {
      country = this.pendingFocus;
      this.pendingFocus = undefined;
      this.queue = this.queue.filter((c) => c.iso2 !== country.iso2);
    } else {
      if (this.queue.length === 0) this.queue = shuffle(this.pool);
      country = this.queue.pop()!;
    }
    const types = questionTypesForMode(this.config);
    const type = types[Math.floor(Math.random() * types.length)];
    return buildQuestion(type, country, this.config.difficulty, this.pool);
  }
}
