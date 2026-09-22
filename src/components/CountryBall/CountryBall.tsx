import { useId, type CSSProperties } from 'react';
import type { Country } from '../../types/country';
import { getFlagUrl } from '../Flag/flagAssets';
import { useBallReaction } from '../../reactions/useBallReaction';
import type { BallMood } from '../../reactions/events';
export type { BallMood } from '../../reactions/events';
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
    blinkDur: rand(3.2, 5.2),
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
}: CountryBallProps) {
  const reaction = useBallReaction(country.iso2, reactive && explicitMood === undefined);
  const mood = explicitMood ?? reaction.mood;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const flagUrl = getFlagUrl(country.iso2);
  const clipId = `cb-clip-${uid}`;
  const shadeId = `cb-shade-${uid}`;
  const ch = characterFor(country.iso2);
  const delay = animationDelay ?? `${ch.delay.toFixed(2)}s`;
  const moodClass = mood !== 'idle' ? `countryball--${mood}` : '';

  const ballStyle = {
    width: size,
    height: size * 1.08,
    animationDelay: delay,
    '--cb-float-dur': `${ch.floatDur.toFixed(2)}s`,
    '--cb-tilt-dur': `${ch.tiltDur.toFixed(2)}s`,
    '--cb-tilt-deg': `${ch.tiltDeg.toFixed(2)}deg`,
    '--cb-blink-dur': `${ch.blinkDur.toFixed(2)}s`,
  } as CSSProperties;

  return (
    <div className={`countryball ${moodClass} ${className}`} style={ballStyle} aria-hidden="true">
      <svg
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
              href={flagUrl}
              x="-14"
              y="4"
              width="128"
              height="96"
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${clipId})`}
            />
          ) : (
            <circle cx="50" cy="52" r="46" fill="#9db8cc" />
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
          {ch.blush && (
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
              <circle cx={ch.eyeLeftCx + ch.pupilDx + 1.5} cy={ch.eyeCy + ch.pupilDy - 2} r="1.4" fill="#fff" />
            </g>
            <g className="countryball__eye">
              <ellipse cx={ch.eyeRightCx} cy={ch.eyeCy} rx={ch.eyeRx} ry={ch.eyeRy} fill="#fff" stroke="rgba(8,33,56,0.75)" strokeWidth="2" />
              <circle className="countryball__pupil" cx={ch.eyeRightCx + ch.pupilDx} cy={ch.eyeCy + ch.pupilDy} r="4" fill="#14283c" />
              <circle cx={ch.eyeRightCx + ch.pupilDx + 1.5} cy={ch.eyeCy + ch.pupilDy - 2} r="1.4" fill="#fff" />
            </g>
            {/* Φρύδια */}
            {ch.brows && (
              <g stroke="rgba(8,33,56,0.7)" strokeWidth="2.4" strokeLinecap="round">
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

          {/* Στόμα */}
          <Mouth kind={ch.mouth} cy={ch.eyeCy} />
        </g>
      </svg>
    </div>
  );
}
