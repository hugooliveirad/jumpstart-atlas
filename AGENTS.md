# Jumpstart Atlas

Standalone J25 explorer in one `index.html`. Collection data lives in this browser. Do not split the file, add a bundler, or invent a second catalog source unless a task explicitly asks.

## Run

Open `index.html` over `http://` (not `file://` if you need clipboard or IndexedDB cache). From this directory: `python3 -m http.server`. Live site: https://hugobessa.com.br/jumpstart-atlas/

## Change

Read `docs/development.md` before editing catalog shape, theme tags, pack rarity, pairing synergy, Scryfall sync, or `localStorage` keys.

## Guardrails

- Inventory is English-name keyed, not printing keyed. Do not silently bump `APP_SCHEMA`.
- Theme rarity is Common / Rare / Mythic from variant counts 4 / 2 / 1.
- Filters use catalog theme tags. Do not restore editorial pack-type buckets.
- Card and pack lists copy a Scryfall decklist. JSON backup and import-issue downloads stay as downloads.
- Mixing-room ranking is shared-tag synergy, not a published winrate table.
