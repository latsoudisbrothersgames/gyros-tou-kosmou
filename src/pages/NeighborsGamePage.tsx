import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseGameConfig } from './QuizGamePage';
import { useGeoSession } from '../hooks/useGeoSession';
import { createNeighborsHostPicker, eligibleNeighborsHosts, makeNeighborsPuzzle } from '../game/neighborsPuzzles';
import { scoreNeighbors, scoreNeighborhoodBonus } from '../game/scoring';
import { borderKind, landNeighbors } from '../data/borders';
import { getCountryByIsoCode } from '../data/countries';
import { CountryBall } from '../components/CountryBall/CountryBall';
import { SpeechBubble } from '../components/SpeechBubble/SpeechBubble';
import { RegionalMap } from '../components/RegionalMap/RegionalMap';
import { Button } from '../components/Button/Button';
import { GeoModeLayout } from './GeoModeLayout';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useReactions } from '../reactions/ReactionsProvider';
import { pickGeoLine } from '../data/ballLines';
import { playSound } from '../audio/soundManager';
import { useWorldTopology } from '../components/WorldMap/useWorldTopology';
import { makeNeighborhoodPuzzle, qualifiesForNeighborhood } from '../game/neighborhoodPuzzles';
import type { WorldTopology } from '../components/WorldMap/useWorldTopology';
import { NeighborhoodStage } from './NeighborhoodStage';
import { incrementNeighborhoodCount } from '../utils/storage';

export function NeighborsGamePage() {
  const [params] = useSearchParams();
  const { topology, error } = useWorldTopology();
  if (error) return <p role="alert">Δεν φορτώθηκε ο χάρτης. Δοκίμασε ξανά.</p>;
  if (!topology) return <p role="status">Ετοιμάζουμε τη γειτονιά…</p>;
  return <NeighborsSession key={params.toString()} config={parseGameConfig('neighbors', params)!} topology={topology} />;
}
export function NeighborsSession({ config, topology }: { config: NonNullable<ReturnType<typeof parseGameConfig>>; topology: WorldTopology }) {
  const [picker] = useState(() => createNeighborsHostPicker(config.difficulty,
    new Set(eligibleNeighborsHosts(config.difficulty).filter(c => qualifiesForNeighborhood(c.iso2, config.difficulty, topology))
      .map(c => c.iso2)), config.focusCountryId));
  const session = useGeoSession(config, index => makeNeighborsPuzzle(config.difficulty, undefined, picker.pick(index)));
  const hasNeighborhood = qualifiesForNeighborhood(session.round.host.iso2, config.difficulty, topology);
  return <GeoModeLayout {...session} nextVariant={hasNeighborhood ? 'secondary' : 'primary'}
    restart={() => { picker.reset(); session.restart(); }}>
    <NeighborsRound key={session.state.questionIndex} session={session} topology={topology} hasNeighborhood={hasNeighborhood} />
  </GeoModeLayout>;
}
function NeighborsRound({ session: s, topology, hasNeighborhood }: {
  session: ReturnType<typeof useGeoSession<ReturnType<typeof makeNeighborsPuzzle>>>;
  topology: WorldTopology; hasNeighborhood: boolean;
}) {
  const { host, guests, correct, totalNeighbors } = s.round;
  const [picked, setPicked] = useState<string[]>([]);
  const [none, setNone] = useState(false);
  const [stage, setStage] = useState<'closed' | 'playing' | 'skipped'>('closed');
  const answered = s.answered;
  const neighborhood = useMemo(() => answered && topology
    ? makeNeighborhoodPuzzle(host.iso2, s.state.config.difficulty, landNeighbors(host.iso2, false), topology, s.state.questionIndex)
    : null, [answered, topology, host.iso2, s.state.config.difficulty, s.state.questionIndex]);
  const reactions = useReactions();
  const reduced = useReducedMotion();
  const correctSet = new Set(correct);
  const opened = () => {
    const chosen = none ? [] : picked;
    const hits = chosen.filter(id => correctSet.has(id)).length;
    const missed = correct.length - hits;
    const wrong = chosen.length - hits + (none && correct.length || !none && !correct.length ? 1 : 0);
    const perfect = missed === 0 && wrong === 0 && (correct.length > 0 || none);
    s.complete(host.iso2, perfect, scoreNeighbors(hits, missed, wrong, s.state.streak), perfect ? [host.iso2] : []);
    playSound('door'); reactions?.emit({ type: 'neighbors:open', host: host.iso2, guests: correct });
  };
  const special = answered ? correct.map(id => borderKind(host.iso2, id)).filter(Boolean) : [];
  if (stage === 'playing' && neighborhood) return <NeighborhoodStage puzzle={neighborhood} host={host}
    difficulty={s.state.config.difficulty} onSkip={() => setStage('skipped')}
    onComplete={withoutHint => {
      const bonus = scoreNeighborhoodBonus(withoutHint);
      s.awardBonus(bonus);
      return { bonus, count: incrementNeighborhoodCount() };
    }} />;
  return <>
    <h1>Οι γείτονες χτυπούν την πόρτα</h1>
    <p>Ποιοι από τους καλεσμένους συνορεύουν με {host.nameGreekAccusative};</p>
    {totalNeighbors > correct.length && <p>Βρες {correct.length} από τους {totalNeighbors} γείτονες ανάμεσα στις προσκλήσεις.</p>}
    <div className="neighbors__house"><span className="neighbors__house-icon" aria-hidden="true">🏠</span>
      <CountryBall country={host} size={100} identityVisible={answered} reactive={false}
        mood={answered ? 'celebrate' : 'idle'} speechEnabled={false} />
      {hasNeighborhood && <span className="neighbors__badge">🧩 Μετά: Φτιάξε τη γειτονιά</span>}
    </div>
    <RegionalMap iso2s={[host.iso2, ...guests.map(c => c.iso2)]} host={host.iso2}
      revealed={answered} highlighted={answered ? correct : []} />
    {answered && correct.length > 0 && <div className={`neighbors__table ${reduced ? 'neighbors__table--still' : ''}`}>
      <span aria-hidden="true">🍽️</span>{guests.filter(c => correctSet.has(c.iso2) && picked.includes(c.iso2)).map(c =>
        <CountryBall key={c.iso2} country={c} size={44} identityVisible={answered} reactive={false} speechEnabled={false} mood="happy" />)}
    </div>}
    <div className="neighbors__guests">
      {guests.map(c => {
        const selected = picked.includes(c.iso2);
        const isRight = correctSet.has(c.iso2);
        return <button key={c.iso2} type="button" className={`neighbors__guest ${answered ? isRight ? 'neighbors__guest--right' : selected ? 'neighbors__guest--wrong' : '' : ''}`}
          aria-pressed={selected} disabled={answered}
          onClick={() => { setNone(false); setPicked(v => selected ? v.filter(id => id !== c.iso2) : [...v, c.iso2]); }}>
          <CountryBall country={c} size={46} identityVisible={answered} reactive={false} speechEnabled={false}
            mood={answered ? isRight ? selected ? 'celebrate' : 'wave' : selected ? 'shrug' : 'idle' : 'idle'} />
          <span>{c.nameGreek}</span>
          {answered && <small>{isRight ? selected ? 'Πέρασε μέσα!' : pickGeoLine('missed', guests.indexOf(c)) : selected ? pickGeoLine('wrongGuest', guests.indexOf(c)) : ''}</small>}
        </button>;
      })}
    </div>
    <button type="button" className="neighbors__none" aria-pressed={none} disabled={answered}
      onClick={() => { setNone(v => !v); setPicked([]); }}>Κανένας δεν συνορεύει</button>
    {!answered && <Button onClick={opened}>Άνοιξε την πόρτα</Button>}
    {answered && <div className="geo-mode__bubble"><SpeechBubble lines={[correct.length ? pickGeoLine('door', s.state.questionIndex) : 'Αυτή η χώρα δεν έχει χερσαίους γείτονες!']} /></div>}
    {special.map((edge, i) => edge && <p key={i}>Ήξερες ότι… {edge.noteGreek}</p>)}
    {answered && stage === 'closed' && neighborhood && <>
      <p className="neighborhood__preview">Οι γείτονες που θα τοποθετήσεις είναι: {neighborhood.pieces
        .map(piece => getCountryByIsoCode(piece.id)!.nameGreek).join(', ')}.</p>
      <Button onClick={() => setStage('playing')}>Φτιάξε τη γειτονιά</Button>
    </>}
  </>;
}
