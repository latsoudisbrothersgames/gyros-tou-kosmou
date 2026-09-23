/**
 * Ηχητικά εφέ συντιθέμενα με WebAudio — κανένα εξωτερικό αρχείο,
 * κανένα autoplay: ο ήχος παράγεται μόνο ως απόκριση σε ενέργεια του χρήστη.
 */

export type SoundName = 'blip' | 'correct' | 'wrong' | 'click' | 'highscore' | 'spawn' | 'magic' | 'stamp' | 'door' | 'delivery' | 'snap' | 'ship';

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

function getContext(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  audio: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.12,
): void {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

/** Επιφάνειες της λειτουργίας «Ξύσε τη Σημαία» — κάθε μία με δικό της ήχο */
export type ScratchSurface = 'clouds' | 'ice' | 'sand' | 'leaves' | 'paint';

let noiseBuffer: AudioBuffer | null = null;

/** Κοινό buffer λευκού θορύβου — βάση για όλους τους ήχους ξυσίματος */
function getNoiseBuffer(audio: AudioContext): AudioBuffer {
  if (!noiseBuffer || noiseBuffer.sampleRate !== audio.sampleRate) {
    const len = Math.floor(audio.sampleRate * 0.5);
    noiseBuffer = audio.createBuffer(1, len, audio.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

/**
 * Κόκκος ήχου ξυσίματος: φιλτραρισμένος θόρυβος με χροιά ανά υλικό.
 * Καλείται συχνά όσο κινείται το δάχτυλο — οι κόκκοι αλληλοκαλύπτονται
 * και ακούγονται ως συνεχές «σσσς»/τρίξιμο.
 */
export function playScratchSound(surface: ScratchSurface): void {
  if (!enabled) return;
  const audio = getContext();
  if (!audio) return;
  const now = audio.currentTime;
  const src = audio.createBufferSource();
  src.buffer = getNoiseBuffer(audio);
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  let dur = 0.09;
  let vol = 0.07;
  switch (surface) {
    case 'sand': // βραχνό «σσσς» άμμου
      filter.type = 'bandpass';
      filter.frequency.value = 900;
      filter.Q.value = 0.9;
      src.playbackRate.value = 0.9 + Math.random() * 0.3;
      break;
    case 'ice': // λεπτό γυάλινο ξύσιμο
      filter.type = 'highpass';
      filter.frequency.value = 2800;
      vol = 0.05;
      dur = 0.06;
      src.playbackRate.value = 1.2 + Math.random() * 0.5;
      break;
    case 'clouds': // απαλό φύσημα
      filter.type = 'lowpass';
      filter.frequency.value = 450;
      vol = 0.05;
      dur = 0.13;
      src.playbackRate.value = 0.5 + Math.random() * 0.2;
      break;
    case 'leaves': // θρόισμα φύλλων
      filter.type = 'bandpass';
      filter.frequency.value = 2200;
      filter.Q.value = 1.2;
      dur = 0.07;
      src.playbackRate.value = 1 + Math.random() * 0.6;
      break;
    case 'paint': // υγρό «σβήσιμο» μπογιάς
      filter.type = 'bandpass';
      filter.frequency.value = 600;
      filter.Q.value = 2;
      vol = 0.06;
      src.playbackRate.value = 0.55 + Math.random() * 0.15;
      break;
  }
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(filter).connect(gain).connect(audio.destination);
  src.start(now, Math.random() * 0.3, dur + 0.05);

  // Ο πάγος σπάει πού και πού με ένα «κρακ»
  if (surface === 'ice' && Math.random() < 0.12) {
    tone(audio, 900 + Math.random() * 700, now, 0.05, 'triangle', 0.06);
  }
}

/** Ουδέτερος τόνος χωρίς έγκριση ταυτότητας, σταθερός τόνος ανά ISO2 μετά. */
export function ballVoiceFrequency(iso2?: string): number {
  return iso2 ? 610 + ([...iso2].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) >>> 0) % 310 : 740;
}

export function playSound(name: SoundName, voiceIso2?: string): void {
  if (!enabled) return;
  const audio = getContext();
  if (!audio) return;
  const now = audio.currentTime;
  switch (name) {
    case 'door':
      tone(audio, 180, now, 0.09, 'triangle', 0.11);
      tone(audio, 180, now + 0.16, 0.09, 'triangle', 0.11);
      break;
    case 'delivery':
      tone(audio, 660, now, 0.12);
      tone(audio, 990, now + 0.12, 0.22);
      break;
    case 'snap':
      tone(audio, 940, now, 0.045, 'square', 0.04);
      break;
    case 'ship':
      tone(audio, 330, now, 0.3, 'sine', 0.07);
      tone(audio, 392, now + 0.12, 0.35, 'sine', 0.07);
      break;
    case 'correct':
      tone(audio, 523.25, now, 0.12, 'sine');
      tone(audio, 659.25, now + 0.09, 0.12, 'sine');
      tone(audio, 783.99, now + 0.18, 0.2, 'sine');
      break;
    case 'wrong':
      tone(audio, 220, now, 0.18, 'square', 0.06);
      tone(audio, 174.61, now + 0.15, 0.25, 'square', 0.06);
      break;
    case 'blip':
      tone(audio, ballVoiceFrequency(voiceIso2), now, 0.035, 'triangle', 0.025);
      break;
    case 'click':
      tone(audio, 880, now, 0.05, 'sine', 0.05);
      break;
    case 'highscore':
      tone(audio, 523.25, now, 0.12);
      tone(audio, 659.25, now + 0.1, 0.12);
      tone(audio, 783.99, now + 0.2, 0.12);
      tone(audio, 1046.5, now + 0.3, 0.35);
      break;
    case 'stamp': { // μαλακό «γκουπ» σφραγίδας στο διαβατήριο
      tone(audio, 150, now, 0.07, 'sine', 0.09);
      tone(audio, 95, now + 0.02, 0.09, 'triangle', 0.06);
      const src = audio.createBufferSource();
      src.buffer = getNoiseBuffer(audio);
      const filter = audio.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 700;
      const gain = audio.createGain();
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      src.connect(filter).connect(gain).connect(audio.destination);
      src.start(now, Math.random() * 0.3, 0.08);
      break;
    }
    case 'spawn': // απαλό «ντιν» — κάτι εμφανίστηκε στον χάρτη
      tone(audio, 659.25, now, 0.09, 'sine', 0.05);
      tone(audio, 987.77, now + 0.08, 0.16, 'sine', 0.05);
      break;
    case 'magic': // μαγικό αρπέζ για το χρυσό γεγονός
      tone(audio, 523.25, now, 0.1, 'triangle', 0.07);
      tone(audio, 659.25, now + 0.07, 0.1, 'triangle', 0.07);
      tone(audio, 783.99, now + 0.14, 0.1, 'triangle', 0.07);
      tone(audio, 1046.5, now + 0.21, 0.22, 'triangle', 0.08);
      tone(audio, 1318.5, now + 0.3, 0.3, 'sine', 0.05);
      break;
  }
}
