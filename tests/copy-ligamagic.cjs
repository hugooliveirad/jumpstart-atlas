// NODE_PATH points to an external Playwright installation; see docs/development.md.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const catalog = JSON.parse(html.match(/const CATALOG = (.*);/)[1]);
const unique = [...new Map(catalog.decks.flatMap(d => d.cards).map(c => [c.name, c])).values()];
const names = new Set(unique.map(c => c.name));
const origin = process.env.ATLAS_URL || 'http://127.0.0.1:8000/';
const source = html.slice(html.indexOf('function ligaMagicLine('), html.indexOf('function copyListButton('));
const sandbox = { idx: { cards: new Map(unique.map(c => [c.name.toLowerCase(), c])) } };
vm.createContext(sandbox); vm.runInContext(source, sandbox);
for (const card of unique) {
  const hydrated = { ...card, number: '999', printings: [{ set: 'j25', collector_number: '999' }], _printing: { set: 'other', collector_number: '321' } };
  assert.equal(sandbox.ligaMagicLine(hydrated, 2), `2 ${card.name}`, 'Printing metadata cannot enter a LigaMagic line');
}
function parse(text) {
  const result = {};
  for (const line of text.split('\n')) {
    const match = /^([1-9]\d*) (.+)$/.exec(line);
    assert(match, `Plain quantity/name line: ${line}`);
    assert(names.has(match[2]), `Exact English card name: ${match[2]}`);
    assert(!Object.hasOwn(result, match[2]), `One line per card name: ${match[2]}`);
    result[match[2]] = Number(match[1]);
  }
  return result;
}
const legion = catalog.decks.find(d => d.id === 'legion-1');
const pack = Object.fromEntries(legion.cards.map(c => [c.name, c.quantity]));
const pair = Object.fromEntries(legion.cards.map(c => [c.name, c.quantity * 2]));
const inventory = { 'raise the alarm': 1, plains: 3 };
const missing = Object.fromEntries(legion.cards.filter(c => !c.isBasic).map(c => [c.name, Math.max(0, c.quantity * 2 - (inventory[c.name.toLowerCase()] || 0))]).filter(([, q]) => q));
const seed = { schema: 1, set: 'j25', inventory, allocations: {}, saved: [{ id: 'liga-copy', name: 'Liga copy test', pair: ['legion-1', 'legion-1'] }], favorites: [], settings: { includeBasics: false } };
const cards = unique.map((c, i) => ({ id: `copy-${i}`, name: c.name, set: 'j25', collector_number: String(i + 1), type_line: c.isLand ? 'Basic Land' : 'Creature', cmc: c.isLand ? 0 : 2 }));
cards.push({ ...cards.find(c => c.name === 'Raise the Alarm'), id: 'copy-alternate', collector_number: '999' });
(async () => {
  const browser = await chromium.launch();
  try {
    for (const [width, online] of [[1280, true], [320, false]]) {
      const context = await browser.newContext({ viewport: { width, height: 920 } });
      await context.addInitScript(seed => {
        window.JSATLAS_STANDALONE = true;
        if (!localStorage.getItem('jumpstart-atlas.collection.v1')) localStorage.setItem('jumpstart-atlas.collection.v1', JSON.stringify(seed));
        window.copiedLists = [];
        Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => window.copiedLists.push(text) } });
      }, seed);
      await context.route('https://**/*', route => {
        if (online && route.request().url().startsWith('https://api.scryfall.com/cards/search')) return route.fulfill({ json: { object: 'list', data: cards, total_cards: cards.length, has_more: false } });
        return route.abort();
      });
      const page = await context.newPage(); page.setDefaultTimeout(10000);
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      const action = (name, scope = page) => scope.locator(`[data-action="${name}"]`);
      const reveal = async target => {
        const id = await target.evaluate(el => el.closest('[popover]')?.id);
        if (id && !await page.locator('#' + id).evaluate(el => el.matches(':popover-open'))) await page.locator(`[popovertarget="${id}"]:not([popovertargetaction="hide"])`).click();
      };
      const copy = async target => {
        await reveal(target); const count = await page.evaluate(() => copiedLists.length); await target.click();
        await page.waitForFunction(count => copiedLists.length > count, count);
        return page.evaluate(() => copiedLists.at(-1));
      };
      await page.goto(origin + '#pairings?packs=legion-1,legion-1');
      assert.deepEqual(parse(await copy(action('copy-pair'))), pair, 'Identical halves aggregate to all 40 cards, including lands');
      await page.getByText('Copied for LigaMagic.', { exact: true }).waitFor();
      assert.deepEqual(parse(await copy(action('copy-missing-pair'))), missing, 'Missing copy output keeps shortage quantities');
      const share = await copy(action('share-pair')); assert(share.endsWith('#pairings?packs=legion-1,legion-1'), 'Share remains a URL');
      await action('reveal-pack', page.locator('.pair-slot')).first().click();
      assert.deepEqual(parse(await copy(action('copy-pack'))), pack, 'Pack output includes lands hidden in the card grid');
      await page.goto(origin + '#saved');
      assert.deepEqual(parse(await copy(action('copy-saved'))), pair, 'Saved recipe output matches builder');
      await reveal(action('load-saved')); await action('load-saved').click();
      assert.deepEqual(parse(await copy(action('copy-dialog-deck'))), pair, 'Combined dialog output matches builder');
      await page.goto(origin + '#collection');
      assert.deepEqual(parse(await copy(action('copy-inventory', page.locator('main')))), { Plains: 3, 'Raise the Alarm': 1 });
      await page.goto(origin + '#cards');
      if (online) await page.getByText('Scryfall connected', { exact: false }).first().waitFor();
      const output = parse(await copy(action('copy-library')));
      assert.equal(Object.keys(output).length, unique.length, 'Copy results includes all filtered pages');
      assert.equal(output.Plains, 3); assert.equal(output['Raise the Alarm'], 1);
      await reveal(page.locator('#card-printings')); await page.locator('#card-printings').check();
      assert.deepEqual(parse(await copy(action('copy-library'))), output, 'Alternate printings never duplicate name-keyed copies');
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px ${online ? 'hydrated' : 'offline'}: LigaMagic names/quantities, pack/mix/saved/dialog/missing/inventory/library, printing deduplication, share URL`);
      await context.close();
    }
    console.log(`PASS all ${unique.length} catalog names: printing-independent LigaMagic lines`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
