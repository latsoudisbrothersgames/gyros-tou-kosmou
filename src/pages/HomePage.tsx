import { Link, useNavigate } from 'react-router-dom';
import { getCountryByIsoCode } from '../data/countries';
import { CountryBall } from '../components/CountryBall/CountryBall';
import { Flag } from '../components/Flag/Flag';
import { Button } from '../components/Button/Button';
import { usePwaStatus } from '../pwa/status';
import './HomePage.css';

const MODE_CARDS = [
  {
    to: '/games/country',
    icon: '🚩',
    title: 'Βρες τη Χώρα',
    text: 'Δες τη σημαία και μάντεψε τη χώρα',
    accent: 'coral',
  },
  {
    to: '/games/capital',
    icon: '🏛️',
    title: 'Βρες την Πρωτεύουσα',
    text: 'Ξέρεις την πρωτεύουσα κάθε χώρας;',
    accent: 'sun',
  },
  {
    to: '/games/flags',
    icon: '🎌',
    title: 'Σημαίες',
    text: 'Πρόκληση με σημαίες απ’ όλο τον κόσμο',
    accent: 'leaf',
  },
  {
    to: '/games/map',
    icon: '📍',
    title: 'Βρες τη Χώρα στον Χάρτη',
    text: 'Δείξε πού βρίσκεται κάθε χώρα',
    accent: 'grape',
  },
  {
    to: '/games/landmark',
    icon: '🗼',
    title: 'Μνημεία του Κόσμου',
    text: 'Μάντεψε τη χώρα από το μνημείο',
    accent: 'ocean',
  },
  {
    to: '/games/scratch',
    icon: '🖐️',
    title: 'Ξύσε τη Σημαία',
    text: 'Ξύσε το κάλυμμα και μάντεψε τη χώρα',
    accent: 'coral',
  },
  {
    to: '/collection',
    icon: '🎁',
    title: 'Η Συλλογή μου',
    text: 'Μάζεψε όλες τις φιγούρες των χωρών',
    accent: 'sun',
  },
  {
    to: '/map',
    icon: '🗺️',
    title: 'Παγκόσμιος Χάρτης',
    text: 'Εξερεύνησε τον κόσμο διαδραστικά',
    accent: 'ocean',
  },
  {
    to: '/encyclopedia',
    icon: '📚',
    title: 'Εγκυκλοπαίδεια Χωρών',
    text: 'Μάθε τα πάντα για κάθε χώρα',
    accent: 'ocean',
  },
] as const;

const HERO_BALLS = ['gr', 'jp', 'br', 'ca', 'ke'] as const;
const HERO_FLAGS = ['fr', 'it', 'us', 'au', 'in', 'za', 'mx', 'se'] as const;

export function HomePage() {
  const navigate = useNavigate();
  const { offlineReady } = usePwaStatus();

  return (
    <div className="home">
      <section className="home__hero" aria-label="Καλωσόρισμα">
        <div className="home__hero-flags" aria-hidden="true">
          {HERO_FLAGS.map((iso, i) => (
            <span key={iso} className="home__hero-flag" style={{ animationDelay: `${i * 0.7}s` }}>
              <Flag iso2={iso} size="sm" />
            </span>
          ))}
        </div>
        <h1 className="home__title">Γύρος του Κόσμου</h1>
        {offlineReady && <p className="home__offline" role="status">Λειτουργεί χωρίς σύνδεση ✓</p>}
        <p className="home__subtitle">Σημαίες • Χώρες • Πρωτεύουσες • Γεωγραφία</p>
        <div className="home__cta">
          <Button variant="sun" size="lg" onClick={() => navigate('/games')}>
            Παίξε τώρα
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('/map')}>
            Εξερεύνησε τον Χάρτη
          </Button>
        </div>
        <div className="home__balls" aria-hidden="true">
          {HERO_BALLS.map((iso, i) => {
            const country = getCountryByIsoCode(iso);
            return country ? (
              <CountryBall
                key={iso}
                country={country} identityVisible
                size={i === 2 ? 120 : 88}
                animationDelay={`${i * 0.6}s`}
              />
            ) : null;
          })}
        </div>
      </section>

      <section aria-label="Λειτουργίες παιχνιδιού">
        <div className="home__grid">
          {MODE_CARDS.map((card) => (
            <Link key={card.to + card.title} to={card.to} className={`home-card home-card--${card.accent}`}>
              <span className="home-card__icon" aria-hidden="true">{card.icon}</span>
              <span className="home-card__title">{card.title}</span>
              <span className="home-card__text">{card.text}</span>
            </Link>
          ))}
          <Link to="/scoreboard" className="home-card home-card--ocean home-card--wide">
            <span className="home-card__icon" aria-hidden="true">🏆</span>
            <span className="home-card__title">Βαθμολογία</span>
            <span className="home-card__text">Δες τους κορυφαίους παίκτες</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
