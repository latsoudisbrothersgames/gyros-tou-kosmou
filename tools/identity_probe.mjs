import assert from 'node:assert/strict';
import { base, withPreview } from './probe_helpers.mjs';

const modes = [
  ['country', '.question-card'], ['capital', '.question-card'], ['flags', '.question-card'],
  ['map', '.mapgame__prompt'], ['landmark', '.question-card'], ['scratch', '.scratch'],
  ['whoami', '.new-mode__round'], ['parade', '.new-mode__round'], ['bigger', '.new-mode__round'],
  ['neighbors', '.new-mode__round'], ['post', '.new-mode__round'], ['puzzle', '.new-mode__round'],
];
await withPreview(async ({ page }) => {
  for (const [mode, selector] of modes) {
    await page.goto(`${base}#/play/${mode}?difficulty=easy&focus=gr`);
    await page.locator(selector).first().waitFor();
    assert.equal(await page.locator('[data-accessory]').count(), 0, `${mode}: αξεσουάρ πριν από απάντηση`);
    assert.equal(await page.locator('.countryball .speech-bubble').filter({ hasText: /Γεια! Είμαι|Γεια σου γείτονα|Ήξερες ότι/ }).count(), 0, `${mode}: χώρα-ειδική ατάκα`);
    assert.equal(await page.locator('.countryball[data-identity-visible="true"]').count(), 0, `${mode}: πρόωρη ταυτότητα`);
    console.log(`PASS ${mode}: identityVisible=false πριν την απάντηση`);
  }
});
