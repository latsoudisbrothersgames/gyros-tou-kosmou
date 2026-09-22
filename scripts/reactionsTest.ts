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
