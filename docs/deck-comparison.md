# Optional deck analysis

The existing version comparison dialog opens on **Cards**. **Analysis** switches to comparative deck statistics, mana curves, BREAD assignments, supporting roles, and theme tags for every published version of that theme. Switching back retains the existing card-difference table.

The mixing room has its own **Analysis** button, off in every fresh session and independent of More details, card lists, filters, and saved display preferences. It compares Pack 1, Pack 2, and the combined 40-card deck. A single selected pack can be inspected, including when it occupies slot 2. Empty slots remain empty; identical halves count twice. Changing a pack updates the open analysis. This compares the selected halves, not a stored history of alternative mixes.

## Meaning of the numbers

- Statistics always use full published lists and count card copies. Inventory, role filters, and Show lands never alter analysis.
- Land/nonland totals and editorial roles are bundled and available offline.
- Nonland mana values use the existing Scryfall index. Curves use bins 0–6 and 7+, excluding unknown mana values. X is zero in mana value. The average is weighted by copies with known values; its known/total denominator is always displayed. Missing metadata is never treated as zero mana.
- Nonland type counts partition into creatures, other nonlands, and unknown types. An artifact creature counts once as a creature. Creature tokens produced by a card are not extra cards in the deck.
- BREAD roles overlap: a card tagged B and R contributes to both. Counts are draft aids, not a deck-strength rating. Bars use one shared scale per chart across all compared columns and rows, with exact numeric labels and table headers.
- Supporting roles (draw, ramp/fixing, tricks, recursion, tokens, synergy/support) show differences between versions. These are existing editorial assignments; this change audits Removal specifically, not every other role.
- Theme tags are attached to themes, so all versions of a theme share them. Mixing synergy uses the existing scorer: 4 per shared tag, 2 for same color or 1 for two different non-M colors, and 1 for the same theme. The analysis explains this heuristic and does not label it a winrate.

## Implementation and review

`deckAnalysis(decks, index)` aggregates full catalog lists; `deckAnalysisHTML(series, {kind})` renders both contexts. The helpers and styles remain embedded in `index.html`, marked BEGIN/END DECK COMPARISON. `ui.showPairAnalysis` is session-only; version analysis lives on the current comparison dialog. No catalog duplication, dependency, collection schema change, or new storage key is introduced.

Tables scroll inside their own keyboard-focusable regions on narrow screens. Analysis switches expose pressed/expanded state and restore focus after rendering. Metadata hydration refreshes open analysis through the existing rendering flow.

Run the focused checks with an external Playwright installation and a local HTTP server:

```bash
NODE_PATH=/path/to/node_modules node tests/deck-comparison.cjs
```

`ATLAS_URL` optionally selects the server. The checks use isolated browser contexts and synthetic Scryfall responses; they do not modify a person's browser collection.

The Removal audit and its card-level reasons are recorded in [removal-audit.md](removal-audit.md).
