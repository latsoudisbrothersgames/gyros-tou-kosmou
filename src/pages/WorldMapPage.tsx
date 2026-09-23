import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ALL_COUNTRIES, getCountryByIsoCode } from '../data/countries';
import { CONTINENT_LABELS, type Country } from '../types/country';
import type { Question } from '../types/game';
import { buildQuestion, shuffle } from '../game/questionGenerator';
import { MAP_EVENTS, makeUnicornEvent, type MapEvent } from '../data/mapEvents';
import { continentVars } from '../theme/continents';
import { addToCollection, loadCollection } from '../utils/collection';
import { playSound } from '../audio/soundManager';
import { WorldMap, type WorldMapHandle } from '../components/WorldMap/WorldMap';
import { AmbientClouds, MapEventsLayer } from '../components/MapEvents/MapEventsLayer';
import { QuestionCard } from '../components/QuestionCard/QuestionCard';
import { Flag } from '../components/Flag/Flag';
import { CountryBall } from '../components/CountryBall/CountryBall';
import { Button } from '../components/Button/Button';
import './WorldMapPage.css';

const MAX_ACTIVE_EVENTS = 3;
const EVENT_LIFETIME_MS = 16_000;
const SPAWN_EVERY_MS = 7_000;
const FIRST_SPAWN_MS = 2_500;
/** Πιθανότητα το επόμενο γεγονός να είναι ο χρυσός μονόκερος */
const UNICORN_CHANCE = 0.12;

interface ActiveChallenge {
  event: MapEvent;
  question: Question;
}

/** Εξερεύνηση παγκόσμιου χάρτη με πλαϊνό πάνελ πληροφοριών. */
export function WorldMapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusIso2 = searchParams.get('focus');
  const [selectedIso2, setSelectedIso2] = useState<string | null>(focusIso2);
  const mapRef = useRef<WorldMapHandle>(null);
  const selected = selectedIso2 ? getCountryByIsoCode(selectedIso2) : undefined;

  // ─── Ζωντανά γεγονότα ─────────────────────────────────────────
  const [events, setEvents] = useState<MapEvent[]>([]);
  const eventsRef = useRef<MapEvent[]>([]);
  const [challenge, setChallenge] = useState<ActiveChallenge | null>(null);
  const [challengeAnswer, setChallengeAnswer] = useState<string | null>(null);
  const [collected, setCollected] = useState(false);
  const [bonusCountry, setBonusCountry] = useState<Country | null>(null);
  // ?big=1 ανοίγει τον χάρτη κατευθείαν σε πλήρη οθόνη
  const [isFullscreen, setIsFullscreen] = useState(searchParams.get('big') === '1');

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    const spawn = () => {
      const prev = eventsRef.current;
      if (prev.length >= MAX_ACTIVE_EVENTS) return;
      let ev: MapEvent | undefined;
      if (Math.random() < UNICORN_CHANCE && !prev.some((p) => p.id === 'unicorn')) {
        ev = makeUnicornEvent();
      } else {
        const candidates = MAP_EVENTS.filter((e) => !prev.some((p) => p.id === e.id));
        if (candidates.length === 0) return;
        ev = candidates[Math.floor(Math.random() * candidates.length)];
      }
      const spawned = ev;
      playSound(spawned.golden ? 'magic' : 'spawn');
      window.setTimeout(
        () => setEvents((cur) => cur.filter((c) => c.id !== spawned.id)),
        EVENT_LIFETIME_MS,
      );
      setEvents((cur) => (cur.some((c) => c.id === spawned.id) ? cur : [...cur, spawned]));
    };
    const first = window.setTimeout(spawn, FIRST_SPAWN_MS);
    const iv = window.setInterval(spawn, SPAWN_EVERY_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(iv);
    };
  }, []);

  const handleEventTap = useCallback((ev: MapEvent) => {
    playSound('click');
    setEvents((prev) => prev.filter((p) => p.id !== ev.id));
    const country = getCountryByIsoCode(ev.iso2);
    if (!country) return;
    const type = Math.random() < 0.5 ? 'COUNTRY_TO_CAPITAL' : 'FLAG_TO_COUNTRY';
    setChallenge({ event: ev, question: buildQuestion(type, country, 'easy', ALL_COUNTRIES) });
    setChallengeAnswer(null);
    setCollected(false);
    setBonusCountry(null);
  }, []);

  // Έξοδος από πλήρη οθόνη με Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  const handleChallengeAnswer = useCallback(
    (answerId: string) => {
      if (!challenge || challengeAnswer !== null) return;
      const correct = answerId === challenge.question.correctAnswerId;
      playSound(correct ? 'correct' : 'wrong');
      if (correct) {
        setCollected(addToCollection(challenge.event.iso2));
        // Χρυσό γεγονός: μπόνους δεύτερη φιγούρα από τις κλειδωμένες
        if (challenge.event.golden) {
          const owned = loadCollection();
          const locked = shuffle(
            ALL_COUNTRIES.filter((c) => !owned.has(c.iso2) && c.iso2 !== challenge.event.iso2),
          );
          if (locked.length > 0) {
            addToCollection(locked[0].iso2);
            setBonusCountry(locked[0]);
            playSound('magic');
          }
        }
      }
      setChallengeAnswer(answerId);
    },
    [challenge, challengeAnswer],
  );

  const closeChallenge = useCallback(() => {
    setChallenge(null);
    setChallengeAnswer(null);
    setCollected(false);
    setBonusCountry(null);
  }, []);

  useEffect(() => {
    if (focusIso2) {
      setSelectedIso2(focusIso2);
      // Μικρή αναμονή ώστε να φορτώσει η γεωμετρία πριν το ζουμ
      const t = window.setTimeout(() => mapRef.current?.zoomToCountry(focusIso2), 600);
      return () => window.clearTimeout(t);
    }
  }, [focusIso2]);

  return (
    <div className="mappage" style={selected ? continentVars(selected.continent) : undefined}>
      <h1 className="page-title">
        🗺️ Παγκόσμιος Χάρτης
        <span className="mappage__title-rule" aria-hidden="true" />
      </h1>
      <p className="page-subtitle">
        Πάτησε μια χώρα για πληροφορίες — και έχε τον νου σου: κάθε λίγο
        εμφανίζονται εκπλήξεις πάνω στον χάρτη! 🎈
      </p>

      <div className="mappage__layout">
        <div className={`mappage__map ${isFullscreen ? 'mappage__map--full' : ''}`}>
          <WorldMap
            ref={mapRef}
            fill={isFullscreen}
            selectedIso2={selectedIso2}
            onSelectCountry={(iso2) => {
              setSelectedIso2(iso2);
              if (searchParams.get('focus')) setSearchParams({}, { replace: true });
            }}
            overlay={
              <>
                <AmbientClouds />
                <MapEventsLayer events={events} onTap={handleEventTap} />
              </>
            }
          />
          <button
            type="button"
            className="mappage__fullbtn"
            aria-label={isFullscreen ? 'Έξοδος από πλήρη οθόνη' : 'Χάρτης σε πλήρη οθόνη'}
            title={isFullscreen ? 'Έξοδος' : 'Πλήρης οθόνη'}
            onClick={() => setIsFullscreen((v) => !v)}
          >
            {isFullscreen ? '✕' : '⛶'}
          </button>
          {isFullscreen && selected && (
            <div className="mappage__fullcard" role="status">
              <Flag iso2={selected.iso2} countryName={selected.nameGreek} size="sm" />
              <span className="mappage__fullcard-name">{selected.nameGreek}</span>
              <Link to={`/country/${selected.iso2}`} className="mappage__fullcard-link">
                Περισσότερα →
              </Link>
            </div>
          )}
        </div>

        <aside className="mappage__panel" aria-label="Πληροφορίες επιλεγμένης χώρας">
          {selected ? (
            <div className="mappage__panel-card card">
              <Flag iso2={selected.iso2} countryName={selected.nameGreek} size="lg" />
              <h2 className="mappage__panel-name">{selected.nameGreek}</h2>
              <dl className="mappage__panel-facts">
                <div>
                  <dt>Πρωτεύουσα</dt>
                  <dd>{selected.capitalGreek}</dd>
                </div>
                <div>
                  <dt>Ήπειρος</dt>
                  <dd>{CONTINENT_LABELS[selected.continent]}</dd>
                </div>
              </dl>
              <div className="mappage__panel-actions">
                <Link to={`/country/${selected.iso2}`}>
                  <Button variant="primary">Περισσότερα →</Button>
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => mapRef.current?.zoomToCountry(selected.iso2)}
                >
                  🔍 Ζουμ στη χώρα
                </Button>
              </div>
              <div className="mappage__panel-ball">
                <CountryBall country={selected} size={90} identityVisible playful />
              </div>
            </div>
          ) : (
            <div className="mappage__panel-empty card">
              <span aria-hidden="true" className="mappage__panel-empty-icon">👆</span>
              <p>Διάλεξε μια χώρα στον χάρτη για να δεις πληροφορίες.</p>
            </div>
          )}
        </aside>
      </div>

      {challenge && (
        <div className="mapevent-modal" role="dialog" aria-modal="true" aria-label="Μίνι πρόκληση">
          <div className="mapevent-modal__content">
            <div className="mapevent-modal__intro card">
              <span className="mapevent-modal__emoji" aria-hidden="true">
                {challenge.event.emoji}
              </span>
              <p>{challenge.event.textGreek}</p>
            </div>

            <QuestionCard
              question={challenge.question}
              selectedAnswerId={challengeAnswer}
              onSelect={handleChallengeAnswer}
            />

            {challengeAnswer !== null && (
              <div className="mapevent-modal__feedback" role="status" aria-live="assertive">
                {(() => {
                  const country = getCountryByIsoCode(challenge.event.iso2);
                  const correct = challengeAnswer === challenge.question.correctAnswerId;
                  return (
                    <>
                      {country && (
                        <CountryBall country={country} size={88} identityVisible mood={correct ? 'happy' : 'sad'} />
                      )}
                      {correct ? (
                        <p className="mapevent-modal__ok">✓ Μπράβο σου!</p>
                      ) : (
                        <p className="mapevent-modal__no">Δεν πειράζει — την επόμενη φορά!</p>
                      )}
                      {collected && country && (
                        <p className="quiz__collect">
                          🎁 Νέα φιγούρα στη <strong>Συλλογή</strong> σου:{' '}
                          <Link to={`/country/${country.iso2}?discovered=1`}>
                            {country.nameGreek}
                          </Link>
                          !
                        </p>
                      )}
                      {bonusCountry && (
                        <p className="quiz__collect mapevent-modal__bonus">
                          🦄 ΔΙΠΛΟ δώρο! Κέρδισες και τη φιγούρα:{' '}
                          <strong>{bonusCountry.nameGreek}</strong>!
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            <div className="mapevent-modal__actions">
              <Button variant={challengeAnswer !== null ? 'primary' : 'ghost'} onClick={closeChallenge}>
                {challengeAnswer !== null ? 'Πίσω στον χάρτη →' : '✕ Κλείσιμο'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
