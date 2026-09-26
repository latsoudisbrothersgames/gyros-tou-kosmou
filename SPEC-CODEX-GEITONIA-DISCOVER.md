# SPEC — Make «Φτιάξε τη γειτονιά» discoverable

Base: branch `codex/geitonia` (39b651b, Sprint 5, not yet merged). Apollo tested the preview on 26.09.2026 and **could not find the new stage at all**: he only saw «Οι γείτονες χτυπούν την πόρτα». Today Stage 2 appears only after answering, and only when `makeNeighborhoodPuzzle` finds ≥3 eligible land neighbours (≥4 on Medium) — with random hosts many rounds never offer it, and nothing tells the child it exists. Players are 8-year-olds.

## Requirements
1. **Announce it up front:** when the round's host qualifies for Stage 2, show a clear, friendly cue from the start of the round (e.g. a small puzzle-piece badge on the house: «🧩 Μετά: Φτιάξε τη γειτονιά»). When the host doesn't qualify, show nothing (no disappointment message).
2. **Make it happen often enough:** bias host selection so that at least 1 in 3 rounds of a session qualifies (configurable constant), without extra country repetition and respecting the difficulty's country pool. Precompute qualification cheaply (the topology is already loaded) — no noticeable delay when a round starts.
3. **After answering:** the «Φτιάξε τη γειτονιά» button must be the obvious next action (primary style, first in reading order), with «Επόμενη ερώτηση» secondary. Keep the neighbour list preview.
4. **Mode card/menu:** the description of «Οι γείτονες χτυπούν την πόρτα» mentions the new stage in one short Greek line.
5. Don't change the puzzle mechanics, scoring, art or other modes.

## Tests & QA
- Unit tests for the qualification check and the host-selection bias (seeded: over 30 rounds ≥ 10 qualify; no immediate repeats).
- Update `tools/geitonia_probe.mjs` to assert the badge appears on a qualifying host before answering and the Stage-2 button is primary after answering; screenshots 390×844.
- Run everything you can in the sandbox (`npm run build`, `npm run lint`, unit tests). **Browser probes cannot run in the sandbox** — write/update them and list the exact commands for Claude.

## Rules
Work in this clone on branch `codex/geitonia-discover` (git dir outside the workspace; if commits fail, leave changes uncommitted and say so). Never push/deploy. Do not ask for clarification — decide, record in `CODEX_REPORT-DISCOVER.md`, finish everything.
