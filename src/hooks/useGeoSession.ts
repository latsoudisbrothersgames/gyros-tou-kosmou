import { useRef, useState } from 'react';
import type { GameConfig, SessionState } from '../types/game';
import { addToCollection } from '../utils/collection';
import { playSound } from '../audio/soundManager';
import { vibrate } from '../utils/haptics';

const initial = (config: GameConfig): SessionState => ({ config, questionIndex: 0, score: 0,
  streak: 0, bestStreak: 0, answers: [], finished: false });

/** Κοινή συνεδρία για γύρους με πολλές σωστές επιλογές ή κινήσεις. */
export function useGeoSession<T>(config: GameConfig, makeRound: (index: number) => T, totalOverride?: number | null) {
  const [round, setRound] = useState(() => makeRound(0));
  const [state, setState] = useState(() => initial(config));
  const [answered, setAnswered] = useState(false);
  const locked = useRef(false);
  const started = useRef(performance.now());
  const total = totalOverride === undefined ? config.length === 'endless' ? null : config.length : totalOverride;
  const complete = (countryId: string, correct: boolean, points: number, collect: string[] = []) => {
    if (locked.current || state.finished) return false;
    locked.current = true;
    const discoveredIso2 = correct ? collect.filter(addToCollection) : [];
    const discovered = discoveredIso2.length > 0;
    const elapsed = performance.now() - started.current;
    setState(prev => ({ ...prev, score: prev.score + points,
      streak: correct ? prev.streak + 1 : 0,
      bestStreak: Math.max(prev.bestStreak, correct ? prev.streak + 1 : 0),
      answers: [...prev.answers, { questionId: `geo-${prev.questionIndex}`, countryId, correct,
        pointsAwarded: points, timeMs: elapsed, discovered, discoveredIso2 }] }));
    setAnswered(true);
    playSound(correct ? 'correct' : 'wrong');
    vibrate(correct ? 35 : [25, 60, 25]);
    return true;
  };
  const next = () => {
    if (!locked.current || state.finished) return;
    const index = state.questionIndex + 1;
    const finished = total !== null && index >= total;
    setState(prev => ({ ...prev, questionIndex: index, finished }));
    if (!finished) { setRound(makeRound(index)); setAnswered(false); locked.current = false; started.current = performance.now(); }
  };
  const restart = () => {
    setRound(makeRound(0)); setState(initial(config)); setAnswered(false);
    locked.current = false; started.current = performance.now();
  };
  const finish = () => { locked.current = true; setState(prev => ({ ...prev, finished: true })); };
  return { round, state, answered, total, complete, next, restart, finish };
}
export type GeoSession<T> = ReturnType<typeof useGeoSession<T>>;
