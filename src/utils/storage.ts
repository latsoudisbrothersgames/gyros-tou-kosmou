import type { ScoreEntry, Settings } from '../types/game';
import { DEFAULT_SETTINGS } from '../types/game';
import { readStorage, writeStorage } from '../hooks/useLocalStorage';

/** Κλειδιά με έκδοση για μελλοντικές μεταφορές δεδομένων */
export const SCORES_KEY = 'geographyGame:scores:v1';
export const SETTINGS_KEY = 'geographyGame:settings:v1';

export const MAX_SCOREBOARD_ENTRIES = 20;
export const MAX_PLAYER_NAME_LENGTH = 20;

export function isScoreEntryArray(v: unknown): v is ScoreEntry[] {
  return (
    Array.isArray(v) &&
    v.every(
      (e) =>
        e != null &&
        typeof e === 'object' &&
        typeof (e as ScoreEntry).playerName === 'string' &&
        typeof (e as ScoreEntry).score === 'number',
    )
  );
}

export function isSettings(v: unknown): v is Settings {
  return (
    v != null &&
    typeof v === 'object' &&
    typeof (v as Settings).soundEnabled === 'boolean'
  );
}

export function loadScores(): ScoreEntry[] {
  return readStorage<ScoreEntry[]>(SCORES_KEY, [], isScoreEntryArray);
}

export function saveScores(scores: ScoreEntry[]): void {
  writeStorage(SCORES_KEY, scores);
}

/** Καθαρισμός ονόματος: αφαίρεση αόρατων/επικίνδυνων χαρακτήρων, όριο μήκους */
export function sanitizePlayerName(raw: string): string {
  return raw
    // Οι χαρακτήρες ελέγχου αφαιρούνται σκόπιμα από το όνομα παίκτη.
    // oxlint-disable-next-line no-control-regex
    .replace(/[<>\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_PLAYER_NAME_LENGTH);
}

/** Προσθήκη σκορ: ταξινόμηση φθίνουσα, κράτημα των κορυφαίων. Επιστρέφει τη νέα λίστα και το id. */
export function addScore(entry: Omit<ScoreEntry, 'id'>): { scores: ScoreEntry[]; id: string } {
  const id = `s-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const full: ScoreEntry = { ...entry, id };
  const scores = [...loadScores(), full]
    .sort((a, b) => b.score - a.score || a.date.localeCompare(b.date))
    .slice(0, MAX_SCOREBOARD_ENTRIES);
  saveScores(scores);
  return { scores, id };
}

export function clearScores(): void {
  saveScores([]);
}

export function loadSettings(): Settings {
  const stored = readStorage<Settings>(SETTINGS_KEY, { ...DEFAULT_SETTINGS, reducedMotion: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches }, isSettings);
  return { ...DEFAULT_SETTINGS, ...stored,
    hapticsEnabled: typeof stored.hapticsEnabled === 'boolean' ? stored.hapticsEnabled : true,
    reducedMotion: typeof stored.reducedMotion === 'boolean' ? stored.reducedMotion
      : typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
}

export function saveSettings(settings: Settings): void {
  writeStorage(SETTINGS_KEY, settings);
}
