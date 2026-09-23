import { useEffect, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { GameConfig } from '../types/game';
import { parseGameConfig } from './QuizGamePage';
import { useNewModeSession, type NewModeSession } from '../hooks/useNewModeSession';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { paradeSettings } from '../game/newModes';
import { scoreCorrectAnswer, TIME_BONUS_WINDOW_MS } from '../game/scoring';
import { useReactions } from '../reactions/ReactionsProvider';
import { CountryBall } from '../components/CountryBall/CountryBall';
import { SpeechBubble } from '../components/SpeechBubble/SpeechBubble';
import { NewModeLayout } from './NewModeLayout';

export function ParadeGamePage() {
  const [params] = useSearchParams();
  return <ParadeSession key={params.toString()} config={parseGameConfig('parade', params)!} />;
}
function ParadeSession({ config }: { config: GameConfig }) {
  const session = useNewModeSession(config);
  return <NewModeLayout session={session} automatic><ParadeRound key={session.round.id} session={session} /></NewModeLayout>;
}
function ParadeRound({ session: s }: { session: NewModeSession }) {
  const { answer, next } = s;
  const [started] = useState(() => performance.now());
  const reduced = useReducedMotion();
  const reactions = useReactions();
  // Η σωστή απάντηση αυτού του γύρου δεν επιταχύνει την ήδη ενεργή διέλευση.
  const [settings] = useState(() => paradeSettings(s.state.config.difficulty, s.state.answers.filter(a => a.correct).length));
  const [missed, setMissed] = useState(false);
  const answered = s.selected !== null;
  const targetIndex = s.round.choices.findIndex(c => c.iso2 === s.round.country.iso2);
  const delay = reduced ? 0 : Math.floor(targetIndex / 2) * settings.durationMs * .24;
  const deadline = settings.durationMs + delay;
  useEffect(() => {
    if (answered) return;
    const timer = window.setTimeout(() => {
      setMissed(true);
      answer('__miss__', scoreCorrectAnswer);
      reactions?.emit({ type: 'parade:miss', iso2: s.round.country.iso2 });
    }, Math.max(0, started + deadline - performance.now()));
    return () => window.clearTimeout(timer);
  }, [answered, deadline, started, answer, s.round.country.iso2, reactions]);
  useEffect(() => {
    if (!answered) return;
    const timer = window.setTimeout(next, 800);
    return () => window.clearTimeout(timer);
  }, [answered, next]);
  const choose = (iso2: string) => s.answer(iso2, (streak, elapsed) =>
    scoreCorrectAnswer(streak, Math.max(0, elapsed - delay) / settings.durationMs * TIME_BONUS_WINDOW_MS));
  return <>
    <h1>Βρες: {s.round.country.nameGreek}</h1>
    <p>Πάτα τη σωστή σημαία πριν φύγει!</p>
    {reduced && <div className="parade__clock" role="timer" aria-label={`Χρόνος γύρου: ${(deadline / 1000).toFixed(1)} δευτερόλεπτα`}>
      <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" className="parade__clock-track" />
        <circle cx="20" cy="20" r="16" className="parade__clock-hand" style={{ '--clock-duration': `${deadline}ms`, animationPlayState: answered ? 'paused' : 'running' } as CSSProperties} /></svg>
    </div>}
    <div className={`parade__track ${reduced ? 'parade__track--still' : ''} ${answered ? 'parade__track--paused' : ''}`}
      role="group" aria-label="Σημαίες της παρέλασης">
      {s.round.choices.map((country, index) => <button type="button" key={country.iso2}
        className="parade__runner" disabled={answered} data-choice={country.iso2}
        aria-label={answered ? country.nameGreek : `Σημαία ${index + 1}`}
        style={{ '--lane': index % 2, '--duration': `${settings.durationMs}ms`, '--delay': `${Math.floor(index / 2) * settings.durationMs * .24}ms` } as CSSProperties}
        onPointerDown={event => { if (event.button === 0) { event.preventDefault(); choose(country.iso2); } }}
        onClick={event => { if (event.detail === 0) choose(country.iso2); }}>
        <CountryBall country={country} size={64} identityVisible={answered} speechEnabled={false} />
        {answered && <span className="parade__name">{country.nameGreek}</span>}
      </button>)}
    </div>
    {answered && <div className={`parade__result ${missed ? 'parade__miss' : ''}`}>
      <SpeechBubble lines={[missed ? 'Έφυγα!' : s.selected === s.round.country.iso2 ? 'Ναι! Με βρήκες!' : 'Εδώ είμαι!']} />
      <CountryBall country={s.round.country} size={64} identityVisible
        mood={missed ? 'sad' : s.selected !== s.round.country.iso2 ? 'wave' : s.state.streak >= 3 ? 'dance' : 'celebrate'} />
    </div>}
  </>;
}
