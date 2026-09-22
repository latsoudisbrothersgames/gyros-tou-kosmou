let enabled = true;
export function setHapticsEnabled(value: boolean) { enabled = value; }

/** Το iPhone μπορεί να μην εκθέτει vibrate· η απουσία του είναι κανονική. */
export function vibrate(pattern: number | number[]): void {
  if (!enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch { /* Χωρίς άδεια δόνησης συνεχίζουμε κανονικά. */ }
}
