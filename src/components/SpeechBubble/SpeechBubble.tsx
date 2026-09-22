import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playSound } from '../../audio/soundManager';
import './SpeechBubble.css';

/** Κάθε ατάκα ζει 2,5 s· η επόμενη παίρνει τη θέση της χωρίς επικάλυψη. */
export function SpeechBubble({ lines, audible = true }: { lines: string[]; audible?: boolean }) {
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const [index, setIndex] = useState(0);
  const text = lines[index];
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;
    const fit = () => {
      bubble.style.marginLeft = '0px';
      const box = bubble.getBoundingClientRect();
      const shift = Math.max(12 - box.left, Math.min(0, window.innerWidth - 12 - box.right));
      bubble.style.marginLeft = `${shift}px`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [text]);
  useEffect(() => {
    if (!text) return;
    let characters = 0;
    const blips = audible ? setInterval(() => {
      characters += 3;
      if (characters <= text.length) playSound('blip');
      else clearInterval(blips);
    }, Math.min(90, 2200 / Math.max(1, Math.floor(text.length / 3)))) : undefined;
    const hide = setTimeout(() => setIndex((current) => current + 1), 2500);
    return () => { clearInterval(blips); clearTimeout(hide); };
  }, [text, audible]);
  if (!text) return null;
  return <span ref={bubbleRef} className="speech-bubble" role="status" aria-live="polite" aria-label={text} title={text}>{text}</span>;
}
