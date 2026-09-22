# Γύρος του Κόσμου — Sprint 1 (22.09.2026): PWA offline + μπάλες με συναισθήματα

Ιδιοκτήτης: Apollo. Παίκτες: παιδιά και ενήλικες, κυρίως σε iPhone. Stack: React 19 + TypeScript + Vite 8, HashRouter,
React Router 7, d3 για τον χάρτη, flag-icons (SVG στο build), WebAudio ήχοι χωρίς αρχεία, LocalStorage.
Διάβασε πρώτα: `README.md`, `IDEAS-2026-09-22.md` (ενότητες 0 και 1 — αυτό το sprint), `src/App.tsx`, `src/components/CountryBall/*`,
`src/hooks/useGameSession.ts`, `src/audio/soundManager.ts`, `src/context/SettingsContext.tsx`, `src/types/game.ts`,
`src/pages/QuizGamePage.tsx`, `src/pages/MapGamePage.tsx`, `src/pages/CountryPage.tsx`, `src/components/GameResults/GameResults.tsx`.

## ΑΠΑΡΕΓΚΛΙΤΟΣ ΚΑΝΟΝΑΣ
Το παιχνίδι πρέπει να δουλεύει στο κινητό **παντού, χωρίς wifi και χωρίς Mac ανοικτό**. Δηλαδή: μετά την πρώτη επίσκεψη με
σύνδεση στο https://latsoudisbrothersgames.github.io/gyros-tou-kosmou/ και «Προσθήκη στην αρχική οθόνη», ανοίγει και παίζεται
ολόκληρο σε λειτουργία πτήσης. Καμία κλήση δικτύου κατά το παιχνίδι. Αυτό είναι το Task 1 και ελέγχεται αυτόματα.

Branch: `codex/sprint1-balls` (δημιούργησέ το· αν το `.git` είναι μόνο για ανάγνωση στο sandbox, κλωνοποίησε σε `/private/tmp/gyros-sprint1` και δούλεψε εκεί, όπως αναφέρεις στην αναφορά). Ποτέ στο `main`. Commit ανά task.
Επιτρεπόμενες νέες εξαρτήσεις: `vite-plugin-pwa` (dev) και `playwright-core` (dev, για probes· χρησιμοποιεί το εγκατεστημένο Google Chrome, channel 'chrome'). Τίποτα άλλο.

## Task 1 — PWA πλήρως offline
- `vite-plugin-pwa` με `registerType: 'autoUpdate'`, `workbox.globPatterns` που πιάνουν **όλα** τα assets του dist (js, css, svg σημαίες, png, json, woff2, το TopoJSON του χάρτη), `maximumFileSizeToCacheInBytes` αρκετό για το TopoJSON (~750KB) και το bundle. Το dist σήμερα είναι ~3,5 MB· όλο precache.
- `manifest`: name «Γύρος του Κόσμου», short_name «Γύρος», lang el, display standalone, orientation portrait, theme/background `#0d2f4f`, `start_url` και `scope` με το base `/gyros-tou-kosmou/` (δες `vite.config.ts` — το base είναι μόνο στο build). Εικονίδια 192 και 512 PNG (maskable + any): φτιάξε τα από το `public/apple-touch-icon.png` με `sips -z 512 512` / `sips -z 192 192` (macOS) και βάλ' τα στο `public/`. Διόρθωσε το `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` στο `index.html` ώστε να σέβεται το base (`%BASE_URL%apple-touch-icon.png` ή σχετικό `./`).
- HashRouter: μία HTML σελίδα, άρα ένα `navigateFallback` στο `index.html` του base αρκεί.
- UI: στην αρχική σελίδα μικρή ένδειξη «Λειτουργεί χωρίς σύνδεση ✓» όταν ο service worker είναι ενεργός και το precache ολοκληρωμένο· όταν υπάρχει νέα έκδοση, διακριτικό μήνυμα «Νέα έκδοση, πάτα για ανανέωση» (χρησιμοποίησε το `registerSW` του plugin). Αν ο browser δεν υποστηρίζει SW, τίποτα δεν σπάει.
- **Probe `tools/offline_probe.mjs`** (`npm run probe:offline`): `npm run build`, `vite preview --port 4173 --strictPort` (ή ισοδύναμο που σερβίρει το dist στο base), Chrome headless viewport 390×844 (iPhone), άνοιγμα της αρχικής στο base, αναμονή `navigator.serviceWorker.ready` και ολοκλήρωσης precache (έλεγξε το Cache Storage: πλήθος entries ≥ πλήθος αρχείων του dist/assets), μετά `context.setOffline(true)`, `page.reload()`, και επίσκεψη σε: αρχική, `#/games`, `#/play/flag-country` (ή ό,τι είναι το πρώτο quiz mode), `#/map`, `#/encyclopedia`, `#/country/gr`, `#/collection`. Σε καθεμία: καμία αποτυχημένη αίτηση δικτύου (page.on('requestfailed') = 0 εκτός αναμενόμενων), τουλάχιστον μία σημαία `<img>` με `naturalWidth > 0`, καμία `pageerror`. Στο quiz απάντησε μία ερώτηση (κλικ στην πρώτη επιλογή) και δες ότι εμφανίζεται η επόμενη. Τύπωσε PASS/FAIL ανά οθόνη. Κλείσε τον preview server στο τέλος.

## Task 2 — Μηχανή αντιδράσεων (`src/reactions/`)
- `ReactionsProvider` (μέσα στο `SettingsProvider`) + `useReactions()`. Ένας ελαφρύς event bus: `emit(event)` και `subscribe(iso2 | '*', handler)`.
- Γεγονότα (τύποι σε `src/reactions/events.ts`): `question:new {iso2s}`, `answer:correct {iso2, streak}`, `answer:wrong {chosen, correct}`, `timer:low {secondsLeft}`, `idle {seconds}`, `game:end {won: iso2[], lost: iso2[]}`, `country:open {iso2}`, `map:near {iso2, distancePx}`, `collection:tap {iso2}`.
- Πηγές γεγονότων: `useGameSession.answer()` (σωστό/λάθος/σερί), `QuizGamePage` (νέα ερώτηση, χρονόμετρο < 3΄΄, αδράνεια 10΄΄ χωρίς είσοδο), `MapGamePage` (απόσταση δακτύλου/δείκτη από τη χώρα-στόχο), `CountryPage` (άνοιγμα), `GameResults` (τέλος), `CollectionPage` (πάτημα μπάλας).
- Οι μπάλες αντιδρούν ΜΟΝΕΣ τους: το `CountryBall` δέχεται νέο prop `reactive?: boolean` (προεπιλογή true όταν υπάρχει provider) και κρατά εσωτερική «ουρά διαθέσεων» με χρονική διάρκεια (π.χ. surprised 600ms → idle, celebrate 2000ms → happy 1500ms → idle). Το υπάρχον prop `mood` παραμένει και υπερισχύει όταν δίνεται ρητά.
- Κανόνες αντίδρασης (υλοποίησε ακριβώς αυτούς, σε `src/reactions/rules.ts`, με μοναδιαία tests):
  - `question:new` → όλες οι ορατές μπάλες `surprised` 0,6΄΄ και μετά `idle`.
  - `answer:correct` → η σωστή χώρα `celebrate`, οι άλλες ορατές `happy` (χειροκρότημα)· αν streak ≥ 3 → όλες `dance` 2΄΄.
  - `answer:wrong` → η επιλεγμένη `shrug`, η σωστή `wave` 2΄΄ (για να τη θυμάται ο παίκτης), οι υπόλοιπες `sad` 1΄΄.
  - `timer:low` → όλες `nervous` όσο ισχύει.
  - `idle` → όλες `sleepy` μέχρι το επόμενο γεγονός.
  - `game:end` → οι `won` παρελαύνουν (`dance` με διαδοχικές καθυστερήσεις), οι `lost` `sleepy`.
  - `country:open` → η μπάλα `wave` 1,5΄΄ και μετά `proud`, με φούσκα ομιλίας (βλ. Task 4).
  - `map:near` → η μπάλα-στόχος `shy` (κρυφοκοίταγμα) όταν distancePx < 80, αλλιώς `idle`.
  - `collection:tap` → `celebrate` + φούσκα «Ήξερες ότι…».

## Task 3 — Νέες διαθέσεις + μάτια που ακολουθούν το δάχτυλο
- `BallMood` επεκτείνεται: `surprised | thinking | proud | shy | sleepy | nervous | celebrate | wave | shrug` (σύνολο 13 με τις υπάρχουσες). Καθεμία με δικό της CSS animation στο `CountryBall.css` και αλλαγές στο SVG (φρύδια, στόμα, βλέφαρα, ιδρώτας για nervous, ζζζ για sleepy, κομφετί για celebrate — μικρά SVG στοιχεία, όχι εικόνες). Κράτα τον ντετερμινιστικό χαρακτήρα ανά χώρα.
- **Μάτια που ακολουθούν**: ο `ReactionsProvider` κρατά τη θέση δείκτη/δακτύλου (pointermove + touchmove, throttled με rAF, μία ακρόαση για όλη τη σελίδα). Κάθε μπάλα υπολογίζει τη μετατόπιση της κόρης (max 3px, με `transform`, χωρίς re-render React ανά κίνηση — χρησιμοποίησε ref και CSS variables). Απενεργοποιείται με `prefers-reduced-motion` ή τη ρύθμιση «Λιγότερη κίνηση».
- Επιδόσεις: μέγιστο 8 «ζωντανές» μπάλες ταυτόχρονα· οι υπόλοιπες στατικές. Μόνο CSS animations/transforms, όχι JS ανά καρέ εκτός από τα μάτια.

## Task 4 — Φούσκες ομιλίας + ήχοι + δονήσεις + ρυθμίσεις
- `SpeechBubble` component πάνω από τη μπάλα, μέγιστο 2 γραμμές, αυτόματη εξαφάνιση σε 2,5΄΄. Δεδομένα σε `src/data/ballLines.ts`: τουλάχιστον 6 ελληνικές ατάκες ανά διάθεση (π.χ. celebrate: «Ναι! Με βρήκες!», shrug: «Ωχ… όχι εγώ», wave: «Εδώ είμαι!», sleepy: «Ζζζ… παίζουμε;»), + για `country:open`: «Γεια! Είμαι η/ο/το {όνομα}» (χρησιμοποίησε το άρθρο/γένος αν υπάρχει στα δεδομένα χώρας, αλλιώς «Γεια! Είμαι {όνομα}») και ένα «Ήξερες ότι…» από τα quick facts της εγκυκλοπαίδειας (ό,τι υπάρχει ήδη στο `Country`).
- Ήχος: νέο `SoundName` `'blip'` στο soundManager (σύντομος τόνος ανά 3 χαρακτήρες κειμένου της φούσκας, όπως τα «ομιλούντα» παιχνίδια), σεβόμενο τον υπάρχοντα διακόπτη ήχου.
- Δονήσεις: `src/utils/haptics.ts` με `vibrate(pattern)` πάνω από `navigator.vibrate` (αν υπάρχει), σε σωστό (μία σύντομη) και λάθος (δύο σύντομες). Ρύθμιση «Δονήσεις» (προεπιλογή on).
- Ρύθμιση «Λιγότερη κίνηση» στο `Settings` (προεπιλογή = `prefers-reduced-motion`), που απενεργοποιεί μάτια, χορούς και κομφετί αλλά κρατά τις εκφράσεις προσώπου.
- Οι ρυθμίσεις εμφανίζονται όπου είναι ήδη ο διακόπτης ήχου.

## QA (πριν τελειώσεις)
- `npm run build` και `npm run lint` καθαρά· `npx tsc -b` χωρίς σφάλματα.
- Μοναδιαία tests για τους κανόνες αντίδρασης και για τον επιλογέα ατάκας (χωρίς framework: `node --test` με `tsx` αν υπάρχει, αλλιώς απλό script `scripts/reactionsTest.ts` όπως το υπάρχον `scripts/engineTest.ts`).
- `npm run probe:offline` PASS.
- **Probe `tools/balls_probe.mjs`** (`npm run probe:balls`): Chrome 390×844 στο preview· παίξε 3 ερωτήσεις στο quiz (μία σωστή βρίσκοντας το `correctAnswerId` από το DOM/δεδομένα ή δοκιμάζοντας επιλογές) και έλεγξε ότι οι κλάσεις `countryball--celebrate` / `--shrug` / `--wave` εμφανίζονται στο DOM τις σωστές στιγμές· άνοιξε `#/country/gr` και δες φούσκα με «Γεια!»· κράτα screenshots `tools/shots/balls-*.png` (quiz σωστό, quiz λάθος, σελίδα χώρας, αποτελέσματα).
- Μέγεθος dist ≤ 5 MB. Χωρίς εξωτερικά URL στο runtime (grep του dist για `https://` εκτός από σχόλια/manifest).
- `CODEX_REPORT.md`: τι έγινε ανά task, αρχεία, πώς δοκιμάζεται στο iPhone (βήματα: άνοιγμα URL, προσθήκη στην αρχική, λειτουργία πτήσης), τι έμεινε, αποκλίσεις.
