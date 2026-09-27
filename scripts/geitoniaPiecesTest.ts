import assert from 'node:assert/strict';
import { feature } from 'topojson-client';
import atlas from 'world-atlas/countries-50m.json' with { type: 'json' };
import { ALL_COUNTRIES, getCountryByIsoNumeric } from '../src/data/countries.ts';
import { landNeighbors } from '../src/data/borders.ts';
import { BOARD } from '../src/game/puzzleGeometry.ts';
import { makeNeighborhoodPuzzle, qualifiesForNeighborhood } from '../src/game/neighborhoodPuzzles.ts';
import { acceptsNeighborhoodDrop, dropCenter, dropHalfSide, trayHitSide } from '../src/game/neighborhoodTouch.ts';
import type { WorldTopology } from '../src/components/WorldMap/useWorldTopology.ts';
import type { DifficultyId } from '../src/types/game.ts';

const raw = atlas as unknown as WorldTopology['raw'];
const countries = feature(raw, raw.objects.countries).features.map(f => ({ feature: f,
  isoNumeric: String(f.id), iso2: getCountryByIsoNumeric(String(f.id))?.iso2 }));
const topology: WorldTopology = { raw, countries, availableIso2: new Set(countries.map(c => c.iso2).filter((id): id is string => !!id)) };
const boardW = BOARD.x1 - BOARD.x0, boardH = BOARD.y1 - BOARD.y0;
const sample = new Set(['gr', 'cn', 'ly', 'ru', 'br', 'de', 'rs']);
let checked = 0;
let smallest = { side: Infinity, label: '' };
let largest = { share: 0, label: '' };
console.log('host,difficulty,pieces,hostMaxAxis,minPieceSide,maxPieceBBoxShare,inside');
for (const difficulty of ['easy', 'medium', 'hard'] as DifficultyId[]) {
  for (const host of ALL_COUNTRIES) {
    if (!qualifiesForNeighborhood(host.iso2, difficulty, topology)) {
      if (sample.has(host.iso2)) console.log(`${host.iso2},${difficulty},—, —, —, —,not qualifying`);
      continue;
    }
    const puzzle = makeNeighborhoodPuzzle(host.iso2, difficulty, landNeighbors(host.iso2, false), topology, 0);
    assert.ok(puzzle, `${host.iso2}/${difficulty}: qualifying host must build a puzzle`);
    checked++;
    const label = `${host.iso2}/${difficulty}`;
    const maxAxis = Math.max(puzzle.hostBounds.width / boardW, puzzle.hostBounds.height / boardH);
    assert.ok(maxAxis >= 0.69, `${label}: host max-axis share ${maxAxis}`);
    assert.ok(puzzle.anchor, `${label}: visible host`);
    assert.ok(puzzle.pieces.length >= (difficulty === 'medium' ? 4 : 3)
      && puzzle.pieces.length <= { easy: 3, medium: 5, hard: 6 }[difficulty], `${label}: piece count`);
    const minSide = Math.min(...puzzle.pieces.map(p => Math.min(p.visibleWidth, p.visibleHeight)));
    const maxPiece = Math.max(...puzzle.pieces.map(p => p.width * p.height / (boardW * boardH)));
    if (minSide < smallest.side) smallest = { side: minSide, label };
    if (maxPiece > largest.share) largest = { share: maxPiece, label };
    const inside = puzzle.pieces.filter(p => p.x >= BOARD.x0 - 1e-6 && p.y >= BOARD.y0 - 1e-6
      && p.x + p.width <= BOARD.x1 + 1e-6 && p.y + p.height <= BOARD.y1 + 1e-6).length;
    assert.ok(minSide > 0 && Number.isFinite(minSide), `${label}: min visible piece side ${minSide}`);
    assert.ok(maxPiece <= 1 + 1e-6, `${label}: max piece bbox share ${maxPiece}`);
    assert.equal(inside, puzzle.pieces.length, `${label}: clipped pieces must fit board`);
    for (const piece of puzzle.pieces) {
      assert.ok(piece.d && !piece.d.includes('NaN') && Number.isFinite(piece.targetX) && Number.isFinite(piece.targetY),
        `${label}/${piece.id}: finite clipped path and target`);
      for (const svgScale of [0.75, 0.95, 1.25]) {
        assert.ok(trayHitSide(piece.width, piece.trayScale, svgScale) * piece.trayScale * svgScale >= 44,
          `${label}/${piece.id}: tray hit width`);
        assert.ok(trayHitSide(piece.height, piece.trayScale, svgScale) * piece.trayScale * svgScale >= 44,
          `${label}/${piece.id}: tray hit height`);
        const half = dropHalfSide(piece, difficulty, svgScale);
        assert.ok(half * 2 * svgScale >= 44, `${label}/${piece.id}: board drop hit width/height`);
        const center = dropCenter(piece, half);
        assert.ok(center.x - half >= BOARD.x0 - 1e-6 && center.x + half <= BOARD.x1 + 1e-6
          && center.y - half >= BOARD.y0 - 1e-6 && center.y + half <= BOARD.y1 + 1e-6,
        `${label}/${piece.id}: board drop box inside board`);
        assert.ok(acceptsNeighborhoodDrop(piece.id, center, puzzle.pieces, [], difficulty, svgScale),
          `${label}/${piece.id}: correct drop at target centre`);
        for (const other of puzzle.pieces.filter(p => p.id !== piece.id))
          assert.ok(!acceptsNeighborhoodDrop(other.id, center, puzzle.pieces, [], difficulty, svgScale),
            `${label}: wrong piece cannot use ${piece.id} target`);
      }
    }
    if (sample.has(host.iso2)) console.log([host.iso2, difficulty, puzzle.pieces.length,
      maxAxis.toFixed(2), minSide.toFixed(1), maxPiece.toFixed(2), `${inside}/${puzzle.pieces.length}`].join(','));
  }
}
assert.ok(checked > 50, 'Full topology host coverage');
console.log(`PASS geitonia pieces: ${checked} qualifying host × difficulty puzzles; min side ${smallest.side.toFixed(2)} (${smallest.label}), max bbox share ${largest.share.toFixed(2)} (${largest.label})`);
