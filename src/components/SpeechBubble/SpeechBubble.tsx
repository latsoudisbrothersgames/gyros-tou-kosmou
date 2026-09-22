import { useEffect, useState } from 'react';
import { playSound } from '../../audio/soundManager';
import './SpeechBubble.css';

/** Κάθε ατάκα ζει 2,5 s· η επόμενη παίρνει τη θέση της χωρίς επικάλυψη. */
export function SpeechBubble({ lines, audible = true }: { lines: string[]; audible?: boolean }) {
  const [index, setIndex] = useState(0);
  const text = lines[index];
  useEffect(() => {
    if (!text) return;
    let characters = 0;
    const blips = audible ? setInterval(() => {
      characters += 3;
      if (characters <= text.length) playSound('blip');
      else clearInterval(blips);
    }, 90) : undefined;
    const hide = setTimeout(() => setIndex((current) => current + 1), 2500);
    return () => { clearInterval(blips); clearTimeout(hide); };
  }, [text, audible]);
  if (!text) return null;
  return <span className="speech-bubble" role="status" aria-live="polite" aria-label={text} title={text}>{text}</span>;
}
