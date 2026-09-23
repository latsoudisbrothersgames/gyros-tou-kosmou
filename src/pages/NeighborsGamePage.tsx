import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseGameConfig } from './QuizGamePage';
import { useGeoSession } from '../hooks/useGeoSession';
import { makeNeighborsPuzzle } from '../game/neighborsPuzzles';
import { scoreNeighbors } from '../game/scoring';
import { borderKind } from '../data/borders';
import { CountryBall } from '../components/CountryBall/CountryBall';
import { SpeechBubble } from '../components/SpeechBubble/SpeechBubble';
import { RegionalMap } from '../components/RegionalMap/RegionalMap';
import { Button } from '../components/Button/Button';
import { GeoModeLayout } from './GeoModeLayout';
import { playSound } from '../audio/soundManager';

export function NeighborsGamePage() {
  const [params] = useSearchParams();
  return <NeighborsSession key={params.toString()} config={parseGameConfig('neighbors', params)!} />;
}
function NeighborsSession({ config }: { config: NonNullable<ReturnType<typeof parseGameConfig>> }) {
  const session = useGeoSession(config, index => makeNeighborsPuzzle(config.difficulty, index === 0 ? config.focusCountryId : undefined));
  return <GeoModeLayout {...session}>
    <NeighborsRound key={session.state.questionIndex} session={session} />
  </GeoModeLayout>;
}
function NeighborsRound({ session: s }: { session: ReturnType<typeof useGeoSession<ReturnType<typeof makeNeighborsPuzzle>>> }) {
  const { host, guests, correct, totalNeighbors } = s.round;
  const [picked, setPicked] = useState<string[]>([]);
  const [none, setNone] = useState(false);
  const answered = s.answered;
  const correctSet = new Set(correct);
  const opened = () => {
    const chosen = none ? [] : picked;
    const hits = chosen.filter(id => correctSet.has(id)).length;
    const missed = correct.length - hits;
    const wrong = chosen.length - hits + (none && correct.length || !none && !correct.length ? 1 : 0);
    const perfect = missed === 0 && wrong === 0 && (correct.length > 0 || none);
    s.complete(host.iso2, perfect, scoreNeighbors(hits, missed, wrong, s.state.streak), perfect ? [host.iso2] : []);
    playSound('door');
  };
  const special = answered ? correct.map(id => borderKind(host.iso2, id)).filter(Boolean) : [];
  return <>
    <h1>Οι γείτονες χτυπούν την πόρτα</h1>
    <p>Ποιοι από τους καλεσμένους συνορεύουν με {host.nameGreekAccusative};</p>
    {totalNeighbors > correct.length && <p>Βρες {correct.length} από τους {totalNeighbors} γείτονες ανάμεσα στις προσκλήσεις.</p>}
    <div className="neighbors__house"><span aria-hidden="true">🏠</span><CountryBall country={host} size={100} reactive={false}
      mood={answered ? 'celebrate' : 'idle'} speechEnabled={false} /></div>
    <RegionalMap iso2s={[host.iso2, ...guests.map(c => c.iso2)]} host={host.iso2}
      revealed={answered} highlighted={answered ? correct : []} />
    <div className="neighbors__guests">
      {guests.map(c => {
        const selected = picked.includes(c.iso2);
        const isRight = correctSet.has(c.iso2);
        return <button key={c.iso2} type="button" className={`neighbors__guest ${answered ? isRight ? 'neighbors__guest--right' : selected ? 'neighbors__guest--wrong' : '' : ''}`}
          aria-pressed={selected} disabled={answered}
          onClick={() => { setNone(false); setPicked(v => selected ? v.filter(id => id !== c.iso2) : [...v, c.iso2]); }}>
          <CountryBall country={c} size={46} reactive={false} speechEnabled={false}
            mood={answered ? isRight ? selected ? 'celebrate' : 'wave' : selected ? 'shrug' : 'idle' : 'idle'} />
          <span>{c.nameGreek}</span>
          {answered && <small>{isRight ? selected ? 'Πέρασε μέσα!' : 'Με ξέχασες!' : selected ? 'Μάλλον μπέρδεψα τη διεύθυνση.' : ''}</small>}
        </button>;
      })}
    </div>
    <button type="button" className="neighbors__none" aria-pressed={none} disabled={answered}
      onClick={() => { setNone(v => !v); setPicked([]); }}>Κανένας δεν συνορεύει</button>
    {!answered && <Button onClick={opened}>Άνοιξε την πόρτα</Button>}
    {answered && <div className="geo-mode__bubble"><SpeechBubble lines={[correct.length ? 'Οι αληθινοί γείτονες κάθισαν γύρω από το τραπέζι!' : 'Αυτή η χώρα δεν έχει χερσαίους γείτονες!']} /></div>}
    {special.map((edge, i) => edge && <p key={i}>Ήξερες ότι… {edge.noteGreek}</p>)}
  </>;
}
