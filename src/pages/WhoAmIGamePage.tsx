import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseGameConfig } from './QuizGamePage';
import type { GameConfig } from '../types/game';
import { useNewModeSession } from '../hooks/useNewModeSession';
import { mysteryHints } from '../game/newModes';
import { scoreWithHints } from '../game/scoring';
import { countryGreeting } from '../data/ballLines';
import { CountryBall } from '../components/CountryBall/CountryBall';
import { SpeechBubble } from '../components/SpeechBubble/SpeechBubble';
import { Button } from '../components/Button/Button';
import { NewModeLayout } from './NewModeLayout';

export function WhoAmIGamePage() {
  const [params] = useSearchParams();
  return <WhoAmISession key={params.toString()} config={parseGameConfig('whoami', params)!} />;
}
function WhoAmISession({ config }: { config: GameConfig }) {
  const session = useNewModeSession(config);
  return <NewModeLayout session={session}><MysteryRound key={session.round.id} session={session} /></NewModeLayout>;
}
function MysteryRound({ session: s }: { session: ReturnType<typeof useNewModeSession> }) {
  const [hints, setHints] = useState(0);
  const answered = s.selected !== null;
  const correct = s.selected === s.round.country.iso2;
  const lines = mysteryHints(s.round.country);
  const reveal = countryGreeting(s.round.country).replace('Γεια! Είμαι', correct ? 'Ναι! Είμαι' : 'Όχι… ήμουν');
  return <>
    <h1>Ποιος είμαι;</h1>
    <div className="mystery__stage">
      <div className="mystery__speaker">
        <SpeechBubble key={answered ? 'reveal' : hints} lines={[answered ? reveal : hints ? lines[hints - 1] : 'Μπορείς να με βρεις;']} />
        <CountryBall country={s.round.country} size={128} concealed={!answered} reactive={false}
          className={answered ? 'new-mode__reveal' : ''}
          mood={!answered ? 'thinking' : correct ? (s.state.streak >= 3 ? 'dance' : 'celebrate') : 'wave'} />
      </div>
    </div>
    {!answered && <div className="mystery__hints">
      <Button variant="secondary" disabled={hints === 3} onClick={() => setHints(value => Math.min(3, value + 1))}>Δώσε μου ένδειξη ({hints}/3)</Button>
      <p>Σωστή απάντηση: {scoreWithHints(hints, 0).base} πόντοι + μπόνους σερί</p>
    </div>}
    <div className="new-mode__choices" role="group" aria-label="Επιλογές χωρών">
      {s.round.choices.map(country => <button type="button" key={country.iso2} data-choice={country.iso2}
        disabled={answered} className={`new-mode__choice ${answered && country.iso2 === s.round.country.iso2 ? 'new-mode__choice--correct' : answered && country.iso2 === s.selected ? 'new-mode__choice--wrong' : ''}`}
        onClick={() => s.answer(country.iso2, streak => scoreWithHints(hints, streak))}>
        {answered && <CountryBall country={country} size={40} speechEnabled={false} />}
        <span>{country.nameGreek}</span>
      </button>)}
    </div>
  </>;
}
