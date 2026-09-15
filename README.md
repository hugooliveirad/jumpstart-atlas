# Jumpstart Atlas

Explore every Foundations Jumpstart (J25) theme, track the packs in your collection, and pair two halves into a play deck.

Live site: https://hugobessa.com.br/jumpstart-atlas/

(`https://hugooliveirad.github.io/jumpstart-atlas/` redirects there.)

## What it is

A single standalone HTML file. Collection data stays in your browser (`localStorage`). Card images and extra details load from [Scryfall](https://scryfall.com/) and [mtg.wtf](https://mtg.wtf/).

You can:

- Browse 46 themes and 121 pack versions, with Common / Rare / Mythic marks
- Filter themes by color, ownership, and catalog tags
- Import a CSV (including Mythic Tools-style exports) and confirm exact pack versions
- Mix two halves, rank combinations by shared-tag synergy, and save 40-card recipes
- Copy Scryfall decklists (quantity, name, set, collector number) from pack, card, and pairing lists
- Open card details for J25 printings, Scryfall, and [LigaMagic](https://www.ligamagic.com.br/) links

## Run it locally

Serve this directory over HTTP:

```bash
python3 -m http.server
```

Open `http://127.0.0.1:8000/`. Opening the file directly works for browsing decklists; copy-to-clipboard and cached card data need an `http://` or `https://` origin.

## Your collection

Nothing is uploaded. Import a CSV from the sidebar, or add copies from a card dialog. Confirmed packs reserve copies so other candidates cannot spend them. Export a JSON backup from Settings before clearing site data.

## Change it

Agents: start with `AGENTS.md`.

The catalog, tags, rarity rule, storage keys, and Scryfall behavior are documented in [`docs/development.md`](docs/development.md).
