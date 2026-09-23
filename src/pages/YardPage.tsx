import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { CountryBall, type BallMood } from '../components/CountryBall/CountryBall';
import { SpeechBubble } from '../components/SpeechBubble/SpeechBubble';
import { ALL_COUNTRIES } from '../data/countries';
import { canGreet } from '../reactions/social';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { loadCollection } from '../utils/collection';
import './YardPage.css';

const DIAMETER = 70;
type Body = { x: number; y: number; vx: number; vy: number; held: boolean; lastX: number; lastY: number; lastT: number; moved: boolean; bumpedAt: number; wallAt: number; downAt?: number; targetX?: number; targetY?: number };

/** Πρόσθετη ελεύθερη αυλή· δεν γράφει πρόοδο ή αποτέλεσμα παιχνιδιού. */
export function YardPage() {
  const collected = useMemo(() => { const set = loadCollection(); return ALL_COUNTRIES.filter(c => set.has(c.iso2)); }, []);
  const [invited, setInvited] = useState(() => collected.slice(0, 8).map(c => c.iso2));
  const owned = useMemo(() => invited.map(id => collected.find(c => c.iso2 === id)!).filter(Boolean), [collected, invited]);
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const bodies = useRef<Body[]>([]);
  const lastInput = useRef(Date.now());
  const sleeping = useRef(false);
  const [moods, setMoods] = useState<Record<string, BallMood>>({});
  const [bubble, setBubble] = useState<{ index: number; sequence: number; lines: string[] } | null>(null);
  const [taps, setTaps] = useState<Record<string, number>>({});
  const [hugs, setHugs] = useState<Record<string, number>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const moodTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const temporaryMood = useCallback((index: number, mood: BallMood, duration = 1000) => {
    const iso2 = owned[index]?.iso2;
    if (!iso2) return;
    const previous = moodTimers.current.get(iso2); if (previous) clearTimeout(previous);
    setMoods(prev => ({ ...prev, [iso2]: mood }));
    const timer = setTimeout(() => { moodTimers.current.delete(iso2); setMoods(prev => { const next = { ...prev }; delete next[iso2]; return next; }); }, duration);
    moodTimers.current.set(iso2, timer);
  }, [owned]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); moodTimers.current.forEach(clearTimeout); }, []);
  const inviteFriends = () => {
    if (collected.length <= 8) return;
    const pool = [...collected.map(c => c.iso2)];
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const next = pool.slice(0, 8);
    const newcomer = pool.find(id => !invited.includes(id));
    if (newcomer && next.every(id => invited.includes(id))) next[0] = newcomer;
    moodTimers.current.forEach(clearTimeout); moodTimers.current.clear();
    timers.current.forEach(clearTimeout); timers.current = [];
    setMoods({}); setBubble(null); sleeping.current = false; lastInput.current = Date.now();
    setInvited(next);
  };
  useEffect(() => {
    if (reduced || !owned.length) return;
    const stage = stageRef.current;
    if (!stage) return;
    const width = () => Math.max(DIAMETER, stage.clientWidth);
    const height = () => Math.max(DIAMETER, stage.clientHeight);
    // Περιθώρια ώστε να μην κόβεται η μπάλα όταν αναπηδά: δεξιά το κρατούμενο αξεσουάρ, κάτω το όνομα (Claude 23.09).
    const EDGE = 6, maxX = () => Math.max(EDGE, width() - DIAMETER - 18), maxY = () => Math.max(EDGE, height() - DIAMETER - 28);
    bodies.current = owned.map((_, i) => ({
      x: EDGE + 2 + (i % 3) * Math.max(0, (maxX() - EDGE - 4) / 2),
      y: 24 + Math.floor(i / 3) * Math.max(0, (height() - DIAMETER - 64) / 3),
      vx: (i % 2 ? 1 : -1) * (.3 + i * .035), vy: (i % 3 ? .28 : -.28),
      held: false, lastX: 0, lastY: 0, lastT: 0, moved: false, bumpedAt: -3000, wallAt: -3000,
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
            if (b.targetX !== undefined && b.targetY !== undefined) {
              const dx = b.targetX - b.x, dy = b.targetY - b.y, distance = Math.hypot(dx, dy);
              if (distance < 12) { b.targetX = b.targetY = undefined; b.vx *= .3; b.vy *= .3; temporaryMood(i, 'excited', 850); }
              else { b.vx += (dx / distance * 3.8 - b.vx) * .16 * dt; b.vy += (dy / distance * 3.8 - b.vy) * .16 * dt; }
            }
            b.x += b.vx * dt; b.y += b.vy * dt;
            b.vx *= .998; b.vy *= .998;
            // Απαλό ελατήριο κρατά τις μπάλες μέσα στον χώρο.
            if ((b.x < EDGE || b.x > maxX() || b.y < EDGE || b.y > maxY()) && Math.hypot(b.vx, b.vy) > 2 && time - b.wallAt > 2400 && time - b.bumpedAt > 900) {
              b.wallAt = time; temporaryMood(i, 'disappointed', 750);
            }
            if (b.x < EDGE || b.x > maxX()) b.vx += (Math.max(EDGE, Math.min(maxX(), b.x)) - b.x) * .055 * dt;
            if (b.y < EDGE || b.y > maxY()) b.vy += (Math.max(EDGE, Math.min(maxY(), b.y)) - b.y) * .055 * dt;
            b.x = Math.max(2, Math.min(maxX() + 4, b.x));
            b.y = Math.max(2, Math.min(maxY() + 4, b.y));
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
            temporaryMood(i, 'surprised', 430); temporaryMood(j, 'surprised', 430);
            timers.current.push(setTimeout(() => { temporaryMood(i, 'giggle', 900); temporaryMood(j, 'giggle', 900); }, 430));
            if (canGreet(owned[i].iso2, owned[j].iso2, true, true)) {
              setBubble({ index: i, sequence: Date.now(), lines: ['Γεια σου γείτονα!'] });
            }
          }
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [owned, reduced, temporaryMood]);
  const down = (event: PointerEvent<HTMLDivElement>, index: number) => {
    if (reduced) { temporaryMood(index, 'love', 1400); setBubble({ index, sequence: Date.now(), lines: ['Χι χι! Παίζουμε μαζί!'] }); return; }
    const b = bodies.current[index]; if (!b) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    b.held = true; b.targetX = b.targetY = undefined; b.moved = false; b.lastX = event.clientX; b.lastY = event.clientY; b.lastT = performance.now(); b.downAt = b.lastT;
    lastInput.current = Date.now();
    if (sleeping.current) { sleeping.current = false; setMoods({}); b.vx = .5; b.vy = -.5; }
    temporaryMood(index, 'curious', 800);
  };
  const move = (event: PointerEvent<HTMLDivElement>, index: number) => {
    const b = bodies.current[index]; if (!b?.held || reduced) return;
    const now = performance.now(), dt = Math.max(16, now - b.lastT);
    const dx = event.clientX - b.lastX, dy = event.clientY - b.lastY;
    if (Math.hypot(dx, dy) > 6) b.moved = true;
    b.x += dx; b.y += dy; b.vx = Math.max(-8, Math.min(8, dx / dt * 16)); b.vy = Math.max(-8, Math.min(8, dy / dt * 16));
    b.lastX = event.clientX; b.lastY = event.clientY; b.lastT = now;
    lastInput.current = Date.now();
  };
  const up = (index: number) => {
    const b = bodies.current[index]; if (!b?.held || reduced) return;
    b.held = false; lastInput.current = Date.now();
    if (!b.moved) {
      // Άγγιγμα, όχι σύρσιμο: η μπάλα μετρά το σερί (3 → γαργάλημα, 6 → ζάλη) ή δίνει αγκαλιά σε παρατεταμένο πάτημα.
      const held = performance.now() - (b.downAt ?? performance.now());
      const iso2 = owned[index]?.iso2;
      if (iso2) (held >= 600 ? setHugs : setTaps)(v => ({ ...v, [iso2]: (v[iso2] ?? 0) + 1 }));
    }
    else temporaryMood(index, 'excited', 1000);
  };
  const stageTap = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !owned.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const tx = event.clientX - rect.left, ty = event.clientY - rect.top;
    lastInput.current = Date.now();
    if (sleeping.current) { sleeping.current = false; setMoods({}); }
    let nearest = 0, nearestDistance = Infinity;
    owned.forEach((_, i) => {
      const nodeRect = nodes.current[i]?.getBoundingClientRect();
      const body = bodies.current[i];
      const cx = reduced && nodeRect ? nodeRect.left - rect.left + DIAMETER / 2 : (body?.x ?? 0) + DIAMETER / 2;
      const cy = reduced && nodeRect ? nodeRect.top - rect.top + DIAMETER / 2 : (body?.y ?? 0) + DIAMETER / 2;
      const dx = tx - cx, dy = ty - cy;
      const distance = Math.hypot(dx, dy);
      if (distance < nearestDistance) { nearest = i; nearestDistance = distance; }
      const ball = nodes.current[i]?.querySelector<HTMLElement>('.countryball');
      ball?.style.setProperty('--cb-look-x', `${Math.max(-3, Math.min(3, dx / 20))}px`);
      ball?.style.setProperty('--cb-look-y', `${Math.max(-3, Math.min(3, dy / 20))}px`);
      temporaryMood(i, 'curious', 950);
    });
    if (!reduced && bodies.current[nearest]) {
      bodies.current[nearest].targetX = Math.max(0, Math.min(rect.width - DIAMETER, tx - DIAMETER / 2));
      bodies.current[nearest].targetY = Math.max(0, Math.min(rect.height - DIAMETER, ty - DIAMETER / 2));
    }
  };
  return <main className="yard">
    <h1 className="page-title">Η αυλή των CountryBalls</h1>
    <p className="page-subtitle">Σύρε τους φίλους σου, άφησέ τους να κυλήσουν και άγγιξέ τους για να ξυπνήσουν!</p>
    <div className="yard__controls"><Link className="yard__back" to="/collection">← Πίσω στη Συλλογή</Link>{collected.length > 8 && <button className="yard__invite" type="button" onClick={inviteFriends}>Κάλεσε φίλους</button>}</div>
    {!owned.length ? <div className="yard__empty"><p>Κέρδισε φίλους παίζοντας!</p><Link to="/games">Πάμε στα παιχνίδια</Link></div> :
      <div ref={stageRef} className={`yard__stage ${reduced ? 'yard__stage--still' : ''}`} aria-label="Η αυλή με τις κερδισμένες μπάλες" onPointerDown={stageTap}>
        {owned.map((country, index) => <div key={country.iso2} ref={node => { nodes.current[index] = node; }} className="yard__friend"
          onPointerDown={event => down(event, index)} onPointerMove={event => move(event, index)} onPointerUp={() => up(index)} onPointerCancel={() => up(index)}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); temporaryMood(index, 'love', 1400); setBubble({ index, sequence: Date.now(), lines: ['Χι χι! Παίζουμε μαζί!'] }); } }}
          role="button" tabIndex={0} aria-label={`Παίξε με τη φιγούρα: ${country.nameGreek}`}>
          {bubble?.index === index && <SpeechBubble key={bubble.sequence} lines={bubble.lines} voiceIso2={country.iso2} />}
          <CountryBall country={country} size={DIAMETER} identityVisible mood={moods[country.iso2] ?? 'idle'} reactive={false} speechEnabled={false} tapSignal={taps[country.iso2] ?? 0} hugSignal={hugs[country.iso2] ?? 0} />
          <span className="yard__name">{country.nameGreek}</span>
        </div>)}
      </div>}
  </main>;
}
