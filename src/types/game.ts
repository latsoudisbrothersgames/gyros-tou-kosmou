import type { DifficultyTier } from './country';

/** Τύποι ερωτήσεων — επεκτάσιμο για μελλοντικές λειτουργίες */
export type QuestionType =
  | 'FLAG_TO_COUNTRY'
  | 'COUNTRY_TO_FLAG'
  | 'COUNTRY_TO_CAPITAL'
  | 'FIND_ON_MAP'
  | 'LANDMARK_TO_COUNTRY';

/** Λειτουργίες παιχνιδιού όπως εμφανίζονται στο μενού */
export type GameModeId = 'country' | 'capital' | 'flags' | 'map' | 'landmark' | 'scratch' | 'whoami' | 'parade' | 'bigger' | 'neighbors' | 'post' | 'puzzle';

export const GAME_MODE_LABELS: Record<GameModeId, string> = {
  country: 'Βρες τη Χώρα',
  capital: 'Βρες την Πρωτεύουσα',
  flags: 'Σημαίες',
  map: 'Βρες τη Χώρα στον Χάρτη',
  landmark: 'Μνημεία του Κόσμου',
  scratch: 'Ξύσε τη Σημαία',
  whoami: 'Ποιος είμαι;',
  parade: 'Παρέλαση Σημαιών',
  bigger: 'Ποια είναι η μεγαλύτερη;',
  neighbors: 'Οι γείτονες χτυπούν την πόρτα',
  post: 'Το ταχυδρομείο των CountryBalls',
  puzzle: 'Ο άτλαντας έγινε κομμάτια',
};

export type DifficultyId = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_LABELS: Record<DifficultyId, string> = {
  easy: 'Εύκολο',
  medium: 'Μεσαίο',
  hard: 'Δύσκολο',
};

/** Πόσες ερωτήσεις: 10, 20 ή ατέρμονο (Infinity) */
export type SessionLength = 10 | 20 | 'endless';

export interface AnswerChoice {
  id: string;
  /** Κείμενο απάντησης (όνομα χώρας ή πρωτεύουσας) — κενό για επιλογές-σημαίες */
  label: string;
  /** iso2 όταν η επιλογή είναι σημαία */
  flagIso2?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  /** iso2 της σωστής χώρας */
  countryId: string;
  prompt: string;
  choices: AnswerChoice[];
  correctAnswerId: string;
  /** id μνημείου για ερωτήσεις LANDMARK_TO_COUNTRY */
  landmarkId?: string;
}

/** Παραλλαγή για τη λειτουργία «Σημαίες» */
export type FlagVariant = 'mixed' | 'flag-to-country' | 'country-to-flag';

export const FLAG_VARIANT_LABELS: Record<FlagVariant, string> = {
  mixed: 'Μικτό',
  'flag-to-country': 'Σημαία → Χώρα',
  'country-to-flag': 'Χώρα → Σημαία',
};

export interface GameConfig {
  mode: GameModeId;
  difficulty: DifficultyId;
  length: SessionLength;
  /** Μόνο για mode = 'flags' */
  flagVariant?: FlagVariant;
  /** Προαιρετικά: εξασφάλισε ότι θα εμφανιστεί συγκεκριμένη χώρα (π.χ. από σελίδα χώρας) */
  focusCountryId?: string;
}

export interface AnswerRecord {
  questionId: string;
  countryId: string;
  correct: boolean;
  /** Πόντοι που κερδήθηκαν σε αυτή την ερώτηση */
  pointsAwarded: number;
  timeMs: number;
  /** Η απάντηση ξεκλείδωσε τη φιγούρα της χώρας για ΠΡΩΤΗ φορά */
  discovered?: boolean;
}

export interface SessionState {
  config: GameConfig;
  questionIndex: number;
  score: number;
  streak: number;
  bestStreak: number;
  answers: AnswerRecord[];
  finished: boolean;
}

/** Εγγραφή βαθμολογίας στον πίνακα */
export interface ScoreEntry {
  id: string;
  playerName: string;
  score: number;
  mode: GameModeId;
  difficulty: DifficultyId;
  correctAnswers: number;
  totalQuestions: number;
  /** ISO ημερομηνία */
  date: string;
}

export interface Settings {
  soundEnabled: boolean;
  reducedMotion: boolean;
  hapticsEnabled: boolean;
  lastDifficulty: DifficultyId;
  lastPlayerName: string;
}

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  reducedMotion: false,
  hapticsEnabled: true,
  lastDifficulty: 'easy',
  lastPlayerName: '',
};

export function tiersForDifficulty(difficulty: DifficultyId): DifficultyTier[] {
  switch (difficulty) {
    case 'easy':
      return [1];
    case 'medium':
      return [1, 2];
    case 'hard':
      return [1, 2, 3];
  }
}
