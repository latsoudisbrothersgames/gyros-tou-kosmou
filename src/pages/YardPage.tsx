import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { CountryBall, type BallMood } from '../components/CountryBall/CountryBall';
import { SpeechBubble } from '../components/SpeechBubble/SpeechBubble';
import { ALL_COUNTRIES } from '../data/countries';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { loadCollection } from '../utils/collection';
import { vibrate } from '../utils/haptics';
import './YardPage.css';

const DIAMETER = 64;
type Body = { x: number; y: number; vx: number; vy: number; held: boolean; lastX: number; lastY: number; lastT: number; moved: boolean; bumpedAt: number };

/** Πρόσθετη ελεύθερη αυλή· δεν γράφει πρόοδο ή αποτέλεσμα παιχνιδιού. */
export function YardPage() {
  const owned = useMemo(() => { const set = loadCollection(); return ALL_COUNTRIES.filter(c => set.has(c.iso2)).slice(0, 8); }, []);
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const bodies = useRef<Body[]>([]);
  const lastInput = useRef(Date.now());
  const sleeping = useRef(false);
  const [moods, setMoods] = useState<Record<string, BallMood>>({});
  const [bubble, setBubble] = useState<{ index: number; sequence: number } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const temporaryMood = useCallback((index: number, mood: BallMood, duration = 1000) => {
    const iso2 = owned[index]?.iso2;
    if (!iso2) return;
    setMoods(prev => ({ ...prev, [iso2]: mood }));
    timers.current.push(setTimeout(() => setMoods(prev => { const next = { ...prev }; delete next[iso2]; return next; }), duration));
  }, [owned]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (reduced || !owned.length) return;
    const stage = stageRef.current;
    if (!stage) return;
    const width = () => Math.max(DIAMETER, stage.clientWidth);
    const height = () => Math.max(DIAMETER, stage.clientHeight);
    bodies.current = owned.map((_, i) => ({
      x: 8 + (i % 3) * Math.max(0, (width() - DIAMETER - 16) / 2),
      y: 20 + Math.floor(i / 3) * Math.max(0, (height() - DIAMETER - 40) / 3),
      vx: (i % 2 ? 1 : -1) * (.3 + i * .035), vy: (i % 3 ? .28 : -.28),
      held: false, lastX: 0, lastY: 0, lastT: 0, moved: false, bumpedAt: 0,
    }));
    let frame = 0;
    let previous = 0;
    let visible = true;
    const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; });
    observer.observe(stage);
    const draw = (time: number) => {
      const dt = Math.min(2, (time - (previous || time)) / 16.67);
      previous = time;
      if (visible) {
        if (!sleeping.current && Date.now() - lastInput.current > 12000) {
          sleeping.current = true;
          setMoods(Object.fromEntries(owned.map(c => [c.iso2, 'sleepy' as BallMood])));
        }
        const bs = bodies.current;
        for (let i = 0; i < bs.length; i++) {
          const b = bs[i];
          if (!b.held && !sleeping.current) {
            b.x += b.vx * dt; b.y += b.vy * dt;
            b.vx *= .998; b.vy *= .998;
            // Απαλό ελατήριο κρατά τις μπάλες μέσα στον χώρο.
            if ((b.x < 0 || b.x > width() - DIAMETER || b.y < 0 || b.y > height() - DIAMETER) && Math.hypot(b.vx, b.vy) > 2 && time - b.bumpedAt > 2400) {
              b.bumpedAt = time; temporaryMood(i, 'disappointed', 750);
            }
            if (b.x < 0 || b.x > width() - DIAMETER) b.vx += (Math.max(0, Math.min(width() - DIAMETER, b.x)) - b.x) * .055 * dt;
            if (b.y < 0 || b.y > height() - DIAMETER) b.vy += (Math.max(0, Math.min(height() - DIAMETER, b.y)) - b.y) * .055 * dt;
            b.x = Math.max(-8, Math.min(width() - DIAMETER + 8, b.x));
            b.y = Math.max(-8, Math.min(height() - DIAMETER + 8, b.y));
          }
          nodes.current[i]?.style.setProperty('transform', `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0)`);
        }
        if (!sleeping.current) for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
          const a = bs[i], b = bs[j];
          if (a.held || b.held) continue;
          const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy) || 1;
          if (distance >= DIAMETER - 5) continue;
          const nx = dx / distance, ny = dy / distance, overlap = (DIAMETER - 5 - distance) / 2;
          a.x -= nx * overlap; a.y -= ny * overlap; b.x += nx * overlap; b.y += ny * overlap;
          const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (relative < 0) { const impulse = -relative * .75; a.vx -= nx * impulse; a.vy -= ny * impulse; b.vx += nx * impulse; b.vy += ny * impulse; }
          if (time - a.bumpedAt > 2400 && time - b.bumpedAt > 2400) {
            a.bumpedAt = b.bumpedAt = time;
            temporaryMood(i, 'confused', 650); temporaryMood(j, 'giggle', 650);
          }
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [owned, reduced, temporaryMood]);
  const down = (event: PointerEvent<HTMLDivElement>, index: number) => {
    if (reduced) { temporaryMood(index, 'love', 1400); setBubble({ index, sequence: Date.now() }); return; }
    const b = bodies.current[index]; if (!b) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    b.held = true; b.moved = false; b.lastX = event.clientX; b.lastY = event.clientY; b.lastT = performance.now();
    lastInput.current = Date.now();
    if (sleeping.current) { sleeping.current = false; setMoods({}); b.vx = .5; b.vy = -.5; }
    temporaryMood(index, 'curious', 800);
  };
  const move = (event: PointerEvent<HTMLDivElement>, index: number) => {
    const b = bodies.current[index]; if (!b?.held || reduced) return;
    const now = performance.now(), dt = Math.max(16, now - b.lastT);
    const dx = event.clientX - b.lastX, dy = event.clientY - b.lastY;
    if (Math.hypot(dx, dy) > 2) b.moved = true;
    b.x += dx; b.y += dy; b.vx = Math.max(-8, Math.min(8, dx / dt * 16)); b.vy = Math.max(-8, Math.min(8, dy / dt * 16));
    b.lastX = event.clientX; b.lastY = event.clientY; b.lastT = now;
    lastInput.current = Date.now();
  };
  const up = (index: number) => {
    const b = bodies.current[index]; if (!b?.held || reduced) return;
    b.held = false; lastInput.current = Date.now();
    if (!b.moved) { temporaryMood(index, 'giggle', 900); setBubble({ index, sequence: Date.now() }); vibrate(8); }
    else temporaryMood(index, 'excited', 1000);
  };
  return <main className="yard">
    <h1 className="page-title">Η αυλή των CountryBalls</h1>
    <p className="page-subtitle">Σύρε τους φίλους σου, άφησέ τους να κυλήσουν και άγγιξέ τους για να ξυπνήσουν!</p>
    <Link className="yard__back" to="/collection">← Πίσω στη Συλλογή</Link>
    {!owned.length ? <div className="yard__empty"><p>Κέρδισε φίλους παίζοντας!</p><Link to="/games">Πάμε στα παιχνίδια</Link></div> :
      <div ref={stageRef} className={`yard__stage ${reduced ? 'yard__stage--still' : ''}`} data-ball-social aria-label="Η αυλή με τις κερδισμένες μπάλες">
        {owned.map((country, index) => <div key={country.iso2} ref={node => { nodes.current[index] = node; }} className="yard__friend"
          onPointerDown={event => down(event, index)} onPointerMove={event => move(event, index)} onPointerUp={() => up(index)} onPointerCancel={() => up(index)}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); temporaryMood(index, 'love', 1400); setBubble({ index, sequence: Date.now() }); } }}
          role="button" tabIndex={0} aria-label={`Παίξε με τη φιγούρα: ${country.nameGreek}`}>
          {bubble?.index === index && <SpeechBubble key={bubble.sequence} lines={['Χι χι! Παίζουμε μαζί!']} voiceIso2={country.iso2} />}
          <CountryBall country={country} size={DIAMETER} identityVisible mood={moods[country.iso2] ?? 'idle'} reactive={false} speechEnabled={false} />
          <span className="yard__name">{country.nameGreek}</span>
        </div>)}
      </div>}
  </main>;
}
