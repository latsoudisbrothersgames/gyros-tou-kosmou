import { useId, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Country } from '../../types/country';
import { getFlagUrl } from '../Flag/flagAssets';
import { useReactions } from '../../reactions/ReactionsProvider';
import { useBallReaction } from '../../reactions/useBallReaction';
import type { BallMood } from '../../reactions/events';
export type { BallMood } from '../../reactions/events';
import { SpeechBubble } from '../SpeechBubble/SpeechBubble';
import { useSettings } from '../../context/SettingsContext';
import { countryFact, countryGreeting, pickBallLine } from '../../data/ballLines';
import './CountryBall.css';

/** Διάθεση/κίνηση του χαρακτήρα */


interface CountryBallProps {
  country: Country;
  /** Διάμετρος σε px */
  size?: number;
  className?: string;
  /** Καθυστέρηση κίνησης για ποικιλία όταν υπάρχουν πολλές μπάλες */
  animationDelay?: string;
  /** idle: ήρεμο αιώρημα · happy: χαρούμενα άλματα · dance: χορός · sad: στενοχώρια */
  mood?: BallMood;
  reactive?: boolean;
  /** Η κρυμμένη σημαία απουσιάζει εντελώς από το DOM. */
  concealed?: boolean;
  /** Επιτρέπει μία κοινή, ακέραιη φούσκα έξω από λωρίδες που κόβονται στα άκρα. */
  speechEnabled?: boolean;
  /** Μόνο ρητή έγκριση εμφανίζει χώρα-ειδικά στοιχεία. */
  identityVisible?: boolean;
}

/** Ντετερμινιστική «τυχαιότητα» από το iso2 — ίδια χώρα, ίδιος χαρακτήρας */
function makeSeededRandom(iso2: string) {
  let h = 2166136261;
  for (let i = 0; i < iso2.length; i++) {
    h ^= iso2.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function next(min: number, max: number) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const u = ((h ^= h >>> 16) >>> 0) / 4294967296;
    return min + u * (max - min);
  };
}

interface BallCharacter {
  eyeRx: number;
  eyeRy: number;
  eyeLeftCx: number;
  eyeRightCx: number;
  eyeCy: number;
  pupilDx: number;
  pupilDy: number;
  mouth: 0 | 1 | 2 | 3;
  blush: boolean;
  brows: boolean;
  browTilt: number;
  floatDur: number;
  tiltDur: number;
  tiltDeg: number;
  blinkDur: number;
  delay: number;
}

function characterFor(iso2: string): BallCharacter {
  const rand = makeSeededRandom(iso2);
  const eyeGap = rand(13, 16);
  return {
    eyeRx: rand(8.5, 11),
    eyeRy: rand(10.5, 13.5),
    eyeLeftCx: 50 - eyeGap,
    eyeRightCx: 50 + eyeGap,
    eyeCy: rand(40, 44),
    pupilDx: rand(0.5, 3),
    pupilDy: rand(0.5, 3),
    mouth: Math.floor(rand(0, 4)) as 0 | 1 | 2 | 3,
    blush: rand(0, 1) > 0.45,
    brows: rand(0, 1) > 0.55,
    browTilt: rand(-9, 9),
    floatDur: rand(3.6, 5.6),
    tiltDur: rand(4.8, 7.2),
    tiltDeg: rand(1.6, 3.6),
    blinkDur: rand(3, 7),
    delay: rand(0, 2),
  };
}

function Mouth({ kind, cy }: { kind: BallCharacter['mouth']; cy: number }) {
  const y = cy + 20;
  switch (kind) {
    case 0: // απαλό χαμόγελο
      return (
        <path
          d={`M 40 ${y} Q 50 ${y + 8} 60 ${y}`}
          fill="none"
          stroke="rgba(8,33,56,0.8)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      );
    case 1: // πλατύ χαμόγελο
      return (
        <path
          d={`M 35 ${y - 1} Q 50 ${y + 13} 65 ${y - 1}`}
          fill="none"
          stroke="rgba(8,33,56,0.8)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      );
    case 2: // έκπληξη «ο»
      return (
        <ellipse cx="50" cy={y + 3} rx="4" ry="4.8" fill="rgba(8,33,56,0.85)" />
      );
    case 3: // ανοιχτό γέλιο
      return (
        <path
          d={`M 39 ${y - 1} Q 50 ${y + 14} 61 ${y - 1} Z`}
          fill="rgba(8,33,56,0.85)"
        />
      );
  }
}

/**
 * Διαδικαστικό «countryball»: σφαιρικός χαρακτήρας από τη σημαία
 * της χώρας, με καρτουνίστικα μάτια, σκίαση και ήπια κίνηση.
 * Τα χαρακτηριστικά (μάτια, στόμα, μαγουλάκια, ρυθμός κίνησης)
 * παράγονται ντετερμινιστικά από το iso2 — κάθε χώρα έχει τον
 * δικό της, πάντα ίδιο, χαρακτήρα χωρίς ξεχωριστά αρχεία.
 */
export function CountryBall({
  country,
  size = 140,
  className = '',
  animationDelay,
  mood: explicitMood,
  reactive = true,
  concealed = false,
  speechEnabled = true,
  identityVisible = false,
}: CountryBallProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reactions = useReactions();
  const [live, setLive] = useState(false);
  const [microMood, setMicroMood] = useState<BallMood | null>(null);
  const { settings } = useSettings();
  useEffect(() => {
    const element = rootRef.current;
    if (element && reactions) return reactions.registerBall(element, setLive);
  }, [reactions]);
  const identity = identityVisible && !concealed;
  const reaction = useBallReaction(country.iso2, live && reactive && !concealed && explicitMood === undefined);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const mood = explicitMood ?? (reaction.mood !== 'idle' ? reaction.mood : microMood ?? 'idle');
  useEffect(() => {
    if (!live || explicitMood !== undefined || settings.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rand = makeSeededRandom(uid);
    let timer: ReturnType<typeof setTimeout>;
    let end: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const cycle = () => {
      const choice = rand(0, 1);
      const next: BallMood | null = choice < .48 ? null : choice < .76 ? 'curious' : choice < .92 ? 'sleepy' : 'surprised';
      if (next === null) {
        const root = rootRef.current;
        root?.style.setProperty('--cb-look-x', `${rand(-2, 2).toFixed(1)}px`);
        end = setTimeout(() => root?.style.setProperty('--cb-look-x', '0px'), 900);
      } else {
        setMicroMood(next);
        end = setTimeout(() => { if (!cancelled) setMicroMood(null); }, next === 'sleepy' ? 1400 : 650);
      }
      timer = setTimeout(cycle, rand(8000, 12000));
    };
    timer = setTimeout(cycle, rand(8000, 12000));
    return () => { cancelled = true; clearTimeout(timer); clearTimeout(end); };
  }, [live, explicitMood, settings.reducedMotion, uid]);
  const flagUrl = concealed ? undefined : getFlagUrl(country.iso2);
  const clipId = `cb-clip-${uid}`;
  const shadeId = `cb-shade-${uid}`;
  const ch = characterFor(identity ? country.iso2 : uid);
  const delay = animationDelay ?? `${ch.delay.toFixed(2)}s`;
  const moodClass = `countryball--${mood}`;
  const mouthKind = ['surprised', 'sleepy', 'nervous', 'confused', 'dizzy'].includes(mood) ? 2
    : ['celebrate', 'dance', 'happy', 'excited', 'giggle', 'love'].includes(mood) ? 3 : mood === 'idle' ? ch.mouth : 0;

  const ballStyle = {
    width: size,
    height: size * 1.08,
    animationDelay: mood === 'idle' ? delay : animationDelay ?? '0s',
    '--cb-float-dur': `${ch.floatDur.toFixed(2)}s`,
    '--cb-tilt-dur': `${ch.tiltDur.toFixed(2)}s`,
    '--cb-tilt-deg': `${ch.tiltDeg.toFixed(2)}deg`,
    '--cb-blink-dur': `${ch.blinkDur.toFixed(2)}s`,
  } as CSSProperties;

  return (
    <div ref={rootRef} data-iso2={identity ? country.iso2 : undefined} data-identity-visible={identity} data-live={live} className={`countryball ${moodClass} ${!live ? 'countryball--static' : ''} ${className}`} style={ballStyle}>
      {speechEnabled && reaction.speech && (reaction.speech.reaction.speech === 'mood' || identity) && (
        <SpeechBubble key={`${country.iso2}-${reaction.speech.sequence}`} lines={
          reaction.speech.reaction.speech === 'greeting' ? [countryGreeting(country), countryFact(country)]
            : reaction.speech.reaction.speech === 'fact' ? [countryFact(country, reaction.speech.sequence - 1)]
            : [pickBallLine(reaction.speech.reaction.steps[0].mood, identity ? country.iso2 : 'xx', reaction.speech.sequence)]
        } voiceIso2={identity ? country.iso2 : undefined} audible={reaction.speech.event.type !== 'answer:correct' || reaction.speech.event.iso2 === country.iso2} />
      )}
      <svg
        aria-hidden="true"
        className="countryball__svg"
        viewBox="0 0 100 108"
        width={size}
        height={size * 1.08}
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx="50" cy="52" r="46" />
          </clipPath>
          <radialGradient id={shadeId} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(8,33,56,0.38)" />
          </radialGradient>
        </defs>

        {/* Σκιά εδάφους */}
        <ellipse className="countryball__ground" cx="50" cy="103" rx="30" ry="5" fill="rgba(8,33,56,0.18)" />

        <g className="countryball__body">
          {/* Σώμα-σημαία */}
          {flagUrl ? (
            <image
              className="countryball__flag"
              href={flagUrl}
              x="-14"
              y="4"
              width="128"
              height="96"
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${clipId})`}
            />
          ) : (
            <circle cx="50" cy="52" r="46" fill={concealed ? "#46515c" : "#9db8cc"} />
          )}
          {/* Σφαιρική σκίαση */}
          <circle cx="50" cy="52" r="46" fill={`url(#${shadeId})`} />
          {/* Γυαλάδα-παιχνιδιού πάνω αριστερά */}
          <ellipse
            cx="35"
            cy="25"
            rx="13"
            ry="6.5"
            fill="rgba(255,255,255,0.4)"
            transform="rotate(-20 35 25)"
          />
          <circle cx="50" cy="52" r="46" fill="none" stroke="rgba(8,33,56,0.55)" strokeWidth="2.5" />
          {/* Λευκό περίγραμμα αυτοκόλλητου — «συλλεκτικό» φινίρισμα */}
          <circle cx="50" cy="52" r="48.4" fill="none" stroke="#ffffff" strokeWidth="2.8" opacity="0.9" />

          {/* Μαγουλάκια */}
          {(ch.blush || mood === 'shy') && (
            <g>
              <ellipse cx={ch.eyeLeftCx - 7} cy={ch.eyeCy + 14} rx="5.5" ry="3.2" fill="rgba(255,107,107,0.4)" />
              <ellipse cx={ch.eyeRightCx + 7} cy={ch.eyeCy + 14} rx="5.5" ry="3.2" fill="rgba(255,107,107,0.4)" />
            </g>
          )}

          {/* Μάτια */}
          <g className="countryball__eyes">
            <g className="countryball__eye">
              <ellipse cx={ch.eyeLeftCx} cy={ch.eyeCy} rx={ch.eyeRx} ry={ch.eyeRy} fill="#fff" stroke="rgba(8,33,56,0.75)" strokeWidth="2" />
              <circle className="countryball__pupil" cx={ch.eyeLeftCx + ch.pupilDx} cy={ch.eyeCy + ch.pupilDy} r="4" fill="#14283c" />
              <circle className="countryball__pupil" cx={ch.eyeLeftCx + ch.pupilDx + 1.5} cy={ch.eyeCy + ch.pupilDy - 2} r="1.4" fill="#fff" />
            </g>
            <g className="countryball__eye">
              <ellipse cx={ch.eyeRightCx} cy={ch.eyeCy} rx={ch.eyeRx} ry={ch.eyeRy} fill="#fff" stroke="rgba(8,33,56,0.75)" strokeWidth="2" />
              <circle className="countryball__pupil" cx={ch.eyeRightCx + ch.pupilDx} cy={ch.eyeCy + ch.pupilDy} r="4" fill="#14283c" />
              <circle className="countryball__pupil" cx={ch.eyeRightCx + ch.pupilDx + 1.5} cy={ch.eyeCy + ch.pupilDy - 2} r="1.4" fill="#fff" />
            </g>
            {/* Φρύδια */}
            {(ch.brows || mood !== 'idle') && (
              <g className="countryball__brows" stroke="rgba(8,33,56,0.7)" strokeWidth="2.4" strokeLinecap="round">
                <line
                  x1={ch.eyeLeftCx - 6}
                  y1={ch.eyeCy - ch.eyeRy - 4}
                  x2={ch.eyeLeftCx + 6}
                  y2={ch.eyeCy - ch.eyeRy - 4}
                  transform={`rotate(${ch.browTilt} ${ch.eyeLeftCx} ${ch.eyeCy - ch.eyeRy - 4})`}
                />
                <line
                  x1={ch.eyeRightCx - 6}
                  y1={ch.eyeCy - ch.eyeRy - 4}
                  x2={ch.eyeRightCx + 6}
                  y2={ch.eyeCy - ch.eyeRy - 4}
                  transform={`rotate(${-ch.browTilt} ${ch.eyeRightCx} ${ch.eyeCy - ch.eyeRy - 4})`}
                />
              </g>
            )}
            {/* Βλέφαρα για το ανοιγόκλεισμα */}
            <g className="countryball__blink">
              <ellipse cx={ch.eyeLeftCx} cy={ch.eyeCy} rx={ch.eyeRx + 1} ry={ch.eyeRy + 1} fill="rgba(8,33,56,0.85)" />
              <ellipse cx={ch.eyeRightCx} cy={ch.eyeCy} rx={ch.eyeRx + 1} ry={ch.eyeRy + 1} fill="rgba(8,33,56,0.85)" />
            </g>
          </g>

          {/* Στόμα: νέο επίπεδο ανά διάθεση για ασφαλές fade στο Safari. */}
          <g key={mood} className="countryball__mouth">
          {mood === 'sad' || mood === 'shrug' ? (
            <path d={mood === 'sad' ? 'M40 68 Q50 58 60 68' : 'M41 64 L59 62'} fill="none" stroke="#14283c" strokeWidth="2.6" strokeLinecap="round" />
          ) : mood === 'disappointed' ? <path d="M40 66 Q50 63 60 66" fill="none" stroke="#14283c" strokeWidth="2.6" strokeLinecap="round" /> : <Mouth kind={mouthKind} cy={ch.eyeCy} />}
          </g>
          {(mood === 'sleepy' || mood === 'shy' || mood === 'thinking') && (
            <g fill="#8aa9bb" stroke="#14283c" strokeWidth="1">
              <path d={`M${ch.eyeLeftCx - ch.eyeRx} ${ch.eyeCy} a${ch.eyeRx} ${ch.eyeRy} 0 0 1 ${ch.eyeRx * 2} 0 Z`} />
              <path d={`M${ch.eyeRightCx - ch.eyeRx} ${ch.eyeCy} a${ch.eyeRx} ${ch.eyeRy} 0 0 1 ${ch.eyeRx * 2} 0 Z`} />
            </g>
          )}
          {mood === 'curious' && <path d="M28 25 Q35 20 42 24" fill="none" stroke="#14283c" strokeWidth="2.4" strokeLinecap="round" />}
          {mood === 'confused' && <text x="72" y="28" fontSize="18" fontWeight="bold" fill="#14283c">?</text>}
          {mood === 'excited' && <g fill="#ffdf63"><path d="M33 38 l2 5 5 1 -5 2 -2 5 -2 -5 -5 -2 5 -1Z"/><path d="M65 38 l2 5 5 1 -5 2 -2 5 -2 -5 -5 -2 5 -1Z"/></g>}
          {mood === 'dizzy' && <g fill="none" stroke="#14283c" strokeWidth="2"><path d="M29 42 q8 -9 12 0 q3 7 -7 7 q-5 -1 -2 -5"/><path d="M59 42 q8 -9 12 0 q3 7 -7 7 q-5 -1 -2 -5"/></g>}
          {mood === 'love' && <g fill="#ff718d"><path d="M26 42 C26 34 34 34 35 39 C37 34 45 34 45 42 L35 52Z"/><path d="M56 42 C56 34 64 34 65 39 C67 34 75 34 75 42 L65 52Z"/></g>}
          {mood === 'nervous' && <path className="countryball__sweat" d="M80 24 Q69 40 80 41 Q90 40 80 24Z" fill="#55cfff" stroke="#0d2f4f" />}
          {mood === 'sleepy' && <text className="countryball__zzz" x="70" y="16" fontSize="15" fill="#0d2f4f">ζζζ</text>}
          {(mood === 'wave' || mood === 'shrug') && (
            <g fill="none" stroke="#0d2f4f" strokeWidth="3" strokeLinecap="round">
              <path className="countryball__hand" d="M90 63 Q105 59 102 42 M102 42 l-5 -4 M102 42 l5 -5" />
              {mood === 'shrug' && <path d="M10 63 Q-5 58 -2 46 M-2 46 l-4 -3 M-2 46 l5 -4" />}
            </g>
          )}
          {mood === 'celebrate' && (
            <g className="countryball__confetti">
              {['#ff6b6b', '#ffd45c', '#5ccea6', '#a684e8', '#55cfff', '#ffad72'].map((color, index) => (
                <rect key={color} x={8 + index * 16} y={-8 + (index % 2) * 12} width="4" height="7" rx="1" fill={color} transform={`rotate(${index * 25} ${10 + index * 16} 0)`} />
              ))}
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
