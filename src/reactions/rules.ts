import type { Reaction, ReactionEvent } from './events';

/** Καθαροί κανόνες: το null αφήνει ανεπηρέαστη μια άσχετη χώρα. */
export function reactionFor(event: ReactionEvent, iso2: string): Reaction | null {
  switch (event.type) {
    case 'question:new':
      return { steps: [{ mood: 'surprised', durationMs: 600 }, { mood: 'idle' }] };
    case 'answer:correct':
      if (event.streak >= 3) return { steps: [{ mood: 'dance', durationMs: 2000 }, { mood: 'idle' }], speech: 'mood' };
      return { steps: [
        { mood: event.iso2 === iso2 ? 'celebrate' : 'happy', durationMs: 2000 },
        { mood: 'happy', durationMs: 1500 }, { mood: 'idle' },
      ], speech: 'mood' };
    case 'answer:wrong':
      return { steps: [
        { mood: event.chosen === iso2 ? 'shrug' : event.correct === iso2 ? 'wave' : 'sad', durationMs: event.chosen === iso2 || event.correct === iso2 ? 2000 : 1000 },
        { mood: 'idle' },
      ], speech: 'mood' };
    case 'timer:low':
      return { steps: [{ mood: event.secondsLeft > 0 && event.secondsLeft < 3 ? 'nervous' : 'idle' }] };
    case 'idle':
      return { steps: [{ mood: 'sleepy' }], speech: 'mood' };
    case 'game:end': {
      const index = event.won.indexOf(iso2);
      if (index >= 0) return { steps: [{ mood: 'dance', durationMs: 2000 }, { mood: 'happy' }], delayMs: index * 180 };
      return event.lost.includes(iso2) ? { steps: [{ mood: 'sleepy' }] } : null;
    }
    case 'country:open':
      return event.iso2 === iso2 ? { steps: [{ mood: 'wave', durationMs: 1500 }, { mood: 'proud' }], speech: 'greeting' } : null;
    case 'map:near':
      return event.iso2 === iso2 ? { steps: [{ mood: event.distancePx < 80 ? 'shy' : 'idle' }] } : null;
    case 'collection:tap':
      return event.iso2 === iso2 ? { steps: [{ mood: 'celebrate', durationMs: 2000 }, { mood: 'idle' }], speech: 'fact' } : null;
  }
}
