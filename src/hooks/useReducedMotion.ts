import { useEffect, useState } from 'react';
import { useSettings } from '../context/SettingsContext';

/** Ζωντανή αλλαγή τόσο της ρύθμισης όσο και της προτίμησης του συστήματος. */
export function useReducedMotion() {
  const { settings } = useSettings();
  const [system, setSystem] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystem(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return settings.reducedMotion || system;
}
