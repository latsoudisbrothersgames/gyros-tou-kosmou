import { useEffect } from 'react';
import type { Question } from '../types/game';
import { TIME_BONUS_WINDOW_MS } from '../game/scoring';
import { countryForChoice } from './choiceCountry';
import { useReactions } from './ReactionsProvider';

export function useQuizReactions(question: Question, answered: boolean, finished: boolean) {
  const bus = useReactions();
  useEffect(() => {
    if (!bus || finished) return;
    bus.emit({ type: 'question:new', iso2s: question.choices.map((choice) => countryForChoice(question, choice)?.iso2).filter((iso2): iso2 is string => Boolean(iso2)) });
  }, [bus, question, finished]);

  useEffect(() => {
    if (!bus || answered || finished) return;
    const started = performance.now();
    let sleeping = false;
    let idleTimer: ReturnType<typeof setTimeout>;
    const wake = () => {
      clearTimeout(idleTimer);
      if (sleeping) bus.emit({ type: 'question:new', iso2s: question.choices.map((choice) => countryForChoice(question, choice)?.iso2).filter((iso2): iso2 is string => Boolean(iso2)) });
      sleeping = false;
      idleTimer = setTimeout(() => { sleeping = true; bus.emit({ type: 'idle', seconds: 10 }); }, 10000);
    };
    const timer = setInterval(() => {
      const secondsLeft = Math.ceil((TIME_BONUS_WINDOW_MS - (performance.now() - started)) / 1000);
      if (secondsLeft < 3 && secondsLeft >= 0 && !sleeping) bus.emit({ type: 'timer:low', secondsLeft });
      if (secondsLeft <= 0) clearInterval(timer);
    }, 1000);
    wake();
    const inputs = ['pointerdown', 'pointermove', 'touchstart', 'keydown'] as const;
    inputs.forEach((type) => window.addEventListener(type, wake, { passive: true }));
    return () => {
      clearInterval(timer); clearTimeout(idleTimer);
      inputs.forEach((type) => window.removeEventListener(type, wake));
    };
  }, [bus, question, answered, finished]);
}
