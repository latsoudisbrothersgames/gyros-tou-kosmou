import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ReactionEvent } from './events';

type Handler = (event: ReactionEvent) => void;

function createBus() {
  const subscribers = new Map<string, Set<Handler>>();
  let latest: ReactionEvent | null = null;
  return {
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
  return <ReactionsContext.Provider value={bus}>{children}</ReactionsContext.Provider>;
}
export function useReactions() {
  return useContext(ReactionsContext);
}
