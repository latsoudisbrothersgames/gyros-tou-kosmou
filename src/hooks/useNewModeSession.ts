import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameConfig, SessionState } from '../types/game';
import { NewModeStream } from '../game/newModes';
import type { ScoreBreakdown } from '../game/scoring';
import { useReactions } from '../reactions/ReactionsProvider';
import { addToCollection } from '../utils/collection';
import { vibrate } from '../utils/haptics';
import { playSound } from '../audio/soundManager';

const initialState = (config: GameConfig): SessionState => ({ config, questionIndex: 0, score: 0,
  streak: 0, bestStreak: 0, answers: [], finished: false });

/** Κοινός κύκλος ζωής μόνο για τα νέα παιχνίδια. Κλείδωμα πριν από κάθε παρενέργεια. */
export function useNewModeSession(config: GameConfig) {
  const reactions = useReactions();
  const [stream, setStream] = useState(() => new NewModeStream(config));
  const [round, setRound] = useState(() => stream.next());
  const [state, setState] = useState(() => initialState(config));
  const [selected, setSelected] = useState<string | null>(null);
  const locked = useRef(false);
  const started = useRef(performance.now());
  const total = config.length === 'endless' ? null : config.length;
  useEffect(() => {
    reactions?.emit({ type: 'question:new', iso2s: round.choices.map(c => c.iso2) });
  }, [round, reactions]);
  const answer = useCallback((iso2: string, score: (streak: number, elapsed: number) => ScoreBreakdown) => {
    if (locked.current || state.finished) return;
    locked.current = true;
    const elapsed = performance.now() - started.current;
    const correct = iso2 === round.country.iso2;
    const points = correct ? score(state.streak, elapsed).total : 0;
    const discovered = correct && addToCollection(round.country.iso2);
    setSelected(iso2);
    setState(prev => ({ ...prev, score: prev.score + points, streak: correct ? prev.streak + 1 : 0,
      bestStreak: Math.max(prev.bestStreak, correct ? prev.streak + 1 : 0),
      answers: [...prev.answers, { questionId: round.id, countryId: round.country.iso2, correct,
        pointsAwarded: points, timeMs: elapsed, discovered }] }));
    playSound(correct ? 'correct' : 'wrong');
    vibrate(correct ? 35 : [25, 60, 25]);
    reactions?.emit(correct ? { type: 'answer:correct', iso2, streak: state.streak + 1 }
      : { type: 'answer:wrong', chosen: iso2, correct: round.country.iso2 });
  }, [round, state.streak, state.finished, reactions]);
  const next = useCallback(() => {
    if (!locked.current || state.finished) return;
    locked.current = false;
    const finished = total !== null && state.questionIndex + 1 >= total;
    setState(prev => ({ ...prev, questionIndex: prev.questionIndex + 1, finished }));
    if (!finished) { setRound(stream.next()); setSelected(null); started.current = performance.now(); }
  }, [state.questionIndex, state.finished, stream, total]);
  const restart = () => {
    const fresh = new NewModeStream(config);
    setStream(fresh); setRound(fresh.next()); setState(initialState(config));
    setSelected(null); locked.current = false; started.current = performance.now();
  };
  const finish = () => { locked.current = true; setState(prev => ({ ...prev, finished: true })); };
  return { state, round, selected, total, answer, next, restart, finish };
}
export type NewModeSession = ReturnType<typeof useNewModeSession>;
