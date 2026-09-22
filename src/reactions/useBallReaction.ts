import { useEffect, useState } from 'react';
import { useReactions } from './ReactionsProvider';
import { reactionFor } from './rules';
import type { BallMood, Reaction, ReactionEvent } from './events';

export function useBallReaction(iso2: string, reactive = true) {
  const bus = useReactions();
  const [mood, setMood] = useState<BallMood>('idle');
  const [speech, setSpeech] = useState<{ reaction: Reaction; event: ReactionEvent; sequence: number } | null>(null);
  useEffect(() => {
    if (!bus || !reactive) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let sequence = 0;
    const unsubscribe = bus.subscribe(iso2, (event) => {
      const reaction = reactionFor(event, iso2);
      if (!reaction) return;
      clearTimeout(timer);
      setSpeech(reaction.speech ? { reaction, event, sequence: ++sequence } : null);
      const step = (index: number) => {
        const current = reaction.steps[index];
        if (!current) return;
        setMood(current.mood);
        if (current.durationMs !== undefined) timer = setTimeout(() => step(index + 1), current.durationMs);
      };
      if (reaction.delayMs) timer = setTimeout(() => step(0), reaction.delayMs);
      else step(0);
    });
    return () => { unsubscribe(); clearTimeout(timer); };
  }, [bus, iso2, reactive]);
  return { mood: reactive ? mood : 'idle', speech: reactive ? speech : null };
}
