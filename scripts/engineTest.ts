import { QuestionStream, getCountriesByDifficulty } from '../src/game/questionGenerator';
import { applyHintPenalty, scoreCorrectAnswer, scoreWithHints } from '../src/game/scoring';
import { LANDMARK_BY_ID, LANDMARKS_BY_ISO2 } from '../src/data/landmarks';
import type { GameConfig } from '../src/types/game';

let fails = 0;
const check = (cond: boolean, msg: string) => { if (!cond) { fails++; console.log('FAIL:', msg); } };

for (const mode of ['country','capital','flags'] as const) {
  for (const difficulty of ['easy','medium','hard'] as const) {
    const config: GameConfig = { mode, difficulty, length: 10 };
    const stream = new QuestionStream(config);
    const seen: string[] = [];
    for (let i = 0; i < 60; i++) {
      const q = stream.next();
      check(q.choices.length === 4, `${mode}/${difficulty}: ${q.choices.length} choices`);
      check(q.choices.some(c => c.id === q.correctAnswerId), `${mode}/${difficulty}: correct answer not among choices`);
      const labels = new Set(q.choices.map(c => c.flagIso2 ?? c.label));
      check(labels.size === 4, `${mode}/${difficulty}: duplicate choices [${[...labels]}] for ${q.countryId}`);
      seen.push(q.countryId);
    }
    // no immediate repeats within a pool cycle
    const poolSize = getCountriesByDifficulty(difficulty).length;
    const firstCycle = seen.slice(0, Math.min(poolSize, 60));
    check(new Set(firstCycle).size === firstCycle.length, `${mode}/${difficulty}: repeats within first cycle (pool ${poolSize})`);
  }
}

// scoring
const s1 = scoreCorrectAnswer(0, 0);
check(s1.total === 150, `fast first answer should be 150, got ${s1.total}`);
const s2 = scoreCorrectAnswer(5, 20000);
check(s2.total === 150, `streak-5 slow answer should be 100+50+0=150, got ${s2.total}`);
const s3 = scoreCorrectAnswer(15, 5000);
check(s3.base === 100 && s3.streakBonus === 100 && s3.timeBonus === 25, `capped streak: ${JSON.stringify(s3)}`);

// focus country
const fstream = new QuestionStream({ mode: 'country', difficulty: 'easy', length: 10, focusCountryId: 'jp' });
check(fstream.next().countryId === 'jp', 'focus country should come first');

// landmark mode: κάθε ερώτηση έχει έγκυρο μνημείο της σωστής χώρας
for (const difficulty of ['easy','medium','hard'] as const) {
  const lstream = new QuestionStream({ mode: 'landmark', difficulty, length: 10 });
  for (let i = 0; i < 60; i++) {
    const q = lstream.next();
    check(q.type === 'LANDMARK_TO_COUNTRY', `landmark/${difficulty}: wrong type ${q.type}`);
    check(q.choices.length === 4, `landmark/${difficulty}: ${q.choices.length} choices`);
    check(q.choices.some(c => c.id === q.correctAnswerId), `landmark/${difficulty}: correct not among choices`);
    check(!!q.landmarkId && LANDMARK_BY_ID.has(q.landmarkId), `landmark/${difficulty}: missing/unknown landmarkId for ${q.countryId}`);
    const lm = q.landmarkId ? LANDMARK_BY_ID.get(q.landmarkId) : undefined;
    check(!!lm && lm.iso2 === q.countryId, `landmark/${difficulty}: landmark ${q.landmarkId} not of ${q.countryId}`);
    check(LANDMARKS_BY_ISO2.has(q.countryId), `landmark/${difficulty}: country ${q.countryId} has no landmarks`);
  }
}

// scratch mode: ερωτήσεις σημαία → χώρα με 4 επιλογές
const sstream = new QuestionStream({ mode: 'scratch', difficulty: 'easy', length: 10 });
for (let i = 0; i < 30; i++) {
  const q = sstream.next();
  check(q.type === 'FLAG_TO_COUNTRY', `scratch: wrong type ${q.type}`);
  check(q.choices.length === 4, `scratch: ${q.choices.length} choices`);
}

// βοήθεια: μισοί πόντοι
const hp = applyHintPenalty(scoreCorrectAnswer(0, 0));
check(hp.total === 75, `hint penalty on 150 should be 75, got ${hp.total}`);

for (const [hints, expected] of [[0, 100], [1, 70], [2, 45], [3, 25], [9, 25], [-1, 100]]) {
  check(scoreWithHints(hints, 0).total === expected, `hints ${hints}`);
  check(scoreWithHints(hints, 20).total === expected + 100, `hints streak cap ${hints}`);
}
const { mysteryHints, safeMysteryFact, NewModeStream } = await import('../src/game/newModes');
const { ALL_COUNTRIES } = await import('../src/data/countries');
for (const country of ALL_COUNTRIES) {
  check(mysteryHints(country).length === 3, `three hints ${country.iso2}`);
  const fact = safeMysteryFact(country).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  for (const name of [country.nameGreek, country.capitalGreek]) {
    check(!fact.includes(name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()), `unsafe hint ${country.iso2}`);
  }
}
const mysteryStream = new NewModeStream({ mode: 'whoami', difficulty: 'easy', length: 10, focusCountryId: 'jp' });
check(mysteryStream.next().country.iso2 === 'jp', 'mystery focus');
for (let i = 0; i < 60; i++) {
  const round = mysteryStream.next();
  check(new Set(round.choices.map(c => c.iso2)).size === 4, 'mystery distinct choices');
  check(round.choices.includes(round.country), 'mystery answer available');
}

const { paradeSettings } = await import('../src/game/newModes');
for (const [difficulty, count, seconds] of [['easy', 3, 9], ['medium', 4, 7], ['hard', 5, 5]] as const) {
  const parade = new NewModeStream({ mode: 'parade', difficulty, length: 10 });
  check(parade.next().choices.length === count, `parade count ${difficulty}`);
  check(paradeSettings(difficulty, 0).durationMs === seconds * 1000, `parade duration ${difficulty}`);
  check(paradeSettings(difficulty, 3).speed === 1.1, `parade acceleration ${difficulty}`);
  check(paradeSettings(difficulty, 100).speed === 2, `parade speed cap ${difficulty}`);
}
const { validComparison, comparisonRatio } = await import('../src/game/newModes');
for (const difficulty of ['easy', 'medium', 'hard'] as const) {
  const stream = new NewModeStream({ mode: 'bigger', difficulty, length: 20 });
  for (let i = 0; i < 200; i++) {
    const round = stream.next();
    const metric = i % 2 === 0 ? 'population' : 'areaKm2';
    const [a, b] = round.choices;
    check(round.metric === metric, 'bigger alternates metrics');
    check(validComparison(a, b, metric, difficulty), `valid bigger pair ${difficulty}`);
    check(round.choices.every(c => getCountriesByDifficulty(difficulty).includes(c)), 'bigger tiers');
    check(round.country[metric] === Math.max(a[metric]!, b[metric]!), 'bigger correct answer');
    check(Math.max(a[metric]!, b[metric]!) / Math.min(a[metric]!, b[metric]!) >= comparisonRatio(difficulty), 'bigger ratio');
  }
}
const [a, b] = ALL_COUNTRIES;
check(!validComparison({ ...a, population: undefined }, b, 'population', 'hard'), 'missing population excluded');
check(!validComparison({ ...a, areaKm2: 0 }, b, 'areaKm2', 'hard'), 'zero area excluded');
check(!validComparison({ ...a, population: Infinity }, b, 'population', 'hard'), 'infinite population excluded');
check(!validComparison({ ...a, population: 114 }, { ...b, population: 100 }, 'population', 'hard'), 'close pair excluded');
check(validComparison({ ...a, population: 115 }, { ...b, population: 100 }, 'population', 'hard'), '15 percent boundary included');

const { makeNeighborsPuzzle, rankedNeighborTraps } = await import('../src/game/neighborsPuzzles');
const { landNeighbors, borderKind } = await import('../src/data/borders');
const { scoreNeighbors } = await import('../src/game/scoring');
check(scoreNeighbors(4, 0, 0, 0) === 100, 'neighbors perfect');
check(scoreNeighbors(4, 0, 0, 3) === 130, 'neighbors streak');
check(scoreNeighbors(1, 3, 2, 0) === 0, 'neighbors floor');
for (const difficulty of ['easy', 'medium', 'hard'] as const) {
  for (let i = 0; i < 200; i++) {
    const p = makeNeighborsPuzzle(difficulty);
    check(p.guests.length === { easy: 6, medium: 7, hard: 8 }[difficulty], 'neighbor guest count');
    check(new Set(p.guests.map(c => c.iso2)).size === p.guests.length, 'neighbor distinct guests');
    check(p.correct.every(id => p.guests.some(c => c.iso2 === id) && landNeighbors(p.host.iso2, difficulty !== 'easy').includes(id)), 'neighbor true choices');
    check(p.guests.filter(c => !p.correct.includes(c.iso2)).every(c => !landNeighbors(p.host.iso2, true).includes(c.iso2)), 'neighbor traps');
    check(difficulty !== 'easy' || p.host.tier === 1 && p.totalNeighbors >= 2 && p.totalNeighbors <= 5, 'neighbor easy pool');
  }
}
for (const host of ALL_COUNTRIES.filter(c => !['xk', 'ps', 'tw', 'ma', 'mr'].includes(c.iso2)).slice(0, 20)) {
  const puzzle = makeNeighborsPuzzle('hard', host.iso2);
  const needed = puzzle.guests.length - puzzle.correct.length;
  const closest = new Set(rankedNeighborTraps(host.iso2).slice(0, needed).map(c => c.iso2));
  check(puzzle.guests.filter(c => !puzzle.correct.includes(c.iso2)).every(c => closest.has(c.iso2)), `closest neighbor traps ${host.iso2}`);
}
check(!makeNeighborsPuzzle('easy', 'gr').guests.some(c => c.iso2 === 'ee'), 'Greek traps stay local');

const { makePostPuzzle, reachableRoutes, travelOptions, postConstraintMet, longerPostRoute } = await import('../src/game/postPuzzles');
const { scorePost } = await import('../src/game/scoring');
check(scorePost(4, 4, true, 0) === 125, 'post shortest bonus');
check(scorePost(5, 4, false, 0) === 50, 'post constraint penalty');
check(scorePost(4, 4, true, 3) === 155, 'post streak bonus');
for (const difficulty of ['easy', 'medium', 'hard'] as const) {
  const range = { easy: [2, 3], medium: [3, 5], hard: [4, 7] }[difficulty];
  for (let i = 0; i < 100; i++) {
    const p = makePostPuzzle(difficulty, undefined, i);
    const min = reachableRoutes(p.sender.iso2, p.tickets, difficulty !== 'easy').get(p.receiver.iso2);
    check(!!min && min.length === p.shortest.length, 'post BFS shortest');
    check(p.shortest.length - 1 >= range[0] && p.shortest.length - 1 <= range[1], 'post range');
    check(p.shortest[0] === p.sender.iso2 && p.shortest.at(-1) === p.receiver.iso2, 'post endpoints');
    let possible = [{ land: 0, sea: 0, air: 0 }];
    for (let j = 1; j < p.shortest.length; j++) {
      const kinds = travelOptions(p.shortest[j - 1], p.shortest[j], difficulty !== 'easy');
      possible = possible.flatMap(counts => kinds.map(kind => ({ ...counts, [kind]: counts[kind] + 1 })))
        .filter(counts => counts.land <= p.tickets.land && counts.sea <= p.tickets.sea && counts.air <= p.tickets.air);
    }
    check(possible.length > 0, 'post witness fits tickets');
    check(p.constraint !== 'two-continents' || postConstraintMet(p, p.shortest, []), 'post continent constraint');
    check(p.constraint !== 'no-air' || p.tickets.air > 0 && p.shortest.every((id, step) =>
      step === 0 || travelOptions(p.shortest[step - 1], id).some(kind => kind !== 'air')), 'post no-air is meaningful and solvable');
    check(difficulty !== 'easy' || p.shortest.every((id, step) => step === 0 || !borderKind(p.shortest[step - 1], id)), 'easy post avoids special borders');
    check(p.constraint !== 'shortest' || !!longerPostRoute(p.sender.iso2, p.receiver.iso2, p.tickets, p.shortest.length - 1, difficulty !== 'easy'), 'post shortest has detour');
  }
}

const { ATLAS_PUZZLES, puzzleForRound } = await import('../src/data/puzzles');
const { scorePuzzle } = await import('../src/game/scoring');
check(ATLAS_PUZZLES.length >= 12, 'at least twelve atlas puzzles');
for (const puzzle of ATLAS_PUZZLES) {
  check(puzzle.countries.length >= 4 && puzzle.countries.length <= 8, `puzzle size ${puzzle.id}`);
  check(new Set(puzzle.countries).size === puzzle.countries.length, `puzzle distinct pieces ${puzzle.id}`);
  check(puzzle.countries.every(id => ALL_COUNTRIES.some(c => c.iso2 === id) && !['xk','ps','tw','ma','mr'].includes(id)), `puzzle countries ${puzzle.id}`);
}
check(puzzleForRound(0, 'gr').id === 'balkans', 'puzzle focus');
check(scorePuzzle(4, 0, 0, 0) === 150, 'puzzle time bonus');
check(scorePuzzle(5, 30, 200, 0) === 25, 'puzzle floor');
check(scorePuzzle(6, 1, 120, 2) === 115, 'puzzle misdrop and streak');
console.log(fails === 0 ? 'ENGINE OK' : `${fails} failures`);
process.exit(fails ? 1 : 0);
