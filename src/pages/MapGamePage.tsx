import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { GameConfig } from '../types/game';
import { useGameSession } from '../hooks/useGameSession';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { playSound } from '../audio/soundManager';
import { getCountryByIsoCode } from '../data/countries';
import { WorldMap, type WorldMapHandle } from '../components/WorldMap/WorldMap';
import { useWorldTopology } from '../components/WorldMap/useWorldTopology';
import { ExplorerPassport } from '../components/Passport/ExplorerPassport';
import { ScoreDisplay } from '../components/ScoreDisplay/ScoreDisplay';
import { GameResults } from '../components/GameResults/GameResults';
import { Button } from '../components/Button/Button';
import { parseGameConfig } from './QuizGamePage';
import { CountryBall } from '../components/CountryBall/CountryBall';
import { useReactions } from '../reactions/ReactionsProvider';
import './MapGamePage.css';

const AUTO_ADVANCE_MS = 3000;

/** «Βρες τη χώρα στον χάρτη» — ο παίκτης απαντά κάνοντας κλικ στον χάρτη. */
export function MapGamePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { topology, error } = useWorldTopology();

  const config = useMemo(() => parseGameConfig('map', searchParams), [searchParams]);

  if (error) {
    return (
      <div className="card" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <p>⚠️ Ο χάρτης δεν μπόρεσε να φορτώσει.</p>
        <Button variant="primary" onClick={() => navigate('/games')}>
          ← Πίσω στα παιχνίδια
        </Button>
      </div>
    );
  }

  if (!topology || !config) {
    return (
      <div className="mapgame__loading" role="status">
        <p>Φόρτωση χάρτη...</p>
      </div>
    );
  }

  return <MapGameSession config={config} availableIso2={topology.availableIso2} />;
}

function MapGameSession({
  config,
  availableIso2,
}: {
  config: GameConfig;
  availableIso2: Set<string>;
}) {
  const navigate = useNavigate();
  const session = useGameSession(config, availableIso2);
  const { state, question, selectedAnswerId } = session;
  const reactions = useReactions();
  const nearRef = useRef<boolean | null>(null);
  useEffect(() => {
    nearRef.current = null;
    reactions?.emit({ type: 'question:new', iso2s: [question.countryId] });
  }, [question.id, question.countryId, reactions]);
  const mapRef = useRef<WorldMapHandle>(null);
  const autoAdvanceRef = useRef<number | null>(null);

  const answered = selectedAnswerId !== null;
  const correct = answered && selectedAnswerId === question.correctAnswerId;
  const targetCountry = getCountryByIsoCode(question.countryId);
  const clickedCountry =
    answered && !correct && selectedAnswerId ? getCountryByIsoCode(selectedAnswerId) : undefined;

  const handleSelect = useCallback(
    (iso2: string) => {
      if (selectedAnswerId !== null) return;
      const wasCorrect = session.answer(iso2);
      playSound(wasCorrect ? 'correct' : 'wrong');
      if (!wasCorrect) {
        // Δείξε πού ήταν η σωστή χώρα
        mapRef.current?.zoomToCountry(question.countryId);
      }
      if (autoAdvanceRef.current) window.clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = window.setTimeout(() => {
        mapRef.current?.resetZoom();
        session.nextQuestion();
      }, AUTO_ADVANCE_MS);
    },
    [selectedAnswerId, session, question.countryId],
  );

  const handleAdvance = useCallback(() => {
    if (selectedAnswerId !== null) {
      if (autoAdvanceRef.current) window.clearTimeout(autoAdvanceRef.current);
      mapRef.current?.resetZoom();
      session.nextQuestion();
    }
  }, [selectedAnswerId, session]);

  useEffect(
    () => () => {
      if (autoAdvanceRef.current) window.clearTimeout(autoAdvanceRef.current);
    },
    [],
  );

  useKeyboardControls({ onAdvance: handleAdvance, enabled: !state.finished });

  if (state.finished) {
    return <GameResults state={state} onPlayAgain={session.restart} />;
  }

  return (
    <div className="mapgame" onPointerMove={(event) => {
      if (answered) return;
      const path = event.currentTarget.querySelector<SVGPathElement>(`path[data-iso2="${question.countryId}"]`);
      const matrix = path?.getScreenCTM();
      if (!path || !matrix) return;
      const box = path.getBBox();
      const center = new DOMPoint(box.x + box.width / 2, box.y + box.height / 2).matrixTransform(matrix);
      const distancePx = Math.hypot(event.clientX - center.x, event.clientY - center.y);
      const near = distancePx < 80;
      if (near !== nearRef.current) {
        nearRef.current = near;
        reactions?.emit({ type: 'map:near', iso2: question.countryId, distancePx });
      }
    }}>
      <div className="mapgame__top">
        <Button variant="ghost" onClick={() => navigate('/games')} aria-label="Έξοδος από το παιχνίδι">
          ← Έξοδος
        </Button>
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

      <ExplorerPassport stops={state.answers} totalQuestions={session.totalQuestions} compact />

      <h2 className="mapgame__prompt">{question.prompt}</h2>
      {targetCountry && <CountryBall country={targetCountry} size={72} identityVisible={answered} />}

      <WorldMap
        ref={mapRef}
        onSelectCountry={handleSelect}
        interactionDisabled={answered}
        correctIso2={answered ? question.countryId : null}
        wrongIso2={answered && !correct ? selectedAnswerId : null}
        ariaLabel="Χάρτης παιχνιδιού — κάνε κλικ στη σωστή χώρα"
      />

      {answered && (
        <div className="mapgame__feedback" role="status" aria-live="assertive">
          {correct ? (
            <p className="mapgame__feedback-text mapgame__feedback-text--ok">✓ Σωστό!</p>
          ) : (
            <p className="mapgame__feedback-text mapgame__feedback-text--no">
              ✕ Λάθος!
              {clickedCountry && <> Πάτησες {clickedCountry.nameGreekAccusative}.</>}{' '}
              Η σωστή απάντηση είναι: <strong>{targetCountry?.nameGreek}</strong>
            </p>
          )}
          <Button variant="primary" onClick={handleAdvance}>
            Επόμενη Ερώτηση →
          </Button>
        </div>
      )}
    </div>
  );
}
