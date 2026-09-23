# Γύρος του Κόσμου — Sprint 4 (23.09.2026): CountryBalls ζωντανοί χαρακτήρες

Η κόρη του Apollo λατρεύει τις CountryBalls και θέλει να γίνουν πιο διαδραστικές. Παρακάτω: (Α) οι οδηγίες του Apollo **αυτούσιες**,
(Β) η συμπλήρωση του κανόνα που κόπηκε, (Γ) πρόσθετα στοιχεία του Claude, (Δ) QA. Ισχύουν ΚΑΙ οι απαρέγκλιτοι κανόνες του `GAME-OVERVIEW.md`.

Διάβασε πρώτα: `GAME-OVERVIEW.md`, `src/components/CountryBall/*`, `src/reactions/*`, `src/data/ballLines.ts`, `src/data/landmarks.ts`,
`src/data/borders.ts`, `src/components/SpeechBubble/*`, `src/audio/soundManager.ts`, `src/utils/haptics.ts`, `src/pages/CollectionPage.tsx`,
`src/pages/CountryPage.tsx`, `tools/balls_probe.mjs`, `tools/modes_probe.mjs`, `tools/geo_modes_probe.mjs`, `tools/probe_helpers.mjs`.

---
## (Α) Οδηγίες Apollo (αυτούσιες)

# TASK: Upgrade the CountryBalls Character, Emotion and Accessory System

You are working on an existing Greek educational geography PWA built primarily for iPhone portrait use.

Your task is to substantially improve the visual personality, emotional reactions and country-specific appearance of the existing CountryBalls WITHOUT changing the existing gameplay architecture, game rules, scoring, navigation, question generation, answer validation, country data semantics or offline behavior.

This is primarily a PRESENTATION LAYER and CHARACTER SYSTEM upgrade.

Do not perform unrelated refactoring.

Do not add any dependency without explicit approval.

Work on a dedicated branch.

Create a separate commit for each logically independent task.

Before modifying anything, inspect the existing implementation and produce a short implementation plan identifying:

1. How CountryBalls are currently rendered.
2. How faces and emotions are currently selected.
3. How game events trigger reactions.
4. Where country-specific visual data currently lives.
5. Whether accessories can be added through data and SVG/CSS layers without modifying core game logic.
6. The minimum code surface that must change to implement this system safely.

If the requested system can be implemented entirely through the existing CountryBall renderer and data configuration, use that architecture.

If the current renderer cannot support layered accessories or additional expressions, make only the minimum additive changes necessary to the CountryBall presentation component.

DO NOT redesign the game architecture.

DO NOT modify working game logic merely to make the new system cleaner.

## PRIMARY OBJECTIVE

Transform each CountryBall from a relatively simple animated country icon into a small expressive character that appears alive.

A CountryBall should: react emotionally to gameplay · look at the player's finger where appropriate · react to nearby CountryBalls · change expression naturally ·
perform small idle behaviors · celebrate · be disappointed · become nervous · become curious · become sleepy · become confused · become proud · become shy ·
become excited · occasionally perform secondary micro reactions · and optionally wear country-specific accessories when the current screen allows the
country's identity to be visible.

The result should feel playful and animated without becoming visually noisy.

The CountryBall itself must remain instantly recognizable.

## ABSOLUTE COMPATIBILITY REQUIREMENT

The upgrade must NOT change: question generation · correct answers · wrong answers · distractor selection · difficulty system · score calculation ·
streak calculation · timers · 50:50 functionality · Explorer Passport · collections · leaderboard · map mechanics · country unlocking · country selection ·
game mode rules · keyboard controls · existing URLs · existing navigation · existing persistence · existing saved user data · existing country IDs ·
existing country data fields unless optional backwards-compatible presentation metadata is added · offline functionality · PWA installation ·
service worker behavior except where new local static assets must be included in the existing offline cache.

No existing feature may regress.

## COUNTRYBALL IDENTITY RULE

Country-specific visual elements MUST NEVER reveal an answer before the player has committed to an answer.

This rule has priority over every visual improvement in this specification.

Examples:

If a CountryBall is intentionally hidden behind "?" in Βρες τη Χώρα, do not display a sombrero, beret, traditional hat, recognizable costume or other country-specific accessory.

If the correct CountryBall is hidden in Ποιος είμαι;, do not *(το κείμενο του Apollo κόπηκε εδώ — συνέχεια στο (Β))*

---
## (Β) Συμπλήρωση του κανόνα ταυτότητας (Claude, με βάση τους ισχύοντες κανόνες)

- Στο «Ποιος είμαι;» η κρυμμένη μπάλα μένει γκρίζα σιλουέτα **χωρίς** αξεσουάρ, χωρίς χώρα-ειδικές ατάκες, χωρίς χώρα-ειδική «φωνή», χωρίς χώρα-ειδικό idle.
- **Ένας μοναδικός διακόπτης** `identityVisible` (prop ή context) αποφασίζει για ΟΛΑ τα χώρα-ειδικά στοιχεία: αξεσουάρ, ατάκες με όνομα/στοιχεία χώρας,
  χώρα-ειδική φωνή, χαιρετισμοί γειτόνων. `false` για: `concealed`, placeholder «?», κάθε επιλογή/μπάλα ερώτησης **πριν** την απάντηση σε ΟΛΑ τα 12 modes
  (και στην Παρέλαση: η σημαία φαίνεται, αλλά αξεσουάρ θα ήταν επιπλέον ένδειξη → όχι πριν το πάτημα). `true` μόνο σε: σελίδα χώρας, Συλλογή, Εγκυκλοπαίδεια,
  νέα «Αυλή», αποτελέσματα/Διαβατήριο, και μετά την απάντηση σε κάθε mode. Αμφιβολία = `false`.
- Γενικές εκφράσεις (μάτια, στόμα, διαθέσεις) επιτρέπονται παντού — δεν αποκαλύπτουν χώρα.

---
## (Γ) Πρόσθετα Claude (για να «ζωντανέψει» το αποτέλεσμα) — όλα presentation layer

1. **Νέες εκφράσεις** δίπλα στις 13 υπάρχουσες: `curious` (γέρνει, ένα φρύδι πάνω), `confused` (ερωτηματικό, μάτια σε διαφορετικά ύψη), `excited` (αστεράκια στα μάτια,
   αναπήδηση), `disappointed` (ήπιο, όχι κλάμα), `dizzy` (σπιράλ μάτια), `giggle`, `love` (καρδούλες). Ομαλή μετάβαση ανάμεσα σε εκφράσεις (cross-fade/transform) —
   **ΟΧΙ** CSS animation της ιδιότητας `d` (δεν δουλεύει στο iOS Safari) και **ΟΧΙ** `foreignObject`/HTML μέσα σε SVG `<g>` με transform (λάθος θέση στο iOS Safari,
   βλ. bug παζλ 23.09 — σημείωση στο `src/pages/PuzzleGamePage.tsx`).
2. **Μικρο-ζωή σε αδράνεια:** τυχαίο ανοιγόκλεισμα ματιών (3–7΄΄, ντετερμινιστικό seed ανά μπάλα ώστε να μη βλεφαρίζουν όλες μαζί), απαλή «ανάσα», περιστασιακό
   κοίταγμα γύρω, χασμουρητό πριν από το `sleepy`, σπάνιο φτάρνισμα-έκπληξη. Όχι θόρυβος: το πολύ μία μικρο-αντίδραση ανά μπάλα ανά ~8΄΄.
3. **Αγγίγματα (το πιο σημαντικό για ένα παιδί):** πάτημα σε μπάλα που ΔΕΝ είναι στοιχείο απάντησης → «ζούληγμα» (squash & stretch) + γελάκι + σύντομη ατάκα·
   3 γρήγορα πατήματα → γαργάλημα/γέλιο· 6+ → `dizzy` 2΄΄· παρατεταμένο πάτημα (~600ms) → `love` με καρδούλες. Ποτέ σε μπάλες που είναι κουμπί απάντησης ή
   κομμάτι παζλ/επιλογή (δεν «κλέβουμε» το πάτημα από το παιχνίδι). Ήπια δόνηση όπου υποστηρίζεται (υπάρχον `haptics`).
4. **Κοινωνική συμπεριφορά:** μπάλες κοντά η μία στην άλλη κοιτάζονται περιστασιακά· όταν μία πανηγυρίζει, οι διπλανές γυρίζουν και χειροκροτούν σε «κύμα»
   με μικρές καθυστερήσεις (όχι όλες ταυτόχρονα)· **χώρες που συνορεύουν** (`BORDERS`) χαιρετιούνται «Γεια σου γείτονα!» όταν εμφανίζονται μαζί με
   `identityVisible` (π.χ. Συλλογή, αποτελέσματα, Αυλή).
5. **Φωνή ανά μπάλα:** το υπάρχον «μπλιπ» των φουσκών με ντετερμινιστικό τόνο ανά χώρα (μόνο όταν `identityVisible`, αλλιώς ουδέτερος τόνος). Σεβασμός ρύθμισης Ήχου.
6. **Αξεσουάρ ανά χώρα** — `src/data/ballAccessories.ts` (προαιρετικά presentation metadata, 40–60 χώρες, οι υπόλοιπες χωρίς): σχεδιασμένα ως διαδικαστικά SVG
   επίπεδα μέσα στο SVG της μπάλας (καμία εικόνα, ίδιο ύφος με το `LandmarkArt`), π.χ. μικρό μνημείο που κρατά η μπάλα (από τα 24 του `landmarks.ts`),
   εθνικό ζώο/φυτό/άθλημα, ή παραδοσιακό καπέλο **μόνο** όπου είναι ευρέως αγαπητό εθνικό σύμβολο. **Κανόνες σεβασμού (παιδικό παιχνίδι):** καμία καρικατούρα
   εθνοτικών χαρακτηριστικών, κανένα θρησκευτικό ένδυμα/σύμβολο, κανένα όπλο, αλκοόλ ή πολιτικό σύμβολο, τίποτα που θα μπορούσε να προσβάλει. Η μπάλα μένει
   αναγνωρίσιμη (το αξεσουάρ ≤ 30% της επιφάνειας, δεν καλύπτει τη σημαία πέρα από μια άκρη). Αμφιβολία = χωρίς αξεσουάρ.
7. **Συλλογή 2.0 (ελαφρύ):** πάτημα σε κερδισμένη μπάλα στη Συλλογή → διάθεση + φούσκα «Ήξερες ότι…» (από τα `factsGreek`), χαιρετισμός αν δίπλα είναι γείτονας.
8. **«Η αυλή των CountryBalls»** (νέα διαδρομή `/yard`, κουμπί από τη Συλλογή — προσθετικό, καμία υπάρχουσα διαδρομή δεν αλλάζει): έως 8 κερδισμένες μπάλες
   περιφέρονται, μπορούν να συρθούν και να «πεταχτούν» (απλή φυσική ελατηρίου με pointer events, χωρίς βιβλιοθήκη), αναπηδούν στα όρια, συγκρούονται απαλά και
   αντιδρούν, αποκοιμιούνται μετά από αδράνεια, ξυπνούν με πάτημα· γείτονες χαιρετιούνται· με 0 κερδισμένες → φιλική οθόνη «Κέρδισε φίλους παίζοντας!».
   «Λιγότερη κίνηση»: σταθερό πλέγμα, μόνο αντιδράσεις σε πάτημα. **Ξεχωριστό commit** (να μπορεί να αφαιρεθεί).
9. **Απόδοση:** ≤ 8 «ζωντανές» μπάλες (υπάρχον όριο), παύση animations εκτός οθόνης (IntersectionObserver), καμία React κατάσταση ανά καρέ (refs + CSS vars),
   στόχος 60fps σε iPhone· ο dist ≤ 5 MB (`audit:dist`).

---
## (Δ) Κανόνες εργασίας & QA
- Branch `codex/sprint4-balls` (ή κλώνος `/private/tmp/gyros-sprint4` αν το .git είναι μόνο για ανάγνωση), commit ανά λογικά ανεξάρτητο task, ποτέ στο main,
  καμία νέα εξάρτηση. Πρώτο βήμα: το σύντομο implementation plan (σημεία 1–6 του Apollo) ως ενότητα στην κορυφή του `CODEX_REPORT.md` — μετά υλοποίηση χωρίς αναμονή.
- `npm run build`, `lint`, `tsc -b`, `test:engine`, `test:data`, `test:reactions` (+ tests για τις νέες εκφράσεις, το `identityVisible`, τα αγγίγματα, τους χαιρετισμούς
  γειτόνων), `test:markup` (+ έλεγχος: καμία μπάλα με `identityVisible=false` δεν αποδίδει `[data-accessory]`), `audit:dist` — καθαρά.
- **Probes:** `probe_helpers.mjs` να δέχεται `PROBE_ENGINE=webkit` (υπάρχει εγκατεστημένο Playwright WebKit — `import { webkit } from 'playwright-core'`) ώστε
  όλοι οι probes να τρέχουν και σε μηχανή Safari. `probe:balls`: νέες εκφράσεις, αγγίγματα (tap ×1/×3/×6, παρατεταμένο), Αυλή (σύρσιμο/ρίψη), screenshots
  `tools/shots/balls-*.png`. `probe:modes` + `geo_modes_probe`: σε ΚΑΘΕ mode πριν την απάντηση **μηδέν** `[data-accessory]` και καμία χώρα-ειδική ατάκα στο DOM.
  `probe:offline`: + η διαδρομή `/yard`. Οι browser probes αποτυγχάνουν στο sandbox (Chrome SIGABRT) — γράψ' τους έτοιμους· τους τρέχει ο Claude σε Chrome ΚΑΙ WebKit.
- Ενημέρωσε το `GAME-OVERVIEW.md` (ενότητα CountryBalls). `CODEX_REPORT.md`: plan, τι έγινε ανά task, λίστα αξεσουάρ ανά χώρα, αποφάσεις, τι έμεινε.
