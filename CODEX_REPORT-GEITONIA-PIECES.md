# Γειτονιά — χειρίσιμα κομμάτια

## Implementation decisions

- The Natural Earth projection fits the host alone into the central 70% of both board axes. The measured protagonist metric is `max(host bbox width / 332, host bbox height / 266) ≥ 0.69`; it is 0.70 in all 290 qualifying host × difficulty puzzles. The 15% margins show the shared-border portions of neighbours. The complete board uses `clipExtent([14,14], [346,280])`.
- Host, pieces, exterior, and shared-border lines use the same projection, raw topology, and board clip. A piece's local path uses that same projection and clip translated by its board origin, so its placed path coincides with its outline. The projection normally fits the host after `trimRemote`; if trimming hides an actual shared border (notably archipelagos), it refits the full host. Selection logic and difficulty counts remain unchanged.
- The invisible tray rectangle measures at least 48 × 48 CSS px after SVG and tray scaling, recalculated on resize. Board drop boxes have a 48 × 48 CSS px minimum and a larger existing difficulty tolerance; tiny pieces get at least a 40-unit half side. Their centres use the visible clipped shape centroid, kept inside the board. Overlapping logical boxes are partitioned by nearest target centre; releasing a different piece there fails.
- Stage 1, scoring, badge, Greek UI text, art, and other modes were not changed. No dependency was added.

## Before and after metrics

Measured with `world-atlas/countries-50m`, seed 0, all land neighbours revealed. **Host** is the larger of its board width or height shares; **min** is the shortest visible piece bounding-box side in SVG units; **max** is the largest piece bounding-box area divided by board area (a conservative footprint, not polygon fill); **inside** counts pieces wholly inside the board. Before values came from `a905014`; after values come from `npm run test:geitonia-pieces`.

| Host | Difficulty | Pieces | Host before → after | Min before → after | Max before → after | Inside before → after |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Ελλάδα | easy | 3 | .41 → .70 | 23.8 → 41.0 | .28 → .25 | 3/3 → 3/3 |
| Κίνα | easy | 3 | .18 → .70 | 13.9 → 53.5 | .18 → .18 | 3/3 → 3/3 |
| Λιβύη | easy | 3 | .43 → .70 | 74.3 → 85.1 | .24 → .28 | 2/3 → 3/3 |
| Ρωσία | easy | 3 | 1.00 → .70 | 13.9 → 13.5 | .03 → .02 | 3/3 → 3/3 |
| Βραζιλία | easy | 3 | .58 → .70 | 28.8 → 34.7 | .03 → .04 | 3/3 → 3/3 |
| Γερμανία | easy | 3 | .43 → .70 | 36.3 → 59.3 | .04 → .10 | 3/3 → 3/3 |
| Σερβία | easy | 3 | .38 → .70 | 39.7 → 72.3 | .26 → .35 | 3/3 → 3/3 |
| Ελλάδα | medium | 4 | .41 → .70 | 23.8 → 41.0 | .28 → .25 | 4/4 → 4/4 |
| Κίνα | medium | 5 | .18 → .70 | 5.4 → 20.7 | .18 → .37 | 5/5 → 5/5 |
| Λιβύη | medium | 5 | .43 → .70 | 27.7 → 45.3 | .24 → .28 | 4/5 → 5/5 |
| Ρωσία | medium | 5 | 1.00 → .70 | 9.3 → 6.5 | .03 → .02 | 5/5 → 5/5 |
| Βραζιλία | medium | 5 | .58 → .70 | 28.8 → 34.7 | .04 → .05 | 5/5 → 5/5 |
| Γερμανία | medium | 5 | .43 → .70 | 36.3 → 50.0 | .11 → .15 | 5/5 → 5/5 |
| Σερβία | medium | 5 | .38 → .70 | 39.7 → 59.6 | .26 → .35 | 5/5 → 5/5 |
| Ελλάδα | hard | 4 | .41 → .70 | 23.8 → 41.0 | .28 → .25 | 4/4 → 4/4 |
| Κίνα | hard | 6 | .18 → .70 | 5.4 → 20.7 | .18 → .37 | 6/6 → 6/6 |
| Λιβύη | hard | 6 | .43 → .70 | 27.7 → 45.3 | .24 → .28 | 5/6 → 6/6 |
| Ρωσία | hard | 6 | 1.00 → .70 | 6.2 → 6.5 | .03 → .02 | 6/6 → 6/6 |
| Βραζιλία | hard | 6 | .58 → .70 | 16.5 → 19.8 | .04 → .05 | 6/6 → 6/6 |
| Γερμανία | hard | 6 | .43 → .70 | 36.3 → 50.0 | .28 → .19 | 6/6 → 6/6 |
| Σερβία | hard | 6 | .38 → .70 | 39.7 → 59.6 | .26 → .35 | 6/6 → 6/6 |

Russia still has thin visible neighbour fragments; the visible shape stays geographically accurate while its tray handle and board drop zone remain at least 48 CSS px. The smallest visible side in the complete sweep is 0.16 SVG units (Italy/hard), where the enlarged invisible handle and the existing 🔍 label are essential. Some large neighbours can occupy a large bounding box around a smaller host (up to 0.90 in the complete host sweep); clipping removes their distant land but cannot make their real border fragments smaller without changing the map. The host metric describes its span, not its relative polygon area.

## Verification

- Passed in sandbox: `npm run build`, `npm run lint`, `npm run test:data`, `npm run test:engine`, `npm run test:markup`, `npm run test:discover`, `npm run audit:dist`, `npm run test:geitonia-pieces`.
- The new test covers all 290 qualifying host × difficulty puzzles, checks the protagonist share, minimum visible piece size, maximum piece footprint, board containment, and 44 px minimum hit width and height at three SVG scales. It also checks that each target accepts its own piece and rejects the others at its centre.
- Browser probes cannot run in this sandbox. Claude should run these exact commands from this clone, where the probe uses the `focus` URL seam and a 390 × 844 touch viewport:

```bash
npm run probe:geitonia
PROBE_ENGINE=webkit npm run probe:geitonia
```

The probe checks tray rectangles and logical board drop sizes, drags pieces, and writes `tools/shots/geitonia-gr-medium-390x844.png`, `tools/shots/geitonia-gr-hard-390x844.png`, and `tools/shots/geitonia-cn-hard-390x844.png` (plus its existing screenshots).

Work is uncommitted on `codex/geitonia-pieces`; nothing was pushed or deployed.
