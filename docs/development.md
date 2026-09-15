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

`pairTitle` is `Name vN + Name vN`. Synergy score is shared tags plus a small color bonus; saved recipes are highlighted. Choosing a mixing-room half filters `PAIRS` to combinations that include every selected pack.

`scryfallLine` / `scryfallList` / `deckText` produce `quantity Name (SET) number` lists. Copy buttons call `copyText`. `downloadText` remains for JSON backup, CSV import template, import issues, and unreadable-recovery dumps.

## UI landmarks

- Pack click → `showPack` dialog on every viewport
- Tag filters: `#pack-type`, `#card-pack-type`, `#collection-type`, `#pair-type`, `#saved-type`, `#picker-type`
- Hover preview: `#card-hover-preview` and `[data-hover-image]`
- LigaMagic: `https://www.ligamagic.com.br/?view=cards/card&card=` + encoded English name

## Checks

There is no test runner. After JS edits:

```bash
python3 -c "from pathlib import Path; t=Path('index.html').read_text(); s=t[t.find('<script>')+8:t.rfind('</script>')]; Path('/tmp/atlas.js').write_text(s)"
node --check /tmp/atlas.js
```

Then click a pack (dialog), a card (printings + LigaMagic), the mixing room (synergy rail + half filter), and a Copy list button.
