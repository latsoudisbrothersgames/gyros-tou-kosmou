# SPEC — «Φτιάξε τη γειτονιά»: pieces a child can actually handle

Base: main a905014 (Stage 2 is LIVE since 27.09.2026). Apollo (iPhone) confirmed Stage 2 works (Λιβύη 5/5). Two known problems from the 25.09 QA (`src/game/neighborhoodPuzzles.ts`, `src/pages/NeighborhoodStage.tsx`):
1. **Χώρες με τεράστιους γείτονες** — the projection is `fitExtent` over host + ALL selected neighbours, so a huge neighbour dictates the zoom. Ελλάδα: η Τουρκία πιάνει σχεδόν όλο τον χάρτη, η Ελλάδα μικραίνει. Κίνα (Δύσκολο, 6 pieces): Russia/Kazakhstan/India dominate and small neighbours (Bhutan, Nepal, Laos…) become tiny.
2. **Tiny pieces** — hard to pick up / drop with a child's finger on a 390×844 iPhone.

## Requirements
1. **Frame the board around the host**: fit the projection to the host's bounds expanded by a margin (choose the factor; neighbours are then clipped to the board — a large neighbour appears as the part near the shared border, which is what the puzzle is about). Pieces, targets, exterior outline and border lines must all use the same clipped geometry so a piece still snaps exactly into its outline. The host must be clearly the protagonist (define and assert a metric, e.g. host bbox ≥ X% of board width or area — choose X, justify).
2. **Touch targets ≥ 44×44 CSS px** for every piece in the tray and every drop target on the board (Apple HIG), via invisible hit padding / a larger handle — the visible shape may stay small. Drop tolerance for tiny targets must scale so a correct drop near a tiny country counts, without making wrong drops count (neighbouring targets must not overlap in hit area; if they would, prefer the nearest target centre).
3. Keep selection rules, counts per difficulty, scoring, Stage 1, discoverability badge, art, and all other modes unchanged. No new dependencies.

## Tests & QA
- Add a metric test over **every qualifying host × difficulty** (topology is already used by existing tests): host share, min visible piece size, max piece share of board, pieces fully inside the board. Print a small table for Ελλάδα, Κίνα, Λιβύη, Ρωσία, Βραζιλία, Γερμανία, Σερβία (all difficulties) in `CODEX_REPORT-GEITONIA-PIECES.md`, before vs after.
- Update `tools/geitonia_probe.mjs` to assert hit areas ≥ 44 px and take 390×844 screenshots for Ελλάδα (medium, hard) and Κίνα (hard) — force the host through whatever seam the probe already uses.
- Run in the sandbox: `npm run build`, `npm run lint`, `npm run test:data`, `npm run test:engine`, `npm run test:markup`, `npm run test:discover`, `npm run audit:dist`, plus your new test. **Browser probes cannot run in the sandbox** — list the exact commands for Claude (Chrome + `PROBE_ENGINE=webkit`).

## Rules
Work in this clone on branch `codex/geitonia-pieces` (`.git` read-only: leave changes uncommitted and say so). `node_modules` is a local copy — do not reinstall. Never push/deploy. Don't ask questions: decide, record decisions in `CODEX_REPORT-GEITONIA-PIECES.md`, finish everything. UI text Greek, no CSS uppercase on Greek.
