export type ReactionEvent =
  | { type: 'question:new'; iso2s: string[] }
  | { type: 'answer:correct'; iso2: string; streak: number }
  | { type: 'answer:wrong'; chosen: string; correct: string }
  | { type: 'timer:low'; secondsLeft: number }
  | { type: 'parade:miss'; iso2: string }
  | { type: 'neighbors:open'; host: string; guests: string[] }
  | { type: 'post:depart'; iso2: string }
  | { type: 'post:deliver'; iso2: string }
  | { type: 'puzzle:snap'; iso2: string; neighbors: string[] }
  | { type: 'idle'; seconds: number }
  | { type: 'game:end'; won: string[]; lost: string[] }
  | { type: 'country:open'; iso2: string }
  | { type: 'map:near'; iso2: string; distancePx: number }
  | { type: 'collection:tap'; iso2: string };

export type BallMood = 'idle' | 'happy' | 'dance' | 'sad' | 'surprised' | 'thinking'
  | 'proud' | 'shy' | 'sleepy' | 'nervous' | 'celebrate' | 'wave' | 'shrug';

export interface MoodStep {
  mood: BallMood;
  /** Απουσία διάρκειας: παραμένει μέχρι το επόμενο γεγονός. */
  durationMs?: number;
}
export interface Reaction {
  steps: MoodStep[];
  delayMs?: number;
  speech?: 'greeting' | 'fact' | 'mood';
}
