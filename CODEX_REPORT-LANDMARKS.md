# Landmark detail implementation — 27 September 2026

Implemented all 24 scenes in `src/components/LandmarkArt/LandmarkArt.tsx` after reading `SPEC-LANDMARKS-DETAIL.md` and viewing `tools/shots/landmarks-before.png`.

Work is **uncommitted** on `codex/landmarks-detail`; `.git` was not modified. Nothing was pushed or deployed. The existing local dependencies were used without installation.

## Preserved and chosen

- The exported component and `hasLandmarkArt`, props, pointer handling, accessibility/answer-hiding behaviour, `Scene` layers, `GROUND_Y = 112`, viewBox, aspect ratio, sky gradients, original scene palettes, rounded frame, celebration and accent behaviour are unchanged. `LandmarkArt.css` is unchanged.
- Geometry remains flat SVG. Material faces use flat colours with fine architectural marks; there are no new gradients, filters, external images, assets or dependencies, and no text, letters, numerals or flags inside the art. Existing suns and cloud styling remain.
- Reused helpers cover arches, columns/fluting, palms, pines, skylines, ripples, cypresses, mills and chapel patterns. Temple silhouettes are reused for reflections; water clips have per-instance React IDs.
- Details are stylised for the existing small viewport. Optional camel and torii were omitted to leave room for the Sphinx and pagoda. The five Angkor towers and nine St Basil chapels are arranged in depth, with partial occlusion expected.
- The contact-sheet tool now measures actual UTF-8 SVG bytes (its previous “KB SVG” value included HTML/CSS), isolates each cell’s SVG IDs, supports `--html-only` and `--mobile`, and enforces the average SVG budget. Captions remain outside the art. Only the QA sheet freezes ambient drift for repeatable screenshots; production animation is untouched.

## SVG measurements and added details

Sizes are uncompressed UTF-8 bytes of the rendered `<svg>…</svg>`, excluding the outer div, captions and CSS. Both versions were rendered with identical default props and `identifierPrefix: landmarkId + '-'` using React SSR. The before source was captured before editing; after values match `npm run sheet:landmarks`. The original unprefixed baseline total was 63,321 bytes; the common prefix used for the fair comparison below accounts for the extra 660 baseline bytes.

### 1. Πύργος του Άιφελ (`eiffel`)

**2,699 → 3,947 bytes.** Four splayed legs in front/rear pairs, crossed lattice braces, the large curved base arch, two observation platforms with rail detail, an upper lattice shaft, summit and antenna. Champ-de-Mars tree rows, a central path and small Paris roofs/windows establish the setting.

### 2. Κολοσσαίο (`colosseum`)

**3,140 → 8,357 bytes.** Curved elliptical outer wall and inner ring; three rows of arched openings with engaged half-column accents; an attic with square windows; a stepped broken edge revealing inner arcades and seating bands. Travertine light, midtone and shadow faces. The whole structure fits above the existing ground band.

### 3. Ακρόπολη (`acropolis`)

**3,401 → 7,266 bytes.** Eight fluted Doric front columns, stepped plinth, entablature with triglyph rhythm, recessed pediment and chipped roofline. Left Propylaea, right Erechtheion with four small caryatid figures, angular cliff faces, olive trees and white Athens houses below.

### 4. Σινικό Τείχος (`greatwall`)

**2,486 → 4,323 bytes.** A winding wall with a pale walking surface, crenellations, foreground steps and masonry courses. Three watchtowers shrink into the distance and have dark windows and battlements. Three layers of muted mountain ridges establish depth.

### 5. Άγαλμα της Ελευθερίας (`liberty`)

**2,923 → 4,274 bytes.** Robe silhouette and folds, separate face, exactly seven crown rays, a raised torch with golden flame and a tablet in the statue’s left arm (viewer’s right). Detailed pedestal and star-fort island, Manhattan skyline, harbour ripples and a ferry.

### 6. Πυραμίδες της Γκίζας (`pyramids`)

**1,691 → 3,818 bytes.** Three principal pyramids with light/shadow faces and stone courses; Khafre has a smooth casing cap. Three smaller queens’ pyramids, a recumbent Sphinx with head, headdress, nose and projecting paws, dunes and a palm.

### 7. Μπιγκ Μπεν (`bigben`)

**3,168 → 5,468 bytes.** Elizabeth Tower with gothic vertical panels, belfry openings, pointed roof and corner pinnacles; a clock with hands and no numerals or lettering. Parliament arcades and pinnacles, Thames water, Westminster Bridge arches/railings and a red two-deck bus.

### 8. Ταζ Μαχάλ (`tajmahal`)

**2,814 → 10,041 bytes.** Onion dome and finial on a drum, four minarets with balcony bands and small tops, a framed pishtaq and pointed recessed iwan, chhatris, side niches and plinth. Long perspective pool with an inverted reflection clipped to the water and two cypress rows.

### 9. Χριστός Λυτρωτής (`redeemer`)

**2,049 → 3,449 bytes.** A recognisable human statue: separate head/hair, shoulders, broad draped sleeves, hands and open arms, full robe and fold lines, standing on a stepped pedestal. Corcovado has rock planes; Sugarloaf, the bay and a pale shoreline appear behind.

### 10. Όπερα του Σίδνεϊ (`opera`)

**2,177 → 3,799 bytes.** Two overlapping groups of shell sails with fine ridge/tile lines, shaded rear shells and glazing below. A stepped podium, Harbour Bridge arch with vertical structure in the background, harbour ripples and a complete small sailboat.

### 11. Ναός του Αγίου Βασιλείου (`stbasil`)

**3,097 → 9,411 bytes.** Nine chapels: eight onion-domed side chapels at different heights/depths around the tall central tent chapel. Spiral, zig-zag and diamond patterns use several dome colours. Kokoshnik arches, red masonry with pale trim, entrances, stepped base and Red Square cobbles.

### 12. Όρος Φούτζι (`fuji`)

**2,091 → 5,155 bytes.** Snowcap with long streaks following mountain ridges, two mountain faces and a forest skirt. A five-storey red pagoda with layered eaves, pale railings and finial, cherry branches/blossoms, and a lake containing an inverted mountain/snow reflection.

### 13. Ανεμόμυλοι (`windmill`)

**2,763 → 9,829 bytes.** Three smock mills diminishing along a canal. Faceted thatched bodies, cap roofs, four lattice sails, galleries with railings, doors and windows. Three tulip rows, canal banks/ripples and a small arched bridge.

### 14. Τσιτσέν Ιτζά (`chichen`)

**3,472 → 5,749 bytes.** Exactly nine terraces with recessed panel strips and projecting courses, a separate summit temple with doorways, a central staircase with eighteen step marks and sloping balustrades. Paired serpent heads at the foot and surrounding jungle.

### 15. Μάτσου Πίτσου (`machu`)

**2,397 → 5,741 bytes.** A steep Huayna Picchu peak with separate rock/vegetation faces, distant ridges and low valley clouds. Six stone/grass terrace bands, six ruin groups with masonry joints and trapezoidal openings, and a small foreground llama.

### 16. Πέτρα (`petra`)

**1,812 → 5,419 bytes.** The Treasury’s lower portico has six columns, a recessed central doorway and pediment. Upper storey has side columns and broken half-pediments around the round tholos, conical roof and urn. Rose-red carved stone, ledges and stratified Siq walls frame the façade.

### 17. Μπουρτζ Χαλίφα (`burj`)

**2,767 → 3,646 bytes.** A narrow central core and staggered wings suggest the spiralling setbacks of the Y-plan. Horizontal glass bands, vertical highlights and small flat reflected patches, plus a thin spire. Dubai skyline, dune bands, a water feature and palms.

### 18. Αγία Σοφία (`hagia`)

**2,960 → 5,775 bytes.** Large ribbed central dome with a ring of arched windows, two semi-domes with ribs, buttresses, entrance and wall arcades. Four minarets in front/rear pairs with balcony bands and conical caps, plus a Bosphorus water strip behind.

### 19. Πύλη του Βρανδεμβούργου (`brandenburg`)

**2,965 → 8,405 bytes.** Twelve fluted Doric columns in six front/rear pairs, side wings, entablature/triglyph rhythm and attic relief band. The Quadriga is explicitly drawn as four separate horses with heads, bodies and legs, reins, a wheeled chariot and driver, rather than a single mass.

### 20. Σαγράδα Φαμίλια (`sagrada`)

**2,787 → 7,040 bytes.** Six tall spires at varying depths, rows of dark perforations, pale vertical ribs and clustered fruit-like finials. Layered Nativity façade with pointed portals, small sculptural forms and textured trim; a crane with mast, jib and hanging hook; foreground trees.

### 21. Πύργος CN (`cntower`)

**2,170 → 3,391 bytes.** Tapering concrete shaft with flat shade/highlight, a large main observation pod with a glazing ring, a separate upper SkyPod and antenna. Toronto skyline, ribbed Rogers Centre dome, shoreline, lake and small boats.

### 22. Μοάι (`moai`)

**3,228 → 5,442 bytes.** Five moai of different sizes, including two with red cylindrical pukao. Long faces, heavy brows, projected noses, ears, mouths, torsos and arm details. Jointed ahu stone platform, ocean and surf behind, grass in front.

### 23. Ανγκόρ Βατ (`angkor`)

**2,838 → 10,058 bytes.** Five tiered lotus-bud towers in a depth arrangement representing the quincunx: rear pair, tall centre and front pair. Carving bands, galleries with repeated openings, central gate, causeway, palms and a reflecting pool with a clipped inverted temple reflection.

### 24. Μάτερχορν (`matterhorn`)

**2,086 → 5,007 bytes.** Sharp pyramidal summit, distinct lit/shaded rock faces, ridgelines and broken snow streaks. Background alpine peak, three timber Zermatt chalets with roofs/windows/balconies, meadow flowers, path and layered pines.

## Totals and budgets

- Total SVG: **63,981 → 144,810 bytes** (62.48 → 141.42 KiB).
- Average: **2,665.9 → 6,033.8 bytes** (2.60 → 5.89 KiB), below ~12 KB per monument.
- Largest: Angkor Wat, **10,058 bytes / 9.82 KiB**. Every individual scene also fits within 12 KB.
- Final `audit:dist`: **PASS**, **3,893,340 bytes** against the 5,000,000-byte ceiling; **88** unique precached files. No external asset requests were introduced.

## Completed QA

All required sandbox-compatible checks passed:

- `npm run build`
- `npm run lint`
- `npm run test:data`
- `npm run test:engine`
- `npm run test:markup`
- `npm run test:discover`
- `npm run test:geitonia-pieces`
- `npm run audit:dist`
- `npm run sheet:landmarks` — HTML generated for all 24 scenes.
- `npm run sheet:landmarks -- --html-only` — explicit browser-free generation also passed.
- `git diff --check`

Additional one-off SSR checks passed for all 24 IDs: viewBox, all three scene layers, default hidden aria, labelled image aria, celebration/accent/custom props, unknown-ID fallback, no SVG text/images/foreignObject/filter nodes or nonfinite geometry, and a single existing sky gradient. Rendering repeated Taj/Angkor instances together confirmed unique reflection/gradient/clip IDs and resolving references. All rendered SVGs parse as XML. A source comparison confirmed the original exported rendering/interaction wrapper and scene colours are unchanged.

Vite emits a chunk-size advisory above 800 kB; the build succeeds and the required distribution audit passes.

## Browser/PNG handoff to Claude

Browser visual acceptance remains pending outside the sandbox. Chrome launch here failed with `browserType.launch: Target page, context or browser has been closed`; the HTML generation succeeded. A native Quick Look attempt also failed to initialise in the sandbox. No after PNG, browser interaction result or actual iPhone pass is claimed.

Run these exact commands from this checkout on a machine with Chrome and the existing Playwright WebKit runtime. Each probe owns the preview server on port 4173, so run them sequentially:

```sh
cd /private/tmp/gyros-s8
npm run sheet:landmarks -- tools/shots/landmarks-after.png
npm run sheet:landmarks -- tools/shots/landmarks-after-iphone.png --mobile
npm run probe:modes
npm run probe:touch
npm run probe:offline
PROBE_ENGINE=webkit npm run probe:modes
PROBE_ENGINE=webkit npm run probe:touch
PROBE_ENGINE=webkit npm run probe:offline
```

The contact-sheet PNG commands use desktop 1300×800 and mobile 390×844 viewports respectively, at device scale 2, and capture the full sheet. Inspect all 24 against the before image for legibility, recognizable silhouettes, clipped reflections, occlusion and edge clipping. Generic mode/touch probes are regression checks and do not replace visual review of these illustrations.

For the live landmark quiz and manual pointer/touch/celebration review:

```sh
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173/gyros-tou-kosmou/#/play/landmark` on desktop and at a 390×844 touch viewport. Check no horizontal overflow; art hides its accessible name before answering; reveal supplies the name and frame accent; pointer/touch movement resets on release/cancel/leave; celebration remains intact; reduced-motion disables drift/parallax/celebration. The static HTML sheet does not hydrate event handlers, so these interaction checks must use the live app. Actual iPhone Safari verification is still a separate device check.

## Files

- `src/components/LandmarkArt/LandmarkArt.tsx` — all 24 detailed scenes and shared SVG helpers.
- `tools/landmarks_sheet.mjs` — accurate byte accounting, unique cell IDs, HTML-only and mobile options, responsive contact sheet.
- `tools/shots/landmarks-sheet.html` — generated review artifact with all 24 updated scenes.
- `CODEX_REPORT-LANDMARKS.md` — this report.

The supplied specification and before screenshot were left untouched.
