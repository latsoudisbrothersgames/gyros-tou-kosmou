import { useEffect } from 'react';
import { useReactions } from '../reactions/ReactionsProvider';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ALL_COUNTRIES, getCountryByIsoCode } from '../data/countries';
import {
  CONTINENT_LABELS,
  formatAreaGreek,
  formatPopulationGreek,
} from '../types/country';
import { continentVars } from '../theme/continents';
import { loadCollection } from '../utils/collection';
import { Flag } from '../components/Flag/Flag';
import { CountryBall } from '../components/CountryBall/CountryBall';
import { CountrySilhouette } from '../components/GeoIdentity/CountrySilhouette';
import { MiniGlobe } from '../components/GeoIdentity/MiniGlobe';
import { Button } from '../components/Button/Button';
import './CountryPage.css';

type StickerKind = 'capital' | 'continent' | 'population' | 'area' | 'currency' | 'languages';

/** Ενιαία, δικά μας εικονίδια αυτοκόλλητων (όχι emoji πλατφόρμας) */
function StickerIcon({ kind }: { kind: StickerKind }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className: 'sticker__glyph',
  };
  switch (kind) {
    case 'capital': // κτήρια πόλης με σημαιάκι
      return (
        <svg {...common}>
          <path d="M3 20h18" />
          <path d="M5 20v-9h5v9" />
          <path d="M13 20V6h6v14" />
          <path d="M13 6V3l4 1.5L13 6" />
          <path d="M7 14h1M16 10h1M16 14h1" />
        </svg>
      );
    case 'continent': // πυξίδα
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5 13 13l-4.5 2.5L11 11l4.5-2.5Z" />
        </svg>
      );
    case 'population': // δύο φιγούρες
      return (
        <svg {...common}>
          <circle cx="8.5" cy="8" r="3" />
          <path d="M3.5 20c0-3 2.2-5 5-5s5 2 5 5" />
          <circle cx="16.5" cy="9.5" r="2.4" />
          <path d="M14.5 15.4c.6-.3 1.3-.4 2-.4 2.4 0 4 1.7 4 4.4" />
        </svg>
      );
    case 'area': // χάρτης με χάρακα
      return (
        <svg {...common}>
          <path d="M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20V6.5Z" />
          <path d="M9 4v13.5M15 6.5V20" />
        </svg>
      );
    case 'currency': // νόμισμα
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.6" />
          <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2" />
        </svg>
      );
    case 'languages': // συννεφάκι ομιλίας
      return (
        <svg {...common}>
          <path d="M4 6.5C4 5.1 5.1 4 6.5 4h11C18.9 4 20 5.1 20 6.5v7c0 1.4-1.1 2.5-2.5 2.5H12l-4.5 4v-4h-1C5.1 16 4 14.9 4 13.5v-7Z" />
          <path d="M8.5 10h.01M12 10h.01M15.5 10h.01" />
        </svg>
      );
  }
}

export function CountryPage() {
  const { iso2 } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const country = iso2 ? getCountryByIsoCode(iso2) : undefined;

  const reactions = useReactions();
  useEffect(() => {
    if (country) reactions?.emit({ type: 'country:open', iso2: country.iso2 });
  }, [country, reactions]);

  if (!country) {
    return (
      <div className="country-page__missing card">
        <h1>Η χώρα δεν βρέθηκε</h1>
        <p>Δεν υπάρχουν πληροφορίες για αυτή τη χώρα.</p>
        <Link to="/encyclopedia">← Πίσω στην Εγκυκλοπαίδεια</Link>
      </div>
    );
  }

  const collection = loadCollection();
  const owned = collection.has(country.iso2);
  const justDiscovered = owned && searchParams.get('discovered') === '1';
  const collectedCount = ALL_COUNTRIES.filter((c) => collection.has(c.iso2)).length;

  const stickers: { kind: StickerKind; label: string; value: string }[] = [
    { kind: 'capital', label: 'Πρωτεύουσα', value: country.capitalGreek },
    { kind: 'continent', label: 'Ήπειρος', value: CONTINENT_LABELS[country.continent] },
    { kind: 'population', label: 'Πληθυσμός', value: formatPopulationGreek(country.population) },
    { kind: 'area', label: 'Έκταση', value: formatAreaGreek(country.areaKm2) },
    { kind: 'currency', label: 'Νόμισμα', value: country.currencyGreek ?? 'Άγνωστο' },
    {
      kind: 'languages',
      label:
        country.languagesGreek && country.languagesGreek.length > 1 ? 'Γλώσσες' : 'Γλώσσα',
      value: country.languagesGreek?.join(', ') ?? 'Άγνωστη',
    },
  ];

  return (
    <div className="atlas" style={continentVars(country.continent)}>
      <div className="atlas__back">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          ← Πίσω
        </Button>
      </div>

      <article className="atlas__page">
        <header className="atlas__head">
          <span className="atlas__continent">{CONTINENT_LABELS[country.continent]}</span>
          <h1 className="atlas__name">{country.nameGreek}</h1>
        </header>

        <div className="atlas__body">
          {/* ── Οπτική στήλη: ο «ήρωας» του άτλαντα ── */}
          <div className="atlas__visual">
            <div className="atlas__scene">
              <div className="atlas__halo" />
              <div className="atlas__silhouette">
                <CountrySilhouette iso2={country.iso2} />
              </div>
              <div className="atlas__flag-sticker">
                <Flag iso2={country.iso2} countryName={country.nameGreek} size="lg" />
              </div>
              <div className="atlas__globe">
                <MiniGlobe iso2={country.iso2} size={104} />
                <span className="atlas__globe-caption">Εδώ είναι!</span>
              </div>
              <div className="atlas__ball">
                <CountryBall
                  country={country} identityVisible playful
                  size={150}
                />
              </div>
            </div>

            <div className="atlas__status">
              {owned ? (
                <div
                  className={`atlas__stamp ${justDiscovered ? 'atlas__stamp--slam' : ''}`}
                  role="status"
                >
                  <span className="atlas__stamp-top">
                    {justDiscovered ? 'ΝΕΑ ΑΝΑΚΑΛΥΨΗ' : 'ΣΥΛΛΕΧΘΗΚΕ'}
                  </span>
                  <span className="atlas__stamp-check" aria-hidden="true">✓</span>
                  <span className="atlas__stamp-sub">στον άτλαντά μου</span>
                </div>
              ) : (
                <div className="atlas__stamp atlas__stamp--locked" role="status">
                  <span className="atlas__stamp-top">ΔΕΝ ΣΥΛΛΕΧΘΗΚΕ</span>
                  <span className="atlas__stamp-check" aria-hidden="true">?</span>
                  <span className="atlas__stamp-sub">ακόμη</span>
                </div>
              )}
              <p className="atlas__progress">
                Άτλαντας: <strong>{collectedCount}</strong> / {ALL_COUNTRIES.length} χώρες
                <span className="atlas__progress-bar" aria-hidden="true">
                  <span
                    className="atlas__progress-fill"
                    style={{ width: `${(collectedCount / ALL_COUNTRIES.length) * 100}%` }}
                  />
                </span>
              </p>
              {!owned && (
                <p className="atlas__unlock-hint">
                  Απάντησε σωστά για {country.nameGreekAccusative} σε οποιοδήποτε{' '}
                  <Link to="/games">παιχνίδι</Link> για να τη συλλέξεις!
                </p>
              )}
            </div>
          </div>

          {/* ── Στήλη πληροφοριών ── */}
          <div className="atlas__info">
            <h2 className="atlas__section">Στοιχεία ταξιδιώτη</h2>
            <div className="atlas__stickers">
              {stickers.map((s) => (
                <div key={s.label} className="sticker">
                  <span className="sticker__icon">
                    <StickerIcon kind={s.kind} />
                  </span>
                  <span className="sticker__label">{s.label}</span>
                  <span className="sticker__value">{s.value}</span>
                </div>
              ))}
            </div>

            {country.factsGreek.length > 0 && (
              <>
                <h2 className="atlas__section">Σημειώσεις εξερευνητή</h2>
                <ul className="atlas__notes">
                  {country.factsGreek.map((fact, i) => (
                    <li key={i} className="note">
                      <span className="note__tape" aria-hidden="true" />
                      {fact}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="atlas__actions">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(`/map?focus=${country.iso2}`)}
              >
                Βρες {country.nameGreekAccusative} στον χάρτη
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
