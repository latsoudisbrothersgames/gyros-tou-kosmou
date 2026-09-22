import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';

let status = { offlineReady: false, updateReady: false };
const listeners = new Set<() => void>();
function publish(patch: Partial<typeof status>) {
  status = { ...status, ...patch };
  listeners.forEach((listener) => listener());
}

if ('serviceWorker' in navigator) {
  // Η ενεργοποίηση γίνεται μόνο αφού εγκατασταθεί ολόκληρο το precache.
  const controlledAtStart = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    publish({ offlineReady: true, updateReady: controlledAtStart });
  });
  navigator.serviceWorker.ready.then(() => publish({ offlineReady: true }));
  registerSW({
    immediate: true,
    // Με autoUpdate ο νέος SW ενεργοποιείται αυτόματα. Η σελίδα ανανεώνεται
    // με επιλογή του παίκτη, ώστε να μη χάνεται το παιχνίδι του.
    onOfflineReady: () => publish({ offlineReady: true }),
    onNeedReload: () => publish({ updateReady: true }),
    onNeedRefresh: () => publish({ updateReady: true }),
    onRegisteredSW: (_url, registration) => {
      registration?.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            publish({ updateReady: true });
          }
        });
      });
    },
  });
}

export function usePwaStatus() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    () => status,
  );
}
