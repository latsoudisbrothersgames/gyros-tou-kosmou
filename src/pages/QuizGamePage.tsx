import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { DifficultyId, FlagVariant, GameConfig, GameModeId, SessionLength } from '../types/game';
import { GAME_MODE_LABELS } from '../types/game';
import { useGameSession } from '../hooks/useGameSession';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { playSound } from '../audio/soundManager';
import { QuestionCard } from '../components/QuestionCard/QuestionCard';
import { ExplorerPassport } from '../components/Passport/ExplorerPassport';
import { ScoreDisplay } from '../components/ScoreDisplay/ScoreDisplay';
import { GameResults } from '../components/GameResults/GameResults';
import { Button } from '../components/Button/Button';
import { CountryBall } from '../components/CountryBall/CountryBall';
import { getCountryByIsoCode } from '../data/countries';
import { useQuizReactions } from '../reactions/useQuizReactions';
import './QuizGamePage.css';

const AUTO_ADVANCE_MS = 2200;

export function parseGameConfig(
  mode: string | undefined,
  params: URLSearchParams,
): GameConfig | null {
  if (
    mode !== 'country' &&
    mode !== 'capital' &&
    mode !== 'flags' &&
    mode !== 'map' &&
    mode !== 'landmark' &&
    mode !== 'scratch' && mode !== 'whoami' && mode !== 'parade' && mode !== 'bigger' && mode !== 'neighbors' && mode !== 'post' && mode !== 'puzzle'
  ) {
    return null;
  }
  const difficultyRaw = params.get('difficulty');
  const difficulty: DifficultyId =
    difficultyRaw === 'medium' || difficultyRaw === 'hard' ? difficultyRaw : 'easy';
  const lengthRaw = params.get('length');
  const length: SessionLength =
    lengthRaw === '20' ? 20 : lengthRaw === 'endless' ? 'endless' : 10;
  const variantRaw = params.get('variant');
  const flagVariant: FlagVariant | undefined =
    variantRaw === 'flag-to-country' || variantRaw === 'country-to-flag' || variantRaw === 'mixed'
      ? variantRaw
      : undefined;
  const focus = params.get('focus') ?? undefined;
  return {
    mode: mode as GameModeId,
    difficulty,
    length,
    flagVariant,
    focusCountryId: focus,
  };
}

/** Κοινή σελίδα για όλα τα κουίζ πολλαπλής επιλογής. */
export function QuizGamePage() {
  const { mode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const config = useMemo(
    () => parseGameConfig(mode, searchParams),
    [mode, searchParams],
  );

  useEffect(() => {
    // Ο χάρτης και το «Ξύσε τη Σημαία» έχουν δικές τους σελίδες
    if (!config || config.mode === 'map' || config.mode === 'scratch') {
      navigate('/games', { replace: true });
    }
  }, [config, navigate]);

  if (!config || config.mode === 'map' || config.mode === 'scratch') return null;
  return <QuizSession config={config} />;
}

function QuizSession({ config }: { config: GameConfig }) {
  const navigate = useNavigate();
  const session = useGameSession(config);
  const { state, question, selectedAnswerId, lastBreakdown } = session;
  useQuizReactions(question, selectedAnswerId !== null, state.finished);
  const autoAdvanceRef = useRef<number | null>(null);

  const handleAnswer = useCallback(
    (answerId: string) => {
      const correct = session.answer(answerId);
      playSound(correct ? 'correct' : 'wrong');
      if (autoAdvanceRef.current) window.clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = window.setTimeout(() => {
        session.nextQuestion();
      }, AUTO_ADVANCE_MS);
    },
    [session],
  );

  const handleAdvance = useCallback(() => {
    if (selectedAnswerId !== null) {
      if (autoAdvanceRef.current) window.clearTimeout(autoAdvanceRef.current);
      session.nextQuestion();
    }
  }, [selectedAnswerId, session]);

  useEffect(
    () => () => {
      if (autoAdvanceRef.current) window.clearTimeout(autoAdvanceRef.current);
    },
    [],
  );

  useKeyboardControls({
    onSelectChoice: (index) => {
      const choice = question.choices[index];
      if (choice && selectedAnswerId === null && !session.eliminatedIds.includes(choice.id)) {
        handleAnswer(choice.id);
      }
    },
    onAdvance: handleAdvance,
    enabled: !state.finished,
  });

  if (state.finished) {
    return <GameResults state={state} onPlayAgain={session.restart} />;
  }

  const answeredCorrectly =
    selectedAnswerId !== null && selectedAnswerId === question.correctAnswerId;
  const correctCountry = getCountryByIsoCode(question.countryId);

  return (
    <div className="quiz">
      <div className="quiz__top">
        <Button variant="ghost" onClick={() => navigate('/games')} aria-label="Έξοδος από το παιχνίδι">
          ← Έξοδος
        </Button>
        <span className="quiz__mode">{GAME_MODE_LABELS[config.mode]}</span>
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
        totalQuestions={session.totalQuestions}
      />

      <ExplorerPassport stops={state.answers} totalQuestions={session.totalQuestions} />

      <QuestionCard
        key={question.id}
        question={question}
        selectedAnswerId={selectedAnswerId}
        onSelect={handleAnswer}
        eliminatedIds={session.eliminatedIds}
      />

      {selectedAnswerId !== null && (
        <div className="quiz__feedback" role="status" aria-live="assertive">
          {correctCountry && (
            <CountryBall
              country={correctCountry} identityVisible
              size={92}
            />
          )}
          {answeredCorrectly ? (
            <p className="quiz__feedback-text quiz__feedback-text--ok">
              ✓ Σωστό!
              {lastBreakdown && lastBreakdown.total > 0 && (
                <span className="quiz__points"> +{lastBreakdown.total} πόντοι</span>
              )}
            </p>
          ) : (
            <p className="quiz__feedback-text quiz__feedback-text--no">
              ✕ Λάθος! Η σωστή απάντηση είναι:{' '}
              <strong>
                {question.type === 'COUNTRY_TO_CAPITAL'
                  ? correctCountry?.capitalGreek
                  : correctCountry?.nameGreek}
              </strong>
            </p>
          )}
          {answeredCorrectly && state.streak >= 3 && (
            <p className="quiz__streak" aria-live="polite">
              🔥 Σερί {state.streak}! Ο χαρακτήρας χορεύει για σένα!
            </p>
          )}
          {session.lastCollected && correctCountry && (
            <p className="quiz__collect" aria-live="polite">
              🎁 Νέα φιγούρα στη <strong>Συλλογή</strong> σου:{' '}
              <Link to={`/country/${correctCountry.iso2}?discovered=1`}>
                {correctCountry.nameGreek}
              </Link>
              !
            </p>
          )}
          <Button variant="primary" onClick={handleAdvance}>
            Επόμενη Ερώτηση →
          </Button>
          <p className="quiz__hint">Πάτησε Enter για να συνεχίσεις</p>
        </div>
      )}
      {selectedAnswerId === null && (
        <div className="quiz__helper">
          {!session.hintUsed ? (
            <Button variant="ghost" onClick={session.useHint}>
              💡 Βοήθεια (μισοί πόντοι)
            </Button>
          ) : (
            <p className="quiz__hint-bubble" role="status">
              💡 Έκρυψα δύο λάθος απαντήσεις για να σε βοηθήσω!
            </p>
          )}
          <p className="quiz__hint">Πλήκτρα 1–4 για γρήγορη απάντηση</p>
        </div>
      )}
    </div>
  );
}
