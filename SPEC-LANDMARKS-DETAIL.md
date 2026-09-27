# SPEC — «Μνημεία του Κόσμου»: πιο λεπτομερή, πιο ρεαλιστικά γραφικά, ίδιο στυλ

Apollo (27.09.2026): «τα γραφικά στα μνημεία είναι παραπάνω απλοϊκά — το στυλ να μείνει ίδιο, αλλά με περισσότερες λεπτομέρειες». Players: 8-year-olds on iPhone (390×844) and desktop.

Current state: `src/components/LandmarkArt/LandmarkArt.tsx` (24 procedural SVG dioramas, ~38 lines each) + `LandmarkArt.css`. Before-image of all 24: `tools/shots/landmarks-before.png` (view it first). Contact-sheet tool: `npm run sheet:landmarks` → `tools/shots/landmarks-sheet.html` (+PNG only where Chrome exists — not in the sandbox).

## Keep (the style)
- Flat vector illustration, same warm pastel palette family, same sky gradient, sun, soft clouds, ground band, rounded dashed frame, same viewBox / aspect, same `Scene` layering (back / mid / front), `GROUND_Y`, the `celebrate` animation and `frameAccent`, exported API (`LandmarkArt`, `hasLandmarkArt`), props, aria behaviour.
- Shading = 2–3 flat tones per material + small highlights/shadows (no photorealism, no outlines where the current style has none, no blur/filters — iPhone performance). Gradients only where the current file already uses them.
- **No text, letters, numbers or flags inside any art** (the art is the quiz question).

## Add (detail and real architecture) — each monument must be instantly recognisable
- **Πύργος του Άιφελ**: four splayed lattice legs with cross-bracing, the big arches between legs at the base, 1st and 2nd platforms, lattice upper shaft, top + antenna; Champ-de-Mars trees, hint of Paris roofs.
- **Κολοσσαίο**: elliptical perspective, three tiers of arches with engaged half-columns, fourth attic storey with small square windows, the broken/stepped ruined side revealing inner tiers; travertine tones with shade.
- **Ακρόπολη**: Parthenon with front colonnade (Doric, fluting hint), entablature band with triglyph rhythm, pediment, partly ruined roofline; Propylaea at the left, small Erechtheion with caryatid porch hint; rocky cliff hill, olive trees, a few white Athens houses below.
- **Σινικό Τείχος**: wall with crenellations winding over receding ridges (clear perspective), watchtowers with windows and battlements, steps, layered misty mountains.
- **Άγαλμα της Ελευθερίας**: robe folds, seven-ray crown, raised torch with golden flame, tablet in the left arm, star-fort base + pedestal details, copper-green shades; Manhattan skyline behind, harbour water, a ferry.
- **Πυραμίδες της Γκίζας**: three pyramids with stone-course lines (Khafre with the smooth casing cap), small queens' pyramids, the Sphinx in front, dunes, a palm, maybe a camel silhouette.
- **Μπιγκ Μπεν**: Elizabeth Tower gothic panels, ornate clock face (hands only, no numerals), belfry openings, spire with pinnacles; Parliament façade with pinnacles; Thames, Westminster Bridge arches, a red double-decker bus shape.
- **Ταζ Μαχάλ**: onion dome + finial, drum, four minarets with balconies, pishtaq with pointed iwan, small chhatris, plinth, long reflecting pool **with reflection**, cypress rows.
- **Χριστός Λυτρωτής** (currently wrong — a cross on a hill): the statue with open arms, robe, head, on its pedestal at the top of Corcovado; Sugarloaf mountain and bay with water behind.
- **Όπερα του Σίδνεϊ**: groups of overlapping shell sails with tile ridge lines, podium and steps, Harbour Bridge arch in the background, water, small sailboat.
- **Ναός του Αγίου Βασιλείου** (currently inaccurate): nine chapels — multiple onion domes each with its own pattern (spiral stripes, zig-zags, diamond scales) in different colours, central tall tent spire, kokoshnik arches, red-brick body with white trim, Red Square cobbles.
- **Όρος Φούτζι**: snow cap with streaks down the ridges, forest skirt, five-storey red Chureito pagoda and cherry blossoms, lake with reflection (the torii may stay if it fits).
- **Ανεμόμυλοι** (Kinderdijk): several smock mills along a canal, thatched body, sails with lattice grid, the gallery, tulip rows, small bridge.
- **Τσιτσέν Ιτζά**: El Castillo — nine stepped terraces with panel detail, central staircase with serpent heads at the base, temple on top with doorways; jungle around.
- **Μάτσου Πίτσου**: stone terraces, ruin walls with trapezoidal windows and doorways, the iconic steep Huayna Picchu peak behind, clouds in the valley, a llama.
- **Πέτρα**: Al-Khazneh façade — lower portico with six columns and pediment, upper storey with the round tholos, conical roof and urn, broken half-pediments either side, carved from rose-red rock; the Siq walls framing it.
- **Μπουρτζ Χαλίφα**: stepped setbacks of the Y-plan, glass bands with reflections, spire; Dubai skyline, desert, palm.
- **Αγία Σοφία**: large ribbed central dome with ring of windows, semi-domes, buttresses, four slender minarets with balconies and conical caps; Bosphorus hint.
- **Πύλη του Βρανδεμβούργου**: twelve Doric columns (six pairs), entablature with triglyphs, attic with relief band, the **Quadriga** (chariot with four horses) on top — currently a green blob — side wings.
- **Σαγράδα Φαμίλια**: several very tall perforated spires with fruit-like finials, Nativity façade texture, a construction crane (iconic), trees.
- **Πύργος CN**: concrete shaft, main pod with its ring and upper SkyPod, antenna; Toronto skyline, Rogers Centre dome, lake.
- **Μοάι**: a row of moai on an ahu stone platform, some with red pukao topknots, long faces with heavy brows, ocean and surf behind.
- **Ανγκόρ Βατ**: five lotus-bud towers (quincunx) with tiered carving, galleries, causeway, reflecting pool with reflection, palm trees.
- **Μάτερχορν**: sharp pyramidal peak with ridges and rock faces, snow, Zermatt chalets, alpine meadow and pines.

## Budgets
- Rendered SVG ≤ ~12 KB per monument on average (today ≈ 2.8 KB; `npm run sheet:landmarks` prints the total). `npm run audit:dist` must still PASS. Reuse helpers (e.g. `Arches`, repeated patterns via small components/loops) instead of pasting coordinates.
- No new dependencies, no external images.

## QA
- `npm run build`, `npm run lint`, `npm run test:data`, `npm run test:engine`, `npm run test:markup`, `npm run test:discover`, `npm run test:geitonia-pieces`, `npm run audit:dist`, `npm run sheet:landmarks` (HTML). Browser probes and the PNG cannot run in the sandbox — list the exact commands for Claude.
- In `CODEX_REPORT-LANDMARKS.md`: per monument, what details were added, and the per-monument + total SVG sizes before/after.

## Rules
Work in this clone on branch `codex/landmarks-detail` (`.git` is read-only: leave changes uncommitted and say so). `node_modules` is a local copy — do not reinstall. Never push/deploy. Don't ask questions: decide, record decisions, finish all 24. UI text Greek, no CSS uppercase on Greek.
