import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { SessionState } from '../../types/game';
import { formatScore } from '../../game/scoring';
import { addScore, loadScores, sanitizePlayerName, MAX_PLAYER_NAME_LENGTH } from '../../utils/storage';
import { loadCollection } from '../../utils/collection';
import { getCountryByIsoCode } from '../../data/countries';
import { useSettings } from '../../context/SettingsContext';
import { playSound } from '../../audio/soundManager';
import { Button } from '../Button/Button';
import { CountryBall } from '../CountryBall/CountryBall';
import { ExplorerPassport } from '../Passport/ExplorerPassport';
import { SessionRouteMap } from '../Passport/SessionRouteMap';
import { useReactions } from '../../reactions/ReactionsProvider';
import './GameResults.css';

/** Ορόσημα συλλογής που γιορτάζονται με χρυσή σφραγίδα */
const MILESTONES = [10, 25, 50, 100, 197];

interface GameResultsProps {
  state: SessionState;
  onPlayAgain: () => void;
}

/** Οθόνη αποτελεσμάτων με καταχώριση ονόματος στον πίνακα βαθμολογίας. */
export function GameResults({ state, onPlayAgain }: GameResultsProps) {
  const navigate = useNavigate();
  const reactions = useReactions();
  useEffect(() => {
    reactions?.emit({ type: 'game:end',
      won: [...new Set(state.answers.filter((a) => a.correct).map((a) => a.countryId))],
      lost: [...new Set(state.answers.filter((a) => !a.correct).map((a) => a.countryId))],
    });
  }, [reactions, state.answers]);
  const { settings, updateSettings } = useSettings();
  const [name, setName] = useState(settings.lastPlayerName);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const correct = state.answers.filter((a) => a.correct).length;
  const total = state.answers.length;
  const isNewHighScore =
    state.score > 0 &&
    (loadScores()[0]?.score === undefined || state.score > loadScores()[0].score);

  // ─── Το ταξίδι της συνεδρίας ───
  // Σε πολύ μεγάλα ατέρμονα ταξίδια δείχνουμε τις τελευταίες 20 σφραγίδες
  const journeyStops = state.answers.slice(-20);
  const hiddenStops = state.answers.length - journeyStops.length;
  const uniqueVisited = new Set(state.answers.map((a) => a.countryId)).size;
  const discoveredIso2 = [
    ...new Set(state.answers.filter((a) => a.discovered).map((a) => a.countryId)),
  ];
  const discoveredCountries = discoveredIso2
    .map((iso2) => getCountryByIsoCode(iso2))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const collectionAfter = loadCollection().size;
  const collectionBefore = collectionAfter - discoveredCountries.length;
  const milestone = MILESTONES.find((m) => collectionBefore < m && collectionAfter >= m);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isNewHighScore) playSound('highscore');
    // μόνο κατά την πρώτη εμφάνιση της οθόνης
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    const clean = sanitizePlayerName(name);
    if (!clean || saved) return;
    addScore({
      playerName: clean,
      score: state.score,
      mode: state.config.mode,
      difficulty: state.config.difficulty,
      correctAnswers: correct,
      totalQuestions: total,
      date: new Date().toISOString(),
    });
    updateSettings({ lastPlayerName: clean });
    setSaved(true);
    playSound('correct');
  };

  return (
    <section className="game-results card" aria-label="Αποτελέσματα παιχνιδιού">
      <h2 className="game-results__title">Το Ταξίδι σου</h2>
      <p className="game-results__journey-sub">
        Επισκέφθηκες <strong>{uniqueVisited}</strong>{' '}
        {uniqueVisited === 1 ? 'χώρα' : 'χώρες'} σε {total}{' '}
        {total === 1 ? 'στάση' : 'στάσεις'}
        {hiddenStops > 0 && <> (οι {hiddenStops} πρώτες δεν χωρούν στη σελίδα)</>}
      </p>

      <div className="game-results__passport">
        <ExplorerPassport
          stops={journeyStops}
          totalQuestions={journeyStops.length}
          large
          silent
        />
      </div>

      <div className="game-results__parade" aria-label="Οι χώρες του ταξιδιού">
        {[...new Set(state.answers.map((a) => a.countryId))].map((iso2) => {
          const country = getCountryByIsoCode(iso2);
          return country ? <CountryBall key={iso2} country={country} size={64} /> : null;
        })}
      </div>
      <SessionRouteMap stops={state.answers} />

      {discoveredCountries.length > 0 && (
        <div className="game-results__discoveries" role="status">
          <h3 className="game-results__discoveries-title">Νέες Ανακαλύψεις</h3>
          <div className="game-results__discoveries-grid">
            {discoveredCountries.map((c, i) => (
              <Link
                key={c.iso2}
                to={`/country/${c.iso2}?discovered=1`}
                className="game-results__discovery"
                style={{ animationDelay: `${i * 140}ms` }}
              >
                <CountryBall country={c} size={76} />
                <span className="game-results__discovery-name">{c.nameGreek}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {milestone && (
        <p className="game-results__milestone" role="status">
          🏅 Ορόσημο εξερευνητή: <strong>{milestone}</strong>{' '}
          {milestone === 197 ? '— ΟΛΟΚΛΗΡΟΣ ο άτλαντας!' : 'χώρες στον άτλαντά σου!'}
        </p>
      )}

      {isNewHighScore && (
        <p className="game-results__highscore" role="status">
          🎉 Νέο ρεκόρ!
        </p>
      )}
      <p className="game-results__score">{formatScore(state.score)} πόντοι</p>
      <div className="game-results__stats">
        <div className="game-results__stat">
          <span className="game-results__stat-value">
            {correct} / {total}
          </span>
          <span className="game-results__stat-label">σωστές απαντήσεις</span>
        </div>
        <div className="game-results__stat">
          <span className="game-results__stat-value">{state.bestStreak}</span>
          <span className="game-results__stat-label">καλύτερο σερί</span>
        </div>
      </div>

      {saved ? (
        <p className="game-results__saved" role="status">
          ✓ Η βαθμολογία αποθηκεύτηκε!
        </p>
      ) : (
        <form
          className="game-results__form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="game-results__label" htmlFor="player-name">
            Όνομα παίκτη:
          </label>
          <div className="game-results__form-row">
            <input
              ref={inputRef}
              id="player-name"
              className="game-results__input"
              type="text"
              value={name}
              maxLength={MAX_PLAYER_NAME_LENGTH}
              placeholder="π.χ. Αλέξανδρος"
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" variant="leaf" disabled={!sanitizePlayerName(name)}>
              Αποθήκευση
            </Button>
          </div>
        </form>
      )}

      <div className="game-results__actions">
        <Button variant="primary" size="lg" onClick={onPlayAgain}>
          Παίξε ξανά
        </Button>
        <Button variant="secondary" size="lg" onClick={() => navigate('/')}>
          Αρχικό μενού
        </Button>
        {saved && (
          <Button variant="sun" size="lg" onClick={() => navigate('/scoreboard')}>
            Δες τη Βαθμολογία
          </Button>
        )}
      </div>
    </section>
  );
}
