import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import {
  DIFFICULTY_LABELS,
  FLAG_VARIANT_LABELS,
  GAME_MODE_LABELS,
  type DifficultyId,
  type FlagVariant,
  type GameModeId,
  type SessionLength,
} from '../types/game';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/Button/Button';
import './GamesPage.css';

const MODES: { id: GameModeId; icon: string; text: string; accent: string }[] = [
  { id: 'country', icon: '🚩', text: 'Δες τη σημαία και μάντεψε τη χώρα', accent: 'coral' },
  { id: 'capital', icon: '🏛️', text: 'Βρες τη σωστή πρωτεύουσα', accent: 'sun' },
  { id: 'flags', icon: '🎌', text: 'Πρόκληση αναγνώρισης σημαιών', accent: 'leaf' },
  { id: 'map', icon: '📍', text: 'Δείξε τη χώρα στον παγκόσμιο χάρτη', accent: 'grape' },
  { id: 'landmark', icon: '🗼', text: 'Μάντεψε τη χώρα από το διάσημο μνημείο', accent: 'ocean' },
  { id: 'bigger', icon: '⚖️', text: 'Σύγκρινε πληθυσμό και έκταση χωρών', accent: 'leaf' },
  { id: 'parade', icon: '🎠', text: 'Πρόλαβε τη σωστή σημαία στην παρέλαση', accent: 'sun' },
  { id: 'whoami', icon: '🕵️', text: 'Μάντεψε τη χώρα με τρεις ενδείξεις', accent: 'grape' },
  { id: 'scratch', icon: '🖐️', text: 'Ξύσε το κάλυμμα και μάντεψε τη σημαία', accent: 'coral' },
];

const DIFFICULTIES: DifficultyId[] = ['easy', 'medium', 'hard'];
const LENGTHS: { value: SessionLength; label: string }[] = [
  { value: 10, label: '10 ερωτήσεις' },
  { value: 20, label: '20 ερωτήσεις' },
  { value: 'endless', label: 'Ατέρμονο' },
];
const FLAG_VARIANTS: FlagVariant[] = ['mixed', 'flag-to-country', 'country-to-flag'];

function isGameMode(v: string | undefined): v is GameModeId {
  return (
    v === 'country' ||
    v === 'capital' ||
    v === 'flags' ||
    v === 'map' ||
    v === 'landmark' ||
    v === 'scratch' || v === 'whoami' || v === 'parade' || v === 'bigger'
  );
}

/** Λίστα λειτουργιών ή οθόνη ρυθμίσεων πριν την έναρξη. */
export function GamesPage() {
  const { mode } = useParams();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const [difficulty, setDifficulty] = useState<DifficultyId>(settings.lastDifficulty);
  const [length, setLength] = useState<SessionLength>(10);
  const [variant, setVariant] = useState<FlagVariant>('mixed');

  if (!isGameMode(mode)) {
    return (
      <div>
        <h1 className="page-title">Παιχνίδια</h1>
        <p className="page-subtitle">Διάλεξε λειτουργία παιχνιδιού</p>
        <div className="games__grid">
          {MODES.map((m) => (
            <Link key={m.id} to={`/games/${m.id}`} className={`games-card games-card--${m.accent}`}>
              <span className="games-card__icon" aria-hidden="true">{m.icon}</span>
              <span className="games-card__title">{GAME_MODE_LABELS[m.id]}</span>
              <span className="games-card__text">{m.text}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const start = () => {
    updateSettings({ lastDifficulty: difficulty });
    const params = new URLSearchParams({
      difficulty,
      length: String(length),
    });
    if (mode === 'flags') params.set('variant', variant);
    navigate(`/play/${mode}?${params.toString()}`);
  };

  return (
    <div className="game-setup card">
      <h1 className="game-setup__title">{GAME_MODE_LABELS[mode]}</h1>

      <fieldset className="game-setup__group">
        <legend>Δυσκολία</legend>
        <div className="game-setup__options">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              className={`setup-chip ${difficulty === d ? 'setup-chip--active' : ''}`}
              aria-pressed={difficulty === d}
              onClick={() => setDifficulty(d)}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="game-setup__group">
        <legend>Διάρκεια</legend>
        <div className="game-setup__options">
          {LENGTHS.map((l) => (
            <button
              key={String(l.value)}
              type="button"
              className={`setup-chip ${length === l.value ? 'setup-chip--active' : ''}`}
              aria-pressed={length === l.value}
              onClick={() => setLength(l.value)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </fieldset>

      {mode === 'flags' && (
        <fieldset className="game-setup__group">
          <legend>Τύπος ερωτήσεων</legend>
          <div className="game-setup__options">
            {FLAG_VARIANTS.map((v) => (
              <button
                key={v}
                type="button"
                className={`setup-chip ${variant === v ? 'setup-chip--active' : ''}`}
                aria-pressed={variant === v}
                onClick={() => setVariant(v)}
              >
                {FLAG_VARIANT_LABELS[v]}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="game-setup__actions">
        <Button variant="sun" size="lg" onClick={start}>
          Νέο Παιχνίδι
        </Button>
        <Button variant="ghost" onClick={() => navigate('/games')}>
          ← Πίσω στα παιχνίδια
        </Button>
      </div>
    </div>
  );
}
