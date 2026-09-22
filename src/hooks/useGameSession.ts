import { useCallback, useMemo, useRef, useState } from 'react';
import type { GameConfig, Question, SessionState } from '../types/game';
import { QuestionStream } from '../game/questionGenerator';
import {
  applyHintPenalty,
  scoreCorrectAnswer,
  scoreWrongAnswer,
  type ScoreBreakdown,
} from '../game/scoring';
import { vibrate } from '../utils/haptics';
import { useReactions } from '../reactions/ReactionsProvider';
import { addToCollection } from '../utils/collection';

export interface GameSession {
  state: SessionState;
  question: Question;
  /** id επιλογής που διάλεξε ο παίκτης (ή iso2 χώρας στον χάρτη), null όσο δεν έχει απαντήσει */
  selectedAnswerId: string | null;
  lastBreakdown: ScoreBreakdown | null;
  totalQuestions: number | null;
  /** Ζητήθηκε βοήθεια στην τρέχουσα ερώτηση (μισοί πόντοι) */
  hintUsed: boolean;
  /** Επιλογές που «έκρυψε» η βοήθεια (50:50) */
  eliminatedIds: string[];
  useHint: () => void;
  /** iso2 φιγούρας που μόλις ξεκλειδώθηκε με τη σωστή απάντηση, αλλιώς null */
  lastCollected: string | null;
  answer: (answerId: string) => boolean;
  nextQuestion: () => void;
  restart: () => void;
}

function initialState(config: GameConfig): SessionState {
  return {
    config,
    questionIndex: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    answers: [],
    finished: false,
  };
}

/**
 * Κοινή μηχανή συνεδρίας για όλες τις λειτουργίες παιχνιδιού
 * (κουίζ πολλαπλής επιλογής και χάρτης).
 */
export function useGameSession(config: GameConfig, restrictToIso2?: Set<string>): GameSession {
  const reactions = useReactions();
  const streamRef = useRef<QuestionStream | null>(null);
  if (streamRef.current === null) {
    streamRef.current = new QuestionStream(config, restrictToIso2);
  }

  const [state, setState] = useState<SessionState>(() => initialState(config));
  const [question, setQuestion] = useState<Question>(() => streamRef.current!.next());
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [lastBreakdown, setLastBreakdown] = useState<ScoreBreakdown | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [eliminatedIds, setEliminatedIds] = useState<string[]>([]);
  const [lastCollected, setLastCollected] = useState<string | null>(null);
  const questionStartRef = useRef<number>(performance.now());

  const totalQuestions = useMemo(
    () => (config.length === 'endless' ? null : config.length),
    [config.length],
  );

  const answer = useCallback(
    (answerId: string): boolean => {
      if (selectedAnswerId !== null) return false;
      const timeMs = performance.now() - questionStartRef.current;
      const correct = answerId === question.correctAnswerId;
      let breakdown = correct
        ? scoreCorrectAnswer(state.streak, timeMs)
        : scoreWrongAnswer();
      if (correct && hintUsed) breakdown = applyHintPenalty(breakdown);
      const discovered = correct && addToCollection(question.countryId);
      setSelectedAnswerId(answerId);
      setLastBreakdown(breakdown);
      setLastCollected(discovered ? question.countryId : null);
      setState((prev) => {
        const streak = correct ? prev.streak + 1 : 0;
        return {
          ...prev,
          score: prev.score + breakdown.total,
          streak,
          bestStreak: Math.max(prev.bestStreak, streak),
          answers: [
            ...prev.answers,
            {
              questionId: question.id,
              countryId: question.countryId,
              correct,
              pointsAwarded: breakdown.total,
              timeMs,
              discovered,
            },
          ],
        };
      });
      vibrate(correct ? 35 : [25, 60, 25]);
      reactions?.emit(correct
        ? { type: 'answer:correct', iso2: question.countryId, streak: state.streak + 1 }
        : { type: 'answer:wrong', chosen: answerId, correct: question.countryId });
      return correct;
    },
    [question, selectedAnswerId, state.streak, hintUsed, reactions],
  );

  const useHintCb = useCallback(() => {
    if (selectedAnswerId !== null || hintUsed) return;
    setHintUsed(true);
    // 50:50 — κρύψε δύο τυχαίες λάθος επιλογές (αν υπάρχουν επιλογές)
    const wrong = question.choices
      .filter((c) => c.id !== question.correctAnswerId)
      .map((c) => c.id);
    for (let i = wrong.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wrong[i], wrong[j]] = [wrong[j], wrong[i]];
    }
    setEliminatedIds(wrong.slice(0, Math.min(2, Math.max(0, wrong.length - 1))));
  }, [selectedAnswerId, hintUsed, question]);

  const nextQuestion = useCallback(() => {
    if (selectedAnswerId === null) return;
    setState((prev) => {
      const nextIndex = prev.questionIndex + 1;
      const finished = totalQuestions !== null && nextIndex >= totalQuestions;
      return { ...prev, questionIndex: nextIndex, finished };
    });
    const nextIndex = state.questionIndex + 1;
    const willFinish = totalQuestions !== null && nextIndex >= totalQuestions;
    if (!willFinish) {
      setQuestion(streamRef.current!.next());
      setSelectedAnswerId(null);
      setLastBreakdown(null);
      setHintUsed(false);
      setEliminatedIds([]);
      setLastCollected(null);
      questionStartRef.current = performance.now();
    }
  }, [selectedAnswerId, state.questionIndex, totalQuestions]);

  const restart = useCallback(() => {
    streamRef.current = new QuestionStream(config, restrictToIso2);
    setState(initialState(config));
    setQuestion(streamRef.current.next());
    setSelectedAnswerId(null);
    setLastBreakdown(null);
    setHintUsed(false);
    setEliminatedIds([]);
    setLastCollected(null);
    questionStartRef.current = performance.now();
  }, [config, restrictToIso2]);

  return {
    state,
    question,
    selectedAnswerId,
    lastBreakdown,
    totalQuestions,
    hintUsed,
    eliminatedIds,
    useHint: useHintCb,
    lastCollected,
    answer,
    nextQuestion,
    restart,
  };
}
