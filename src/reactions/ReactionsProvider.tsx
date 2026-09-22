import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useSettings } from '../context/SettingsContext';
import { createLiveBalls } from './liveBalls';
import type { ReactionEvent } from './events';

type Handler = (event: ReactionEvent) => void;

function createBus() {
  const subscribers = new Map<string, Set<Handler>>();
  let latest: ReactionEvent | null = null;
  return {
    ...createLiveBalls(),
    emit(event: ReactionEvent) {
      latest = event;
      // Οι άλλες ορατές μπάλες χειροκροτούν ή λυπούνται, άρα λαμβάνουν
      // και γεγονότα άλλων χωρών. Οι καθαροί κανόνες επιλέγουν την αντίδραση.
      subscribers.forEach((handlers) => handlers.forEach((handler) => handler(event)));
    },
    subscribe(iso2: string | '*', handler: Handler) {
      let handlers = subscribers.get(iso2);
      if (!handlers) { handlers = new Set(); subscribers.set(iso2, handlers); }
      handlers.add(handler);
      // Καλύπτει μπάλες που εμφανίζονται αμέσως μετά την απάντηση.
      if (latest) handler(latest);
      return () => { handlers.delete(handler); if (!handlers.size) subscribers.delete(iso2); };
    },
  };
}

const ReactionsContext = createContext<ReturnType<typeof createBus> | null>(null);
export function ReactionsProvider({ children }: { children: ReactNode }) {
  const bus = useMemo(createBus, []);
  const { settings } = useSettings();
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => bus.setReducedMotion(settings.reducedMotion || media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [bus, settings.reducedMotion]);
  useEffect(() => {
    let frame = 0;
    let point = { x: 0, y: 0 };
    const schedule = (x: number, y: number) => {
      point = { x, y };
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0; bus.moveEyes(point.x, point.y);
      });
    };
    const pointer = (event: PointerEvent) => schedule(event.clientX, event.clientY);
    const touch = (event: TouchEvent) => {
      const finger = event.touches[0];
      if (finger) schedule(finger.clientX, finger.clientY);
    };
    window.addEventListener('pointermove', pointer, { passive: true });
    window.addEventListener('touchmove', touch, { passive: true });
    return () => {
      window.removeEventListener('pointermove', pointer);
      window.removeEventListener('touchmove', touch);
      cancelAnimationFrame(frame);
    };
  }, [bus]);
  return <ReactionsContext.Provider value={bus}>{children}</ReactionsContext.Provider>;
}
export function useReactions() {
  return useContext(ReactionsContext);
}
