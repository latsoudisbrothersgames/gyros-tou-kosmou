import { createLiveBalls } from './liveBalls';
import type { ReactionEvent } from './events';

type Handler = (event: ReactionEvent) => void;

export function createBus() {
  const subscribers = new Map<string, Set<Handler>>();
  let latest: ReactionEvent | null = null;
  return {
    ...createLiveBalls(),
    clear() { latest = null; },
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

