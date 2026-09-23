import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { GameConfig, Question, SessionState } from '../types/game';
import { QuestionStream } from '../game/questionGenerator';
import {
  MAX_STREAK_BONUS_STEPS,
  STREAK_BONUS_PER_STEP,
} from '../game/scoring';
import { parseGameConfig } from './QuizGamePage';
import { playSound } from '../audio/soundManager';
import { addToCollection } from '../utils/collection';
import { getCountryByIsoCode } from '../data/countries';
import { ExplorerPassport } from '../components/Passport/ExplorerPassport';
import { ScoreDisplay } from '../components/ScoreDisplay/ScoreDisplay';
import { GameResults } from '../components/GameResults/GameResults';
import { Button } from '../components/Button/Button';
import { CountryBall } from '../components/CountryBall/CountryBall';
import {
  COVER_KINDS,
  COVER_LABELS,
  ScratchFlag,
  type CoverKind,
} from '../components/ScratchFlag/ScratchFlag';
import './ScratchGamePage.css';

const AUTO_ADVANCE_MS = 3000;

/** Όσο λιγότερο έχει αποκαλυφθεί η σημαία, τόσο περισσότεροι πόντοι */
export function scratchBasePoints(revealedFraction: number): number {
  if (revealedFraction < 0.2) return 200;
  if (revealedFraction < 0.4) return 160;
  if (revealedFraction < 0.6) return 130;
  if (revealedFraction < 0.8) return 100;
  return 80;
}

function randomCover(): CoverKind {
  return COVER_KINDS[Math.floor(Math.random() * COVER_KINDS.length)];
}

export function ScratchGamePage() {
  const [searchParams] = useSearchParams();
  const config = useMemo(() => parseGameConfig('scratch', searchParams), [searchParams]);
  if (!config) return null;
  return <ScratchSession config={config} />;
}

function ScratchSession({ config }: { config: GameConfig }) {
  const navigate = useNavigate();
  const streamRef = useRef<QuestionStream | null>(null);
  if (streamRef.current === null) streamRef.current = new QuestionStream(config);

  const [state, setState] = useState<SessionState>(() => ({
    config,
    questionIndex: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    answers: [],
    finished: false,
  }));
  const [question, setQuestion] = useState<Question>(() => streamRef.current!.next());
  const [cover, setCover] = useState<CoverKind>(() => randomCover());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastPoints, setLastPoints] = useState(0);
  const [lastCollected, setLastCollected] = useState<string | null>(null);
  const revealRef = useRef(0);
  const [revealPct, setRevealPct] = useState(0);
  const autoAdvanceRef = useRef<number | null>(null);

  const totalQuestions = config.length === 'endless' ? null : config.length;
  const country = getCountryByIsoCode(question.countryId);
  const answered = selectedId !== null;
  const answeredCorrectly = answered && selectedId === question.correctAnswerId;

  const handleReveal = useCallback((fraction: number) => {
    revealRef.current = fraction;
    setRevealPct(Math.round(fraction * 100));
  }, []);

  const nextQuestion = useCallback(() => {
    if (autoAdvanceRef.current) window.clearTimeout(autoAdvanceRef.current);
    setState((prev) => {
      const nextIndex = prev.questionIndex + 1;
      const finished = totalQuestions !== null && nextIndex >= totalQuestions;
      return { ...prev, questionIndex: nextIndex, finished };
    });
    const willFinish =
      totalQuestions !== null && state.questionIndex + 1 >= totalQuestions;
    if (!willFinish) {
      setQuestion(streamRef.current!.next());
      setCover(randomCover());
      setSelectedId(null);
      setLastPoints(0);
      setLastCollected(null);
      revealRef.current = 0;
      setRevealPct(0);
    }
  }, [state.questionIndex, totalQuestions]);

  const handleSelect = useCallback(
    (choiceId: string) => {
      if (answered) return;
      const correct = choiceId === question.correctAnswerId;
      const base = correct ? scratchBasePoints(revealRef.current) : 0;
      const streakBonus = correct
        ? Math.min(state.streak, MAX_STREAK_BONUS_STEPS) * STREAK_BONUS_PER_STEP
        : 0;
      const total = base + streakBonus;
      const discovered = correct && addToCollection(question.countryId);
      setSelectedId(choiceId);
      setLastPoints(total);
      setLastCollected(discovered ? question.countryId : null);
      playSound(correct ? 'correct' : 'wrong');
      setState((prev) => {
        const streak = correct ? prev.streak + 1 : 0;
        return {
          ...prev,
          score: prev.score + total,
          streak,
          bestStreak: Math.max(prev.bestStreak, streak),
          answers: [
            ...prev.answers,
            {
              questionId: question.id,
              countryId: question.countryId,
              correct,
              pointsAwarded: total,
              timeMs: 0,
              discovered,
            },
          ],
        };
      });
      if (autoAdvanceRef.current) window.clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = window.setTimeout(nextQuestion, AUTO_ADVANCE_MS);
    },
    [answered, question, state.streak, nextQuestion],
  );

  const restart = useCallback(() => {
    streamRef.current = new QuestionStream(config);
    setState({
      config,
      questionIndex: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      answers: [],
      finished: false,
    });
    setQuestion(streamRef.current.next());
    setCover(randomCover());
    setSelectedId(null);
    setLastPoints(0);
    setLastCollected(null);
    revealRef.current = 0;
    setRevealPct(0);
  }, [config]);

  useEffect(
    () => () => {
      if (autoAdvanceRef.current) window.clearTimeout(autoAdvanceRef.current);
    },
    [],
  );

  if (state.finished) {
    return <GameResults state={state} onPlayAgain={restart} />;
  }

  const potentialPoints = scratchBasePoints(revealRef.current);

  return (
    <div className="scratch">
      <div className="scratch__top">
        <Button variant="ghost" onClick={() => navigate('/games')} aria-label="Έξοδος από το παιχνίδι">
          ← Έξοδος
        </Button>
        <span className="scratch__mode">Ξύσε τη Σημαία</span>
        {config.length === 'endless' && (
          <Button variant="secondary" onClick={() => navigate('/games')}>
            Τέλος παιχνιδιού
          </Button>
        )}
      </div>

      <ScoreDisplay
        score={state.score}
        streak={state.streak}
        questionNumber={state.questionIndex + 1}
        totalQuestions={totalQuestions}
      />

      <ExplorerPassport stops={state.answers} totalQuestions={totalQuestions} />

      <section className="scratch__card card" aria-label="Κρυμμένη σημαία">
        <h2 className="scratch__prompt">
          Ξύσε <strong>{COVER_LABELS[cover]}</strong> με το δάχτυλο — ποιας χώρας
          είναι η σημαία;
        </h2>
        <ScratchFlag
          key={question.id}
          iso2={question.countryId}
          cover={cover}
          onRevealChange={handleReveal}
          revealAll={answered}
        />
        {!answered && (
          <p className="scratch__meter" role="status">
            Αποκαλύφθηκε: <strong>{revealPct}%</strong> · Σωστή απάντηση τώρα:{' '}
            <strong>+{potentialPoints}</strong> πόντοι
          </p>
        )}

        <div className="question-card__choices" role="group" aria-label="Επιλογές απάντησης">
          {question.choices.map((choice, index) => {
            const isCorrect = choice.id === question.correctAnswerId;
            const isSelected = choice.id === selectedId;
            let stateClass = '';
            if (answered && isCorrect) stateClass = 'choice--correct';
            else if (answered && isSelected) stateClass = 'choice--wrong';
            else if (answered) stateClass = 'choice--muted';
            return (
              <button
                key={choice.id}
                type="button"
                className={`choice ${stateClass}`}
                disabled={answered}
                onClick={() => handleSelect(choice.id)}
                aria-label={`Επιλογή ${index + 1}: ${choice.label}`}
              >
                <span className="choice__key" aria-hidden="true">{index + 1}</span>
                <span className="choice__label">{choice.label}</span>
                {answered && isCorrect && (
                  <span className="choice__result choice__result--ok">✓ Σωστό</span>
                )}
                {answered && isSelected && !isCorrect && (
                  <span className="choice__result choice__result--no">✕ Λάθος</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {answered && (
        <div className="scratch__feedback" role="status" aria-live="assertive">
          {country && (
            <CountryBall
              country={country} identityVisible
              size={92}
              mood={answeredCorrectly ? (state.streak >= 3 ? 'dance' : 'happy') : 'sad'}
            />
          )}
          {answeredCorrectly ? (
            <p className="scratch__feedback-text scratch__feedback-text--ok">
              ✓ Σωστό! <span className="scratch__points">+{lastPoints} πόντοι</span>
            </p>
          ) : (
            <p className="scratch__feedback-text scratch__feedback-text--no">
              ✕ Λάθος! Είναι η σημαία: <strong>{country?.nameGreek}</strong>
            </p>
          )}
          {answeredCorrectly && state.streak >= 3 && (
            <p className="quiz__streak">🔥 Σερί {state.streak}!</p>
          )}
          {lastCollected && country && (
            <p className="quiz__collect">
              🎁 Νέα φιγούρα στη <strong>Συλλογή</strong> σου:{' '}
              <Link to={`/country/${country.iso2}?discovered=1`}>{country.nameGreek}</Link>!
            </p>
          )}
          <Button variant="primary" onClick={nextQuestion}>
            Επόμενη Σημαία →
          </Button>
        </div>
      )}
    </div>
  );
}
