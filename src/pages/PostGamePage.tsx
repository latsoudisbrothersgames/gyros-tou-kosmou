import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { geoDistance } from 'd3-geo';
import { parseGameConfig } from './QuizGamePage';
import { useGeoSession } from '../hooks/useGeoSession';
import { makePostPuzzle, postConstraintMet, travelOptions, POST_SKIP, type TicketKind, type Tickets } from '../game/postPuzzles';
import { scorePost } from '../game/scoring';
import { ALL_COUNTRIES, getCountryByIsoCode } from '../data/countries';
import { CENTROIDS } from '../data/centroids';
import { landNeighbors } from '../data/borders';
import { TRAVEL_LINKS } from '../data/links';
import { SpeechBubble } from '../components/SpeechBubble/SpeechBubble';
import { CountryBall } from '../components/CountryBall/CountryBall';
import { RegionalMap } from '../components/RegionalMap/RegionalMap';
import { Button } from '../components/Button/Button';
import { GeoModeLayout } from './GeoModeLayout';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useReactions } from '../reactions/ReactionsProvider';
import { playSound } from '../audio/soundManager';

const labels: Record<TicketKind, string> = { land: '🚶', sea: '⛴️', air: '✈️' };
const constraints = { none: '', 'no-air': 'Χωρίς αεροπλάνο.', 'two-continents': 'Πέρασε από δύο διαφορετικές ηπείρους.',
  shortest: 'Βρες τη διαδρομή με τις λιγότερες στάσεις.' };
export function PostGamePage() {
  const [params] = useSearchParams();
  return <PostSession key={params.toString()} config={parseGameConfig('post', params)!} />;
}
function PostSession({ config }: { config: NonNullable<ReturnType<typeof parseGameConfig>> }) {
  const session = useGeoSession(config, index => makePostPuzzle(config.difficulty, index === 0 ? config.focusCountryId : undefined, index));
  return <GeoModeLayout {...session}><PostRound key={session.state.questionIndex} session={session} /></GeoModeLayout>;
}
function PostRound({ session: s }: { session: ReturnType<typeof useGeoSession<ReturnType<typeof makePostPuzzle>>> }) {
  const p = s.round;
  const [route, setRoute] = useState([p.sender.iso2]);
  const [used, setUsed] = useState<Tickets>({ land: 0, sea: 0, air: 0 });
  const [kinds, setKinds] = useState<TicketKind[]>([]);
  const [message, setMessage] = useState('Πάτησε διαδοχικές χώρες στον χάρτη.');
  const [moving, setMoving] = useState(false);
  const [movingStep, setMovingStep] = useState(0);
  const [pending, setPending] = useState<{ id: string; options: TicketKind[] } | null>(null);
  const [invalid, setInvalid] = useState(false);
  const reduced = useReducedMotion();
  const reactions = useReactions();
  const current = route.at(-1)!;
  const mapCurrent = moving ? route[Math.min(movingStep, route.length - 1)] : current;
  const advance = (id: string, kind: TicketKind) => {
    setRoute(v => [...v, id]); setKinds(v => [...v, kind]); setUsed(v => ({ ...v, [kind]: v[kind] + 1 }));
    setMessage(`Τώρα το δέμα βρίσκεται ${destination(getCountryByIsoCode(id)?.nameGreekAccusative ?? 'τον επόμενο σταθμό')}.`);
    setInvalid(false); setPending(null);
    if (kind === 'sea') playSound('ship'); else playSound('click');
  };
  const select = (id: string) => {
    if (s.answered || moving) return;
    if (id === current) return;
    if (POST_SKIP.has(id)) { setMessage('Αυτή η στάση δεν ανήκει στο παιχνίδι.'); setInvalid(true); return; }
    if (route.includes(id)) { setMessage('Αυτή τη χώρα την επισκέφτηκες ήδη!'); setInvalid(true); return; }
    const options = travelOptions(current, id, s.state.config.difficulty !== 'easy');
    if (!options.length) { setMessage('Δεν συνορεύουμε και δεν υπάρχει σύνδεση!'); setInvalid(true); return; }
    const available = options.filter(k => used[k] < p.tickets[k]);
    if (!available.length) { setMessage('Δεν έχεις άλλο εισιτήριο για αυτό το βήμα!'); setInvalid(true); return; }
    if (available.length > 1) { setPending({ id, options: available }); setMessage('Διάλεξε εισιτήριο για αυτή τη σύνδεση.'); return; }
    advance(id, available[0]);
  };
  const undo = () => {
    if (route.length <= 1 || s.answered) return;
    const kind = kinds.at(-1)!;
    setRoute(v => v.slice(0, -1)); setKinds(v => v.slice(0, -1));
    setUsed(v => ({ ...v, [kind]: v[kind] - 1 })); setMessage('Έκανες ένα βήμα πίσω.'); setInvalid(false); setPending(null);
  };
  const depart = () => {
    if (current !== p.receiver.iso2 || moving || s.answered) return;
    setMoving(true); reactions?.emit({ type: 'post:depart', iso2: p.sender.iso2 });
    setMovingStep(0);
    const met = postConstraintMet(p, route, kinds);
    const finish = () => {
      s.complete(p.receiver.iso2, true, scorePost(route.length - 1, p.shortest.length - 1, met, s.state.streak), route);
      setMessage(met ? `Το δέμα έφτασε! ${p.receiver.factsGreek[0]}` : 'Το δέμα έφτασε, αλλά ο περιορισμός δεν τηρήθηκε.');
      playSound('delivery'); reactions?.emit({ type: 'post:deliver', iso2: p.receiver.iso2 }); setMoving(false);
    };
    if (reduced) finish(); else {
      for (let step = 1; step < route.length - 1; step++) window.setTimeout(() => setMovingStep(step), step * 650);
      window.setTimeout(finish, (route.length - 1) * 650);
    }
  };
  const nearby = ALL_COUNTRIES.filter(c => !POST_SKIP.has(c.iso2) && c.iso2 !== current && !route.includes(c.iso2)
    && travelOptions(current, c.iso2, s.state.config.difficulty !== 'easy').some(kind => used[kind] < p.tickets[kind]));
  const frameNeighbors = [...landNeighbors(mapCurrent), ...TRAVEL_LINKS.filter(l => l.kind === 'sea' && (l.a === mapCurrent || l.b === mapCurrent))
    .map(l => l.a === mapCurrent ? l.b : l.a)];
  const frame = [mapCurrent, ...frameNeighbors, p.receiver.iso2]
    .filter((id, index, ids) => ids.indexOf(id) === index && CENTROIDS[id]
      && geoDistance(CENTROIDS[mapCurrent], CENTROIDS[id]) * 6371 <= 1800);
  const visible = ALL_COUNTRIES.map(c => c.iso2);
  const subject = ({ την: 'Η', τη: 'Η', τον: 'Ο', το: 'Το', τις: 'Οι', τους: 'Οι', τα: 'Τα' } as Record<string, string>)[p.sender.nameGreekAccusative.split(' ')[0]] ?? 'Η';
  const destination = (value: string) => value.replace(/^(την|τη|τον|το|τις|τους|τα) /, word => ({ την: 'στην ', τη: 'στη ', τον: 'στον ', το: 'στο ', τις: 'στις ', τους: 'στους ', τα: 'στα ' } as Record<string, string>)[word.trim()] ?? word);
  return <>
    <h1>Το ταχυδρομείο των CountryBalls</h1>
    <p>{subject} {p.sender.nameGreek} στέλνει δέμα {destination(p.receiver.nameGreekAccusative)}.</p>
    {p.constraint !== 'none' && <p className="post__constraint">{constraints[p.constraint]}</p>}
    <div className="post__characters"><CountryBall country={p.sender} size={58} reactive={false} speechEnabled={false} mood={invalid ? 'thinking' : moving ? 'proud' : 'idle'} />
      <span aria-hidden="true">📦</span><CountryBall country={p.receiver} size={58} reactive={false} speechEnabled={false} /></div>
    <div className="post__tickets">{(['land', 'sea', 'air'] as const).map(kind =>
      <span key={kind}>{labels[kind]} × {p.tickets[kind] - used[kind]}</span>)}</div>
    <RegionalMap iso2s={visible} frameIso2s={frame} host={mapCurrent} onCountry={select} minTouch
      revealed={s.answered} route={s.answered ? p.shortest : undefined}
      travelRoute={moving ? route.slice(movingStep, movingStep + 2) : s.answered ? route : undefined}
      travelKinds={moving ? kinds.slice(movingStep, movingStep + 1) : kinds} moving={moving} />
    {!s.answered && <div className="post__nearby"><strong>Επόμενη χώρα:</strong><div>
      {nearby.map(c => <button key={c.iso2} data-country={c.iso2} onClick={() => select(c.iso2)}>{c.nameGreek}</button>)}
    </div></div>}
    <p className="post__route">Η διαδρομή σου: {route.map(id => getCountryByIsoCode(id)?.nameGreek).join(' → ')}</p>
    <p role="status">{message}</p>
    {invalid && <div className="geo-mode__bubble"><SpeechBubble key={message} lines={[message]} audible={false} /></div>}
    {pending && <div className="post__ticket-choice">{pending.options.map(kind => <button key={kind} onClick={() => advance(pending.id, kind)}>{labels[kind]} {kind === 'land' ? 'Στεριά' : kind === 'sea' ? 'Θάλασσα' : 'Αέρας'}</button>)}</div>}
    <div className="post__actions"><Button variant="secondary" disabled={route.length <= 1 || s.answered} onClick={undo}>Αναίρεση</Button>
      {!s.answered && <Button disabled={current !== p.receiver.iso2 || moving} onClick={depart}>{moving ? 'Ταξιδεύει…' : 'Αναχώρηση'}</Button>}</div>
    {s.answered && <div className="post__delivery"><span aria-hidden="true">🎁</span><p>{p.receiver.factsGreek[0]}</p></div>}
    {s.answered && <p>Η διαδρομή σου: {route.length - 1} στάσεις · Η πιο σύντομη: {p.shortest.length - 1}</p>}
  </>;
}
