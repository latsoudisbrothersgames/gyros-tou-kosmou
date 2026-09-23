import assert from 'node:assert/strict';
import { reactionFor } from '../src/reactions/rules.ts';
import type { ReactionEvent } from '../src/reactions/events.ts';

let checks = 0;
function mood(event: ReactionEvent, iso2: string, expected: string | undefined) {
  assert.equal(reactionFor(event, iso2)?.steps[0].mood, expected);
  checks++;
}
mood({ type: 'question:new', iso2s: ['gr'] }, 'jp', 'surprised');
assert.equal(reactionFor({ type: 'question:new', iso2s: [] }, 'gr')?.steps[0].durationMs, 600);
mood({ type: 'answer:correct', iso2: 'gr', streak: 1 }, 'gr', 'celebrate');
mood({ type: 'answer:correct', iso2: 'gr', streak: 2 }, 'jp', 'happy');
for (const iso2 of ['gr', 'jp']) mood({ type: 'answer:correct', iso2: 'gr', streak: 3 }, iso2, 'dance');
for (const [iso2, expected] of [['gr', 'wave'], ['jp', 'shrug'], ['br', 'sad']]) {
  mood({ type: 'answer:wrong', chosen: 'jp', correct: 'gr' }, iso2, expected);
}
assert.equal(reactionFor({ type: 'answer:wrong', chosen: 'jp', correct: 'gr' }, 'br')?.steps[0].durationMs, 1000);
for (const secondsLeft of [0, 1, 2, 3]) mood({ type: 'timer:low', secondsLeft }, 'gr', secondsLeft > 0 && secondsLeft < 3 ? 'nervous' : 'idle');
mood({ type: 'idle', seconds: 10 }, 'gr', 'sleepy');
const end: ReactionEvent = { type: 'game:end', won: ['gr', 'jp'], lost: ['br'] };
mood(end, 'gr', 'dance'); mood(end, 'br', 'sleepy'); mood(end, 'ca', undefined);
assert.equal(reactionFor(end, 'jp')?.delayMs, 180);
assert.deepEqual(reactionFor({ type: 'country:open', iso2: 'gr' }, 'gr')?.steps, [{ mood: 'wave', durationMs: 1500 }, { mood: 'proud' }]);
mood({ type: 'country:open', iso2: 'gr' }, 'jp', undefined);
for (const distancePx of [0, 79.9, 80, 100]) mood({ type: 'map:near', iso2: 'gr', distancePx }, 'gr', distancePx < 80 ? 'shy' : 'idle');
mood({ type: 'map:near', iso2: 'gr', distancePx: 20 }, 'jp', undefined);
mood({ type: 'collection:tap', iso2: 'gr' }, 'gr', 'celebrate');
assert.equal(reactionFor({ type: 'collection:tap', iso2: 'gr' }, 'gr')?.speech, 'fact');
console.log(`PASS κανόνες αντιδράσεων: ${checks} συνδυασμοί και έλεγχοι διάρκειας/ουράς`);

// Ελέγχουμε το όριο και την επαναχρησιμοποίηση θέσεων χωρίς browser/framework.
const { createLiveBalls } = await import('../src/reactions/liveBalls.ts');
const live = createLiveBalls();
const active = new Set<number>();
const elements = Array.from({ length: 12 }, () => {
  const properties = new Map<string, string>();
  return { dataset: {}, style: { setProperty: (name: string, value: string) => properties.set(name, value) },
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 100, height: 100 }), properties };
});
const remove = elements.map((element, i) => live.registerBall(element as unknown as HTMLElement, (value) => { if (value) active.add(i); else active.delete(i); }));
assert.equal(active.size, 8);
live.moveEyes(1000, 1000);
const x = parseFloat(elements[0].properties.get('--cb-look-x')!);
const y = parseFloat(elements[0].properties.get('--cb-look-y')!);
assert.ok(Math.hypot(x, y) <= 3.01);
live.setReducedMotion(true);
assert.equal(elements[0].properties.get('--cb-look-x'), '0px');
remove[0](); active.delete(0);
assert.equal(active.size, 8); assert.ok(active.has(8));
remove.forEach((dispose) => dispose());
console.log('PASS όριο 8 φιγούρων, αναπλήρωση θέσης, κόρες έως 3px, λιγότερη κίνηση');

const { BALL_LINES, countryGreeting, countryFact, pickBallLine } = await import('../src/data/ballLines.ts');
for (const [name, lines] of Object.entries(BALL_LINES)) {
  assert.ok(lines.length >= 6, name);
  assert.equal(new Set(lines).size, lines.length);
  assert.ok(lines.every((line) => /[Α-Ωα-ω]/.test(line)));
  for (let variation = -8; variation < 12; variation++) {
    assert.ok(lines.includes(pickBallLine(name as keyof typeof BALL_LINES, 'gr', variation)));
  }
}
const fixture = { nameGreek: 'Ελλάδα', nameGreekAccusative: 'την Ελλάδα', factsGreek: ['Έχει πολλά νησιά.', 'Βρίσκεται στην Ευρώπη.'], capitalGreek: 'Αθήνα' } as import('../src/types/country.ts').Country;
assert.equal(countryGreeting(fixture), 'Γεια! Είμαι η Ελλάδα');
assert.equal(countryGreeting({ ...fixture, nameGreek: 'Καναδάς', nameGreekAccusative: 'τον Καναδά' }), 'Γεια! Είμαι ο Καναδάς');
assert.equal(countryGreeting({ ...fixture, nameGreek: 'Βέλγιο', nameGreekAccusative: 'το Βέλγιο' }), 'Γεια! Είμαι το Βέλγιο');
assert.equal(countryGreeting({ ...fixture, nameGreekAccusative: 'Ελλάδα' }), 'Γεια! Είμαι Ελλάδα');
assert.equal(countryFact(fixture), 'Ήξερες ότι… Έχει πολλά νησιά.');
assert.equal(countryFact(fixture, 1), 'Ήξερες ότι… Βρίσκεται στην Ευρώπη.');
assert.ok(countryFact({ ...fixture, factsGreek: [] }).includes('Αθήνα'));
assert.equal(pickBallLine('wave', 'gr', 1), pickBallLine('wave', 'gr', 1));
assert.notEqual(pickBallLine('wave', 'gr', 1), pickBallLine('wave', 'gr', 2));
const { vibrate, setHapticsEnabled } = await import('../src/utils/haptics.ts');
const patterns: unknown[] = [];
Object.defineProperty(globalThis.navigator, 'vibrate', { configurable: true, value: (pattern: unknown) => patterns.push(pattern) });
vibrate(35); vibrate([25, 60, 25]);
assert.deepEqual(patterns, [35, [25, 60, 25]]);
setHapticsEnabled(false); vibrate(100); assert.equal(patterns.length, 2);
setHapticsEnabled(true);
Object.defineProperty(globalThis.navigator, 'vibrate', { configurable: true, value: undefined });
assert.doesNotThrow(() => vibrate(35));
console.log('PASS 78 ατάκες, επιλογέας, άρθρα, στοιχεία εγκυκλοπαίδειας και δονήσεις');

const { countryForChoice } = await import('../src/reactions/choiceCountry.ts');
const capitalQuestion = { type: 'COUNTRY_TO_CAPITAL', countryId: 'gr', correctAnswerId: 'cap-gr' } as import('../src/types/game.ts').Question;
assert.equal(countryForChoice(capitalQuestion, { id: 'cap-gr', label: 'Αθήνα' })?.iso2, 'gr');
assert.equal(countryForChoice(capitalQuestion, { id: 'cap-x0', label: 'Ρώμη' })?.iso2, 'it');
console.log('PASS αντιστοίχιση πρωτευουσών σε ISO χωρίς αλλαγή της μηχανής');

const { createBus } = await import('../src/reactions/bus.ts');
const bus = createBus();
let calls = 0;
const unsubscribe = bus.subscribe('*', () => calls++);
bus.emit({ type: 'answer:correct', iso2: 'gr', streak: 1 });
assert.equal(calls, 1);
let replay: ReactionEvent | undefined;
const stop = bus.subscribe('gr', (event) => { replay = event; });
assert.equal(replay?.type, 'answer:correct');
stop(); unsubscribe(); bus.clear();
bus.subscribe('jp', () => calls++);
assert.equal(calls, 1);
bus.emit({ type: 'idle', seconds: 10 });
assert.equal(calls, 2);
console.log('PASS event bus, replay, αποσύνδεση και καθαρισμός στην αλλαγή σελίδας');

mood({ type: 'parade:miss', iso2: 'gr' }, 'gr', 'sad');
mood({ type: 'parade:miss', iso2: 'gr' }, 'jp', undefined);
assert.equal(reactionFor({ type: 'parade:miss', iso2: 'gr' }, 'gr')?.steps[0].durationMs, 2000);
console.log('PASS parade:miss στόχος, άσχετη χώρα και διάρκεια');

mood({ type: 'neighbors:open', host: 'gr', guests: ['al'] }, 'gr', 'celebrate');
mood({ type: 'neighbors:open', host: 'gr', guests: ['al'] }, 'al', 'wave');
mood({ type: 'neighbors:open', host: 'gr', guests: ['al'] }, 'jp', undefined);
mood({ type: 'post:depart', iso2: 'gr' }, 'gr', 'proud');
mood({ type: 'post:deliver', iso2: 'it' }, 'it', 'celebrate');
mood({ type: 'puzzle:snap', iso2: 'gr', neighbors: ['al'] }, 'al', 'wave');
const { GEO_LINES } = await import('../src/data/ballLines.ts');
for (const [kind, lines] of Object.entries(GEO_LINES)) {
  assert.ok(lines.length >= 6 && lines.length <= 8, kind);
  assert.equal(new Set(lines).size, lines.length);
  assert.ok(lines.every(line => /[.!;]/.test(line.at(-1) ?? '')), kind);
}
console.log('PASS νέα γεγονότα και ελληνικές ατάκες Sprint 3');

const { touchReaction } = await import('../src/reactions/touch.ts');
assert.equal(touchReaction(1).mood, 'giggle');
assert.equal(touchReaction(3).mood, 'giggle');
assert.equal(touchReaction(6).mood, 'dizzy');
assert.equal(touchReaction(0, true).mood, 'love');
const { canGreet } = await import('../src/reactions/social.ts');
assert.equal(canGreet('gr', 'al', true, true), true);
assert.equal(canGreet('gr', 'al', true, false), false);
assert.equal(canGreet('gr', 'jp', true, true), false);
const { ALL_COUNTRIES } = await import('../src/data/countries.ts');
const ALL_IDS = new Set(ALL_COUNTRIES.map(c => c.iso2));
const { BALL_ACCESSORIES } = await import('../src/data/ballAccessories.ts');
assert.ok(Object.keys(BALL_ACCESSORIES).length >= 40 && Object.keys(BALL_ACCESSORIES).length <= 70);
assert.ok(Object.keys(BALL_ACCESSORIES).every(id => ALL_IDS.has(id)));
assert.equal(new Set(Object.values(BALL_ACCESSORIES).map(a => a.kind)).size, Object.keys(BALL_ACCESSORIES).length);
assert.ok(Object.values(BALL_ACCESSORIES).every(a => ['hat', 'held', 'badge'].includes(a.position)));
const { LANDMARKS } = await import('../src/data/landmarks.ts');
assert.deepEqual(new Set(Object.values(BALL_ACCESSORIES).map(a => a.landmark).filter(Boolean)), new Set(LANDMARKS.map(l => l.id)));
console.log('PASS αγγίγματα, χαιρετισμοί μόνο με ορατή ταυτότητα και αξεσουάρ');

const { ballVoiceFrequency } = await import('../src/audio/soundManager.ts');
assert.equal(ballVoiceFrequency(), 740);
assert.equal(ballVoiceFrequency('gr'), ballVoiceFrequency('gr'));
assert.notEqual(ballVoiceFrequency('gr'), ballVoiceFrequency('jp'));
assert.ok(ballVoiceFrequency('gr') >= 610 && ballVoiceFrequency('gr') < 920);
console.log('PASS ουδέτερος και ντετερμινιστικός τόνος WebAudio');
