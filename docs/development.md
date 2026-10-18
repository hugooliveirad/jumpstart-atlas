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
multiple roles contributes to each total. Zero counts remain visible.

At widths 320–600 CSS pixels, card grids and theme grids use two equal columns
with shrinking tracks rather than a fixed minimum. Horizontal shelves retain
their layout. At 412 CSS pixels, cards are approximately 180px wide (depending
on container padding); below 320px the grid uses one column.

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

Pack and play-deck dialogs offer View tokens. Related token/emblem IDs come from
Scryfall `all_parts` for the cards in the full deck, independent of card filters.
Token details use the existing request queue and IndexedDB cache (`token:<id>`,
seven-day freshness with stale fallback offline). They are not added to the card
catalog or inventory. The viewer deduplicates by token Oracle ID and lists source
cards. Missing metadata, request failures, and a verified empty token list have
separate states. Copy effects can produce tokens without a listed token card.

`scryfallLine` / `scryfallList` / `deckText` produce `quantity Name (SET) number` lists. Copy buttons call `copyText`. `downloadText` remains for JSON backup, CSV import template, import issues, and unreadable-recovery dumps.

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

`tests/interface.cjs` covers keyboard drawer and popover behavior, filter focus,
persisted display settings, empty searches, version tabs, CSV preview/apply/undo,
saved-hand entry points, persistent dialog disclosures, drawer resizing, and backup
export/preview/cancel/restore/rejection at the same widths. Set `ATLAS_BROWSER=firefox`
to run the interface suite in Firefox (install its Playwright browser first).
