// Run with NODE_PATH pointing to a Playwright installation; see docs/development.md.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const catalog = JSON.parse(html.match(/const CATALOG = (.*);/)[1]);
const origin = process.env.ATLAS_URL || 'http://127.0.0.1:8000/';
const soldierId = 'd093322e-a717-4e2d-8199-fa560792bcf6';
const tokenPart = { id: soldierId, component: 'token', name: 'Soldier' };
// Minimal Scryfall-shaped responses keep browser tests independent of the network.
const cards = [...new Map(catalog.decks.flatMap(d => d.cards).map(c => [c.name, c])).values()].map((c, i) => ({
  id: `fixture-${i}`, name: c.name, set: 'j25', collector_number: String(i + 1),
  type_line: c.isLand ? 'Basic Land' : 'Creature', cmc: c.isLand ? 0 : 2,
  all_parts: ['Raise the Alarm', 'Ancestral Blade'].includes(c.name) ? [tokenPart] : [],
}));
const token = { id: soldierId, oracle_id: 'fixture-soldier', name: 'Soldier', type_line: 'Token Creature — Soldier', power: '1', toughness: '1', oracle_text: '', image_uris: { normal: 'https://cards.scryfall.io/fixture-soldier.png' }, scryfall_uri: 'https://scryfall.com/card/tj25/1/soldier' };
const pause = ms => new Promise(r => setTimeout(r, ms));
async function until(fn) { for (let i = 0; i < 100; i++) { if (await fn()) return; await pause(50); } throw Error('Condition did not become true'); }
(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [1280, 412, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 920 }, permissions: ['clipboard-read', 'clipboard-write'] });
      const page = await context.newPage();
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      let failTokens = false, tokenRequests = 0;
      await page.route('https://**/*', async route => {
        const url = route.request().url();
        if (url.startsWith('https://api.scryfall.com/cards/search')) return route.fulfill({ json: { object: 'list', data: cards, total_cards: cards.length, has_more: false } });
        if (url === `https://api.scryfall.com/cards/${soldierId}`) { tokenRequests++; return route.fulfill(failTokens ? { status: 404, json: { details: 'Fixture token unavailable' } } : { json: token }); }
        return route.abort();
      });
      const slots = () => page.locator('.pair-slot');
      const packIds = () => page.locator('.pair-slot [data-action=reveal-pack]').evaluateAll(els => els.map(el => el.dataset.id));
      const action = (name, scope = page) => scope.locator(`[data-action="${name}"]`);
      const go = async packs => { await page.goto(origin + '#pairings' + (packs === undefined ? '' : '?packs=' + packs)); await slots().first().waitFor(); };
      const checkWidth = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow at ${width}px`);
      await go('stalwart-4,zealots-3');
      for (let i = 0; i < 4; i++) { const before = (await packIds()).sort(); await action('random', page.locator('.mix-builder')).click(); assert.notDeepEqual((await packIds()).sort(), before, 'Surprise changes the recipe'); }
      await go('stalwart-4,zealots-3');
      await action('remove-pair').first().click();
      assert.equal(await slots().nth(0).locator('h3').count(), 0); assert.deepEqual(await packIds(), ['zealots-3']);
      await page.reload(); assert.equal(await slots().nth(0).locator('h3').count(), 0); assert.deepEqual(await packIds(), ['zealots-3']);
      await action('choose-slot', slots().nth(0)).click(); await page.locator('#picker-search').fill('angels');
      await action('pick-pack').filter({ hasText: 'Angels' }).first().click();
      assert.deepEqual(await packIds(), ['angels-1', 'zealots-3']);
      for (const slot of [0, 1]) {
        const before = await packIds(); await action('shuffle-slot', slots().nth(slot)).click(); const after = await packIds();
        assert.notEqual(after[slot], before[slot]); assert.equal(after[1 - slot], before[1 - slot]);
      }
      await action('remove-pair').last().click(); assert.equal(await slots().nth(1).locator('h3').count(), 0);
      await action('remove-pair').first().click(); assert.deepEqual(await packIds(), []);
      await checkWidth();
      await action('shuffle-slot', slots().nth(1)).click(); assert.equal(await slots().nth(0).locator('h3').count(), 0); assert.equal(await packIds().then(x => x.length), 1);
      await page.reload(); assert.equal(await slots().nth(0).locator('h3').count(), 0);
      await action('shuffle-slot', slots().nth(0)).click(); assert.equal((await packIds()).length, 2);
      // Pair filters still constrain shuffle, without pinning the current selection.
      await page.selectOption('#pair-color', 'mono'); await action('random', page.locator('.mix-builder')).click();
      const selected = (await packIds()).map(id => catalog.decks.find(d => d.id === id)); assert.equal(selected[0].color, selected[1].color);
      await page.selectOption('#pair-availability', 'confirmed'); const beforeImpossible = await packIds(); await action('random', page.locator('.mix-builder')).click(); assert.deepEqual(await packIds(), beforeImpossible);
      await go('legion-1,legion-1');
      await page.selectOption('#pair-color', 'all'); await page.selectOption('#pair-availability', 'all');
      assert.equal(await page.locator('.pair-grid .pair-card').count(), 1, 'Identical halves require both copies in results');
      const beforeStorage = await page.evaluate(() => localStorage.getItem('jumpstart-atlas.collection.v1'));
      await action('test-hands', page.locator('.mix-builder')).click();
      const sampleKeys = () => page.locator('[data-sample-key]').evaluateAll(els => els.map(el => el.dataset.sampleKey));
      const first = await sampleKeys();
      const counts = {};
      for (const c of catalog.decks.find(d => d.id === 'legion-1').cards) counts[c.name.toLowerCase()] = c.quantity * 2;
      const observed = new Set();
      for (let i = 0; i < 12; i++) {
        const sample = await sampleKeys(); assert.equal(sample.length, 10);
        assert.equal(await page.locator('[aria-label="Opening hand"] [data-sample-key]').count(), 7);
        assert.equal(await page.locator('[aria-label="Next three draws"] [data-sample-key]').count(), 3);
        const used = {}; for (const name of sample) { observed.add(name); used[name] = (used[name] || 0) + 1; assert(used[name] <= counts[name], 'Draws cannot exceed available copies'); }
        await action('deal-hand').click();
      }
      assert(observed.has('plains'), 'Lands are included even when card list filters hide them');
      await checkWidth();
      const latest = await sampleKeys();
      await page.locator('[data-sample-key] [data-action=card]').first().click(); await page.getByRole('button', { name: 'Back', exact: true }).click(); assert.deepEqual(await sampleKeys(), latest, 'Card details preserve the sample');
      for (let i = 0; i < 12; i++) await page.getByRole('button', { name: 'Previous sample' }).click();
      assert.deepEqual(await sampleKeys(), first); assert(await page.getByRole('button', { name: 'Previous sample' }).isDisabled());
      await action('close-modal').last().click();
      assert.equal(await page.evaluate(() => localStorage.getItem('jumpstart-atlas.collection.v1')), beforeStorage);
      await action('save-pair').click(); await page.locator('#saved-name').fill('Token test mix'); await page.locator('#save-deck-form').evaluate(form => form.requestSubmit());
      await page.goto(origin + '#saved'); await action('test-hands').first().click(); assert.equal((await sampleKeys()).length, 10); await action('close-modal').last().click();
      await action('load-saved').click();
      await action('test-hands', page.locator('.dialog')).click(); await page.getByRole('button', { name: 'Back', exact: true }).click();
      failTokens = true; await action('deck-tokens').click(); await until(() => action('retry-tokens').isVisible());
      assert.equal(await page.locator('.token-card').count(), 0); failTokens = false; await action('retry-tokens').click(); await page.locator('.token-card').waitFor();
      assert.equal(await page.locator('.token-card').count(), 1, 'Shared token deduplicates across halves and source cards');
      assert.match(await page.locator('.token-card').innerText(), /Raise the Alarm/);
      assert.match(await page.locator('.token-card').innerText(), /Ancestral Blade/);
      assert(await page.locator('.token-card img').getAttribute('alt')); await checkWidth();
      const requestsAfterLoad = tokenRequests; await page.getByRole('button', { name: 'Back', exact: true }).click(); await action('deck-tokens').click(); await page.locator('.token-card').waitFor(); assert.equal(tokenRequests, requestsAfterLoad, 'Token response cached');
      await page.getByRole('button', { name: 'Back', exact: true }).click();
      await action('reveal-pack', page.locator('.selected-packs-title')).first().click(); await action('deck-tokens').click(); await page.locator('.token-card').waitFor();
      await page.getByRole('button', { name: 'Back', exact: true }).click(); await checkWidth();
      await page.goto(origin + '#explore?pack=angels-1'); await page.reload(); await action('deck-tokens').click(); await page.getByText('No related tokens or emblems are listed for this deck.').waitFor();
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: reshuffle, remove, empty slots, per-slot shuffle, filters, URL reload, 13 hand samples/history, saved mix, token retry/cache/deduplication, pack tokens, empty tokens, overflow`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
