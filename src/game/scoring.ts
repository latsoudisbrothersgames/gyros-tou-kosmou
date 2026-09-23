/**
 * Σύστημα βαθμολόγησης — καθαρές συναρτήσεις, ανεξάρτητες από το UI,
 * ώστε οι κανόνες να αλλάζουν εύκολα στο μέλλον.
 */

export const BASE_POINTS = 100;
export const STREAK_BONUS_PER_STEP = 10;
export const MAX_STREAK_BONUS_STEPS = 10;
export const MAX_TIME_BONUS = 50;
/** Μέσα σε πόσο χρόνο (ms) δίνεται το πλήρες μπόνους ταχύτητας */
export const TIME_BONUS_WINDOW_MS = 10_000;

export interface ScoreBreakdown {
  base: number;
  streakBonus: number;
  timeBonus: number;
  total: number;
}

/**
 * @param streakBefore το σερί ΠΡΙΝ από αυτή την απάντηση
 * @param timeMs χρόνος απάντησης σε ms
 */
export function scoreCorrectAnswer(streakBefore: number, timeMs: number): ScoreBreakdown {
  const base = BASE_POINTS;
  const streakSteps = Math.min(streakBefore, MAX_STREAK_BONUS_STEPS);
  const streakBonus = streakSteps * STREAK_BONUS_PER_STEP;
  const remaining = Math.max(0, TIME_BONUS_WINDOW_MS - Math.max(0, timeMs));
  const timeBonus = Math.round((remaining / TIME_BONUS_WINDOW_MS) * MAX_TIME_BONUS);
  return { base, streakBonus, timeBonus, total: base + streakBonus + timeBonus };
}

export function scoreWrongAnswer(): ScoreBreakdown {
  return { base: 0, streakBonus: 0, timeBonus: 0, total: 0 };
}

/** Η βοήθεια (💡) κοστίζει τους μισούς πόντους της ερώτησης */
export function applyHintPenalty(b: ScoreBreakdown): ScoreBreakdown {
  const base = Math.round(b.base / 2);
  const streakBonus = Math.round(b.streakBonus / 2);
  const timeBonus = Math.round(b.timeBonus / 2);
  return { base, streakBonus, timeBonus, total: base + streakBonus + timeBonus };
}

/** Μορφοποίηση πόντων με ελληνικό διαχωριστικό χιλιάδων: 1.450 */
export function formatScore(points: number): string {
  return points.toLocaleString('el-GR');
}

/** Πόντοι μυστηρίου, χωρίς μπόνους χρόνου· το σερί μετριέται πριν την απάντηση. */
export function scoreWithHints(hintsUsed: number, streak: number): ScoreBreakdown {
  const base = [100, 70, 45, 25][Math.max(0, Math.min(3, Math.trunc(hintsUsed)))];
  const streakBonus = Math.min(Math.max(0, streak), MAX_STREAK_BONUS_STEPS) * STREAK_BONUS_PER_STEP;
  return { base, streakBonus, timeBonus: 0, total: base + streakBonus };
}

/** Τέλειος γύρος: 100 και μπόνους σερί. Αλλιώς αναλογική πίστωση. */
export function scoreNeighbors(correctPicked: number, missed: number, wrongPicked: number, streak: number): number {
  const total = correctPicked + missed;
  const perfect = missed === 0 && wrongPicked === 0;
  if (perfect) return 100 + Math.min(streak, MAX_STREAK_BONUS_STEPS) * STREAK_BONUS_PER_STEP;
  return Math.max(0, Math.round(100 * (total ? correctPicked / total : 0) - 20 * wrongPicked));
}
