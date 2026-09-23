import type { BallMood } from './events';

export function touchReaction(taps: number, longPress = false): { mood: BallMood; line: string; duration: number } {
  if (longPress) return { mood: 'love', line: 'Μια αγκαλιά για σένα!', duration: 2000 };
  if (taps >= 6) return { mood: 'dizzy', line: 'Ωχ, ζαλίστηκα!', duration: 2000 };
  if (taps >= 3) return { mood: 'giggle', line: 'Χι χι, με γαργαλάς!', duration: 1100 };
  return { mood: 'giggle', line: 'Χι χι!', duration: 650 };
}
