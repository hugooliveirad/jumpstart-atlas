# Changing Jumpstart Atlas

The published app is `index.html`: CSS, a bundled J25 catalog, and the UI runtime. There is no build step in this repo.

## Run locally

```bash
python3 -m http.server
```

Then open `http://127.0.0.1:8000/`. `file://` still browses decklists; clipboard copy, IndexedDB card cache, and service-worker image cache need an `http(s)` origin.

## Catalog

`const CATALOG` in `index.html` is the source of truth.

| Field | Meaning |
|---|---|
| `themes[].id,name,color,description,tags,variants` | One theme, 1–4 pack versions |
| `decks[].id,themeId,name,variant,color,cards` | One 20-card list |
| `colors` | WUBRG + M lane copy and hex |
| `sourceNotes` | Published-list corrections |

Theme **tags** are the filter vocabulary (Flying, Tokens, Lifegain, …). Add or rename a tag on the theme objects; the tag `<select>` is built from the unique set.

Theme **rarity** is not stored. It is derived:

- 4 variants → Common
- 2 variants → Rare
- 1 variant → Mythic

That matches Foundations Jumpstart theme rarity (4 common, 3 rare, 2 mythic per color, plus Chaos). Change `themeRarity()` if Wizards publishes a different mapping.

`BUNDLED_CARDS` is empty in this edition. Scryfall fills printings, rules, rarity, and images at runtime (`set:j25`, cached in IndexedDB for 24 hours). Seed art in `CATALOG.seedImages` is first paint only.

## Card draft roles

`CATALOG.cardDraftTags` assigns editorial, name-keyed roles to all 768 unique
cards in the bundled J25 decklists. The assignments are bundled and available
offline; Scryfall hydration does not change them. They are independent of theme
tags and collection ownership. Review assignments against Oracle text when
changing them; rarity alone is not a Bomb rating.

BREAD labels are Bomb, Removal (including tempo/countermagic), Evasion, Aggro,
and D / Situational. D is filler or a narrow role, not a claim that a card is
unplayable. Additional roles cover card advantage/selection, ramp/fixing,
combat tricks, recursion, creature tokens, synergy/support and lands. A card
can have multiple roles; these are draft aids, not numeric pick orders.

`cardDraftTags`, `matchesDraftTags`, `draftTagsHTML`, and `draftFilterHTML` are
shared by the library, pack dialogs, combined deck dialogs and inventory list.
Checkboxes match **any** selected role (OR), then intersect with search,
ownership, theme and land visibility filters. No selected roles means all.
Filters stay in session UI state, independently by context. Library reset also
clears its draft selections. Filters open in contextual popovers, retain their open state and scroll position
through rendering, and show an active-filter count on the trigger. Ownership and
draft roles live in Filters; land visibility, layouts, printing display and role
descriptions live in View.

Card names have their assigned BREAD letters beside them; artwork stays clear.
Cards with only additional roles do not receive an invented BREAD rating. Owned
and unowned cards use solid green and hollow muted dots, with accessible labels and tooltips. “Role descriptions” toggles full text
labels across lists, off by default. This preference is stored as
`showDraftDetails` in the existing layout-preferences object. Card-detail dialogs
always explain the roles. Pack cards default to a grid unless a saved layout
preference overrides it. Mobile pack and play-deck dialogs use the full viewport.

BREAD summaries below pack and play-deck totals count card copies in the full
list, independent of filters. Each assigned BREAD role counts, so a card with
multiple roles contributes to each total. Zero counts remain visible. Alongside
BREAD, a text-height sparkline counts nonland copies at mana values 1, 2, 3, 4,
and 5+ (all values 5 and above). Only bars are visible; the full counts are in
the accessible name and tooltip. The button retains a 44px touch target.
It uses the shared `deckAnalysis` calculation and the full list independently
of filters. Missing data uses hollow dashed bars, never invented zero counts.

Clicking the sparkline opens a mana-curve dialog with horizontally scrollable
columns and overlapping card artwork. Each exposed card strip is 58px tall
and opens the usual card details. Duplicate names across both halves combine
quantities. Zero-mana and unknown cards have separate columns when present;
an entirely unknown deck opens directly to its Unknown column. The source
deck IDs are explicit, so filters or a different mixing-room selection cannot
change the list. Card inspection and Back preserve horizontal scroll and focus.

At widths 320–600 CSS pixels, card grids and theme grids use two equal columns
with shrinking tracks rather than a fixed minimum. Horizontal shelves retain
their layout. At 412 CSS pixels, cards are approximately 180px wide (depending
on container padding); below 320px the grid uses one column.

## Optional comparison analysis

Version comparison opens on Cards; Analysis compares all versions. The mixing
room has an independent Analysis toggle, off in a fresh session, showing each
selected half and their combined deck. Full-list quantities drive every count;
missing metadata is explicitly unknown. Theme synergy retains the existing
shared-tag heuristic. See [deck-comparison.md](deck-comparison.md) for the
calculation and display contracts.

The [Removal audit](removal-audit.md) reviews all 768 names. Removal requires
hostile threat interaction, including tempo and counters. Recursion, own-only
bounce, graveyard exile, self-imposed combat restrictions and power-only reduction
do not qualify on their own. Cards with real removal and recursion keep both.

Focused regressions (with an external Playwright installation via NODE_PATH):

```bash
node tests/removal-tags.cjs
node tests/deck-comparison.cjs
```

## Collection storage

Key `jumpstart-atlas.collection.v1` (see `APP_SCHEMA`). Shape:

- `inventory`: `{ [normalizedName]: quantity }`
- `allocations`: confirmed pack ids → count
- `saved`: named two-pack recipes
- `favorites`, `settings.includeBasics`

Matching is by English card name. Card-detail “Matched J25 printings” are Scryfall J25 printings of that name, not per-set owned copies. Do not store printings in `inventory` without a schema bump and a backup migration.

Variant matches on My Collection default to exclusive leftover copies: each unallocated copy finances at most one listed match, with complete packs claiming first. A session toggle restores shared-pool scoring, where complete candidates may share cards. Confirmed packs still reserve first.

Layout preferences use `jumpstart-atlas.preferences.v1`.

## Pairing and copy

`pairTitle` is `Name vN + Name vN`. Synergy score is shared tags plus a small color bonus; saved recipes are highlighted. Choosing a mixing-room half filters `PAIRS` to combinations that include every selected pack, including multiplicity for identical halves.

Mixing-room slots retain their positions when one is removed. Empty positions are
`null` in session state and empty fields in the `packs` URL parameter. They are
never saved as recipes. `completePair` guards actions requiring two actual packs.
Surprise me ignores the selected halves, respects the pairing filters, and excludes
the current unordered recipe. Each slot's Shuffle keeps the other half and chooses
a different eligible variant. If filters leave no alternative, the mix stays intact
and a message explains why.

Test opening hands is available from the builder, pairing cards, saved mixes, and
play-deck dialogs. `dealSample` expands both full catalog lists (including basic
lands and repeated copies), shuffles all 40 cards with Fisher–Yates, and takes seven
cards plus the next three draws without replacement. Samples and their history
exist only in the dialog; filtering or ownership never changes the sampled deck.
The opening hand displays nonlands in ascending mana value (name breaks ties;
unknown values come last) and groups lands by name into compact stacks with
copy counts. This is display-only: stored samples and the next three draws keep
their original order. Every distinct card remains available to inspect.

Pack and play-deck dialogs offer View tokens. Related token/emblem IDs come from
Scryfall `all_parts` for the cards in the full deck, independent of card filters.
Token details use the existing request queue and IndexedDB cache (`token:<id>`,
seven-day freshness with stale fallback offline). They are not added to the card
catalog or inventory. The viewer deduplicates by token Oracle ID and lists source
cards. Missing metadata, request failures, and a verified empty token list have
separate states. Copy effects can produce tokens without a listed token card.

`ligaMagicLine` / `ligaMagicList` / `deckText` produce LigaMagic plain-text lists:
`quantity English card name`, one entry per name, without set codes, collector
numbers, headings or annotations. Deck quantities include lands and both halves;
missing lists retain their shortage quantities. Library results collapse alternate
printings into one name, using the owned quantity or one when unowned.
`copyCardList` confirms the LigaMagic format; share links still use `copyText`.
`downloadText` remains for JSON backup, CSV import template, import issues, and
unreadable-recovery dumps.

Checked against LigaMagic's [plain-text export](https://www.ligamagic.com.br/?view=dks/exportar&type=4&id=10260495)
and its [deck editor parser](https://www.lmcorp.com.br/arquivos/js/decks-v75-min.js)
on October 18, 2026. The format is independent of Scryfall hydration and printing
selection. Deck-format legality and account-based saving remain LigaMagic's own
validation; a 20-card pack is an importable list, not a complete constructed deck.

## Interface structure

The five destinations remain Explore, Cards, Collection, Mixing room and Saved.
Search and primary actions stay visible. **Filters** contains result constraints,
**View** contains display choices, and **More** contains secondary actions such as
copy, tokens, backup and pack comparison. These are native auto popovers: Escape,
light dismissal and keyboard focus return are preserved through UI renders. On
mobile they become bounded bottom sheets; menus never nest.

**View → More details** controls optional descriptions, theme tags, mix statistics
and card printing metadata. It defaults off and persists as `showDetails` in the
existing preferences object, independently from `showDraftDetails`. Availability,
ownership and BREAD letters remain visible. No collection schema migration occurs.

The mobile navigation drawer scrolls, traps keyboard focus and makes the workspace
inert until dismissed. Version tabs support arrow keys. Pack-wide navigation and
collection operations live in the pack's More menu. Card printings and containing
packs use named disclosures. Errors remain visible until dismissed.

The feature inventory and preservation decisions are in [feature-map.md](feature-map.md).
The researched Apple HIG rationale is in [interface-design.md](interface-design.md).

## UI landmarks

- Pack click → `showPack` dialog on every viewport
- Tag filters: `#pack-type`, `#card-pack-type`, `#collection-type`, `#pair-type`, `#saved-type`, `#picker-type`
- Hover preview: `#card-hover-preview` and `[data-hover-image]`
- LigaMagic: `https://www.ligamagic.com.br/?view=cards/card&card=` + encoded English name

## Checks

There is no build step. After JS edits:

```bash
python3 -c "from pathlib import Path; t=Path('index.html').read_text(); s=t[t.find('<script>')+8:t.rfind('</script>')]; Path('/tmp/atlas.js').write_text(s)"
node --check /tmp/atlas.js
```

Then click a pack (dialog), a card (printings + LigaMagic), the mixing room (synergy rail + half filter), and a Copy list button.

The mixing-room browser regression checks use Playwright and a local HTTP server.
Install the test dependency outside the repository, then run:

```bash
npm install --prefix /tmp/jumpstart-atlas-tests --no-save playwright
/tmp/jumpstart-atlas-tests/node_modules/.bin/playwright install chromium
# With python3 -m http.server running in another terminal:
NODE_PATH=/tmp/jumpstart-atlas-tests/node_modules node tests/mixing-room.cjs
NODE_PATH=/tmp/jumpstart-atlas-tests/node_modules node tests/interface.cjs
```

`ATLAS_URL` can override the default `http://127.0.0.1:8000/`. The script uses
isolated browser contexts and mocked Scryfall responses; it never edits an existing
browser's collection. It checks shuffle/removal, both empty-slot actions, slot
positions after reload, filter constraints, identical halves, sample quantities
and history, saved recipes, token retry/cache/deduplication, and overflow at 1280,
412, and 320 CSS pixels. Also verify images and token relationships once with live
Scryfall data before publishing related changes.

`tests/hand-layout.cjs` checks land stacking, mana ordering, sample preservation,
full-list pack and combined-deck curves, unknown metadata, mobile widths, RTL,
and 200% CSS zoom. `tests/mana-curve.cjs` covers the sparkline, full-list
column counts, overlapping-card taps, keyboard/scroll/focus restoration,
mobile fullscreen bounds, zero/unknown mana, and identical halves. Use
`ATLAS_BROWSER=firefox` for a second browser.

`tests/interface.cjs` covers keyboard drawer and popover behavior, filter focus,
persisted display settings, empty searches, version tabs, CSV preview/apply/undo,
saved-hand entry points, persistent dialog disclosures, drawer resizing, and backup
export/preview/cancel/restore/rejection at the same widths. Set `ATLAS_BROWSER=firefox`
to run the interface suite in Firefox (install its Playwright browser first).

`tests/copy-ligamagic.cjs` checks every catalog name and exercises Copy for packs,
identical-half mixes, saved decks, missing cards, inventory and the library in
hydrated desktop and offline mobile contexts. It verifies quantity aggregation,
printing deduplication, and that share links remain URLs. Run with the same
`NODE_PATH` and optional `ATLAS_URL` as the other browser tests.
