import { BORDERS } from '../data/borders';

/** Οι χαιρετισμοί ανήκουν αποκλειστικά σε επιβεβαιωμένες ταυτότητες. */
export function canGreet(a: string, b: string, identityA: boolean, identityB: boolean): boolean {
  return identityA && identityB && Boolean(BORDERS[a]?.includes(b));
}
