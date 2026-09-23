import type { BallAccessory as Accessory } from '../../data/ballAccessories';

/** Μικρό στρογγυλό «αυτοκόλλητο» στην άκρη της σημαίας. */
export function BallAccessory({ accessory }: { accessory: Accessory }) {
  return <g data-accessory={accessory.kind} aria-label={accessory.label} transform="translate(78 77)">
    <circle r="13" fill="#fffdf4" stroke="#173653" strokeWidth="1.6" />
    <g fill="none" stroke="#246d53" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {accessory.kind === 'mountain' && <path d="M-10 7 L-3 -7 L1 0 L5 -5 L11 7 Z M-5 -3 L-3 -7 L-1 -3" />}
      {accessory.kind === 'wave' && <path d="M-10 -3 Q-5 -8 0 -3 Q5 2 10 -3 M-10 3 Q-5 -2 0 3 Q5 8 10 3" />}
      {accessory.kind === 'sun' && <><circle r="5" stroke="#e7a82b" /><path stroke="#e7a82b" d="M0 -11 V-8 M0 8 V11 M-11 0 H-8 M8 0 H11 M-8 -8 L-6 -6 M8 -8 L6 -6 M-8 8 L-6 6 M8 8 L6 6" /></>}
      {accessory.kind === 'star' && <path fill="#f2c64d" stroke="#d49a22" d="M0 -10 L3 -3 L10 -3 L5 2 L7 9 L0 5 L-7 9 L-5 2 L-10 -3 L-3 -3Z" />}
      {accessory.kind === 'football' && <><circle r="9" stroke="#173653" /><path stroke="#173653" d="M-2 -3 L3 -4 L5 1 L1 5 L-4 3 Z M-9 0 L-4 3 M8 -3 L5 1" /></>}
      {accessory.kind === 'coffee' && <><ellipse rx="5" ry="8" transform="rotate(30)" fill="#a86b42" stroke="#694125" /><path d="M-2 7 Q0 0 2 -6" /></>}
      {accessory.kind === 'kiwi' && <><ellipse cx="0" cy="1" rx="7" ry="5" fill="#a98560" stroke="#6d543b"/><circle cx="5" cy="-4" r="3" fill="#a98560" stroke="#6d543b"/><path d="M8 -4 L12 -5 M-3 6 L-4 10 M2 6 L3 10" stroke="#6d543b" /></>}
      {accessory.kind === 'tree' && <><path d="M0 2 V10" stroke="#78553c" /><path d="M-8 3 Q-11 -2 -5 -5 Q-3 -10 1 -7 Q6 -9 8 -4 Q12 3 5 4 Z" fill="#69b77b" /></>}
      {(accessory.kind === 'olive' || accessory.kind === 'leaf' || accessory.kind === 'maple') && <><path d="M-8 8 Q0 2 8 -8" /><path d="M-5 4 Q-10 -3 -5 -7 Q2 -5 -2 1 M2 -2 Q2 -9 9 -9 Q11 -3 5 1" fill="#77b96e" /></>}
      {(accessory.kind === 'flower' || accessory.kind === 'cherry' || accessory.kind === 'tulip') && <><path d="M0 2 V10" /><path d="M0 2 C-10 1 -9 -7 -3 -6 C-2 -12 3 -12 4 -6 C10 -7 10 1 0 2Z" fill={accessory.kind === 'cherry' ? '#f6a1bc' : accessory.kind === 'tulip' ? '#f37b8f' : '#ffc56f'} stroke="#a75e70" /></>}
    </g>
  </g>;
}
