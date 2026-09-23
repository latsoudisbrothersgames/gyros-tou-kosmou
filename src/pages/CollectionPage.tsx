import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { canGreet } from '../reactions/social';
import { ALL_COUNTRIES } from '../data/countries';
import { CONTINENT_LABELS, type ContinentId } from '../types/country';
import { continentVars } from '../theme/continents';
import { loadCollection } from '../utils/collection';
import { CountryBall } from '../components/CountryBall/CountryBall';
import { useReactions } from '../reactions/ReactionsProvider';
import './CollectionPage.css';

type Filter = 'all' | ContinentId;

/**
 * Συλλογή φιγούρων: κάθε σωστή απάντηση για μια χώρα (σε οποιοδήποτε
 * παιχνίδι) ξεκλειδώνει τον χαρακτήρα της. Οι κλειδωμένες θέσεις
 * εμφανίζονται ως σκιές με «;».
 */
export function CollectionPage() {
  const reactions = useReactions();
  const collection = useMemo(() => loadCollection(), []);
  const [filter, setFilter] = useState<Filter>('all');
  const [greeting, setGreeting] = useState<string | null>(null);
  const [taps, setTaps] = useState<Record<string, number>>({});
  const greetingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => greetingTimers.current.forEach(clearTimeout), []);

  const continents = useMemo(() => {
    const ids = new Set<ContinentId>();
    for (const c of ALL_COUNTRIES) ids.add(c.continent);
    return [...ids];
  }, []);

  const countries = useMemo(() => {
    const list =
      filter === 'all' ? ALL_COUNTRIES : ALL_COUNTRIES.filter((c) => c.continent === filter);
    return [...list].sort((a, b) => a.nameGreek.localeCompare(b.nameGreek, 'el'));
  }, [filter]);

  const tap = (iso2: string, button: HTMLButtonElement) => {
    reactions?.emit({ type: 'collection:tap', iso2 });
    greetingTimers.current.forEach(clearTimeout); greetingTimers.current = [];
    setGreeting(null);
    const current = button.querySelector<HTMLElement>('.countryball');
    const nearby = [...(button.closest('.collection__grid')?.querySelectorAll<HTMLElement>('.collection__item--owned .countryball[data-identity-visible="true"]') ?? [])];
    const neighbor = nearby.find(ball => ball !== current && ball.dataset.iso2 && current &&
      canGreet(iso2, ball.dataset.iso2, true, true) && Math.hypot(
        ball.getBoundingClientRect().x - current.getBoundingClientRect().x,
        ball.getBoundingClientRect().y - current.getBoundingClientRect().y) < 180);
    if (neighbor) {
      greetingTimers.current.push(setTimeout(() => setGreeting(iso2), 3000));
      greetingTimers.current.push(setTimeout(() => setGreeting(null), 5800));
    }
  };

  const collectedCount = ALL_COUNTRIES.filter((c) => collection.has(c.iso2)).length;

  return (
    <div className="collection">
      <h1 className="page-title">Η Συλλογή μου</h1>
      <p className="page-subtitle">
        Κάθε σωστή απάντηση ξεκλειδώνει τον χαρακτήρα της χώρας!
      </p>

      <p className="collection__count" role="status">
        <strong>{collectedCount}</strong> / {ALL_COUNTRIES.length} φιγούρες
      </p>
      <div className="collection__bar" aria-hidden="true">
        <div
          className="collection__bar-fill"
          style={{ width: `${(collectedCount / ALL_COUNTRIES.length) * 100}%` }}
        />
      </div>

      <Link className="collection__yard" to="/yard">Η αυλή των CountryBalls →</Link>

      <div className="collection__filters">
        <button
          type="button"
          className={`setup-chip ${filter === 'all' ? 'setup-chip--active' : ''}`}
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          Όλες
        </button>
        {continents.map((id) => (
          <button
            key={id}
            type="button"
            className={`setup-chip ${filter === id ? 'setup-chip--active' : ''}`}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {CONTINENT_LABELS[id]}
          </button>
        ))}
      </div>

      <div className="collection__grid" data-ball-social>
        {countries.map((c) => {
          const owned = collection.has(c.iso2);
          return owned ? (
            <div
              key={c.iso2}
              className="collection__item collection__item--owned"
              style={continentVars(c.continent)}
            >
              <button type="button" className="collection__tap" aria-label={`Παίξε με τη φιγούρα: ${c.nameGreek}`}
                onClick={event => { tap(c.iso2, event.currentTarget); setTaps(v => ({ ...v, [c.iso2]: (v[c.iso2] ?? 0) + 1 })); }}>
                <CountryBall country={c} size={84} identityVisible tapSignal={taps[c.iso2] ?? 0} quietFirstTap />
              </button>
              {greeting === c.iso2 && <span className="collection__neighbor" role="status">Γεια σου γείτονα!</span>}
              <Link to={`/country/${c.iso2}`} className="collection__name">{c.nameGreek}</Link>
            </div>
          ) : (
            <div key={c.iso2} className="collection__item collection__item--locked" aria-label="Κλειδωμένη φιγούρα">
              <span className="collection__mystery" aria-hidden="true">?</span>
              <span className="collection__name">Άγνωστη</span>
            </div>
          );
        })}
      </div>

      {collectedCount === 0 && (
        <p className="collection__empty">
          Δεν έχεις φιγούρες ακόμη — <Link to="/games">παίξε ένα παιχνίδι</Link> και
          απάντησε σωστά για να κερδίσεις την πρώτη σου!
        </p>
      )}
    </div>
  );
}
