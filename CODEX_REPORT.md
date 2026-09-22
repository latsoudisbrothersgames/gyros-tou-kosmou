# Sprint 1 — Αναφορά Codex

## Χώρος εργασίας

Το αρχικό `.git` είναι μόνο για ανάγνωση σύμφωνα με το sandbox. Έγινε τοπικός κλώνος (μαζί με το commit του spec) στο `/private/tmp/gyros-sprint1`, branch `codex/sprint1-balls`. Καμία αλλαγή ή commit στο main. Το npm χρησιμοποιεί cache `/private/tmp/gyros-npm-cache` λόγω περιορισμών εγγραφής στην προσωπική cache.

## Task 1

Πλήρες precache με `vite-plugin-pwa`, ελληνικό manifest, σωστό base και PNG 192/512 από το υπάρχον εικονίδιο με sips. Ένδειξη offline στην αρχική και ανανέωση με επιλογή του παίκτη (`onNeedReload`, διατηρώντας `registerType: autoUpdate`). Η σημαία της Ελλάδας στο λογότυπο λειτουργεί και ως κοινός οπτικός έλεγχος offline στις οθόνες που δεν έχουν δικές τους σημαίες.

Αρχεία: `vite.config.ts`, `index.html`, `public/icon-*.png`, `src/pwa/*`, αρχική/πλοήγηση, `tools/probe_helpers.mjs`, `tools/offline_probe.mjs`, package/lock.

Το probe χτίζει, ξεκινά/κλείνει preview, ελέγχει κάθε asset στην Cache Storage, κόβει δίκτυο πριν τις εσωτερικές οθόνες, ελέγχει σημαίες/σφάλματα/εξωτερικά αιτήματα και απαντά στο quiz. Build και lint επιτυχή. Η πρώτη εκτέλεση του probe μπλοκαρίστηκε στην εκκίνηση Chrome (SIGABRT μέσα στο sandbox)· επανέλεγχος στο τελικό QA.
