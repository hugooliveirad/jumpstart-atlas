// Run with NODE_PATH pointing to a Playwright installation; see docs/development.md.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const catalog = JSON.parse(html.match(/const CATALOG = (.*);/)[1]);
const origin = process.env.ATLAS_URL || 'http://127.0.0.1:8000/';
const storageKey = 'jumpstart-atlas.collection.v1';
const cards = [...new Map(catalog.decks.flatMap(d => d.cards).map(c => [c.name, c])).values()].map((c, i) => ({
  id: `interface-${i}`, name: c.name, set: 'j25', collector_number: String(i + 1),
  type_line: c.isLand ? 'Basic Land' : 'Creature', cmc: c.isLand ? 0 : 2, all_parts: [],
}));
(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [320, 412, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 740 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      // Arm native file-picker interception before keyboard actions. Playwright
      // enables the first filechooser subscription asynchronously; registering it
      // immediately before Enter can lose the event under concurrent test load.
      page.on('filechooser', () => {});
      page.setDefaultTimeout(8000);
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await context.addInitScript(() => { window.JSATLAS_STANDALONE = true; });
      await page.route('https://**/*', route => route.request().url().startsWith('https://api.scryfall.com/cards/search')
        ? route.fulfill({ json: { object: 'list', data: cards, total_cards: cards.length, has_more: false } }) : route.abort());
      const action = (name, scope = page) => scope.locator(`[data-action="${name}"]`);
      const go = async route => { await page.goto(origin + '#' + route); await page.locator('main h1').waitFor(); };
      const openFor = async locator => {
        const id = await locator.evaluate(el => el.closest('[popover]')?.id || null);
        if (id && !await page.locator('#' + id).evaluate(el => el.matches(':popover-open'))) await page.locator(`[popovertarget="${id}"]:not([popovertargetaction="hide"])`).click();
        return locator;
      };
      const click = async locator => { await openFor(locator); await locator.click(); };
      const checkWidth = async label => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label}: no document overflow at ${width}px`);
      const checkPopoverWidth = async locator => {
        const bounds = await locator.boundingBox(); assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width + 1, `Popover fits ${width}px viewport`);
      };
      const dismiss = async () => { if (await page.locator('[popover]:popover-open').count()) await page.keyboard.press('Escape'); };
      const menu = async () => { if (width < 900) await action('menu').click(); };
      for (const view of ['explore', 'cards', 'collection', 'pairings', 'saved']) { await go(view); await checkWidth(view); }

      await go('explore');
      if (width < 900) {
        await action('menu').focus(); await page.keyboard.press('Enter');
        assert(await page.evaluate(() => !!document.activeElement.closest('#atlas-sidebar')), 'Opening navigation moves focus inside');
        for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); assert(await page.evaluate(() => !!document.activeElement.closest('#atlas-sidebar')), 'Navigation contains keyboard focus'); }
        await action('settings').click(); await page.getByRole('dialog').waitFor();
        await page.keyboard.press('Escape');
        if (await page.locator('.sidebar.open').count()) await page.keyboard.press('Escape');
        assert(await action('menu').evaluate(el => el === document.activeElement), 'Closing drawer returns focus to navigation trigger');
        // Hidden navigation must not become a keyboard stop.
        await page.keyboard.press('Tab'); assert(!await page.evaluate(() => !!document.activeElement.closest('#atlas-sidebar')), 'Closed drawer has no keyboard stops');
      }

      await go('cards');
      const filters = page.locator('#popover-library-filters');
      const filterTrigger = page.locator('[popovertarget="popover-library-filters"]:not([popovertargetaction="hide"])');
      await filterTrigger.focus(); await page.keyboard.press('Enter');
      assert(await filters.evaluate(el => el.matches(':popover-open')), 'Filters open from keyboard'); await checkPopoverWidth(filters);
      const ownership = page.locator('#search-owned');
      await ownership.focus(); await ownership.selectOption('owned');
      assert(await filters.evaluate(el => el.matches(':popover-open')), 'Changing filter preserves open popover');
      assert(await ownership.evaluate(el => el === document.activeElement), 'Changed filter retains focus across render');
      await ownership.selectOption('all');
      await page.keyboard.press('Escape'); assert(!await filters.evaluate(el => el.matches(':popover-open')), 'Escape dismisses filters');
      await page.waitForFunction(() => document.activeElement?.id === 'trigger-popover-library-filters');
      await filterTrigger.click(); await page.locator('main h1').click(); assert(!await filters.evaluate(el => el.matches(':popover-open')), 'Outside click dismisses filters');

      const viewMenu = page.locator('#popover-library-view');
      await page.locator('[popovertarget="popover-library-view"]:not([popovertargetaction="hide"])').click(); await checkPopoverWidth(viewMenu);
      const details = action('toggle-details', viewMenu);
      const initialDetails = await details.getAttribute('aria-pressed'); await details.click();
      const changedDetails = await details.getAttribute('aria-pressed'); assert.notEqual(changedDetails, initialDetails, 'Details toggles');
      const shelfChoice = viewMenu.locator('[data-action="list-layout"][data-mode="shelves"]');
      await shelfChoice.click(); assert.equal(await shelfChoice.getAttribute('aria-pressed'), 'true');
      await page.reload(); await page.locator('[popovertarget="popover-library-view"]:not([popovertargetaction="hide"])').click();
      assert.equal(await action('toggle-details', viewMenu).getAttribute('aria-pressed'), changedDetails, 'Details preference persists');
      assert.equal(await viewMenu.locator('[data-action="list-layout"][data-mode="shelves"]').getAttribute('aria-pressed'), 'true', 'Layout preference persists');
      await dismiss();
      await page.locator('[popovertarget="popover-library-query"]:not([popovertargetaction="hide"])').click();
      await page.locator('#adv-name').fill('Angel');
      await page.waitForFunction(() => document.getElementById('card-search')?.value.includes('Angel'));
      assert(await page.locator('#popover-library-query').evaluate(el => el.matches(':popover-open')), 'Build query stays open after composing the search');
      assert(await page.locator('#adv-name').evaluate(el => el === document.activeElement), 'Build query retains input focus across render');
      await page.locator('#adv-name').fill('');
      await page.waitForFunction(() => document.getElementById('card-search')?.value === '');
      await dismiss();
      if (width < 900) assert(await page.locator('#card-search').evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 16), 'Mobile search avoids iOS focus zoom');
      await page.locator('#card-search').fill('zzzz-no-such-card'); await page.getByText(/No cards match|No cards found|No cards just/i).first().waitFor(); await checkWidth('empty search');

      // Pack dialogs remain keyboard navigable while their controls move into menus.
      await go('explore?pack=angels-1'); await page.reload(); await page.getByRole('dialog').waitFor();
      assert(await page.locator('#app').evaluate(el => el.inert).catch(() => page.locator('main').evaluate(el => !!el.closest('[inert]'))), 'Modal makes background inert');
      const tabs = page.getByRole('tab');
      if (await tabs.count() > 1) {
        await tabs.first().focus(); await page.keyboard.press('ArrowRight');
        assert.equal(await tabs.nth(1).getAttribute('aria-selected'), 'true', 'Arrow key selects next pack variant');
        assert.equal(await tabs.first().getAttribute('tabindex'), '-1', 'Only active variant enters tab order');
      }
      const variantBeforeMenu = await page.locator('[role=tab][aria-selected="true"]').getAttribute('data-id');
      await page.locator('[popovertarget="popover-pack-view"]:not([popovertargetaction="hide"])').click();
      await action('toggle-details', page.locator('#popover-pack-view')).focus();
      await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('[role=tab][aria-selected="true"]').getAttribute('data-id'), variantBeforeMenu, 'Popover arrows do not navigate the underlying pack dialog');
      assert(await page.locator('#popover-pack-view').evaluate(el => el.matches(':popover-open')), 'Popover remains open after arrow keys');
      await dismiss(); await checkWidth('pack dialog'); await page.keyboard.press('Escape');

      // Apply the built-in sample only to this throwaway browser context, then undo.
      await go('collection'); const initial = await page.evaluate(key => localStorage.getItem(key), storageKey);
      const importButton = action('import', page.locator('main')).filter({ visible: true });
      if (await importButton.count()) await importButton.first().click(); else { await menu(); await action('import').click(); }
      await action('sample-import').click(); await page.getByText(/EXAMPLE DATA/).waitFor();
      assert.equal(await page.evaluate(key => localStorage.getItem(key), storageKey), initial, 'Preview does not modify inventory');
      const mapping = page.locator('summary').filter({ hasText: 'Review column mapping' });
      if (await mapping.count()) { await mapping.click(); assert(await page.locator('[data-map="name"]').isVisible()); await mapping.click(); }
      if (await page.locator('#skip-issues').count()) await page.locator('#skip-issues').check();
      await action('apply-import').click();
      const imported = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
      assert(Object.keys(imported.inventory).length > 0, 'Sample import writes card inventory');
      await checkWidth('imported collection'); await click(action('undo-import'));
      const undone = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
      assert.deepEqual(undone.inventory, initial ? JSON.parse(initial).inventory : {}, 'Undo restores inventory');

      await go('pairings?packs=angels-1,angels-2'); await click(action('save-pair'));
      await page.locator('#saved-name').fill('Interface regression mix');
      await page.locator('#saved-notes').fill('Saved while checking compact menus.');
      await page.locator('#save-deck-form').evaluate(form => form.requestSubmit());
      await go('saved'); await page.getByText('Interface regression mix', { exact: true }).waitFor();
      await click(action('test-hands').first()); assert.equal(await page.locator('[data-sample-key]').count(), 10); await page.keyboard.press('Escape');
      await click(action('load-saved').first()); await page.getByRole('dialog').waitFor(); await checkWidth('saved dialog'); await page.keyboard.press('Escape');
      await menu(); await action('settings').click();
      const restore = page.getByRole('button', { name: 'Restore backup', exact: true }); await restore.focus();
      const chooser = page.waitForEvent('filechooser'); await page.keyboard.press('Enter'); await chooser;
      assert.deepEqual(errors, [], 'No application exceptions');
      console.log(`PASS ${width}px: mobile navigation, keyboard popovers, filter focus, display persistence, empty search, variant tabs, import preview/apply/undo, saved hands, keyboard restore, overflow`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
