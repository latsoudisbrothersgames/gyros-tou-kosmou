import type { BallMood } from './events';

/** Μέγιστο κενό ανάμεσα σε διαδοχικά πατήματα για να μετρήσουν ως ένα «σερί» (παιδικό δάχτυλο, iPhone). */
export const TAP_GAP_MS = 700;

/** Προσθέτει ένα πάτημα στο σερί ή ξεκινά νέο σερί αν πέρασε περισσότερο από TAP_GAP_MS από το προηγούμενο. */
export function nextTapStreak(history: readonly number[], now: number): number[] {
  const last = history[history.length - 1];
  return last !== undefined && now - last <= TAP_GAP_MS ? [...history, now] : [now];
}

export function touchReaction(taps: number, longPress = false): { mood: BallMood; line: string; duration: number } {
  if (longPress) return { mood: 'love', line: 'Μια αγκαλιά για σένα!', duration: 2000 };
  if (taps >= 6) return { mood: 'dizzy', line: 'Ωχ, ζαλίστηκα!', duration: 2000 };
  if (taps >= 3) return { mood: 'giggle', line: 'Χι χι, με γαργαλάς!', duration: 1100 };
  return { mood: 'giggle', line: 'Χι χι!', duration: 650 };
}
