import type { ReactNode } from 'react';
import type { BallAccessory as Accessory } from '../../data/ballAccessories';

type ArtProps = { accessory: Accessory };
const ink = '#244258';

/** All art is SVG paths. A shared outline and broad color blocks keep it legible at 34px. */
function Motif({ accessory: a }: ArtProps): ReactNode {
  const c = a.color, d = a.accent;
  switch (a.motif) {
    case 'cap': return <><path d="M-14 3 Q-10 -9 1 -9 Q12 -8 12 2 L-13 5Z" fill={c}/><path d="M-14 4 Q-21 7 -12 9 L7 5" fill={d}/><path d="M-8 -3 Q0 -5 8 -2" stroke={d}/></>;
    case 'beret': return <><path d="M-16 3 Q-14 -11 1 -13 Q15 -10 15 2 Q3 9 -16 3Z" fill={c}/><path d="M-17 4 Q0 8 15 3" stroke={d}/><circle cy="-13" r="2.5" fill={d}/></>;
    case 'sombrero': return <><path d="M-10 3 Q-8 -15 -2 -14 L7 -13 L12 3Z" fill={c}/><path d="M-22 4 Q0 14 22 4 Q16 11 0 12 Q-16 11 -22 4Z" fill={c}/><path d="M-10 1 H11 M-15 8 Q0 14 15 8" stroke={d}/></>;
    case 'cowboy': return <><path d="M-14 6 Q-8 -1 -7 -11 Q0 -7 7 -11 Q7 -1 14 6Z" fill={c}/><path d="M-20 5 Q-14 10 -7 6 Q0 11 8 6 Q16 10 20 4" fill="none" stroke={c} strokeWidth="4"/><path d="M-9 1 Q0 5 9 1" stroke={d}/></>;
    case 'conical': return <><path d="M-20 7 L0 -14 L20 7Z" fill={c}/><path d="M-19 7 Q0 12 19 7 M-11 2 H11 M-6 -4 H6" stroke={d}/></>;
    case 'knit': case 'knit-bolivia': return <><path d="M-14 5 V-5 Q-12 -15 0 -15 Q12 -15 14 -5 V5Z" fill={c}/><path d="M-16 2 H16 V9 H-16Z" fill={d}/><path d="M-10 -5 L-5 -1 L0 -5 L5 -1 L10 -5 M-12 5 H12" stroke={a.motif === 'knit' ? '#fff1cc' : '#e77765'}/><circle cy="-16" r="3" fill={d}/><path d="M-14 8 L-18 15 M14 8 L18 15" stroke={c}/></>;
    case 'alpine-cap': return <><path d="M-15 6 Q-14 -11 5 -12 Q15 -8 14 6Z" fill={c}/><path d="M-19 6 Q0 10 19 6" stroke={d} strokeWidth="4"/><path d="M6 -7 L12 -20 M9 -13 L15 -16" stroke={d}/></>;
    case 'cork-hat': return <><path d="M-14 5 Q-11 -12 0 -13 Q11 -12 14 5Z" fill={c}/><path d="M-21 5 Q0 12 21 5" fill="none" stroke={c} strokeWidth="5"/><path d="M-15 5 V14 M15 5 V14" stroke={ink}/><circle cx="-15" cy="16" r="2" fill={d}/><circle cx="15" cy="16" r="2" fill={d}/></>;
    case 'tulip-crown': return <><path d="M-19 6 Q0 13 19 6" fill="none" stroke={d} strokeWidth="4"/><path d="M-14 3 L-18 -8 L-12 -5 L-8 -11 L-5 3Z M-3 2 L-6 -12 L0 -8 L6 -12 L3 2Z M8 3 L8 -10 L13 -6 L18 -9 L17 4Z" fill={c}/></>;
    case 'pizza': return <><path d="M-12 -12 Q0 -17 13 -10 L1 14Z" fill={c}/><path d="M-12 -12 Q0 -17 13 -10" fill="none" stroke={d} strokeWidth="4"/><circle cx="-3" cy="-5" r="2.3" fill={d}/><circle cx="5" cy="-7" r="2.3" fill={d}/><circle cx="2" cy="3" r="2.3" fill={d}/></>;
    case 'fan': return <><path d="M0 13 L-16 -6 Q-7 -16 0 -10 Q9 -17 16 -6Z" fill={c}/><path d="M0 13 L-10 -9 M0 13 L0 -11 M0 13 L10 -9 M-16 -6 Q0 -1 16 -6" stroke={d}/><circle cy="13" r="2" fill={d}/></>;
    case 'tile': return <><rect x="-12" y="-12" width="24" height="24" rx="2" fill={c}/><path d="M0 -10 L9 0 L0 10 L-9 0Z M-12 -12 L-5 -5 M12 -12 L5 -5 M-12 12 L-5 5 M12 12 L5 5" stroke={d}/><circle r="3" fill={d}/></>;
    case 'pretzel': return <><path d="M-11 -8 Q-20 -2 -9 8 Q-4 13 0 5 Q4 13 9 8 Q20 -2 11 -8 Q5 -11 0 -3 Q-5 -11 -11 -8Z M-12 -7 Q-5 3 12 8 M12 -7 Q5 3 -12 8" fill="none" stroke={c} strokeWidth="5"/><circle cx="-8" cy="-6" r="1.5" fill={d}/><circle cx="7" cy="2" r="1.5" fill={d}/></>;
    case 'chocolate': return <><rect x="-13" y="-11" width="26" height="22" rx="2" fill={c}/><path d="M-4 -11 V11 M5 -11 V11 M-13 0 H13" stroke={d} strokeWidth="2"/><path d="M-10 -7 L-7 -9 M-1 -7 L2 -9 M8 -7 L11 -9" stroke={d}/></>;
    case 'cowbell': return <><path d="M-7 -13 H7 L12 6 Q0 12 -12 6Z" fill={c}/><path d="M-7 -13 Q0 -18 7 -13 M-9 2 H9" stroke={d}/><circle cy="11" r="3" fill={d}/></>;
    case 'skis': return <><path d="M-9 -14 L9 14 M9 -14 L-9 14" stroke={c} strokeWidth="4"/><path d="M-12 -9 L-4 -13 M4 -13 L12 -9 M-13 7 L-5 12 M5 12 L13 7" stroke={d}/></>;
    case 'snowshoe': return <><ellipse rx="9" ry="14" fill={c}/><path d="M-9 -5 H9 M-9 2 H9 M-6 9 H6 M0 -14 V14 M-8 -9 L8 9 M8 -9 L-8 9" stroke={d}/></>;
    case 'horse': return <><path d="M-12 12 V0 L-6 -3 L-8 -12 L-3 -9 L2 -13 L8 -7 L4 -2 L11 3 V12 H5 V5 H-6 V12Z" fill={c}/><circle cx="3" cy="-7" r="1.5" fill={ink}/><path d="M-10 1 L-15 -3 M-8 4 H8" stroke={d}/></>;
    case 'volcano': return <><path d="M-15 12 L-5 -7 L2 -5 L7 -8 L17 12Z" fill={c}/><path d="M-5 -7 Q-1 3 3 -4 L7 -8" fill={d}/><path d="M-4 -12 Q-8 -18 -2 -20 M3 -11 Q8 -17 5 -21" stroke={d}/></>;
    case 'harp': return <><path d="M-10 -14 Q15 -15 12 11 H-11 Q-4 0 -10 -14Z" fill="none" stroke={c} strokeWidth="4"/><path d="M-5 -12 V9 M0 -12 V9 M5 -10 V9" stroke={d}/></>;
    case 'umbrella': return <><path d="M-15 -2 Q-12 -14 0 -15 Q12 -14 15 -2 Q10 -6 5 -2 Q0 -6 -5 -2 Q-10 -6 -15 -2Z" fill={c}/><path d="M0 -2 V12 Q0 17 6 13" fill="none" stroke={d} strokeWidth="2.5"/></>;
    case 'maple': return <><path d="M0 -15 L4 -8 L10 -11 L8 -4 L15 -2 L9 3 L11 9 L3 7 L0 14 L-3 7 L-11 9 L-9 3 L-15 -2 L-8 -4 L-10 -11 L-4 -8Z" fill={c}/><path d="M0 2 V15" stroke={d}/></>;
    case 'frog': return <><ellipse cy="4" rx="12" ry="9" fill={c}/><circle cx="-8" cy="-5" r="4" fill={c}/><circle cx="8" cy="-5" r="4" fill={c}/><circle cx="-8" cy="-5" r="1.5" fill={ink}/><circle cx="8" cy="-5" r="1.5" fill={ink}/><path d="M-5 6 Q0 10 5 6" stroke={d}/></>;
    case 'maracas': return <><path d="M-8 0 L2 14 M8 0 L-2 14" stroke={ink} strokeWidth="2.5"/><ellipse cx="-10" cy="-6" rx="5" ry="8" transform="rotate(-25 -10 -6)" fill={c}/><ellipse cx="10" cy="-6" rx="5" ry="8" transform="rotate(25 10 -6)" fill={d}/><path d="M-15 -5 H-5 M5 -5 H15" stroke={ink}/></>;
    case 'drum': case 'talking-drum': return <><path d={a.motif === 'drum' ? 'M-12 -8 H12 L9 11 H-9Z' : 'M-11 -11 Q0 -5 11 -11 L6 10 Q0 4 -6 10Z'} fill={c}/><ellipse cy="-8" rx="12" ry="4" fill={d}/><path d="M-10 -4 L8 9 M10 -4 L-8 9" stroke={d}/></>;
    case 'football': return <><circle r="12" fill={c}/><path d="M-4 -3 L3 -6 L8 -1 L5 6 L-3 7 L-7 1Z M-12 -2 L-7 1 M8 -1 L12 -4 M5 6 L8 10 M-3 7 L-7 11" fill={d} stroke={ink} strokeWidth="1.4"/></>;
    case 'coffee': return <><path d="M-11 -7 H7 V8 Q-2 14 -11 8Z" fill={c}/><path d="M7 -5 Q17 -5 14 2 Q12 6 7 4 M-13 11 H9 M-6 -11 Q-9 -16 -5 -19 M1 -11 Q-1 -16 3 -19" stroke={d}/></>;
    case 'tortoise': return <><path d="M-12 4 Q-10 -11 1 -10 Q12 -10 13 4Z" fill={c}/><path d="M-12 4 H13 M-5 -6 L1 4 L7 -6 M-8 8 H-5 M6 8 H9" stroke={d}/><circle cx="15" cy="2" r="4" fill={c}/><circle cx="16" cy="1" r="1" fill={ink}/></>;
    case 'cat': return <><path d="M-11 -5 L-10 -13 L-3 -9 Q0 -11 3 -9 L10 -13 L11 -5 Q15 8 0 12 Q-15 8 -11 -5Z" fill={c}/><circle cx="-5" cy="0" r="1.8" fill={ink}/><circle cx="5" cy="0" r="1.8" fill={ink}/><path d="M-2 5 L0 7 L2 5 M-9 5 L-15 3 M9 5 L15 3" stroke={d}/></>;
    case 'protea': case 'lotus': return <><path d="M0 11 Q-14 4 -12 -7 Q-5 -5 0 2 Q5 -5 12 -7 Q14 4 0 11Z" fill={c}/><path d="M0 8 Q-7 -2 0 -14 Q7 -2 0 8Z" fill={d}/><path d="M-14 2 Q-7 4 0 11 Q7 4 14 2" stroke={d}/></>;
    case 'acacia': return <><path d="M0 0 V13 M0 4 L-9 -2 M0 5 L9 -3" stroke="#8e654c" strokeWidth="3"/><path d="M-16 -4 Q-14 -13 -5 -11 Q0 -17 7 -11 Q15 -11 16 -4 Q5 1 -16 -4Z" fill={c}/></>;
    case 'mountain': return <><path d="M-16 12 L-4 -12 L3 0 L8 -8 L17 12Z" fill={c}/><path d="M-8 0 L-4 -12 L1 -2 L4 2 L8 -8 L12 2" fill="none" stroke="#f8f9eb" strokeWidth="3"/><path d="M-16 12 H17" stroke={d}/></>;
    case 'lantern': case 'paper-lantern': return <><path d="M-5 -14 H5 M0 -17 V-13 M-9 -11 Q0 -15 9 -11 L10 7 Q0 13 -10 7Z" fill={c}/><path d="M-8 -5 H8 M-8 4 H8 M0 -11 V10 M0 11 V16" stroke={d}/></>;
    case 'basket': return <><path d="M-12 -3 H12 L9 12 H-9Z" fill={c}/><path d="M-7 -4 Q-7 -15 0 -15 Q7 -15 7 -4 M-10 3 H10 M-7 8 H7" stroke={d}/><circle cx="-4" cy="-3" r="3" fill="#668552"/><circle cx="4" cy="-3" r="3" fill="#668552"/></>;
    case 'cocoa': case 'bean': return <><path d="M0 -14 Q14 -12 11 2 Q8 16 -2 14 Q-15 10 -11 -3 Q-8 -13 0 -14Z" fill={c}/><path d="M-4 -11 Q5 -3 0 11 M-8 -2 Q0 0 7 0" stroke={d}/></>;
    case 'lemur': return <><ellipse cx="-1" cy="3" rx="9" ry="10" fill={c}/><circle cx="-9" cy="-7" r="4" fill={d}/><circle cx="7" cy="-7" r="4" fill={d}/><circle cx="-5" cy="1" r="2" fill={ink}/><circle cx="4" cy="1" r="2" fill={ink}/><path d="M8 9 Q19 8 14 -5 M13 6 L18 7 M14 1 L19 2" stroke={ink} strokeWidth="3"/></>;
    case 'cherry': return <><path d="M-13 11 Q0 3 13 -10 M-6 5 Q-15 2 -14 -5 M3 -1 Q5 -10 11 -13" stroke={d} strokeWidth="3"/><circle cx="-13" cy="-5" r="4" fill={c}/><circle cx="10" cy="-12" r="4" fill={c}/><circle cx="3" cy="-1" r="4" fill={c}/><circle cx="-6" cy="5" r="3" fill={c}/></>;
    case 'panda': return <><circle cx="-9" cy="-10" r="5" fill={d}/><circle cx="9" cy="-10" r="5" fill={d}/><circle r="12" fill={c}/><ellipse cx="-5" cy="-1" rx="4" ry="5" fill={d}/><ellipse cx="5" cy="-1" rx="4" ry="5" fill={d}/><circle cx="-5" cy="-1" r="1.4" fill="white"/><circle cx="5" cy="-1" r="1.4" fill="white"/><ellipse cy="7" rx="3" ry="2" fill={d}/></>;
    case 'elephant': return <><path d="M-10 -9 Q0 -15 10 -7 L11 4 Q8 12 0 11 Q-8 11 -10 4Z" fill={c}/><ellipse cx="-12" cy="-1" rx="5" ry="7" fill={d}/><ellipse cx="12" cy="-1" rx="5" ry="7" fill={d}/><path d="M0 0 Q3 6 0 13 Q-4 16 -5 11" fill="none" stroke={c} strokeWidth="5"/><circle cx="6" cy="-4" r="1.5" fill={ink}/></>;
    case 'lizard': return <><path d="M-10 1 Q0 -9 10 0 L15 6 L9 8 L2 5 L-5 9 L-11 6 Q-21 10 -18 16" fill={c}/><path d="M-8 6 L-13 12 M7 5 L13 12" stroke={d} strokeWidth="3"/><circle cx="8" cy="-1" r="1.5" fill={ink}/></>;
    case 'shell': return <><path d="M-15 6 Q-14 -12 0 -14 Q14 -12 15 6 Q0 15 -15 6Z" fill={c}/><path d="M0 -13 V7 M-8 -10 L-4 7 M8 -10 L4 7 M-15 6 Q0 12 15 6" stroke={d}/><circle cy="7" r="3" fill="#fffdf3"/></>;
    case 'merlion': return <><path d="M-9 -7 L-12 -15 L-4 -11 Q0 -14 5 -11 L10 -15 L9 -7 Q15 3 6 9 L-5 7Z" fill={c}/><path d="M-4 8 Q7 17 14 6 Q11 10 7 6" fill={d}/><circle cx="-3" cy="-3" r="1.5" fill={ink}/><circle cx="5" cy="-3" r="1.5" fill={ink}/></>;
    case 'kiwi': return <><ellipse cx="-2" cy="3" rx="10" ry="8" fill={c}/><circle cx="7" cy="-7" r="5" fill={c}/><path d="M11 -7 L19 -9 M-5 10 L-6 15 M2 10 L3 15" stroke={d} strokeWidth="2.5"/><circle cx="8" cy="-8" r="1.5" fill={ink}/></>;
    case 'matryoshka': return <><path d="M-9 11 Q-13 6 -8 -3 Q-8 -14 0 -14 Q8 -14 8 -3 Q13 6 9 11Z" fill={c}/><circle cy="-5" r="5" fill={d}/><path d="M-8 5 Q0 -2 8 5 M-6 9 H6" stroke={d}/><circle cx="-2" cy="-5" r="1" fill={ink}/><circle cx="2" cy="-5" r="1" fill={ink}/></>;
    case 'tea': return <><path d="M-10 -11 H10 L7 9 Q0 13 -7 9Z" fill={c}/><path d="M-10 -11 H10 M-6 -2 H6 M-5 13 H5 M-5 16 H5" stroke={d}/></>;
    case 'pierogi': return <><path d="M-13 4 Q0 -14 13 4 Q4 15 -5 11 Q-12 10 -13 4Z" fill={c}/><path d="M-12 4 Q-8 7 -5 4 Q-2 8 1 5 Q5 8 8 4 Q11 7 13 4" stroke={d}/></>;
    case 'turbine': return <><path d="M0 -3 V15 M0 -3 L-2 -17 L3 -6 L15 -10 L5 -1 L10 10 L0 2Z" fill={c}/><circle cy="-3" r="2.5" fill={d}/></>;
    default: return null;
  }
}

/** Distinct tiny silhouettes for the 24 entries in landmarks.ts. */
const landmarkPaths: Record<string, string> = {
  eiffel: 'M0 -14 L-3 -4 L-10 13 H10 L3 -4Z M-6 5 H6 M-4 -5 H4',
  colosseum: 'M-13 12 V-5 Q0 -14 13 -5 V12Z M-8 0 V7 M0 -2 V7 M8 0 V7 M-13 4 H13',
  acropolis: 'M-14 11 H14 M-12 7 H12 M-9 -5 H9 L12 -2 H-12Z M-8 -2 V7 M0 -2 V7 M8 -2 V7',
  greatwall: 'M-14 9 L-10 0 L-2 4 L5 -4 L13 0 V9 M-14 4 Q0 11 13 4',
  liberty: 'M0 -11 V10 M-6 10 H6 M-7 -5 L0 -9 L7 -5 M7 -4 L12 -14 M9 -13 L14 -13',
  pyramids: 'M-15 10 L-5 -10 L4 10Z M0 10 L8 -7 L16 10Z',
  bigben: 'M-7 12 V-11 H7 V12 M-10 12 H10 M-7 -6 H7 M0 -11 V-16 M-3 0 H3',
  tajmahal: 'M-12 11 V1 H12 V11 M-8 1 Q-8 -7 0 -10 Q8 -7 8 1 M0 -10 V-15 M-15 -4 V11 M15 -4 V11',
  redeemer: 'M-15 11 L-5 -7 L0 0 L7 -11 L16 11Z M-15 11 H16',
  opera: 'M-14 10 Q-10 -7 -2 -10 Q1 -3 2 10 M0 10 Q4 -10 11 -9 Q14 0 15 10Z',
  stbasil: 'M-12 11 V0 Q-12 -8 -8 -11 Q-4 -8 -4 0 V11 M-3 11 V-3 Q0 -15 3 -3 V11 M5 11 V0 Q5 -8 9 -11 Q13 -8 13 0 V11',
  fuji: 'M-16 11 L0 -12 L16 11Z M-6 -2 L0 -12 L6 -2',
  windmill: 'M-8 12 L-5 -5 H5 L8 12Z M0 -5 L-11 -13 M0 -5 L11 -13 M0 -5 L-11 3 M0 -5 L11 3',
  chichen: 'M-13 11 H13 M-11 7 H11 M-8 3 H8 M-5 -1 H5 M-3 -5 H3 M0 -9 V-5',
  machu: 'M-15 10 L-8 -4 L-2 2 L5 -11 L14 10 M-10 10 V4 H7 V10 M-5 4 V-1 H2 V4',
  petra: 'M-13 11 V-4 L0 -12 L13 -4 V11 M-9 11 V0 H9 V11 M-4 11 V3 H4 V11 M-13 -4 H13',
  burj: 'M-5 12 L-3 -5 H-1 L0 -16 L1 -5 H3 L5 12 M-9 12 H9 M-3 2 H3',
  hagia: 'M-12 11 V1 H12 V11 M-8 1 Q0 -11 8 1 M-15 11 V-5 M15 11 V-5 M0 -10 V-14',
  brandenburg: 'M-14 11 H14 M-12 7 H12 M-10 -5 H10 L13 -2 H-13Z M-9 -2 V7 M-3 -2 V7 M3 -2 V7 M9 -2 V7',
  sagrada: 'M-13 11 L-10 -9 L-6 11 M-4 11 L0 -15 L4 11 M6 11 L10 -9 L13 11 M-13 11 H13',
  cntower: 'M0 -16 V12 M-4 -2 H4 M-7 2 H7 M-3 12 H3 M0 -16 L2 -12',
  moai: 'M-8 11 L-9 -12 H5 L9 11Z M-9 -3 H8 M-3 3 L5 2 L2 6 H-2',
  angkor: 'M-14 11 V2 H-9 V-5 L-6 -10 L-3 -5 V11 M-4 11 V1 L0 -15 L4 1 V11 M3 11 V-5 L6 -10 L9 -5 V2 H14 V11',
  matterhorn: 'M-15 11 L1 -14 L6 -4 L9 -8 L16 11Z M-3 -7 L1 -14 L6 -4',
};

function LandmarkMini({ id, color, accent }: { id: string; color: string; accent: string }) {
  return <g className="countryball__landmark" fill={color} stroke={ink} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d={landmarkPaths[id]} />
    <path d="M-14 12 H14" fill="none" stroke={accent} strokeWidth="2.4" />
  </g>;
}

export function BallAccessory({ accessory: a }: ArtProps) {
  const x = a.position === 'hat' ? 50 : a.position === 'badge' ? 79 : 85;
  const y = a.position === 'hat' ? 9 : a.position === 'badge' ? 78 : 68;
  const scale = a.position === 'hat' ? 1.04 : 1.08;
  return <g data-accessory={a.kind} data-accessory-position={a.position} aria-label={a.label}>
    {a.position === 'held' && <path d="M70 72 Q77 78 84 69" fill="none" stroke="#244258" strokeWidth="3" strokeLinecap="round" />}
    <g transform={`translate(${x} ${y})`}>
      <g transform={`rotate(${a.position === 'hat' ? -9 : 10}) scale(${scale})`}><g className={`countryball__accessory countryball__accessory--${a.position}`} fill="none" stroke={ink} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {a.motif === 'landmark' && a.landmark
          ? <LandmarkMini id={a.landmark} color={a.color} accent={a.accent} />
          : <Motif accessory={a} />}</g>
      </g>
    </g>
    {a.landmark && a.motif !== 'landmark' && <g transform="translate(18 78)">
      <g transform="scale(.55)"><g className="countryball__accessory countryball__accessory--charm"><LandmarkMini id={a.landmark} color={a.color} accent={a.accent} /></g></g>
    </g>}
  </g>;
}
