import { NavLink } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { playSound } from '../../audio/soundManager';
import { usePwaStatus } from '../../pwa/status';
import { Flag } from '../Flag/Flag';
import './Navigation.css';

const LINKS = [
  { to: '/', label: 'Αρχική', icon: '🌍', end: true },
  { to: '/games', label: 'Παιχνίδια', icon: '🎮', end: false },
  { to: '/map', label: 'Χάρτης', icon: '🗺️', end: false },
  { to: '/encyclopedia', label: 'Εγκυκλοπαίδεια', icon: '📚', end: false },
  { to: '/collection', label: 'Συλλογή', icon: '🎁', end: false },
  { to: '/scoreboard', label: 'Βαθμολογία', icon: '🏆', end: false },
];

export function Navigation() {
  const { settings, updateSettings } = useSettings();
  const { updateReady } = usePwaStatus();

  return (
    <header className="nav">
      {updateReady && (
        <button className="nav__update" type="button" onClick={() => window.location.reload()}>
          Νέα έκδοση, πάτα για ανανέωση
        </button>
      )}
      <nav className="nav__inner" aria-label="Κύρια πλοήγηση">
        <NavLink to="/" className="nav__brand" aria-label="Γύρος του Κόσμου — Αρχική">
          <span className="nav__brand-globe" aria-hidden="true"><Flag iso2="gr" size="sm" /></span>
          <span className="nav__brand-text">Γύρος του Κόσμου</span>
        </NavLink>
        <ul className="nav__links">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `nav__link ${isActive ? 'nav__link--active' : ''}`
                }
              >
                <span className="nav__link-icon" aria-hidden="true">{link.icon}</span>
                <span className="nav__link-label">{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="nav__sound"
          aria-pressed={settings.soundEnabled}
          aria-label={settings.soundEnabled ? 'Απενεργοποίηση ήχου' : 'Ενεργοποίηση ήχου'}
          title={`Ήχος: ${settings.soundEnabled ? 'Ναι' : 'Όχι'}`}
          onClick={() => {
            const next = !settings.soundEnabled;
            updateSettings({ soundEnabled: next });
            if (next) {
              // Άμεση επιβεβαίωση ότι ο ήχος άνοιξε
              setTimeout(() => playSound('click'), 0);
            }
          }}
        >
          {settings.soundEnabled ? '🔊' : '🔇'}
        </button>
      </nav>
    </header>
  );
}
